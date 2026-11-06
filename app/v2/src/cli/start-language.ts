// The language of the knowledge base (`bun run start:language <cs|en>`): the
// knowledge base is written and shown in one language, the language of
// Lazurio for the Organization (the `locale` of the Folder's profile). The
// template carries its structure and its example in each language; this
// command makes one of them the knowledge base's, in knowledgebase.json, and
// removes the others, so that people and agents write into one tree only.
// Run it once, right after the adoption.
//
//   bun run start:language <cs|en> [--data <data/v2 directory>] [--dry-run]
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import {
  defaultDataRoot,
  LANGUAGES,
  type Language,
  languagesOf,
  loadStructure,
} from "../structure";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: { data: { type: "string" }, "dry-run": { type: "boolean" } },
});
const [language] = positionals;
if (!language || !(LANGUAGES as readonly string[]).includes(language)) {
  console.error(`usage: bun run start:language <${LANGUAGES.join("|")}> [--dry-run]`);
  process.exit(2);
}
const dataRoot = resolve(values.data ?? defaultDataRoot);
const dryRun = values["dry-run"] === true;
const present = languagesOf(dataRoot);
if (!present.includes(language as Language)) {
  console.error(
    `Nothing changed: data/v2 carries no "${language}" (it has ${present.join(", ")}). Take it from the template's release.`,
  );
  process.exit(1);
}
// The language to keep must hold before anything goes.
loadStructure(dataRoot, language as Language);

const path = join(dataRoot, "knowledgebase.json");
const declaration = JSON.parse(readFileSync(path, "utf8"));
const others = present.filter((other) => other !== language);
declaration.language = language;
for (const other of others) delete declaration.languages[other];
if (!dryRun) {
  for (const other of others) rmSync(join(dataRoot, "docs", other), { recursive: true });
  writeFileSync(path, `${JSON.stringify(declaration, null, 2)}\n`);
}
console.log(
  `${dryRun ? "Would show" : "The knowledge base is now in"} "${language}"${
    others.length > 0
      ? `; ${dryRun ? "would remove" : "removed"} ${others.map((o) => `docs/${o}`).join(", ")}`
      : ""
  }.`,
);
