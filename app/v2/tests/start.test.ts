import { describe, expect, test } from "bun:test";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import packageJson from "../package.json";

// The start contract of the Lazurio Module Standard (kap. 4): the Launchpad
// runs the `dev` script with the environment it gives every App (HOME, PATH
// with only bun, TMPDIR, NODE_ENV, ASTRO_DEV_BACKGROUND; LazurioPlatform
// src/modules/application-environment.ts) and the listener environment;
// without it the App refuses to start, with it the declared health path
// answers 200 directly (the probe does not follow redirects), a foreign Host is
// refused and SIGTERM ends the App with exit 0.
const app = resolve(import.meta.dir, "..");
const runtime = packageJson.lazurio.runtime;
const [entrypoint] = runtime.listeners;
if (!entrypoint) throw new Error("lazurio.runtime declares no listener");
const variable = `LAZURIO_RUNTIME_LISTENER_${entrypoint.id.toUpperCase().replaceAll("-", "_")}`;
const baseEnv = {
  HOME: process.env.HOME ?? "",
  PATH: dirname(process.execPath),
  TMPDIR: process.env.TMPDIR ?? tmpdir(),
  NODE_ENV: "development",
  ASTRO_DEV_BACKGROUND: "1",
  // Windows needs its system root to start a process at all.
  ...(process.env.SYSTEMROOT ? { SYSTEMROOT: process.env.SYSTEMROOT } : {}),
};
const startTimeoutMs = 60_000;
const warmUpMs = 40_000;

describe("start contract", () => {
  test("refuses to start without the listener environment", () => {
    const run = Bun.spawnSync([process.execPath, "run", runtime.dev_script], {
      cwd: app,
      env: baseEnv,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(run.exitCode).toBe(2);
    expect(run.stderr.toString()).toContain(`${variable}_HOST`);
  });

  test(
    "answers health with 200, refuses a foreign Host and exits 0 on SIGTERM",
    async () => {
      if (process.platform === "win32") await warmUp();
      const port = await freePort();
      const server = Bun.spawn([process.execPath, "run", runtime.dev_script], {
        cwd: app,
        env: { ...baseEnv, [`${variable}_HOST`]: "127.0.0.1", [`${variable}_PORT`]: `${port}` },
        stdout: "ignore",
        stderr: "inherit",
      });
      try {
        const url = `http://127.0.0.1:${port}${entrypoint.health.path}`;
        const health = await firstResponse(url, startTimeoutMs);
        expect(health.status).toBe(200);
        const foreign = await fetch(url, {
          headers: { host: "foreign.invalid" },
          redirect: "manual",
        });
        expect(foreign.status).toBe(403);
      } finally {
        server.kill("SIGTERM");
      }
      expect(await server.exited).toBe(0);
    },
    startTimeoutMs + warmUpMs + 30_000,
  );
});

// On Windows the first start of `astro dev` in a fresh checkout never answers
// (Astro 7.4.5, Vite 8, Bun 1.4.4: the server restarts while it prepares its
// dependencies and fails with "Listen method has been called more than once");
// every later start answers (Lazurio/LazurioPlatform#910). The test starts it
// once there to prepare, stops the whole process tree and checks the contract
// on the next start.

async function warmUp(): Promise<void> {
  const port = await freePort();
  const server = Bun.spawn([process.execPath, "run", runtime.dev_script], {
    cwd: app,
    env: { ...baseEnv, [`${variable}_HOST`]: "127.0.0.1", [`${variable}_PORT`]: `${port}` },
    stdout: "ignore",
    stderr: "ignore",
  });
  await firstResponse(`http://127.0.0.1:${port}/`, warmUpMs).catch(() => null);
  Bun.spawnSync(["taskkill", "/T", "/F", "/PID", String(server.pid)]);
  await server.exited;
}

async function firstResponse(url: string, timeoutMs: number): Promise<Response> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(url, { redirect: "manual" }).catch(() => null);
    if (response) return response;
    await Bun.sleep(200);
  }
  throw new Error(`${url} did not answer within ${timeoutMs} ms`);
}

function freePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      probe.close(() =>
        address && typeof address === "object"
          ? resolvePort(address.port)
          : reject(new Error("no free port")),
      );
    });
  });
}
