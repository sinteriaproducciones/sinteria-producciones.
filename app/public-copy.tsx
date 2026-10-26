"use client";
import { createContext, useContext, type ImgHTMLAttributes } from "react";
import type { SiteContent } from "../lib/content.ts";
export const CopyContext = createContext<SiteContent | null>(null);
export function copyKey(value:string){let hash=2166136261;for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619);}return "copy_"+(hash>>>0).toString(16);}
export function useCopy(){const content=useContext(CopyContext);return (value:string)=>content?.texts?.[copyKey(value)]??value;}
export function Copy({value}:{value:string}){const t=useCopy();return <>{t(value)}</>;}
export function SiteImage({imageKey,...props}:ImgHTMLAttributes<HTMLImageElement>&{imageKey:string}){const content=useContext(CopyContext);return <img {...props} src={content?.images?.[imageKey]||props.src}/>;}
