import { defineRouteMiddleware } from "@astrojs/starlight/route-data";
import { labelsOf } from "./labels";

export const onRequest = defineRouteMiddleware((ctx) => {
  const route = ctx.locals.starlightRoute;
  if (!route) return;
  const labels = labelsOf(route.lang);

  if (route.entry.data.sample === true && !route.entry.data.banner) {
    route.entry.data.banner = { content: labels.sampleBanner };
  }

  // Previous and next links name the section instead of a bare "Přehled".
  const { pagination, sidebar } = route;
  const sectionOf = new Map<string, string>();
  function walk(entries: typeof sidebar) {
    for (const entry of entries) {
      if (entry.type !== "group") continue;
      const first = entry.entries[0];
      if (first?.type === "link" && first.label === labels.overview) {
        sectionOf.set(first.href, entry.label);
      }
      walk(entry.entries);
    }
  }
  walk(sidebar);
  for (const link of [pagination.prev, pagination.next]) {
    if (link?.label === labels.overview) link.label = sectionOf.get(link.href) ?? link.label;
  }
});
