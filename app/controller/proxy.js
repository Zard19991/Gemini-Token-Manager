"use strict";

const { Controller } = require("egg");

class ProxyController extends Controller {
    async handleProxy() {
        const { ctx } = this;

        // Authentication is handled by middleware
        const path = ctx.path;
        const headers = { ...ctx.headers };
        const body = ctx.request.body;
        const method = ctx.method;

        // Remove host header to avoid conflicts
        delete headers.host;

        const proxyResult = await ctx.service.proxy.proxyRequest(path, headers, body, method);

        // Set response status and headers
        ctx.status = proxyResult.status;

        if (proxyResult.headers) {
            // Set relevant headers from the proxied response
            for (const [key, values] of Object.entries(proxyResult.headers)) {
                if (key.toLowerCase() !== "content-length") {
                    // Skip content-length as it might change
                    ctx.set(key, values[0]);
                }
            }
        }

        // Set CORS headers
        ctx.set("Access-Control-Allow-Origin", "*");
        ctx.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        ctx.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        ctx.set("Access-Control-Allow-Credentials", "true");
        ctx.set("Access-Control-Max-Age", "86400");

        // Set cache control headers for streaming support
        ctx.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        ctx.set("Pragma", "no-cache");
        ctx.set("Expires", "0");

        // Set response body
        ctx.body = proxyResult.body;
    }
}

module.exports = ProxyController;
