import { build } from "vite";
import react from "@vitejs/plugin-react";
import { readFile, writeFile, mkdir, cp, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
let content = JSON.parse(await readFile(resolve(root, "public-page/snapshot.json"), "utf8"));
if (!content?.brand || !Array.isArray(content.packages) || !Array.isArray(content.gallery)
  || content.packages.some(p => !p.published) || content.gallery.some(m => !m.published)) {
  throw new Error("Only published content may be included in the public build.");
}
const ssr = resolve(root, ".public-runtime/ssr"), out = resolve(root, "docs");
await build({
  configFile: false, root, publicDir: false, plugins: [react()],
  build: { ssr: resolve(root, "public-page/server.tsx"), outDir: ssr, target: "node22", emptyOutDir: true,
    rolldownOptions: { output: { entryFileNames: "render.mjs" } } },
});
const { renderPublicPage, pages, SITE_BASE, SITE_ORIGIN, initialContent } = await import(pathToFileURL(resolve(ssr, "render.mjs")).href);
content=initialContent;
await build({
  configFile: false, root: resolve(root, "public-page"), base: SITE_BASE, publicDir: false,
  plugins: [react()], css: { postcss: { plugins: [] } },
  build: { outDir: out, emptyOutDir: false, target: "es2022", assetsInlineLimit: 0 },
});
const template = await readFile(resolve(out, "index.html"), "utf8");
for (const token of ["<!--PUBLIC_PAGE-->", "<!--PUBLIC_STATE-->", "<!--STRUCTURED_DATA-->", "__PAGE_URL__"]) {
  if (!template.includes(token)) throw new Error("Missing build placeholder: " + token);
}
const escapeAttr = s => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
const scriptJSON = value => JSON.stringify(value).replaceAll("<", "\\u003c");
const publicURL = SITE_ORIGIN + SITE_BASE;
const organization = { "@type": "Organization", "@id": publicURL + "#organization", name: "Sinteria Producciones", url: publicURL,
  logo: publicURL + "assets/sinteria-logo.png", taxID: content.brand.ruc, telephone: "+" + content.brand.whatsapp,
  email: content.brand.email, areaServed: "Lima sur, Perú", parentOrganization: { "@type": "Organization", name: content.brand.group },
  sameAs: Object.values(content.socials).filter(Boolean) };
for (const page of pages) {
  const url = publicURL + page.path, directory = resolve(out, page.path);
  await mkdir(directory, { recursive: true });
  const structured = { "@context": "https://schema.org", "@graph": [organization,
    { "@type": "WebPage", "@id": url + "#page", url, name: page.title, description: page.description,
      inLanguage: "es-PE", about: { "@id": publicURL + "#organization" } }] };
  if (page.id === "inicio") structured["@graph"].push({ "@type": "ImageObject", name: "Una celebración con Sinteria Producciones",
    contentUrl: publicURL + "media/portada-fiesta-1536.webp", width: 1536, height: 1152,
    caption: "Personajes e invitados en una fiesta de cumpleaños." });
  const extraHead = page.id === "inicio" ? '<link rel="preload" as="image" href="' + SITE_BASE + 'media/portada-fiesta-1536.webp" imagesrcset="' + SITE_BASE + 'media/portada-fiesta-768.webp 768w, ' + SITE_BASE + 'media/portada-fiesta-1536.webp 1536w" imagesizes="100vw" fetchpriority="high" />' : "";
  const html = template.replaceAll("__PAGE_TITLE__", escapeAttr(page.title)).replaceAll("__PAGE_DESCRIPTION__", escapeAttr(page.description))
    .replaceAll("__PAGE_URL__", url).replace("<!--PAGE_EXTRA_HEAD-->", extraHead)
    .replace("<!--PUBLIC_PAGE-->", renderPublicPage(content, page.id))
    .replace("<!--PUBLIC_STATE-->", scriptJSON({ content, page: page.id }))
    .replace("<!--STRUCTURED_DATA-->", scriptJSON(structured));
  await writeFile(resolve(directory, "index.html"), html);
}
const notFound = '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="theme-color" content="#10071f"><title>Página no encontrada | Sinteria Producciones</title><body style="margin:0;font-family:Arial,sans-serif;background:radial-gradient(ellipse at top right,#521868,transparent 65%),#10071f;color:#fff5ff;min-height:100vh;display:grid;place-items:center"><main style="max-width:720px;margin:40px 22px;text-align:center"><img src="' + SITE_BASE + 'media/portada-fiesta-768.webp" alt="Una celebración con los personajes de Sinteria" width="768" height="576" style="width:100%;height:auto;border-radius:24px;border:1px solid #e77ede;box-shadow:0 0 35px #d129a640"><p style="color:#ff9be0;font-size:12px;letter-spacing:2px;margin-top:28px">SINTERIA PRODUCCIONES</p><h1 style="font-size:clamp(30px,6vw,46px);line-height:1.1">Esta página se fue a la pista.</h1><p style="color:#ddc6e7;line-height:1.8">Vuelve al inicio para explorar nuestros servicios y catálogos.</p><a href="' + SITE_BASE + '" style="display:inline-block;margin-top:15px;padding:16px 27px;color:white;background:linear-gradient(110deg,#e91eaa,#9825dd);border:1px solid #ff9bdf;border-radius:999px;text-decoration:none;font-weight:bold">Volver al inicio →</a></main></body></html>';

await mkdir(resolve(out,"admin"),{recursive:true});
await writeFile(resolve(out,"admin/index.html"),'<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=https://sinteria-producciones.genrrytm16.chatgpt.site/admin"><title>Administración Sinteria</title><body style="background:#10071f;color:white;font-family:Arial;padding:40px"><a style="color:#ff8ed9" href="https://sinteria-producciones.genrrytm16.chatgpt.site/admin">Abrir mi panel administrativo</a></body></html>');
await writeFile(resolve(out, "404.html"), notFound);
await writeFile(resolve(out, ".nojekyll"), "");
await writeFile(resolve(out, "sitemap.xml"), '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + pages.map(p => "<url><loc>" + publicURL + p.path + "</loc></url>").join("") + "</urlset>\n");
await writeFile(resolve(out, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: " + publicURL + "sitemap.xml\n");
if (await stat(resolve(root, "public/favicon.svg")).catch(() => null)) await cp(resolve(root, "public/favicon.svg"), resolve(out, "favicon.svg"));
console.log(JSON.stringify({ directory: out, pages: pages.length, gallery: content.gallery.length, catalogs: content.packages.length,
  publicURL, heroPhoto: "portada-fiesta-1536.webp", admin: "https://sinteria-producciones.genrrytm16.chatgpt.site/admin", preservedExistingMedia: true }));

