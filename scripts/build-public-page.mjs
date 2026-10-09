import { build } from "vite";
import react from "@vitejs/plugin-react";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const config = JSON.parse(await readFile(resolve(root, "public-page/config.json"), "utf8"));
const response = await fetch(new URL("/api/site", config.dataOrigin), { signal: AbortSignal.timeout(20000) });
if (!response.ok) throw new Error(`Cannot read the published public catalog (${response.status}).`);
const { content } = await response.json();
if (!content?.brand || !Array.isArray(content.packages) || !Array.isArray(content.gallery)
  || content.packages.some(p => !p.published) || content.gallery.some(m => !m.published)) {
  throw new Error("The build must contain only published public content.");
}

const ssr = resolve(root, ".sites-runtime/pages-ssr");
await build({
  configFile: false, root, publicDir: false, plugins: [react()],
  build: {
    ssr: resolve(root, "public-page/server.tsx"), outDir: ssr,
    target: "node22", emptyOutDir: true,
    rolldownOptions: { output: { entryFileNames: "render.mjs" } },
  },
});
const { renderPublicPage } = await import(pathToFileURL(resolve(ssr, "render.mjs")).href);
const page = renderPublicPage(content, config.dataOrigin);
const out = resolve(root, "docs");
await build({
  configFile: false, root: resolve(root, "public-page"), base: "./", publicDir: false,
  plugins: [react()], css: { postcss: root },
  build: { outDir: out, emptyOutDir: true, target: "es2022", assetsInlineLimit: 0 },
});

const publicURL = process.env.PUBLIC_SITE_URL || config.dataOrigin + "/";
const json = JSON.stringify(content).replaceAll("<", "\\u003c");
const template = await readFile(resolve(out, "index.html"), "utf8");
if (!template.includes("<!--PUBLIC_PAGE-->") || !template.includes("<!--PUBLIC_STATE-->")) {
  throw new Error("Missing public content placeholders.");
}
await writeFile(resolve(out, "index.html"), template.replace("<!--PUBLIC_PAGE-->", page)
  .replace("<!--PUBLIC_STATE-->", json).replaceAll("__PUBLIC_URL__", publicURL));
await writeFile(resolve(out, ".nojekyll"), "");
await writeFile(resolve(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${publicURL}</loc></url></urlset>\n`);
await mkdir(resolve(out, "admin"), { recursive: true });
const admin = new URL("/admin", config.dataOrigin).href;
await writeFile(resolve(out, "admin/index.html"), `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${admin}"><title>Administración · Sinteria Producciones</title></head><body><p><a href="${admin}">Entrar al panel administrativo de Sinteria Producciones</a></p></body></html>\n`);
console.log(JSON.stringify({ directory: out, gallery: content.gallery.length, catalogs: content.packages.length, publicURL, admin }));
