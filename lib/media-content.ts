import type {Media,Package,SiteContent} from "./content.ts";
export function moveMedia<T>(items:readonly T[],from:number,to:number):T[]{
 const next=[...items];if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||from>=next.length||to<0||to>=next.length||from===to)return next;
 const [item]=next.splice(from,1);next.splice(to,0,item);return next;
}
export function catalogMedia(pack:Package):Media[]{
 if(pack.media!==undefined)return pack.media;
 return pack.image?[{id:"cover",title:pack.name,category:pack.category,kind:"image",url:pack.image,published:true}]:[];
}
export function catalogCover(items:readonly Media[]):string|undefined{
 const visible=items.filter(m=>m.published);const first=visible[0];
 return first?.kind==="image"?first.url:first?.poster||visible.find(m=>m.kind==="image")?.url;
}
export function homeMediaIds(content:SiteContent):string[]{
 return content.homeMediaIds??content.gallery.filter(m=>m.published&&m.kind==="image").slice(0,3).map(m=>m.id);
}
export function homeMedia(content:SiteContent):Media[]{
 const map=new Map(content.gallery.filter(m=>m.published).map(m=>[m.id,m]));
 return homeMediaIds(content).map(id=>map.get(id)).filter((m):m is Media=>!!m);
}
export function normalizeMediaContent(content:SiteContent):SiteContent{
 return {...content,homeMediaIds:homeMediaIds(content),packages:content.packages.map(p=>p.media===undefined?{...p,media:catalogMedia(p)}:p)};
}
