import { CATALOG_TYPES, SITE_LIMITS } from "./limits.ts";

export type Package = {
  id: string; name: string; subtitle: string; category: string; description: string;
  price: number | null; includes: string[]; featured: boolean; published: boolean;
  format?: "plan" | "personaje" | "combo" | "show"; image?: string;
};
export type Media = {
  id: string; title: string; category: string; kind: "image" | "video" | "youtube";
  url: string; published: boolean;
  poster?: string; isConcept?: boolean;
};
export type SiteContent = {
  brand: { headline: string; highlight: string; description: string; whatsapp: string;
    email: string; ruc: string; group: string; coverage: string; hero: string; heroIsConcept: boolean };
  socials: { facebook: string; tiktok: string; instagram: string };
  packages: Package[]; gallery: Media[];
};

export const defaultContent: SiteContent = {
  brand: {
    headline: "Que tu fiesta", highlight: "se vuelva inolvidable.",
    description: "Horas locas, personajes y shows que encienden la celebración. Tú pon la fecha. Nosotros, la diversión.",
    whatsapp: "51952391268", email: "sinteria.produciones@gmail.com", ruc: "10742038551",
    group: "Sinteria Group", coverage: "Lima · otros destinos previa coordinación",
    hero: "/assets/fiesta-hero.png", heroIsConcept: true,
  },
  socials: { facebook: "", tiktok: "", instagram: "" },
  packages: [
    { id: "hora-loca-1", name: "La chispa", subtitle: "1 personaje", category: "Hora loca",
      description: "El toque de energía que transforma tu celebración y pone a todos en modo fiesta.",
      price: 180, includes: ["1 personaje a elección disponible", "Show para tu celebración", "Coordinación personalizada"], featured: false, published: true },
    { id: "hora-loca-2", name: "Fiesta en dúo", subtitle: "2 personajes", category: "Hora loca",
      description: "Dos personajes, más interacción y un momento que tus invitados van a recordar.",
      price: 280, includes: ["2 personajes a elección disponibles", "Show para tu celebración", "Coordinación personalizada"], featured: true, published: true },
    { id: "hora-loca-3", name: "Modo celebración", subtitle: "3 personajes", category: "Hora loca",
      description: "Una combinación de personajes para llevar la energía de tu evento al siguiente nivel.",
      price: 380, includes: ["3 personajes a elección disponibles", "Show para tu celebración", "Coordinación personalizada"], featured: false, published: true },
  ],
  gallery: [],
};

export const money = (value: number) => new Intl.NumberFormat("es-PE", {
  style: "currency", currency: "PEN", maximumFractionDigits: 2,
}).format(value);

export const whatsappLink = (phone: string, message: string) =>
  `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

export const limaToday = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

export function safeExternalURL(value: string): boolean {
  if (!value) return true;
  try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password; }
  catch { return false; }
}

export function safeMediaURL(value: string): boolean {
  return /^\/media\/[a-f0-9-]{36}$/.test(value) || /^\/assets\/[a-zA-Z0-9._-]+$/.test(value) || safeExternalURL(value) && !!value;
}

export function youtubeEmbed(value: string): string | null {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return null;
    let id = "";
    if (["youtu.be", "www.youtu.be"].includes(u.hostname)) id = u.pathname.slice(1);
    if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(u.hostname))
      id = u.searchParams.get("v") || u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] || "";
    return /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch { return null; }
}

export function validateContent(input: unknown): input is SiteContent {
  const v = input as SiteContent;
  const str = (x: unknown, max: number, min = 0) => typeof x === "string" && x.length >= min && x.length <= max;
  if (!v || !v.brand || !v.socials || !Array.isArray(v.packages) || !Array.isArray(v.gallery)) return false;
  const b = v.brand;
  if (!str(b.headline, 100, 1) || !str(b.highlight, 100, 1) || !str(b.description, 600, 1) ||
    !/^\d{10,15}$/.test(b.whatsapp) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email) || !/^\d{11}$/.test(b.ruc) ||
    !str(b.group, 100, 1) || !str(b.coverage, 200, 1) || !safeMediaURL(b.hero) || typeof b.heroIsConcept !== "boolean") return false;
  if (![v.socials.facebook, v.socials.tiktok, v.socials.instagram].every(x => str(x, 600) && safeExternalURL(x))) return false;
  if (v.packages.length > SITE_LIMITS.catalogs || v.gallery.length > SITE_LIMITS.galleryItems) return false;
  const ids = new Set<string>();
  for (const p of v.packages) {
    if (!p || !str(p.id, 80, 1) || ids.has(p.id) || !str(p.name, 100, 1) || !str(p.subtitle, 100) ||
      !str(p.category, 80, 1) || !str(p.description, 1500, 1) ||
      !(p.price === null || typeof p.price === "number" && Number.isFinite(p.price) && p.price >= 0 && p.price <= 1000000) ||
      !Array.isArray(p.includes) || p.includes.length > 15 || !p.includes.every(x => str(x, 180, 1)) ||
      typeof p.featured !== "boolean" || typeof p.published !== "boolean" ||
      p.format !== undefined && !CATALOG_TYPES.some(t => t.value === p.format) ||
      p.image !== undefined && (!str(p.image, 600) || p.image !== "" && !safeMediaURL(p.image))) return false;
    ids.add(p.id);
  }
  ids.clear();
  for (const m of v.gallery) {
    if (!m || !str(m.id, 80, 1) || ids.has(m.id) || !str(m.title, 180, 1) || !str(m.category, 80, 1) ||
      !["image", "video", "youtube"].includes(m.kind) || !safeMediaURL(m.url) ||
      m.kind === "youtube" && !youtubeEmbed(m.url) || typeof m.published !== "boolean" ||
      m.poster !== undefined && (!str(m.poster, 600, 1) || !safeMediaURL(m.poster)) ||
      m.isConcept !== undefined && typeof m.isConcept !== "boolean") return false;
    ids.add(m.id);
  }
  return true;
}

export function referencedMedia(content: SiteContent, publishedOnly = false): string[] {
  return [content.brand.hero,
    ...content.packages.filter(p => !publishedOnly || p.published).flatMap(p => p.image ? [p.image] : []),
    ...content.gallery.filter(m => !publishedOnly || m.published).flatMap(m => m.poster ? [m.url, m.poster] : [m.url])];
}
