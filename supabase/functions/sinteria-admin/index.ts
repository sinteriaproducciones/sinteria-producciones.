import { validateContent, type SiteContent } from "../_shared/content.ts";
import { videoDuration } from "../_shared/video-duration.ts";

declare const Deno: { env: { get(name: string): string | undefined }; serve(fn: (r: Request) => Promise<Response>): void };
type Env = { url: string; serviceKey: string; anonKey: string; allowedOrigin: string };
type User = { id: string; email?: string; email_confirmed_at?: string };
class HttpError extends Error { status: number; constructor(status: number, message: string) { super(message); this.status=status; } }
export const ALLOWED_ORIGIN = "https://sinteriaproducciones.github.io";
export const ADMIN_URL = ALLOWED_ORIGIN + "/sinteria-producciones./admin/";
const BUCKET = "sinteria-media";

export function inspectMedia(bytes: ArrayBuffer, mime: string): number | null {
 const b = new Uint8Array(bytes);
 const signature = (start: number, text: string) => Array.from(text).every((c,i) => b[start+i] === c.charCodeAt(0));
 if (mime === "image/jpeg" && !(b[0]===255&&b[1]===216&&b[2]===255)) throw new HttpError(400,"La foto no es un JPG válido.");
 if (mime === "image/png" && !(b[0]===137&&signature(1,"PNG\r\n\x1a\n"))) throw new HttpError(400,"La foto no es un PNG válido.");
 if (mime === "image/webp" && !(signature(0,"RIFF")&&signature(8,"WEBP"))) throw new HttpError(400,"La foto no es un WebP válido.");
 if (mime.startsWith("video/")) {
  const d = videoDuration(bytes,mime);
  if (d===null) throw new HttpError(400,"No pudimos comprobar la duración. Exporta el video como MP4.");
  if (d>60.1) throw new HttpError(400,"Máximo 60 segundos por clip.");
  return d;
 }
 return null;
}
export function ownerIdentity(user: User, expected: string) {
 return !!user.id && user.email?.toLowerCase()===expected.toLowerCase() && !!user.email_confirmed_at;
}
function rpcName(path: string) { return "/rest/v1/rpc/" + path; }
export function createHandler(env: Env, fetcher: typeof fetch = fetch) {
 const db = async (path: string, init: RequestInit = {}) => {
  const response = await fetcher(env.url + path,{...init,headers:{apikey:env.serviceKey,Authorization:"Bearer "+env.serviceKey,"Content-Type":"application/json",...init.headers}});
  const value = response.status===204 ? null : await response.json();
  if (!response.ok) throw new HttpError(value?.code==="40001"?409:value?.code==="P0001"?400:500,value?.message||"No se pudo guardar la información.");
  return value;
 };
 const rpc = (name: string, body: unknown) => db(rpcName(name),{method:"POST",body:JSON.stringify(body)});
 const auth = async (path: string, body?: unknown, token?: string) => {
  const response = await fetcher(env.url+"/auth/v1/"+path,{method:body===undefined?"GET":"POST",headers:{apikey:env.anonKey,"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const value = response.status===204?{}:await response.json();
  if (!response.ok) throw new HttpError(response.status===429?429:401,response.status===429?"Espera unos minutos antes de volver a intentar.":"No pudimos validar el acceso. Revisa tu correo y contraseña.");
  return value;
 };
 const requireOwner = async (request: Request) => {
  const bearer = request.headers.get("Authorization");
  if (!bearer?.startsWith("Bearer ")) throw new HttpError(401,"Inicia sesión para continuar.");
  const user = await auth("user",undefined,bearer.slice(7)) as User;
  const settings = await db("/rest/v1/sinteria_settings?id=eq.true&select=owner_email");
  if (!ownerIdentity(user,settings?.[0]?.owner_email||"")) throw new HttpError(403,"Este acceso está reservado para Sinteria Producciones.");
  if (!await rpc("sinteria_claim_owner",{p_user:user.id,p_email:user.email})) throw new HttpError(403,"Esta cuenta no es la administradora registrada.");
  return user;
 };
 const readJSON = async (request: Request) => {
  if (Number(request.headers.get("Content-Length")||0)>262144) throw new HttpError(413,"Demasiado texto en una sola solicitud.");
  const text=await request.text();
  if (new TextEncoder().encode(text).byteLength>262144) throw new HttpError(413,"Demasiado texto en una sola solicitud.");
  try{return JSON.parse(text);}catch{throw new HttpError(400,"Solicitud inválida.");}
 };
 return async (request: Request): Promise<Response> => {
  const cors = { "Access-Control-Allow-Origin":env.allowedOrigin,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS","Vary":"Origin" };
  const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
  if (request.method==="OPTIONS") return new Response(null,{status:204,headers:cors});
  const origin=request.headers.get("Origin");
  if (origin && origin!==env.allowedOrigin) return reply({error:"Origen no autorizado."},403);
  const path=new URL(request.url).pathname.replace(/^.*\/sinteria-admin(?=\/|$)/,"")||"/";
  try {
   if (path==="/api/admin/login" && request.method==="POST") {
    const body=await readJSON(request);
    const session=await auth("token?grant_type=password",{email:body.email,password:body.password});
    const user=await requireOwner(new Request(request.url,{headers:{Authorization:"Bearer "+session.access_token}}));
    return reply({session,authenticated:true,email:user.email});
   }
   if (path==="/api/admin/refresh" && request.method==="POST") {
    const body=await readJSON(request);
    const session=await auth("token?grant_type=refresh_token",{refresh_token:body.refresh_token});
    await requireOwner(new Request(request.url,{headers:{Authorization:"Bearer "+session.access_token}}));
    return reply({session});
   }
   if (path==="/api/admin/session" && request.method==="GET") {
    if (!request.headers.has("Authorization")) return reply({authenticated:false});
    const user=await requireOwner(request);
    return reply({authenticated:true,email:user.email});
   }
   await requireOwner(request);
   if (path==="/api/admin/logout" && request.method==="POST") {
    await auth("logout",{},request.headers.get("Authorization")!.slice(7));
    return reply({ok:true});
   }
   if (path==="/api/admin/content" && request.method==="GET") {
    const rows=await db("/rest/v1/sinteria_content?id=eq.true&select=payload,revision,updated_at");
    if (!rows[0]) throw new HttpError(503,"La configuración inicial todavía está pendiente.");
    return reply({content:rows[0].payload,revision:rows[0].revision,savedAt:rows[0].updated_at});
   }
   if (path==="/api/admin/content" && request.method==="PUT") {
    const body=await readJSON(request);
    if (!Number.isInteger(body.revision)||!validateContent(body.content)) throw new HttpError(400,"Revisa los precios, enlaces y campos obligatorios.");
    const value=await rpc("sinteria_save_content",{p_content:body.content as SiteContent,p_revision:body.revision});
    return reply(value);
   }
   if (path==="/api/admin/assets" && request.method==="GET") {
    const assets=await db("/rest/v1/sinteria_assets?select=*&order=created_at.desc");
    return reply({assets:assets.map((a: {created_at:string})=>({...a,created_at:Date.parse(a.created_at)}))});
   }
   if (path==="/api/admin/upload" && request.method==="POST") {
    if (Number(request.headers.get("Content-Length")||0)>20971520+100000) throw new HttpError(413,"Máximo 20 MB por video.");
    const form=await request.formData(),file=form.get("file");
    if (!(file instanceof File)) throw new HttpError(400,"Selecciona un archivo.");
    const extensions:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","video/mp4":"mp4","video/webm":"webm"};
    if (!extensions[file.type]||!file.size||file.size>(file.type.startsWith("video/")?20971520:8388608)) throw new HttpError(400,"Usa fotos hasta 8 MB o clips hasta 20 MB en un formato admitido.");
    const buffer=await file.arrayBuffer(),duration=inspectMedia(buffer,file.type);
    const id=crypto.randomUUID(),key=id+"."+extensions[file.type],url=env.url+"/storage/v1/object/public/"+BUCKET+"/"+key;
    await rpc("sinteria_reserve_upload",{p_id:id,p_name:file.name,p_mime:file.type,p_size:file.size,p_url:url,p_key:key,p_duration:duration});
    try {
     const result=await fetcher(env.url+"/storage/v1/object/"+BUCKET+"/"+key,{method:"POST",headers:{apikey:env.serviceKey,Authorization:"Bearer "+env.serviceKey,"Content-Type":file.type,"x-upsert":"false","Cache-Control":"max-age=3600"},body:buffer});
     if (!result.ok) throw new HttpError(502,"La subida no terminó. Inténtalo nuevamente.");
     await rpc("sinteria_commit_upload",{p_id:id});
     return reply({id,url,kind:file.type.startsWith("video/")?"video":"image",duration});
    } catch(error) {
     throw error;
    }
   }
   if (path.startsWith("/api/admin/assets/") && request.method==="DELETE") {
    const id=decodeURIComponent(path.slice("/api/admin/assets/".length));
    const asset=await rpc("sinteria_begin_delete",{p_id:id});
    if (asset) {
     const result=await fetcher(env.url+"/storage/v1/object/"+BUCKET,{method:"DELETE",headers:{apikey:env.serviceKey,Authorization:"Bearer "+env.serviceKey,"Content-Type":"application/json"},body:JSON.stringify({prefixes:[asset.storage_key]})});
     if (!result.ok) throw new HttpError(502,"No pudimos eliminar el archivo. Su espacio sigue contabilizado.");
     await rpc("sinteria_release_upload",{p_id:id});
    }
    return reply({ok:true});
   }
   return reply({error:"Ruta no disponible."},404);
  } catch(error) {
   return reply({error:error instanceof HttpError?error.message:"No pudimos completar la acción. Inténtalo nuevamente."},error instanceof HttpError?error.status:500);
  }
 };
}
if (typeof Deno!=="undefined") Deno.serve(createHandler({
 url:Deno.env.get("SUPABASE_URL")!,serviceKey:Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
 anonKey:Deno.env.get("SUPABASE_ANON_KEY")!,allowedOrigin:ALLOWED_ORIGIN
}));

