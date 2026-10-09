import { SITE_LIMITS } from "../../lib/limits.ts";

export async function prepareVideo(file: File): Promise<File | null> {
  const url = URL.createObjectURL(file), video = document.createElement("video");
  video.preload = "metadata"; video.muted = true; video.playsInline = true;
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("No pudimos leer el video. Usa un MP4 compatible o un enlace de YouTube.")), 15000);
      video.onloadedmetadata = () => { window.clearTimeout(timer); resolve(); };
      video.onerror = () => { window.clearTimeout(timer); reject(new Error("El navegador no puede abrir este video. Exporta como MP4 o usa YouTube.")); };
      video.src = url;
    });
    if (!Number.isFinite(video.duration) || video.duration <= 0) throw new Error("No pudimos comprobar la duración. Exporta el video como MP4.");
    if (video.duration > SITE_LIMITS.videoSeconds + 0.1) throw new Error("Máximo 60 segundos por clip. Para videos largos, usa un enlace de YouTube.");
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error("Vista previa no disponible")), 6000);
        video.onseeked = () => { window.clearTimeout(timer); resolve(); };
        video.currentTime = Math.min(1, video.duration / 2);
      });
      const scale = Math.min(1, 440 / Math.max(video.videoWidth, video.videoHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", .78));
      return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, "")}-vista.jpg`, { type: "image/jpeg" }) : null;
    } catch { return null; }
  } finally { video.removeAttribute("src"); video.load(); URL.revokeObjectURL(url); }
}
