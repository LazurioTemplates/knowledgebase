import { defineCollection } from "astro:content";
import { docsSchema } from "@astrojs/starlight/schema";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { loadStructure } from "./structure";

// The pages live in data/v2/docs/<language>, beside the App generation, so
// that the content survives a new App generation unchanged. This is
// Starlight's own docs loader pointed at the pages of the language the App
// shows (data/v2/knowledgebase.json) instead of src/content/docs.
//
// The metadata every page may declare besides Starlight's own (title,
// description, sidebar). ARCHITECTURE.md describes it; a page that breaks it
// stops the build.
const docs = defineCollection({
  loader: glob({
    base: `../../data/v2/${loadStructure().content_root}`,
    pattern: "**/[^_]*.md",
  }),
  schema: docsSchema({
    extend: z.object({
      /** draft: being written; current: valid; outdated: kept for history. */
      status: z.enum(["draft", "current", "outdated"]).optional(),
      /** The role (or person) who keeps the page true. */
      owner: z.string().min(1).optional(),
      /** When someone last confirmed the page against reality. */
      reviewed: z.coerce.date().optional(),
      /** Invented example content of the template; `bun run start:empty` removes it. */
      sample: z.boolean().optional(),
      /** Other names people use for the subject; search finds them too. */
      aliases: z.array(z.string().min(1)).optional(),
      /** Where the knowledge comes from: a link, a document, a meeting. */
      sources: z.array(z.string().min(1)).optional(),
      /** A decision: when and by whom it was made, and what replaced it. */
      decided: z.coerce.date().optional(),
      decided_by: z.string().min(1).optional(),
      superseded_by: z.string().min(1).optional(),
    }),
  }),
});

export const collections = { docs };
