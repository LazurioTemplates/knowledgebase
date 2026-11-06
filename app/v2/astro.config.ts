import { fileURLToPath } from "node:url";
import starlight from "@astrojs/starlight";
import { astroServerOptions, ModuleKitError, onShutdown } from "@lazurio/module-kit";
import { defineConfig } from "astro/config";
import { LABELS } from "./src/labels";
import { loadStructure, sidebarOf } from "./src/structure";

const LISTENER = "app";

// Host and port come only from the Launchpad listener (Lazurio Module Standard
// 4.2). Astro evaluates `server` during `astro build`, `astro check` and
// `astro sync` too, so the listener is read only when Astro serves.
const serving = process.argv.includes("dev") || process.argv.includes("preview");

function listenerServer(): ReturnType<typeof astroServerOptions> {
  try {
    return astroServerOptions(LISTENER);
  } catch (error) {
    if (!(error instanceof ModuleKitError)) throw error;
    console.error(`Start through Lazurio lifecycle: ${error.message}`);
    process.exit(2);
  }
}

// SIGTERM from the Launchpad ends the dev server with exit 0 (standard 4.4).
if (serving) onShutdown(() => undefined);

// The content lies beside the App in data/v2 with its declared structure; a
// structure that does not hold stops here, before anything is built. The App
// shows the one language data/v2/knowledgebase.json names: the interface and
// the pages in that language only.
const structure = loadStructure();

export default defineConfig({
  ...(serving ? { server: listenerServer() } : {}),
  // Files the pages link to (images, PDFs) live next to the pages in data/v2.
  publicDir: fileURLToPath(new URL("../../data/v2/public", import.meta.url)),
  vite: {
    // No .env* files on the start path (standard 4.3).
    envDir: false,
    server: { strictPort: true },
    preview: { strictPort: true },
  },
  integrations: [
    starlight({
      title: "Knowledgebase",
      favicon: "/favicon.svg",
      // One locale at the root: the index answers 200 itself, which the
      // Launchpad health probe needs (it does not follow redirects).
      locales: { root: { label: LABELS[structure.language].name, lang: structure.language } },
      sidebar: sidebarOf(structure),
      routeMiddleware: "./src/routeData.ts",
      components: { PageTitle: "./src/components/PageTitle.astro" },
      // The look of the design system (src/design-system/), then the layout.
      customCss: ["./src/styles/theme.css", "./src/styles/knowledgebase.css"],
    }),
  ],
});
