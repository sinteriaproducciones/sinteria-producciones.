import { SITE_LIMITS } from "./limits.ts";
export type VideoMetadata = {duration:number;width:number;height:number};
export type VideoQuality = "balanced" | "small" | "high";
export type ClipRange = {start:number;end:number};
export const VIDEO_QUALITIES = {
  balanced:{label:"Equilibrada · recomendada",longEdge:1280,bitrate:1800000},
  small:{label:"Más ligero",longEdge:854,bitrate:900000},
  high:{label:"Mayor detalle",longEdge:1920,bitrate:2400000},
} as const;
export function isVideoFile(file:Pick<File,"type"|"name">){return file.type.startsWith("video/")||/\.(mp4|webm|mov|m4v|mkv|avi|3gp)$/i.test(file.name);}
export function clipRange(duration:number,start=0,end=Math.min(duration,SITE_LIMITS.videoSeconds)):ClipRange {
  if(!Number.isFinite(duration)||duration<=0)throw new Error("No pudimos leer la duración de este video.");
  const safeStart=Math.max(0,Math.min(Number.isFinite(start)?start:0,Math.max(0,duration-.05)));
  const safeEnd=Math.max(safeStart+.05,Math.min(duration,Number.isFinite(end)?end:duration,safeStart+SITE_LIMITS.videoSeconds));
  return {start:safeStart,end:Math.min(duration,safeEnd)};
}
export function videoEditPlan(meta:VideoMetadata,range:ClipRange,quality:VideoQuality="balanced",mute=false,availableBytes:number=SITE_LIMITS.videoBytes){
  if(![meta.duration,meta.width,meta.height,range.start,range.end].every(Number.isFinite)||meta.width<=0||meta.height<=0||range.start<0||range.end>meta.duration+.01||range.end<=range.start||range.end-range.start>SITE_LIMITS.videoSeconds+.01)throw new Error("Elige un fragmento de hasta 60 segundos dentro del video.");
  const duration=range.end-range.start,profile=VIDEO_QUALITIES[quality];
  const maxBytes=Math.floor(Math.min(SITE_LIMITS.videoBytes,availableBytes-120000));
  const audioBitrate=mute?0:96000;
  const bitrateBudget=Math.floor(maxBytes*.80*8/duration)-audioBitrate;
  if(maxBytes<150000||bitrateBudget<120000)throw new Error("Queda poco espacio. Elige un fragmento más corto o elimina archivos que no uses.");
  const videoBitrate=Math.min(profile.bitrate,bitrateBudget);
  const scale=Math.min(1,profile.longEdge/Math.max(meta.width,meta.height));
  const width=Math.max(2,Math.floor(meta.width*scale/2)*2),height=Math.max(2,Math.floor(meta.height*scale/2)*2);
  return {start:range.start,end:range.end,duration,width,height,videoBitrate,audioBitrate,maxBytes,estimatedBytes:Math.ceil((videoBitrate+audioBitrate)*duration/8*1.05)};
}
export const videoTime=(seconds:number)=>{const value=Math.max(0,Number.isFinite(seconds)?seconds:0);return `${Math.floor(value/60).toString().padStart(2,"0")}:${Math.floor(value%60).toString().padStart(2,"0")}`;};
