import { build } from "vite";
import react from "@vitejs/plugin-react";
import { readFile, writeFile, mkdir, cp, stat, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const API_ORIGIN="https://sinteria-producciones.genrrytm16.chatgpt.site";
const SITE_BASE="/sinteria-producciones./",SITE_ORIGIN="https://sinteriaproducciones.github.io",publicURL=SITE_ORIGIN+SITE_BASE;
let content;
try{content=JSON.parse(await readFile(resolve(root,".public-runtime/current-public.json"),"utf8"));}
catch(error){if(error.code!=="ENOENT")throw error;content=JSON.parse(await readFile(resolve(root,"public-page/published-snapshot.json"),"utf8"));}
if(!content?.brand||!Array.isArray(content.packages)||!Array.isArray(content.gallery)||content.packages.some(p=>!p.published||p.media?.some(m=>!m.published))||content.gallery.some(m=>!m.published))throw Error("Only published content may be bundled.");
const resource=value=>value.startsWith("https://")?value:new URL(value,value.startsWith("/")?API_ORIGIN:publicURL).href;
content.brand.hero=resource(content.brand.hero);
content.gallery=content.gallery.map(m=>({...m,url:resource(m.url),...(m.poster?{poster:resource(m.poster)}:{})}));
content.packages=content.packages.map(p=>({...p,...(p.image?{image:resource(p.image)}:{}),...(p.media?{media:p.media.map(m=>({...m,url:resource(m.url),...(m.poster?{poster:resource(m.poster)}:{})}))}:{})}));
if([...content.gallery,...content.packages.flatMap(p=>p.media||[])].some(m=>!/^[a-zA-Z0-9_-]{1,80}$/.test(m.id)))throw Error("Invalid public media identifier.");
const seen=new Set();const videos=[...content.gallery,...content.packages.flatMap(p=>p.media||[])].filter(m=>{if(!m.published||m.kind==="image"||seen.has(m.url))return false;seen.add(m.url);return true;});
await writeFile(resolve(root,"public-page/video-routes.json"),JSON.stringify(videos.map(({id,url})=>({id,url})),null,2)+"\n");
await writeFile(resolve(root,"public-page/published-snapshot.json"),JSON.stringify(content,null,2)+"\n");
const ssr=resolve(root,".public-runtime/ssr"),out=resolve(root,"docs");
await build({configFile:false,root,publicDir:false,plugins:[react()],build:{ssr:resolve(root,"public-page/server.tsx"),outDir:ssr,target:"node22",emptyOutDir:true,rolldownOptions:{output:{entryFileNames:"render.mjs"}}}});
const {renderPublicPage,pages,pageSEO,structuredData,videoDescription,videoHref,youtubeEmbed}=await import(pathToFileURL(resolve(ssr,"render.mjs")).href);
await build({configFile:false,root:resolve(root,"public-page"),base:SITE_BASE,publicDir:false,plugins:[react()],css:{postcss:{plugins:[]}},build:{outDir:out,emptyOutDir:false,target:"es2022",assetsInlineLimit:0}});
const template=await readFile(resolve(out,"index.html"),"utf8");
for(const token of ["<!--PUBLIC_PAGE-->","<!--PUBLIC_STATE-->","<!--STRUCTURED_DATA-->","__PAGE_URL__"])if(!template.includes(token))throw Error("Missing build placeholder: "+token);
const escapeAttr=s=>String(s).replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;");
const scriptJSON=value=>JSON.stringify(value).replaceAll("<","\\u003c");
const videoPage=video=>({id:"video",path:"videos/"+encodeURIComponent(video.id)+"/",videoId:video.id});
const routes=[...pages,{id:"video",path:"videos/"},...videos.map(videoPage)];
for(const page of routes){
 const meta=pageSEO(content,page.id,page.videoId),directory=resolve(out,page.path);await mkdir(directory,{recursive:true});
 const extraHead=page.id==="inicio"?'<link rel="preload" as="image" href="'+escapeAttr(meta.image)+'" fetchpriority="high" />':"";
 const html=template.replaceAll("__PAGE_TITLE__",escapeAttr(meta.title)).replaceAll("__PAGE_DESCRIPTION__",escapeAttr(meta.description)).replaceAll("__PAGE_URL__",escapeAttr(meta.url)).replaceAll("__PAGE_IMAGE__",escapeAttr(meta.image)).replaceAll("__PAGE_IMAGE_ALT__",escapeAttr(meta.imageAlt)).replaceAll("__PAGE_ROBOTS__",meta.noindex?"noindex, follow":"index, follow, max-image-preview:large, max-video-preview:-1").replace("<!--PAGE_EXTRA_HEAD-->",extraHead).replace("<!--PUBLIC_PAGE-->",renderPublicPage(content,page.id,page.videoId)).replace("<!--PUBLIC_STATE-->",scriptJSON({content,page:page.id,...(page.videoId?{videoId:page.videoId}:{})})).replace("<!--STRUCTURED_DATA-->",scriptJSON(structuredData(content,page.id,page.videoId)));
 await writeFile(resolve(directory,"index.html"),html);
}
// Previously generated video pages that are no longer published become a noindex
// notice. Neither their old titles nor their media URLs remain in the HTML.
const videoRoot=resolve(out,"videos");
for(const entry of await readdir(videoRoot,{withFileTypes:true}))if(entry.isDirectory()&&!videos.some(v=>encodeURIComponent(v.id)===entry.name)){
 await writeFile(resolve(videoRoot,entry.name,"index.html"),'<!doctype html><html lang="es-PE"><meta charset="utf-8"><meta name="robots" content="noindex, follow"><title>Video no disponible | Sinteria Producciones</title><body><h1>Este video ya no está disponible.</h1><a href="'+SITE_BASE+'galeria/">Ver los videos publicados</a></body></html>');
}
const xml=escapeAttr;
await writeFile(resolve(out,"sitemap.xml"),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+[...pages,...videos.map(videoPage)].map(p=>"<url><loc>"+xml(publicURL+p.path)+"</loc></url>").join("")+"</urlset>\n");
const videoEntries=videos.filter(m=>!!m.poster).map(m=>'<url><loc>'+xml(SITE_ORIGIN+videoHref(m))+'</loc><video:video><video:thumbnail_loc>'+xml(m.poster)+'</video:thumbnail_loc><video:title>'+xml(m.title)+'</video:title><video:description>'+xml(videoDescription(m))+'</video:description>'+(m.kind==='video'?'<video:content_loc>'+xml(m.url)+'</video:content_loc>':'<video:player_loc>'+xml(youtubeEmbed(m.url))+'</video:player_loc>')+'</video:video></url>');
await writeFile(resolve(out,'video-sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">'+videoEntries.join('')+'</urlset>\n');
await writeFile(resolve(out,"sitemap-index.xml"),'<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>'+xml(publicURL+'sitemap.xml')+'</loc></sitemap><sitemap><loc>'+xml(publicURL+'video-sitemap.xml')+'</loc></sitemap></sitemapindex>\n');
const notFound = '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="theme-color" content="#10071f"><title>Página no encontrada | Sinteria Producciones</title><body style="margin:0;font-family:Arial,sans-serif;background:radial-gradient(ellipse at top right,#521868,transparent 65%),#10071f;color:#fff5ff;min-height:100vh;display:grid;place-items:center"><main style="max-width:720px;margin:40px 22px;text-align:center"><img src="' + SITE_BASE + 'media/portada-fiesta-768.webp" alt="Una celebración con los personajes de Sinteria" width="768" height="576" style="width:100%;height:auto;border-radius:24px;border:1px solid #e77ede;box-shadow:0 0 35px #d129a640"><p style="color:#ff9be0;font-size:12px;letter-spacing:2px;margin-top:28px">SINTERIA PRODUCCIONES</p><h1 style="font-size:clamp(30px,6vw,46px);line-height:1.1">Esta página se fue a la pista.</h1><p style="color:#ddc6e7;line-height:1.8">Vuelve al inicio para explorar nuestros servicios y catálogos.</p><a href="' + SITE_BASE + '" style="display:inline-block;margin-top:15px;padding:16px 27px;color:white;background:linear-gradient(110deg,#e91eaa,#9825dd);border:1px solid #ff9bdf;border-radius:999px;text-decoration:none;font-weight:bold">Volver al inicio →</a></main></body></html>';

await mkdir(resolve(out,"admin"),{recursive:true});
await writeFile(resolve(out,"admin/index.html"),'<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=https://sinteria-producciones.genrrytm16.chatgpt.site/admin"><title>Administración Sinteria</title><body style="background:#10071f;color:white;font-family:Arial;padding:40px"><a style="color:#ff8ed9" href="https://sinteria-producciones.genrrytm16.chatgpt.site/admin">Abrir mi panel administrativo</a></body></html>');
await writeFile(resolve(out, "404.html"), notFound);
await writeFile(resolve(out, ".nojekyll"), "");
await writeFile(resolve(out,"robots.txt"),"User-agent: *\nAllow: /\nSitemap: "+publicURL+"sitemap-index.xml\n");
if (await stat(resolve(root, "public/favicon.svg")).catch(() => null)) await cp(resolve(root, "public/favicon.svg"), resolve(out, "favicon.svg"));
const verificationFile = "google6e49e48c01da3c38.html";
const verificationSource = resolve(root, "public", verificationFile);
if (await stat(verificationSource).catch(() => null)) await cp(verificationSource, resolve(out, verificationFile));
console.log(JSON.stringify({ directory: out, pages: routes.length, videoPages:videos.length, gallery: content.gallery.length, catalogs: content.packages.length,
  publicURL, heroPhoto: "portada-fiesta-1536.webp", admin: "https://sinteria-producciones.genrrytm16.chatgpt.site/admin", preservedExistingMedia: true }));

