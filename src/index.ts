import { DurableObject } from "cloudflare:workers";

export class App extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    // This server only sees requests that don't match static assets.
    // Since we have not_found_handling: "single-page-application",
    // most things will be handled by the asset server (index.html).
    return new Response("Not found", { status: 404 });
  }
}
