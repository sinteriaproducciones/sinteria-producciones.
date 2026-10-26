import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";
import { handleSiteAPI } from "../lib/site-api.ts";

export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    const response = await handleSiteAPI(request, env);
    if (response) return response;
    if (new URL(request.url).pathname.startsWith("/admin")) {
      const result = await runWithConnectorBinding(undefined, () => handler.fetch(request, env, ctx));
      const secured = new Response(result.body, result);
      secured.headers.set("Cache-Control", "private, no-store");
      secured.headers.set("X-Frame-Options", "DENY");
      secured.headers.set("X-Robots-Tag", "noindex, nofollow");
      secured.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      return secured;
    }
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
  },
};
