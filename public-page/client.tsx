import { hydrateRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import PublicPages, { pages, type PageId } from "../app/public-pages.tsx";
import type { SiteContent } from "../lib/content.ts";
import { API_ORIGIN, publicContentWithOrigin } from "../lib/public-content.ts";
import "../app/public-pages.css";
import "../app/party-theme.css";
import "../app/neon-world.css";
const saved = document.getElementById("public-state")?.textContent;
const root = document.getElementById("root");
if (!saved || !root) throw new Error("Missing public page content.");
const state = JSON.parse(saved) as { content: SiteContent; page: PageId };
if (!pages.some(p => p.id === state.page)) throw new Error("Unknown public page.");
function LivePage(){
 const [content,setContent]=useState(state.content),[ready,setReady]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{
  let active=true,loading=false;
  const refresh=async()=>{
   if(loading)return;loading=true;
   try{const r=await fetch(API_ORIGIN+"/api/site",{cache:"no-store",credentials:"omit",signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error();const v=await r.json() as {content:SiteContent};if(!v.content?.brand||!Array.isArray(v.content.packages))throw Error();if(active){setContent(publicContentWithOrigin(v.content,API_ORIGIN));setReady(true);setError(false);}}
   catch{if(active){setReady(false);setError(true);}}finally{loading=false;}
  };
  const visible=()=>{if(document.visibilityState==="visible")refresh();};
  refresh();const timer=window.setInterval(visible,30000);
  document.addEventListener("visibilitychange",visible);window.addEventListener("focus",visible);window.addEventListener("online",visible);
  return()=>{active=false;clearInterval(timer);document.removeEventListener("visibilitychange",visible);window.removeEventListener("focus",visible);window.removeEventListener("online",visible);};
 },[]);
 return <>{error&&<div className="sp-sync-error" role="status">No pudimos actualizar los precios. Revisa tu conexión o consulta por WhatsApp.<button onClick={()=>window.location.reload()}>Reintentar</button></div>}<PublicPages content={content} page={state.page} liveReady={ready}/></>;
}
hydrateRoot(root,<LivePage/>);
