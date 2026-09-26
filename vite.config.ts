import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SEO_PAGES, SEO_PAGE_PATHS, renderSeoPage, renderSitemap } from "./src/lib/seoPages.ts";

/**
 * Static conversion pages (/katha-to-decimal, /bigha-to-sq-feet, …).
 *
 * - build: each page is written to dist/<slug>/index.html so any static host
 *   serves it at the clean URL with zero server config. The generated sitemap
 *   replaces the hand-maintained public/sitemap.xml.
 * - dev/preview: a middleware serves the same HTML for the same URLs so the
 *   pages are reachable in local dev and verification, not just in production.
 */
function conversionPages(): Plugin {
  return {
    name: "conversion-pages",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? "/").split("?")[0].replace(/\/$/, "") || "/";
        const page = SEO_PAGES.find((p) => p.path === path);
        if (!page) return next();
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(renderSeoPage(page));
      });
    },
  };
}

function writeConversionPages(root: string): void {
  for (const page of SEO_PAGES) {
    const dir = join(root, page.path.slice(1));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), renderSeoPage(page));
  }
  writeFileSync(join(root, "sitemap.xml"), renderSitemap());
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    conversionPages(),
    {
      name: "conversion-pages-write",
      apply: "build",
      closeBundle() {
        writeConversionPages("dist");
      },
    },
  ],
  server: {
    host: "0.0.0.0",
    hmr: false,
  },
});

/** Exported for tests: every route the site must serve. */
export { SEO_PAGE_PATHS };
