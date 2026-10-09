import { defaultContent, referencedMedia, validateContent, type SiteContent } from "./content.ts";
import { SITE_LIMITS } from "./limits.ts";
import { videoDuration } from "./video-duration.ts";

export type SiteEnv = { DB?: D1Database; BUCKET?: R2Bucket; ADMIN_EMAIL?: string; ADMIN_PASSWORD_HASH?: string };
const COOKIE = "sinteria_session";
const MAX_IMAGE = SITE_LIMITS.imageBytes;
const MAX_VIDEO = SITE_LIMITS.videoBytes;
const mimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]);
const enc = new TextEncoder();
const hex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, "0")).join("");
export const digest = async (value: string) => hex(await crypto.subtle.digest("SHA-256", enc.encode(value)));

export async function verifyPassword(value: string, stored: string) {
  const [name, rounds, salt, expected] = stored.split("$");
  if (name !== "pbkdf2" || rounds !== "100000" || !salt || !/^[a-f0-9]{64}$/.test(expected || "")) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(value), "PBKDF2", false, ["deriveBits"]);
  const actual = hex(await crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, key, 256));
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  return difference === 0;
}

function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(data), { status, headers: {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers,
  } });
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin && request.headers.get("sec-fetch-site") !== "cross-site";
}

function tokenOf(request: Request) {
  const cookies = request.headers.get("cookie")?.split(";").map(s => s.trim()) || [];
  const matches = cookies.filter(s => s.startsWith(`${COOKIE}=`));
  const token = matches.length === 1 ? matches[0].slice(COOKIE.length + 1) : "";
  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}

async function authorized(request: Request, db: D1Database) {
  const token = tokenOf(request);
  if (!token) return false;
  return !!await db.prepare("SELECT token_hash FROM admin_sessions WHERE token_hash = ? AND expires_at > ?")
    .bind(await digest(token), Date.now()).first();
}

export async function readContent(db: D1Database): Promise<{ content: SiteContent; revision: number }> {
  const row = await db.prepare("SELECT payload, revision FROM site_content WHERE key = ?").bind("main").first<{ payload: string; revision: number }>();
  return { content: row ? JSON.parse(row.payload) : defaultContent, revision: row?.revision || 0 };
}

function published(content: SiteContent) {
  return { ...content, packages: content.packages.filter(p => p.published), gallery: content.gallery.filter(m => m.published) };
}

async function isPublishedAsset(db: D1Database, id: string) {
  const { content } = await readContent(db);
  return referencedMedia(content, true).includes(`/media/${id}`);
}

async function validSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const ascii = new TextDecoder().decode(bytes);
  if (file.type === "image/png") return bytes[0] === 137 && ascii.slice(1, 4) === "PNG";
  if (file.type === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (file.type === "image/webp") return ascii.slice(0, 4) === "RIFF" && ascii.slice(8, 12) === "WEBP";
  if (file.type === "video/mp4") return ascii.slice(4, 8) === "ftyp";
  return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
}

