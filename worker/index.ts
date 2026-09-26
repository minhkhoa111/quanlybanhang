/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { addSecurityHeaders, enforceRequestSecurity } from "./api-security";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  PRODUCT_IMAGES: R2Bucket;
  IMAGES?: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const rejected = await enforceRequestSecurity(request, env);
    if (rejected) return addSecurityHeaders(request, rejected);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      if (!env.ASSETS?.fetch) {
        return addSecurityHeaders(
          request,
          new Response("Static asset binding is unavailable", { status: 503 }),
        );
      }
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        ...(env.IMAGES
          ? {
              transformImage: async (body: ReadableStream, { width, format, quality }: { width: number; format: string; quality: number }) => {
                const result = await env.IMAGES!.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
                return result.response();
              },
            }
          : {}),
      }, allowedWidths);
    }

    const response = await handler.fetch(request, env, ctx);
    const location = response.headers.get("Location");

    // cloudflared forwards the public request to this Worker over localhost
    // HTTP. vinext consequently resolves relative redirects against an HTTP
    // origin, even though the visitor is on HTTPS. Keep redirects on the
    // canonical secure origin so Secure admin cookies remain usable.
    let secureLocation: string | undefined;
    if (process.env.NODE_ENV === "production" && location && response.status >= 300 && response.status < 400) {
      const destination = new URL(location, request.url);
      // A relative Location preserves the visitor's original HTTPS scheme.
      // This also avoids localhost/upstream protocols leaking through tunnels.
      secureLocation = `${destination.pathname}${destination.search}${destination.hash}`;
    }

    if (secureLocation) {
      const headers = new Headers(response.headers);
      headers.set("Location", secureLocation);
      return addSecurityHeaders(
        request,
        new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        }),
      );
    }

    return addSecurityHeaders(request, response);
  },
};

export default worker;
