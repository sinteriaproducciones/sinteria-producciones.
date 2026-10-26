import type {Media,SiteContent} from './content.ts';
import {packagePrice} from './content.ts';
import {homeMedia,catalogMedia} from './media-content.ts';
import videoRoutes from '../public-page/video-routes.json' with {type:'json'};
const builtVideoRoutes: {id:string;url:string}[]=videoRoutes;
export const SITE_BASE='/sinteria-producciones./';
export const SITE_ORIGIN='https://sinteriaproducciones.github.io';
export const SITE_URL=SITE_ORIGIN+SITE_BASE;
export const pages=[
 {id:'inicio',path:'',label:'Inicio',title:'Hora loca en Lima sur | Sinteria Producciones',description:'Shows de hora loca, personajes y animación para tu fiesta en Lima sur. Mira nuestros videos, conoce los catálogos y cotiza con Sinteria Producciones.'},
 {id:'servicios',path:'servicios/',label:'Servicios',title:'Shows de hora loca y animación en Lima sur | Sinteria',description:'Hora loca, personajes, animación y shows para cumpleaños, matrimonios, quinceañeros y eventos de empresa. Coordinamos tu evento en Lima sur.'},
 {id:'catalogo',path:'catalogo/',label:'Catálogos',title:'Precios y personajes de hora loca | Sinteria Producciones',description:'Explora paquetes de hora loca, personajes y combos de Sinteria Producciones. Consulta los precios publicados y la disponibilidad para tu celebración.'},
 {id:'galeria',path:'galeria/',label:'Galería',title:'Videos y fotos de hora loca | Sinteria Producciones',description:'Mira videos y fotos de nuestros shows de hora loca, personajes y celebraciones. Conoce el trabajo de Sinteria Producciones antes de cotizar.'},
 {id:'nosotros',path:'nosotros/',label:'Nosotros',title:'Sinteria Producciones | Hora loca y shows en Lima sur',description:'Conoce Sinteria Producciones, parte de Sinteria Group. Hora loca, personajes y coordinación directa para tu celebración en Lima sur.'},
 {id:'contacto',path:'contacto/',label:'Contacto',title:'Cotiza tu hora loca en Lima sur | Sinteria Producciones',description:'Consulta disponibilidad para tu hora loca o show. Cuéntanos tu fecha, distrito y personajes favoritos y cotiza por el WhatsApp oficial de Sinteria.'},
 {id:'condiciones',path:'condiciones/',label:'Condiciones',title:'Condiciones de reserva | Sinteria Producciones',description:'Condiciones de cotización, adelantos, cancelación, reprogramación y atención de Sinteria Producciones.'},
 {id:'privacidad',path:'privacidad/',label:'Privacidad',title:'Política de privacidad | Sinteria Producciones',description:'Cómo se utilizan los datos de las consultas de Sinteria Producciones y cómo solicitar atención sobre tu información.'},
] as const;
export type PageId=typeof pages[number]['id']|'video';
export const pageHref=(page:PageId)=>SITE_BASE+(page==='video'?'videos/':pages.find(p=>p.id===page)!.path);
export function allPublicVideos(content:SiteContent):Media[]{
 const seen=new Set<string>();return [...content.gallery.filter(m=>m.published),...content.packages.filter(p=>p.published).flatMap(catalogMedia).filter(m=>m.published)].filter(m=>{if(m.kind==='image'||seen.has(m.url))return false;seen.add(m.url);return true;});
}
export function findPublicVideo(content:SiteContent,id?:string){return [...content.gallery.filter(m=>m.published),...content.packages.filter(p=>p.published).flatMap(catalogMedia).filter(m=>m.published)].find(m=>m.kind!=='image'&&m.id===id);}
export function videoHref(media:Media){const built=builtVideoRoutes.find(m=>m.url===media.url||m.id===media.id);return SITE_BASE+'videos/'+(built?encodeURIComponent(built.id)+'/':'?video='+encodeURIComponent(media.id));}
export function videoDescription(media:Media){return `${media.title}. Video de ${media.category.toLocaleLowerCase('es')} de Sinteria Producciones. Consulta personajes y disponibilidad para tu celebración.`;}
export function pageSEO(content:SiteContent,page:PageId,videoId?:string){
 const video=page==='video'?findPublicVideo(content,videoId):undefined;
 const meta=pages.find(p=>p.id===page)||{title:'Videos de hora loca | Sinteria Producciones',description:'Mira los videos de los personajes y shows de Sinteria Producciones.',label:'Videos'};
 const first=homeMedia(content)[0];const image=video?.poster||(first?.kind==='image'?first.url:first?.poster)||content.brand.hero;
 return {title:video?`${video.title} | Sinteria Producciones`:meta.title,description:video?videoDescription(video):meta.description,url:video?SITE_ORIGIN+videoHref(video):SITE_ORIGIN+pageHref(page),image,imageAlt:video?.title||first?.title||'Hora loca y personajes de Sinteria Producciones',noindex:page==='video'&&!video};
}
export function structuredData(content:SiteContent,page:PageId,videoId?:string){
 const meta=pageSEO(content,page,videoId),organization=SITE_URL+'#organization';
 const graph:Record<string,unknown>[]=[{'@type':'Organization','@id':organization,name:'Sinteria Producciones',url:SITE_URL,logo:SITE_URL+'assets/sinteria-logo.png',image:meta.image,taxID:content.brand.ruc,telephone:'+'+content.brand.whatsapp,email:content.brand.email,areaServed:content.brand.coverage,parentOrganization:{'@type':'Organization',name:content.brand.group},sameAs:Object.values(content.socials).filter(Boolean)},
 {'@type':'WebSite','@id':SITE_URL+'#website',url:SITE_URL,name:'Sinteria Producciones',inLanguage:'es-PE',publisher:{'@id':organization}},
 {'@type':page==='video'?'ItemPage':page==='galeria'||page==='catalogo'?'CollectionPage':'WebPage','@id':meta.url+'#page',url:meta.url,name:meta.title,description:meta.description,inLanguage:'es-PE',isPartOf:{'@id':SITE_URL+'#website'},about:{'@id':organization},primaryImageOfPage:{'@type':'ImageObject',contentUrl:meta.image}}];
 if(page!=='inicio')graph.push({'@type':'BreadcrumbList','@id':meta.url+'#breadcrumbs',itemListElement:[{'@type':'ListItem',position:1,name:'Inicio',item:SITE_URL},...(page==='video'?[{'@type':'ListItem',position:2,name:'Galería',item:SITE_URL+'galeria/'},{'@type':'ListItem',position:3,name:findPublicVideo(content,videoId)?.title||'Videos',item:meta.url}]:[{'@type':'ListItem',position:2,name:pages.find(p=>p.id===page)?.label,item:meta.url}])]});
 if(['inicio','catalogo'].includes(page)){
 const offers=content.packages.filter(p=>p.published).map(p=>({'@type':'Offer',...(p.price===null?{}:{price:packagePrice(p,content),priceCurrency:'PEN'}),url:SITE_URL+'catalogo/',itemOffered:{'@type':'Service',name:p.name,description:p.description,serviceType:p.category,provider:{'@id':organization}}}));
 graph.push({'@type':'OfferCatalog',name:'Catálogos de hora loca de Sinteria Producciones',itemListElement:offers});
 }
 if(page==='servicios')for(const s of content.services?.filter(s=>s.published)||[])graph.push({'@type':'Service',name:s.name,description:s.text,serviceType:s.name,areaServed:content.brand.coverage,provider:{'@id':organization},image:s.image,...(s.price===null?{}:{offers:{'@type':'Offer',price:s.price,priceCurrency:'PEN',url:SITE_URL+'contacto/'}})});
 return {'@context':'https://schema.org','@graph':graph};
}
