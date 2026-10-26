export const API_ORIGIN = "https://sinteria-producciones.genrrytm16.chatgpt.site";
import type { SiteContent } from "./content.ts";

export function publicResourceURL(path: string, origin = "") {
  return origin && path.startsWith("/") && !path.startsWith("//")
    ? new URL(path, origin).href : path;
}

export function publicContentWithOrigin(content: SiteContent, origin = ""): SiteContent {
  if (!origin) return content;
  return {
    ...content,
    brand: { ...content.brand, hero: publicResourceURL(content.brand.hero, origin) },
    services: content.services?.map(s => ({...s,image:publicResourceURL(s.image,origin)})),
    images: content.images ? Object.fromEntries(Object.entries(content.images).map(([key,value])=>[key,publicResourceURL(value,origin)])) : undefined,
    packages: content.packages.map(p => ({ ...p, ...(p.image ? { image: publicResourceURL(p.image, origin) } : {}), media:p.media?.map(m=>({...m,url:publicResourceURL(m.url,origin),...(m.poster?{poster:publicResourceURL(m.poster,origin)}:{})})) })),
    gallery: content.gallery.map(m => ({
      ...m, url: publicResourceURL(m.url, origin),
      ...(m.poster ? { poster: publicResourceURL(m.poster, origin) } : {}),
    })),
  };
}
