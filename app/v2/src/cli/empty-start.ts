// The empty start (`bun run start:empty`): removes every page of the
// template's invented example (`sample: true` in its frontmatter) and keeps
// the structure: the home page, the guide and the overview of every section
// with what belongs there and the outline of a page. Run it once, right after
// the adoption, when the Organization starts with its own content.
//
//   bun run start:empty [--data <data/v2 directory>] [--dry-run]
import { rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { internalLinks, isSample, linkSlug, readPages } from "../pages";
import { defaultDataRoot, loadStructure } from "../structure";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: { data: { type: "string" }, "dry-run": { type: "boolean" } },
});
const dataRoot = resolve(values.data ?? defaultDataRoot);
const structure = loadStructure(dataRoot);
const docs = join(dataRoot, structure.content_root);
const pages = readPages(docs);
const samples = pages.filter(isSample);
const sampleSlugs = new Set(samples.map((page) => page.slug));

// A page of the Organization's own that links to an example would be left
// with a broken link: stop and name it instead of deleting anything.
const dangling = pages
  .filter((page) => !isSample(page))
  .flatMap((page) =>
    internalLinks(page.body)
      .filter((target) => sampleSlugs.has(linkSlug(target)))
      .map((target) => `${page.path} → ${target}`),
  );
if (dangling.length > 0) {
  console.error(
    `Nothing removed: these pages link to example pages; change the links first:\n${dangling.join("\n")}`,
  );
  process.exit(1);
}
if (samples.some((page) => page.path.endsWith("index.md") || page.slug === "")) {
  console.error(
    "Nothing removed: an index page is marked as an example; it belongs to the structure.",
  );
  process.exit(1);
}

for (const page of samples) {
  if (!values["dry-run"]) rmSync(join(docs, page.path));
  console.log(`${values["dry-run"] ? "would remove" : "removed"} ${page.path}`);
}
if (samples.length === 0) {
  console.log("No example pages: the knowledge base already starts empty.");
} else {
  const verb = values["dry-run"] ? "would be removed" : "removed";
  console.log(`${samples.length} example pages ${verb}; the structure stays.`);
}
