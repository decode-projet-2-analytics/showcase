import type { APIRoute } from "astro";

import { handleDemoPurchase } from "../../lib/server/demo-purchase-route.ts";

export const prerender = false;

export const POST: APIRoute = ({ request }) => handleDemoPurchase(request, import.meta.env);
