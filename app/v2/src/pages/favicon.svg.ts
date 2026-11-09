import type { APIRoute } from "astro";
import { faviconSvg } from "../favicon";

// /favicon.svg, built with the site (Starlight's `favicon`).
export const GET: APIRoute = () =>
  new Response(faviconSvg(), { headers: { "Content-Type": "image/svg+xml" } });
