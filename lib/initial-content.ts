import snapshot from "../public-page/snapshot.json" with { type: "json" };
import { type SiteContent } from "./content.ts";
const base = "https://sinteriaproducciones.github.io/sinteria-producciones./";
const asset = (p: string) => /^https:\/\//.test(p) ? p : new URL(p.replace(/^\.\//, "").replace(/^\//, ""), base).href;
export const initialContent: SiteContent = {
  ...snapshot,
  brand: { ...snapshot.brand, hero: asset(snapshot.brand.hero), email: "sinteria.producciones@gmail.com", whatsapp: "51932280554" },
  packages: snapshot.packages.map(p => ({ ...p, format: "plan", image: asset(p.image) })),
  gallery: [
    { id: "portada-fiesta", title: "Una celebración llena de alegría", category: "Horas locas", kind: "image", url: asset("media/portada-fiesta-1536.webp"), published: true },
    { id: "portada-124865", title: "Así se vive una hora loca con Sinteria", category: "Horas locas", kind: "video", url: asset("media/portada-124865.mp4"), poster: asset("media/portada-124865.webp"), published: true },
    ...snapshot.gallery.map(m => ({ ...m, kind: m.kind as "image" | "video", url: asset(m.url), ...("poster" in m ? { poster: asset(m.poster!) } : {}) })),
  ],
  services: [
    { id: "hora-loca", name: "Hora loca", text: "Ese momento en que la celebración se enciende y todos se suman a la fiesta.", detail: "Personajes, baile e interacción para compartir con tus invitados.", color: "pink", image: asset("media/portada-fiesta-768.webp"), published: true, price: null },
    { id: "personajes", name: "Personajes", text: "Tus favoritos llegan a la pista para llenar tu evento de risas y buenos momentos.", detail: "Consulta los personajes disponibles para tu fecha y arma tu combinación.", color: "purple", image: asset("media/117024.jpg"), published: true, price: null },
    { id: "animacion", name: "Animación", text: "Conectamos con tus invitados y le damos ritmo a cada momento de tu celebración.", detail: "Coordinamos contigo la dinámica, el espacio y los detalles de tu evento.", color: "yellow", image: asset("media/117020.jpg"), published: true, price: null },
    { id: "shows", name: "Shows y baile", text: "Música, movimiento y la energía que hace que nadie quiera quedarse sentado.", detail: "El alcance, la duración y los elementos incluidos se acuerdan antes de reservar.", color: "teal", image: asset("media/117018.jpg"), published: true, price: null },
  ],
  promotions: [], texts: {}, images: {},
};
