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
    packages: content.packages.map(p => ({ ...p, ...(p.image ? { image: publicResourceURL(p.image, origin) } : {}) })),
    gallery: content.gallery.map(m => ({
      ...m, url: publicResourceURL(m.url, origin),
      ...(m.poster ? { poster: publicResourceURL(m.poster, origin) } : {}),
    })),
  };
}
