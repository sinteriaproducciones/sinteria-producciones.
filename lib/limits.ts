export const SITE_LIMITS = {
  storageBytes: 250 * 1024 * 1024,
  uploadStopBytes: 225 * 1024 * 1024,
  imageBytes: 8 * 1024 * 1024,
  videoBytes: 20 * 1024 * 1024,
  videoSeconds: 60,
  catalogs: 60,
  galleryItems: 150,
  files: 300,
} as const;

export const CATALOG_TYPES = [
  { value: "plan", label: "Plan de hora loca" },
  { value: "personaje", label: "Personaje individual" },
  { value: "combo", label: "Combo de personajes" },
  { value: "show", label: "Show o servicio" },
] as const;

export const fileSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
