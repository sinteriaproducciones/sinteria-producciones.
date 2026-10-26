import { hydrateRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import PublicPages, { pages, type PageId } from "../app/public-pages.tsx";
import {pageSEO,structuredData} from "../lib/site-seo.ts";
import type { SiteContent } from "../lib/content.ts";
import { API_ORIGIN, publicContentWithOrigin } from "../lib/public-content.ts";
import "../app/public-pages.css";
import "../app/party-theme.css";
import "../app/neon-world.css";
import "../app/public-media.css";
const saved = document.getElementById("public-state")?.textContent;
const root = document.getElementById("root");
if (!saved || !root) throw new Error("Missing public page content.");
const state = JSON.parse(saved) as { content: SiteContent; page: PageId; videoId?:string };
if (state.page!=="video"&&!pages.some(p => p.id === state.page)) throw new Error("Unknown public page.");
function LivePage(){
 const [videoId,setVideoId]=useState(state.videoId);
 useEffect(()=>{if(state.page==="video"){const id=new URL(window.location.href).searchParams.get("video");if(id)setVideoId(id);}},[]);
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
 useEffect(()=>{
  const meta=pageSEO(content,state.page,videoId);document.title=meta.title;
  const set=(selector:string,value:string)=>{document.querySelector(selector)?.setAttribute("content",value);};
  set('meta[name="description"]',meta.description);set('meta[property="og:title"]',meta.title);set('meta[property="og:description"]',meta.description);set('meta[property="og:url"]',meta.url);set('meta[property="og:image"]',meta.image);set('meta[property="og:image:alt"]',meta.imageAlt);set('meta[name="twitter:title"]',meta.title);set('meta[name="twitter:description"]',meta.description);set('meta[name="twitter:image"]',meta.image);
  set('meta[name="robots"]',meta.noindex?'noindex, follow':'index, follow, max-image-preview:large, max-video-preview:-1');
  document.querySelector('link[rel="canonical"]')?.setAttribute('href',meta.url);
  const script=document.getElementById('structured-data');if(script)script.textContent=JSON.stringify(structuredData(content,state.page,videoId));
 },[content,videoId]);
 return <>{error&&<div className="sp-sync-error" role="status">No pudimos actualizar los precios. Revisa tu conexión o consulta por WhatsApp.<button onClick={()=>window.location.reload()}>Reintentar</button></div>}<PublicPages content={content} page={state.page} videoId={videoId} liveReady={ready}/></>;
}
hydrateRoot(root,<LivePage/>);
