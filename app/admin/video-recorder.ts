import {ALL_FORMATS,BlobSource,BufferTarget,Conversion,Input,Mp4OutputFormat,Output,WebMOutputFormat} from "mediabunny";
import {videoDuration} from "../../lib/video-duration.ts";
import type {videoEditPlan} from "../../lib/video-edit-plan.ts";
type Plan=ReturnType<typeof videoEditPlan>;
function mediaReady(video:HTMLVideoElement,event:"loadedmetadata"|"seeked",signal:AbortSignal,action:()=>void){
 return new Promise<void>((resolve,reject)=>{
  const timeout=window.setTimeout(()=>finish(new Error("No pudimos abrir el video. Prueba con un MP4 compatible.")),15000);
  function finish(error?:Error){clearTimeout(timeout);video.removeEventListener(event,ready);video.removeEventListener("error",failed);signal.removeEventListener("abort",abort);error?reject(error):resolve();}
  const ready=()=>finish(),failed=()=>finish(new Error("El navegador no puede reproducir este formato de video.")),abort=()=>finish(new DOMException("Preparación cancelada","AbortError"));
  video.addEventListener(event,ready,{once:true});video.addEventListener("error",failed,{once:true});signal.addEventListener("abort",abort,{once:true});
  if(signal.aborted)abort();else action();
 });
}
export async function recordClip(file:File,plan:Plan,hasAudio:boolean,mute:boolean,signal:AbortSignal,onProgress:(value:number)=>void):Promise<File>{
 if(typeof MediaRecorder==="undefined"||typeof HTMLCanvasElement.prototype.captureStream!=="function")throw new Error("Este navegador no permite preparar videos. Abre el panel en Chrome actualizado.");
 const video=document.createElement("video"),canvas=document.createElement("canvas"),url=URL.createObjectURL(file);
 video.preload="auto";video.playsInline=true;video.style.cssText="position:fixed;width:2px;height:2px;left:-10000px;top:0;opacity:.01;pointer-events:none";document.body.appendChild(video);
 canvas.width=plan.width;canvas.height=plan.height;
 const ctx=canvas.getContext("2d",{alpha:false});
 let stream:MediaStream|undefined,audio:AudioContext|undefined,recorder:MediaRecorder|undefined,timer:number|undefined,watchdog:number|undefined;
 let conversion:Conversion|undefined,remuxInput:Input|undefined;
 try{
  if(!ctx)throw new Error("No pudimos preparar la imagen del video.");
  await mediaReady(video,"loadedmetadata",signal,()=>{video.src=url;});
  if(plan.start>0)await mediaReady(video,"seeked",signal,()=>{video.currentTime=plan.start;});
  else if(video.readyState<2)await new Promise<void>((resolve,reject)=>{const timeout=window.setTimeout(()=>reject(new Error("No pudimos leer la primera imagen del video.")),10000);video.onloadeddata=()=>{clearTimeout(timeout);resolve();};if(video.readyState>=2){clearTimeout(timeout);resolve();}});
  ctx.drawImage(video,0,0,plan.width,plan.height);
  stream=canvas.captureStream(30);
  if(!mute&&hasAudio){
   audio=new AudioContext({sampleRate:48000});await audio.resume();
   const source=audio.createMediaElementSource(video),destination=audio.createMediaStreamDestination();source.connect(destination);
   for(const track of destination.stream.getAudioTracks())stream.addTrack(track);
  }else video.muted=true;
  const mime=["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/webm;codecs=vp8,opus","video/webm;codecs=vp9,opus","video/webm","video/mp4"].find(type=>MediaRecorder.isTypeSupported(type));
  if(!mime)throw new Error("No hay un formato de video compatible en este navegador. Prueba con Chrome actualizado.");
  recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:plan.videoBitrate,...(!mute&&hasAudio?{audioBitsPerSecond:plan.audioBitrate}:{})});
  const chunks:BlobPart[]=[];let total=0;
  const recording=await new Promise<Blob>((resolve,reject)=>{
   let finished=false;
   const finish=(error?:Error)=>{if(finished)return;finished=true;clearInterval(timer);clearTimeout(watchdog);signal.removeEventListener("abort",abort);video.pause();if(recorder?.state!=="inactive")recorder?.stop();error?reject(error):resolve(new Blob(chunks,{type:recorder?.mimeType.startsWith("video/mp4")?"video/mp4":"video/webm"}));};
   const abort=()=>finish(new DOMException("Preparación cancelada","AbortError"));
   const stop=()=>{if(recorder?.state!=="inactive")recorder?.stop();};
   recorder!.ondataavailable=event=>{if(event.data.size){chunks.push(event.data);total+=event.data.size;if(total>plan.maxBytes*1.25)finish(new Error("El video todavía pesa demasiado. Elige «Más ligero» o un fragmento más corto."));}};
   recorder!.onstop=()=>finish();recorder!.onerror=()=>finish(new Error("No pudimos terminar el video. Intenta con un fragmento más corto."));
   video.onended=stop;video.onerror=()=>finish(new Error("La reproducción se interrumpió. Intenta nuevamente."));
   signal.addEventListener("abort",abort,{once:true});
   watchdog=window.setTimeout(()=>finish(new Error("La preparación se pausó demasiado tiempo. Mantén esta pantalla abierta y vuelve a intentarlo.")),(plan.duration+35)*1000);
   if(signal.aborted){abort();return;}
   recorder!.start(500);
   timer=window.setInterval(()=>{try{ctx.drawImage(video,0,0,plan.width,plan.height);onProgress(Math.min(.90,Math.max(0,(video.currentTime-plan.start)/plan.duration*.90)));if(video.currentTime>=plan.end)stop();}catch{finish(new Error("No pudimos procesar las imágenes del video."));}},1000/30);
   void video.play().catch(()=>finish(new Error("No pudimos reproducir el video para prepararlo. Pulsa nuevamente «Recortar y reducir».")));
  });
  if(signal.aborted)throw new DOMException("Preparación cancelada","AbortError");
  onProgress(.94);
  remuxInput=new Input({source:new BlobSource(recording),formats:ALL_FORMATS});
  const target=new BufferTarget(),isMp4=recording.type==="video/mp4";
  const output=new Output({format:isMp4?new Mp4OutputFormat({fastStart:"in-memory"}):new WebMOutputFormat(),target});
  conversion=await Conversion.init({input:remuxInput,output,tracks:"primary",trim:{start:0,end:plan.duration},tags:{}});
  if(!conversion.isValid||!conversion.utilizedTracks.some(t=>t.isVideoTrack()))throw new Error("No pudimos terminar el archivo de video.");
  if(hasAudio&&!mute&&!conversion.utilizedTracks.some(t=>t.isAudioTrack()))throw new Error("No se pudo conservar el sonido. Puedes activar «Subir sin sonido» para preparar este formato.");
  const abort=()=>{void conversion?.cancel().catch(()=>{});};signal.addEventListener("abort",abort,{once:true});
  try{if(signal.aborted){abort();throw new DOMException("Preparación cancelada","AbortError");}await conversion.execute();}finally{signal.removeEventListener("abort",abort);}
  const buffer=target.buffer,mimeOut=isMp4?"video/mp4":"video/webm",duration=buffer?videoDuration(buffer,mimeOut):null;
  if(!buffer||duration===null||duration>60.1)throw new Error("No pudimos verificar el recorte. Prueba con un fragmento un poco más corto.");
  if(buffer.byteLength>plan.maxBytes)throw new Error("El video aún pesa demasiado. Elige «Más ligero» o acorta el fragmento.");
  if(signal.aborted)throw new DOMException("Preparación cancelada","AbortError");
  onProgress(1);return new File([buffer],`${file.name.replace(/\.[^.]+$/,"")}-clip.${isMp4?"mp4":"webm"}`,{type:mimeOut});
 }finally{
  clearInterval(timer);clearTimeout(watchdog);if(recorder&&recorder.state!=="inactive")recorder.stop();video.pause();video.removeAttribute("src");video.load();video.remove();URL.revokeObjectURL(url);stream?.getTracks().forEach(t=>t.stop());await audio?.close().catch(()=>{});if(conversion&&conversion.state!=="done")await conversion.cancel().catch(()=>{});remuxInput?.dispose();
 }
}
