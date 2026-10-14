import type { SiteContent } from "./content.ts";
type Config = { projectUrl: string; publicKey: string; ownerEmail: string };
type Session = { access_token: string; refresh_token: string; expires_at?: number; expires_in: number; user?: { email?: string }; startedAt?: number };
let configPromise: Promise<Config> | undefined;
let memorySession: Session | null = null;
const SESSION_KEY = "sinteria.admin.session";
export async function backendConfig(): Promise<Config> {
 if (!configPromise) {
  const base = new URL(document.baseURI);
  base.pathname = base.pathname.replace(/admin\/(?:index\.html)?$/, "");
  configPromise = fetch(new URL("backend-config.json",base),{cache:"no-store"}).then(async r=>{
   if (!r.ok) throw Error("La conexión del panel todavía está pendiente de activar.");
   const c=await r.json() as Config;
   if (!c.projectUrl || !c.publicKey || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(c.projectUrl)) throw Error("La conexión del panel todavía está pendiente de activar.");
   return c;
  }).catch(error=>{configPromise=undefined;throw error;});
 }
 return configPromise;
}
function session(): Session | null {
 if (memorySession) return memorySession;
 try{const raw=sessionStorage.getItem(SESSION_KEY);return raw?JSON.parse(raw):null;}catch{return null;}
}
function setSession(value: Session | null) {
 if(value && !value.expires_at)value.expires_at=Math.floor(Date.now()/1000)+value.expires_in;
 memorySession=value;
 try{if(value)sessionStorage.setItem(SESSION_KEY,JSON.stringify(value));else sessionStorage.removeItem(SESSION_KEY);}catch{}
}
async function endpoint(path: string, options: RequestInit={},authenticated=true) {
 const c=await backendConfig();
 const s=authenticated?session():null;
 const response=await fetch(c.projectUrl+"/functions/v1/sinteria-admin"+path,{
  ...options,headers:{apikey:c.publicKey,...(s?{Authorization:"Bearer "+s.access_token}:{}),...options.headers},cache:"no-store",credentials:"omit"
 });
 const value=await response.json();
 if (!response.ok) throw Object.assign(Error(value.error||"No se pudo completar la acción."),{status:response.status});
 return value;
}
async function refresh() {
 const s=session();
 if (!s) return;
 if (s.startedAt && Date.now()-s.startedAt>8*60*60*1000) {setSession(null);return;}
 if ((s.expires_at||0)*1000-Date.now()>60000) return;
 try{
  const result=await endpoint("/api/admin/refresh",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refresh_token:s.refresh_token})},false);
  setSession({...result.session,startedAt:s.startedAt||Date.now()});
 }catch(error){setSession(null);throw error;}
}
export async function adminApi(path: string, options: RequestInit={}) {
 if(path==="/api/admin/logout") {
  try{await refresh();return session()?await endpoint(path,options):{ok:true};}
  finally{setSession(null);}
 }
 if (path==="/api/admin/login") {
  const value=await endpoint(path,options,false);
  setSession({...value.session,startedAt:Date.now()});
  return value;
 }
 await refresh();
 if (path==="/api/admin/session" && !session()) return {authenticated:false};
 try{
  const result=await endpoint(path,options);
  if(path==="/api/admin/logout")setSession(null);
  return result;
 }catch(error){
  if((error as {status?:number}).status===401)setSession(null);
  throw error;
 }
}
export async function readPublicContent(): Promise<{content:SiteContent}> {
 const c=await backendConfig();
 const response=await fetch(c.projectUrl+"/rest/v1/rpc/sinteria_public_content",{
  method:"POST",headers:{apikey:c.publicKey,"Content-Type":"application/json"},body:"{}",cache:"no-store",credentials:"omit"
 });
 if(!response.ok)throw Error("No pudimos actualizar el catálogo.");
 return response.json();
}

