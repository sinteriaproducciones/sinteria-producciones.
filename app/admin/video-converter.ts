import { ALL_FORMATS, BlobSource, BufferTarget, Conversion, Input, Mp4OutputFormat, WebMOutputFormat, Output, Quality, canEncodeAudio, getFirstEncodableVideoCodec } from "mediabunny";
import { videoEditPlan, type ClipRange, type VideoMetadata, type VideoQuality } from "../../lib/video-edit-plan.ts";
import { videoDuration } from "../../lib/video-duration.ts";
export async function inspectVideo(file:File):Promise<VideoMetadata>{
 const input=new Input({source:new BlobSource(file),formats:ALL_FORMATS});
 try{
  const track=await input.getPrimaryVideoTrack();
  if(!track)throw new Error("Este archivo no contiene una pista de video reconocible.");
  const [duration,width,height]=await Promise.all([input.computeDuration(),track.getDisplayWidth(),track.getDisplayHeight()]);
  if(!Number.isFinite(duration)||duration<=0||!width||!height)throw new Error("No pudimos leer los datos del video.");
  return {duration,width,height};
 }finally{input.dispose();}
}
export async function adaptVideo(file:File,meta:VideoMetadata,range:ClipRange,quality:VideoQuality,mute:boolean,availableBytes:number,signal:AbortSignal,onProgress:(progress:number)=>void):Promise<File>{
 const plan=videoEditPlan(meta,range,quality,mute,availableBytes);
 if(signal.aborted)throw new DOMException("Preparación cancelada","AbortError");
 const input=new Input({source:new BlobSource(file),formats:ALL_FORMATS});
 let conversion:Conversion|undefined;
 let usedRecorder=false;
 const abort=()=>{void conversion?.cancel().catch(()=>{});};
 signal.addEventListener("abort",abort,{once:true});
 try{
  const codec=await getFirstEncodableVideoCodec(["avc","vp8","vp9"],{width:plan.width,height:plan.height,frameRate:30,quality:new Quality({bitrate:plan.videoBitrate})});
  if(!codec){
   usedRecorder=true;
   const {recordClip}=await import("./video-recorder");
   return await recordClip(file,plan,!!await input.getPrimaryAudioTrack(),mute,signal,onProgress);
  }
  const mp4=codec==="avc";
  const audioTrack=await input.getPrimaryAudioTrack();
  if(mp4&&!mute&&audioTrack&&!await canEncodeAudio("aac")){
   const {registerAacEncoder}=await import("@mediabunny/aac-encoder");registerAacEncoder();
  }
  const target=new BufferTarget();
  const output=new Output({format:mp4?new Mp4OutputFormat({fastStart:"in-memory"}):new WebMOutputFormat(),target});
  conversion=await Conversion.init({input,output,tracks:"primary",trim:{start:plan.start,end:plan.end},
   video:{codec,width:plan.width,height:plan.height,fit:"contain",frameRate:30,quality:new Quality({bitrate:plan.videoBitrate}),forceTranscode:true,keyFrameInterval:2,allowTransformationMetadata:false},
   audio:mute?{discard:true}:{codec:mp4?"aac":"opus",quality:new Quality({bitrate:plan.audioBitrate}),numberOfChannels:2,sampleRate:48000},tags:{}});
  if(!conversion.isValid||!conversion.utilizedTracks.some(t=>t.isVideoTrack()))throw new Error("No pudimos preparar este formato de video. Prueba con un MP4 o MOV de tu cámara.");
  if(!mute&&audioTrack&&!conversion.utilizedTracks.some(t=>t.isAudioTrack()))throw new Error("No se pudo conservar el audio de este formato. Puedes activar «Subir sin sonido» y volver a prepararlo.");
  if(signal.aborted){await conversion.cancel();throw new DOMException("Preparación cancelada","AbortError");}
  conversion.onProgress=value=>onProgress(Math.min(.99,Math.max(0,value)));
  await conversion.execute();
  if(signal.aborted)throw new DOMException("Preparación cancelada","AbortError");
  if(!target.buffer)throw new Error("No pudimos terminar el archivo. Intenta con un fragmento más corto.");
  const mime=mp4?"video/mp4":"video/webm",duration=videoDuration(target.buffer,mime);
  if(duration===null||duration>60.1)throw new Error("No pudimos terminar el recorte correctamente. Reduce un poco el final y vuelve a intentarlo.");
  if(target.buffer.byteLength>plan.maxBytes)throw new Error("El resultado aún ocupa demasiado. Elige «Más ligero» o acorta el fragmento y vuelve a prepararlo.");
  const result=new File([target.buffer],`${file.name.replace(/\.[^.]+$/,"")}-clip.${mp4?"mp4":"webm"}`,{type:mime});
  onProgress(1);return result;
 }catch(error){
  if(signal.aborted)throw new DOMException("Preparación cancelada","AbortError");
  if(conversion&&conversion.state!=="done")await conversion.cancel().catch(()=>{});
  if(!usedRecorder){
   const {recordClip}=await import("./video-recorder");
   return await recordClip(file,plan,!!await input.getPrimaryAudioTrack(),mute,signal,onProgress);
  }
  throw error;
 }finally{signal.removeEventListener("abort",abort);input.dispose();}
}
