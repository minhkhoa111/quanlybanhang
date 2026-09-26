import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  // `next/image` asks the Worker for /_vinext/image even during local Vite
  // development. Expose public/ through the same ASSETS binding used in
  // production so image optimization never dereferences an absent binding.
  assets: {
    directory: "./public",
    binding: "ASSETS",
  },
  vars: Object.fromEntries([
    "ADMIN_PASSWORD",
    "CASSO_WEBHOOK_SECRET",
    "FACE_API_KEY",
    "FACE_API_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
    "HR_DATA_KEY",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_VERIFY_SERVICE_SID",
  ].flatMap((name) => process.env[name] ? [[name, process.env[name]]] : [])),
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async ({ command }): Promise<import("vite").UserConfig> => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    // Build and preview must never rewrite the dependency cache used by the
    // long-running storefront. A mixed React hash breaks hooks during hydration.
    cacheDir: command === "serve" ? "node_modules/.vite-dev" : "node_modules/.vite-build",
    resolve: {
      dedupe: ["react", "react-dom", "react-server-dom-webpack"],
    },
    optimizeDeps: {
      include: [
        "qrcode",
        "vietnam-qr-pay",
        "@simplewebauthn/browser",
      ],
    },
    server: {
      // The Cloudflare tunnel targets this port. Failing fast prevents a second
      // dev server from silently moving to 3002/3003 and sharing React caches.
      port: 3001,
      strictPort: true,
      allowedHosts: true,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
      watch: {
        // Miniflare writes SQLite WAL/SHM files on every D1 read/write. They are
        // runtime state, not source files, and must never trigger Vite HMR.
        ignored: [
          "**/.wrangler/**",
          "**/.vinext/**",
          "**/dist/**",
          "**/node_modules/**",
          "**/python-ai/**",
          "**/*.sqlite*",
          "**/*.db*",
          "**/backups/**",
          "**/*.log",
        ],
        ...(isCodexSeatbeltSandbox
          ? { useFsEvents: false, usePolling: true }
          : {}),
      },
    },
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
