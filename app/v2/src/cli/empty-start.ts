// The empty start (`bun run start:empty`): removes every page of the
// template's invented example (`sample: true` in its frontmatter), in every
// language, and keeps the structure: the home page, the guide and the
// overview of every section with what belongs there and the outline of a page.
// Run it once, right after the adoption, when the Organization starts with its
// own content.
//
//   bun run start:empty [--data <data/v2 directory>] [--dry-run]
import { rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { internalLinks, isSample, linkSlug, readPages } from "../pages";
import { defaultDataRoot, languagesOf, loadStructure } from "../structure";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: { data: { type: "string" }, "dry-run": { type: "boolean" } },
});
const dataRoot = resolve(values.data ?? defaultDataRoot);
const dryRun = values["dry-run"] === true;

const plans = languagesOf(dataRoot).map((language) => {
  const structure = loadStructure(dataRoot, language);
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
        .map((target) => `${structure.content_root}/${page.path} → ${target}`),
    );
  const structural = samples.filter(
    (page) => page.path.endsWith("index.md") || !page.path.includes("/"),
  );
  return { docs, structure, samples, dangling, structural };
});

const dangling = plans.flatMap((plan) => plan.dangling);
if (dangling.length > 0) {
  console.error(
    `Nothing removed: these pages link to example pages; change the links first:\n${dangling.join("\n")}`,
  );
  process.exit(1);
}
if (plans.some((plan) => plan.structural.length > 0)) {
  console.error(
    "Nothing removed: an overview or a root page is marked as an example; it belongs to the structure.",
  );
  process.exit(1);
}

let count = 0;
for (const { docs, structure, samples } of plans) {
  for (const page of samples) {
    if (!dryRun) rmSync(join(docs, page.path));
    console.log(`${dryRun ? "would remove" : "removed"} ${structure.content_root}/${page.path}`);
    count += 1;
  }
}
if (count === 0) {
  console.log("No example pages: the knowledge base already starts empty.");
} else {
  console.log(
    `${count} example pages ${dryRun ? "would be removed" : "removed"}; the structure stays.`,
  );
}
