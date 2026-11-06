import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import packageJson from "../package.json";

// The template contract of the Marketplace of Lazurio: what the repository
// carries so that another Organization can adopt it (docs/adoption.md) and
// take its later releases by merge (docs/extending.md).
const root = resolve(import.meta.dir, "../../..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

// Width and height of a WebP image from its header (VP8, VP8L or VP8X).
function webpSize(bytes: Uint8Array): { width: number; height: number } {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (ascii(0, 4) !== "RIFF" || ascii(8, 12) !== "WEBP") throw new Error("not a WebP file");
  const chunk = ascii(12, 16);
  const at = (i: number) => bytes[i] ?? 0;
  if (chunk === "VP8X") {
    return {
      width: 1 + (at(24) | (at(25) << 8) | (at(26) << 16)),
      height: 1 + (at(27) | (at(28) << 8) | (at(29) << 16)),
    };
  }
  if (chunk === "VP8 ") {
    return { width: (at(26) | (at(27) << 8)) & 0x3fff, height: (at(28) | (at(29) << 8)) & 0x3fff };
  }
  if (chunk === "VP8L") {
    const bits = at(21) | (at(22) << 8) | (at(23) << 16) | (at(24) << 24);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
  }
  throw new Error(`unknown WebP chunk ${chunk}`);
}

describe("template contract", () => {
  test("carries its license, notice and documents", () => {
    for (const path of [
      "LICENSE",
      "NOTICE",
      "README.md",
      "AGENTS.md",
      "ARCHITECTURE.md",
      "CHANGELOG.md",
      "docs/adoption.md",
      "docs/extending.md",
    ]) {
      expect(existsSync(join(root, path)) && read(path).trim().length > 0, path).toBe(true);
    }
    expect(read("LICENSE")).toStartWith("MIT License");
  });

  test("pins Bun and every dependency exactly", () => {
    expect(packageJson.packageManager).toMatch(/^bun@\d+\.\d+\.\d+$/);
    const ranges = Object.entries({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }).filter(
      ([, version]) => !/^(?:\d+\.\d+\.\d+|github:[\w.-]+\/[\w.-]+#v\d+\.\d+\.\d+)$/.test(version),
    );
    expect(ranges).toEqual([]);
  });

  test("CI runs the pinned Bun and the one check", () => {
    const bun = packageJson.packageManager.replace("bun@", "");
    for (const path of [".github/workflows/check.yml", ".github/workflows/windows.yml"]) {
      const workflow = read(path);
      expect(workflow, path).toContain(`bun-version: ${bun}`);
      expect(workflow, path).toContain("run: bun run check");
    }
    expect(read(".github/workflows/check.yml")).toContain(`test "$(bun --version)" = "${bun}"`);
  });

  test("the changelog has an entry for the App's version", () => {
    expect(read("CHANGELOG.md")).toContain(`## ${packageJson.version}`);
  });

  test("the documents name the stack profile this release follows", () => {
    for (const path of ["README.md", "docs/extending.md"]) {
      expect(read(path), path).toContain("content@2026.11");
    }
  });

  test("the Marketplace screens are WebP files 1600 px wide", () => {
    const dir = join(root, "docs/screenshots");
    const files = readdirSync(dir).filter((name) => !name.startsWith("."));
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      expect(name).toEndWith(".webp");
      expect(webpSize(readFileSync(join(dir, name))).width, name).toBe(1600);
    }
  });
});