export async function handleSiteAPI(request: Request, env: SiteEnv): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/") && !url.pathname.startsWith("/media/")) return null;
  const db = env.DB;
  if (!db) return json({ error: "El almacenamiento no está disponible. Intenta nuevamente." }, 503);
  try {
    if (request.method === "GET" && url.pathname === "/api/site") {
      const state = await readContent(db);
      return json({ content: published(state.content), revision: state.revision });
    }
    if (["GET", "HEAD"].includes(request.method) && url.pathname.startsWith("/media/")) {
      const id = url.pathname.slice(7);
      if (!/^[a-f0-9-]{36}$/.test(id) || !env.BUCKET) return json({ error: "Archivo no encontrado." }, 404);
      if (!await authorized(request, db) && !await isPublishedAsset(db, id)) return json({ error: "Archivo no encontrado." }, 404);
      const metadata = await env.BUCKET.head(id);
      if (!metadata) return json({ error: "Archivo no encontrado." }, 404);
      const headers = new Headers({ "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Accept-Ranges": "bytes" });
      headers.set("Content-Type", metadata.httpMetadata?.contentType || "application/octet-stream");
      headers.set("ETag", metadata.httpEtag);
      let start = 0, end = metadata.size - 1, status = 200;
      const requestedRange = request.headers.get("range");
      if (requestedRange && request.method !== "HEAD") {
        const match = requestedRange.match(/^bytes=(\d*)-(\d*)$/);
        if (!match || !match[1] && !match[2]) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${metadata.size}` } });
        start = match[1] ? Number(match[1]) : Math.max(0, metadata.size - Number(match[2]));
        end = match[1] && match[2] ? Math.min(Number(match[2]), metadata.size - 1) : metadata.size - 1;
        if (start > end || start >= metadata.size || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${metadata.size}` } });
        status = 206;
        headers.set("Content-Range", `bytes ${start}-${end}/${metadata.size}`);
      }
      headers.set("Content-Length", String(end - start + 1));
      if (request.method === "HEAD") return new Response(null, { headers });
      const obj = await env.BUCKET.get(id, status === 206 ? { range: { offset: start, length: end - start + 1 } } : undefined);
      if (!obj) return json({ error: "Archivo no encontrado." }, 404);
      return new Response(obj.body, { status, headers });
    }
    if (request.method === "GET" && url.pathname === "/api/admin/session")
      return json({ authenticated: await authorized(request, db), email: env.ADMIN_EMAIL || "" });
    if (!["GET", "HEAD"].includes(request.method) && !sameOrigin(request)) return json({ error: "Solicitud no autorizada." }, 403);
    if (request.method === "POST" && url.pathname === "/api/admin/login") {
      if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD_HASH) return json({ error: "El acceso aún no está configurado." }, 503);
      const ip = request.headers.get("cf-connecting-ip") || "shared";
      const key = await digest(`login:${ip}`);
      const now = Date.now();
      await db.prepare("INSERT INTO login_attempts (key, count, window_start) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = CASE WHEN window_start < ? THEN 1 ELSE count + 1 END, window_start = CASE WHEN window_start < ? THEN excluded.window_start ELSE window_start END")
        .bind(key, now, now - 900000, now - 900000).run();
      const limit = await db.prepare("SELECT count FROM login_attempts WHERE key = ?").bind(key).first<{count: number}>();
      if ((limit?.count || 0) > 10) return json({ error: "Demasiados intentos. Vuelve a intentar en 15 minutos." }, 429, { "Retry-After": "900" });
      if (Number(request.headers.get("content-length") || 0) > 3000) return json({ error: "Solicitud demasiado grande." }, 413);
      const raw = await request.text();
      if (raw.length > 3000) return json({ error: "Solicitud demasiado grande." }, 413);
      const body = JSON.parse(raw);
      const emailOK = typeof body.email === "string" && body.email.trim().toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
      const passwordOK = typeof body.password === "string" && body.password.length <= 256 && await verifyPassword(body.password, env.ADMIN_PASSWORD_HASH);
      if (!emailOK || !passwordOK) return json({ error: "Correo o contraseña incorrectos." }, 401);
      const token = hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
      await db.batch([
        db.prepare("DELETE FROM admin_sessions WHERE expires_at < ?").bind(now),
        db.prepare("INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?, ?)").bind(await digest(token), now + 28800000),
        db.prepare("DELETE FROM login_attempts WHERE key = ?").bind(key),
      ]);
      return json({ authenticated: true }, 200, { "Set-Cookie": `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800` });
    }
    if (!await authorized(request, db)) return json({ error: "Inicia sesión para continuar." }, 401);
    if (request.method === "POST" && url.pathname === "/api/admin/logout") {
      const token = tokenOf(request);
      if (token) await db.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").bind(await digest(token)).run();
      return json({ ok: true }, 200, { "Set-Cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` });
    }
    if (request.method === "GET" && url.pathname === "/api/admin/content") return json(await readContent(db));
    if (request.method === "PUT" && url.pathname === "/api/admin/content") {
      const raw = await request.text();
      if (raw.length > 300000) return json({ error: "El contenido supera el tamaño permitido." }, 413);
      const state = JSON.parse(raw);
      if (!Number.isInteger(state.revision) || state.revision < 0 || !validateContent(state.content)) return json({ error: "Revisa los campos: precios, enlaces y datos de contacto deben ser válidos." }, 400);
      const c = state.content as SiteContent;
      const previous = await readContent(db);
      const grows = c.packages.length > previous.content.packages.length ? 1 : 0;
      const managedRefs = new Set(referencedMedia(c).filter(u => u.startsWith("/media/")).map(u => u.slice(7)));
      for (const id of managedRefs) if (!await db.prepare("SELECT id FROM media_assets WHERE id = ? AND upload_state = 'ready'").bind(id).first()) return json({ error: "Un archivo no está disponible. Espera a que termine de subir o súbelo nuevamente." }, 400);
      const result = state.revision === 0
        ? await db.prepare("INSERT OR IGNORE INTO site_content (key, payload, revision, updated_at) SELECT ?, ?, 1, ? WHERE ? = 0 OR (SELECT COALESCE(SUM(size), 0) FROM media_assets) < ?").bind("main", JSON.stringify(c), Date.now(), grows, SITE_LIMITS.uploadStopBytes).run()
        : await db.prepare("UPDATE site_content SET payload = ?, revision = revision + 1, updated_at = ? WHERE key = ? AND revision = ? AND (? = 0 OR (SELECT COALESCE(SUM(size), 0) FROM media_assets) < ?)").bind(JSON.stringify(c), Date.now(), "main", state.revision, grows, SITE_LIMITS.uploadStopBytes).run();
      if (!result.meta.changes) {
        const usage = await db.prepare("SELECT COALESCE(SUM(size), 0) AS total FROM media_assets").first<{total: number}>();
        if (grows && (usage?.total || 0) >= SITE_LIMITS.uploadStopBytes) return json({ error: "Llegaste al tope preventivo de 225 MB. Libera archivos sin uso antes de añadir otro catálogo. Puedes seguir editando lo existente." }, 413);
        return json({ error: "Hay cambios más recientes desde otro dispositivo. Recarga antes de guardar para no sobrescribirlos." }, 409);
      }
      return json({ ok: true, revision: state.revision + 1, savedAt: new Date().toISOString() });
    }
    if (request.method === "GET" && url.pathname === "/api/admin/assets") {
      const rows = await db.prepare("SELECT * FROM media_assets ORDER BY created_at DESC").all();
      return json({ assets: rows.results, limits: SITE_LIMITS });
    }
    if (request.method === "POST" && url.pathname === "/api/admin/upload") {
      if (!env.BUCKET) return json({ error: "Los archivos aún no están disponibles." }, 503);
      if (Number(request.headers.get("content-length") || 0) > MAX_VIDEO + 100000) return json({ error: "El archivo es demasiado grande." }, 413);
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File) || !mimeTypes.has(file.type) || file.size === 0) return json({ error: "Usa JPG, PNG, WebP, MP4 o WebM." }, 400);
      if (file.size > (file.type.startsWith("image/") ? MAX_IMAGE : MAX_VIDEO)) return json({ error: "Máximo 8 MB por foto o 20 MB por video. Para videos largos, usa un enlace de YouTube." }, 413);
      if (!await validSignature(file)) return json({ error: "El contenido no corresponde al formato del archivo." }, 400);
      const buffer = await file.arrayBuffer();
      const duration = file.type.startsWith("video/") ? videoDuration(buffer, file.type) : null;
      if (file.type.startsWith("video/") && duration === null) return json({ error: "No pudimos comprobar la duración. Exporta el video como MP4 y vuelve a subirlo, o usa un enlace de YouTube." }, 400);
      if (duration !== null && duration > SITE_LIMITS.videoSeconds + 0.1) return json({ error: "El video supera los 60 segundos. Usa un clip de hasta 60 segundos o enlaza el video completo desde YouTube." }, 413);
      const id = crypto.randomUUID();
      // Reservar en una sola sentencia evita superar el tope con subidas simultáneas.
      const reservation = await db.prepare("INSERT INTO media_assets (id, mime, size, name, created_at, upload_state, duration_seconds) SELECT ?, ?, ?, ?, ?, 'uploading', ? WHERE (SELECT COALESCE(SUM(size), 0) FROM media_assets) + ? <= ? AND (SELECT COUNT(*) FROM media_assets) < ?")
        .bind(id, file.type, file.size, file.name.slice(0, 200), Date.now(), duration, file.size, SITE_LIMITS.uploadStopBytes, SITE_LIMITS.files).run();
      if (!reservation.meta.changes) return json({ error: "Esta subida supera el tope preventivo de 225 MB o los 300 archivos. Libera archivos sin uso o enlaza tus videos desde YouTube." }, 413);
      try {
        await env.BUCKET.put(id, buffer, { httpMetadata: { contentType: file.type } });
        await db.prepare("UPDATE media_assets SET upload_state = 'ready' WHERE id = ?").bind(id).run();
      } catch (error) {
        try { await env.BUCKET.delete(id); await db.prepare("DELETE FROM media_assets WHERE id = ?").bind(id).run(); } catch { /* La reserva mantiene contabilizado cualquier archivo pendiente de limpieza. */ }
        throw error;
      }
      return json({ url: `/media/${id}`, id, kind: file.type.startsWith("image/") ? "image" : "video", size: file.size, duration });
    }
    if (request.method === "DELETE" && url.pathname.startsWith("/api/admin/assets/")) {
      const id = url.pathname.split("/").pop() || "";
      if (!/^[a-f0-9-]{36}$/.test(id)) return json({ error: "Archivo no encontrado." }, 404);
      const state = await readContent(db);
      if (referencedMedia(state.content).includes(`/media/${id}`)) return json({ error: "Retira primero este archivo de la galería, del catálogo o de la portada y guarda los cambios." }, 409);
      const asset = await db.prepare("SELECT upload_state, created_at FROM media_assets WHERE id = ?").bind(id).first<{upload_state: string; created_at: number}>();
      if (asset?.upload_state === "uploading" && asset.created_at > Date.now() - 300000) return json({ error: "Este archivo todavía se está subiendo. Intenta nuevamente en unos minutos." }, 409);
      if (!env.BUCKET) return json({ error: "Los archivos no están disponibles. No se ha eliminado nada." }, 503);
      await env.BUCKET.delete(id);
      await db.prepare("DELETE FROM media_assets WHERE id = ?").bind(id).run();
      return json({ ok: true });
    }
    return json({ error: "Ruta no disponible." }, 404);
  } catch (error) {
    if (error instanceof SyntaxError) return json({ error: "Los datos no tienen un formato válido." }, 400);
    console.error("Sinteria API failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "No pudimos completar la acción. Vuelve a intentar." }, 500);
  }
}
