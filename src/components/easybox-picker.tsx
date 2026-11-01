"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { parseEasyboxLocker, type EasyboxLocker } from "@/lib/easybox-selection";

type LockerInstance = {
  open: () => void;
  close: () => void;
  subscribe: (callback: (message: unknown) => void) => void;
  subscribeToPluginClosed?: (callback: () => void) => void;
  reinitializePlugin?: (options: Record<string, unknown>) => void;
};
type LockerSDK = { init: (options: Record<string, unknown>) => void; getInstance: () => LockerInstance };
declare global { interface Window { LockerPlugin?: LockerSDK } }
let loader: Promise<LockerSDK> | undefined;

function loadMap() {
  if (window.LockerPlugin) return Promise.resolve(window.LockerPlugin);
  if (!loader) loader = new Promise<LockerSDK>((resolve,reject)=>{
    const script=document.createElement("script");
    const timeout=window.setTimeout(()=>{script.remove();reject(new Error("Harta easybox nu răspunde. Încearcă din nou sau alege livrarea la adresă."));},15000);
    script.src="https://cdn.sameday.ro/locker-plugin/lockerpluginsdk.js";
    script.async=true;
    script.onload=()=>{window.clearTimeout(timeout);window.LockerPlugin ? resolve(window.LockerPlugin) : reject(new Error("Harta nu s-a inițializat. Încearcă din nou."));};
    script.onerror=()=>{window.clearTimeout(timeout);script.remove();reject(new Error("Harta easybox nu s-a încărcat. Verifică conexiunea și încearcă din nou."));};
    document.body.appendChild(script);
  }).catch(error=>{loader=undefined;throw error;});
  return loader;
}

export default function EasyboxPicker() {
  const uid=useId();
  const [locker,setLocker]=useState<EasyboxLocker>();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const button=useRef<HTMLButtonElement>(null);
  const instance=useRef<LockerInstance | undefined>(undefined);
  const alive=useRef(true),opened=useRef(false);
  const validation=useRef<AbortController | undefined>(undefined);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;validation.current?.abort();if(opened.current)instance.current?.close();};},[]);

  const select=async(message:unknown)=>{
    if(!alive.current || !message || typeof message!=="object")return;
    const value=message as {lockerId?:unknown;oohType?:unknown};
    const id=Number(value.lockerId);
    if(Number(value.oohType??0)!==0 || !Number.isSafeInteger(id) || id<=0){setError("Alege un easybox, nu un punct de ridicare partener.");return;}
    instance.current?.close();opened.current=false;
    validation.current?.abort();const controller=new AbortController();validation.current=controller;
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/shipping/easybox",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lockerId:id}),signal:controller.signal});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Easyboxul nu a putut fi verificat.");
      const verified=parseEasyboxLocker(result.locker);
      if(alive.current && !controller.signal.aborted)setLocker(verified);
    }catch(cause){if(alive.current && !controller.signal.aborted)setError(cause instanceof Error?cause.message:"Alege din nou un easybox.");}
    finally{if(alive.current && !controller.signal.aborted){setBusy(false);button.current?.focus({preventScroll:true});}}
  };

  return <div className="easybox-picker">
    <input type="hidden" name="easybox" value={!busy && locker ? JSON.stringify(locker):""} />
    <button ref={button} className="easybox-map-button" type="button" disabled={busy} aria-describedby={`${uid}-selection`} onClick={async()=>{
      setBusy(true);setError("");
      try{
        const response=await fetch("/api/shipping/easybox",{cache:"no-store"});
        const config=await response.json();
        if(!response.ok)throw new Error(config.error||"Harta easybox nu este disponibilă.");
        const sdk=await loadMap();if(!alive.current)return;
        const form=button.current?.form;
        const field=(name:string)=>(form?.elements.namedItem(name) as HTMLInputElement|null)?.value||undefined;
        const options={clientId:config.clientId,apiUsername:config.apiUsername,countryCode:"RO",langCode:"ro",theme:"light",city:field("city"),county:field("county"),favLockerId:locker?.id,favType:0,filters:[{showLockers:true},{showPudos:false}]};
        sdk.init(options);
        const plugin=sdk.getInstance();
        plugin.reinitializePlugin?.(options);
        if(instance.current!==plugin){
          plugin.subscribe(message=>{void select(message);});
          plugin.subscribeToPluginClosed?.(()=>{opened.current=false;if(alive.current)button.current?.focus({preventScroll:true});});
          instance.current=plugin;
        }
        const viewport=document.querySelector('meta[name="viewport"]');
        const originalViewport=viewport?.getAttribute("content");
        plugin.open();opened.current=true;
        // The provider SDK disables zoom; retain the page's accessible viewport.
        if(viewport && originalViewport!=null)viewport.setAttribute("content",originalViewport);
        document.getElementById("locker-plugin-v2-iframe")?.setAttribute("title","Alege un easybox pe hartă");
      }catch(cause){if(alive.current)setError(cause instanceof Error?cause.message:"Harta nu s-a încărcat. Încearcă din nou.");}
      finally{if(alive.current)setBusy(false);}
    }}><MapPin size={19} aria-hidden="true" />{busy?"Se verifică…":locker?"Schimbă easyboxul":"Alege easyboxul pe hartă"}</button>
    <div id={`${uid}-selection`} className="easybox-selection" role="status">{locker?<><strong>{locker.name}</strong><span>{locker.address}</span><span>{locker.city}, {locker.county}</span></>:"Niciun easybox selectat. Alege lockerul de unde vrei să ridici coletul."}</div>
    {error && <p className="checkout-error" role="alert">{error}</p>}
  </div>;
}
