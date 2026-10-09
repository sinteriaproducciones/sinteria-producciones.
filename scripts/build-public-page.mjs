import { build } from "vite";
import react from "@vitejs/plugin-react";
import { readFile, writeFile, mkdir, cp, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import "./restore-assets.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const content = JSON.parse(await readFile(resolve(root, "public-page/snapshot.json"), "utf8"));
if (!content?.brand || !Array.isArray(content.packages) || !Array.isArray(content.gallery)
  || content.packages.some(p => !p.published) || content.gallery.some(m => !m.published)) {
  throw new Error("The build must contain only published public content.");
}

const ssr = resolve(root, ".sites-runtime/pages-ssr");
const out = resolve(root, "docs");
const retainedMedia = resolve(root, ".sites-runtime/public-media");
await mkdir(retainedMedia, { recursive: true });
if (await stat(resolve(out, "media")).catch(() => null)) {
  await cp(resolve(out, "media"), retainedMedia, { recursive: true });
}
await build({
  configFile: false, root, publicDir: false, plugins: [react()],
  build: {
    ssr: resolve(root, "public-page/server.tsx"), outDir: ssr,
    target: "node22", emptyOutDir: true,
    rolldownOptions: { output: { entryFileNames: "render.mjs" } },
  },
});
const { renderPublicPage } = await import(pathToFileURL(resolve(ssr, "render.mjs")).href);
const page = renderPublicPage(content);
await build({
  configFile: false, root: resolve(root, "public-page"), base: "./", publicDir: false,
  plugins: [react()], css: { postcss: root },
  build: { outDir: out, emptyOutDir: true, target: "es2022", assetsInlineLimit: 0 },
});

const publicURL = process.env.PUBLIC_SITE_URL || "https://sinteriaproducciones.github.io/sinteria-producciones./";
const json = JSON.stringify(content).replaceAll("<", "\\u003c");
const template = await readFile(resolve(out, "index.html"), "utf8");
if (!template.includes("<!--PUBLIC_PAGE-->") || !template.includes("<!--PUBLIC_STATE-->")) {
  throw new Error("Missing public content placeholders.");
}
await writeFile(resolve(out, "index.html"), template.replace("<!--PUBLIC_PAGE-->", page)
  .replace("<!--PUBLIC_STATE-->", json).replaceAll("__PUBLIC_URL__", publicURL));
await writeFile(resolve(out, ".nojekyll"), "");
await writeFile(resolve(out, "sitemap.xml"), '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>' + publicURL + '</loc></url></urlset>\n');
await writeFile(resolve(out, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: " + publicURL + "sitemap.xml\n");
await cp(resolve(root, "public/favicon.svg"), resolve(out, "favicon.svg"));
await cp(resolve(root, "public/assets/sinteria-logo.png"), resolve(out, "assets/sinteria-logo.png"));
await cp(resolve(root, "public/assets/fiesta-hero.png"), resolve(out, "assets/fiesta-hero.png"));
await cp(retainedMedia, resolve(out, "media"), { recursive: true });
console.log(JSON.stringify({ directory: out, gallery: content.gallery.length, catalogs: content.packages.length, publicURL, admin: false, liveAPI: false }));
