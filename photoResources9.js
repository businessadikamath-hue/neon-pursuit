import * as T from 'three';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {photoCatalog9} from './photoCatalog9.js';
import {photoSkyPayloads9} from './photoSkyPayloads9.js';

// The runtime stays offline and portable: PBR maps are loaded from small local
// classic scripts as data URLs, while only the two HDR skies use a compact
// binary module because file:// image uploads are origin-sensitive in Chromium.
const payloads=new Map(),textures=new Map(),surfaces=new Map(),listeners=new Set();
let pending=0,loaded=0;const failures=[];
function changed(){for(const fn of listeners)fn();}
function assetUrl(id){const info=photoCatalog9[id];return info?.file?new URL(info.file,document.baseURI).href:null;}
function payload(id){if(payloads.has(id))return payloads.get(id);pending++;changed();
 const promise=new Promise((resolve,reject)=>{
  if(photoSkyPayloads9[id]){resolve({kind:'hdr',data:photoSkyPayloads9[id]});return;}
  const url=assetUrl(id);if(!url){reject(new Error('Missing local art: '+id));return;}
  const script=document.createElement('script');script.src=url;script.onload=()=>{const value=globalThis.NeonPhotoPayloads?.[id];script.remove();if(!value){reject(new Error('Empty local art: '+id));return;}delete globalThis.NeonPhotoPayloads[id];resolve({kind:'image',url:value});};script.onerror=()=>{script.remove();reject(new Error('Unable to read local art: '+id));};document.head.append(script);
 }).finally(()=>{pending--;changed()});payloads.set(id,promise);return promise;
}
export function photoTexture9(id,{color=true,repeat=[1,1]}={}){
 const key=id+':'+color+':'+repeat.join(',');if(textures.has(key))return textures.get(key);
 const texture=new T.Texture();texture.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(...repeat);texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.anisotropy=16;texture.userData.artShared=true;texture.userData.photoAsset=id;
 pending++;payload(id).then(asset=>new Promise((resolve,reject)=>{if(asset.kind!=='image')return reject(new Error('Expected image art: '+id));const img=new Image();img.onload=()=>{texture.image=img;texture.needsUpdate=true;loaded++;resolve()};img.onerror=()=>reject(new Error('Image decode failed: '+id));img.src=asset.url})).catch(e=>failures.push(e.message)).finally(()=>{pending--;changed()});textures.set(key,texture);return texture;
}
export function photoSurface9(kind,ultra=false){
 if(typeof document==='undefined'||!document.head)return null;
 const role=kind==='ground'?'earth':kind,preferred=ultra?'4k':'1k';
 const resolution=photoCatalog9[role+'-'+preferred+'-map']?preferred:'1k';
 if(!photoCatalog9[role+'-'+resolution+'-map'])return null;
 const key=role+'-'+resolution;if(surfaces.has(key))return surfaces.get(key);
 const repeats=role==='road'?[12,80]:role==='dirtroad'||role==='rockroad'?[6,40]:role==='bark'?[2,3]:role==='meadow'?[28,28]:role==='sand'?[18,18]:[22,22];
 const out={};for(const type of ['map','normalMap','roughnessMap'])out[type]=photoTexture9(key+'-'+type,{color:type==='map',repeat:repeats});surfaces.set(key,out);return out;
}
export function photoStatus9(){return {pending,loaded,errors:[...failures],sources:'Poly Haven CC0 PBR scans and original generated feather texture',offline:true,embeddedImagePayloads:true};}
export function photoObject9(id){return Promise.reject(new Error('Photographic model payloads are intentionally omitted from the runtime package: '+id));}
export function installPhotoSky9(world,biome){
 const sky=world.scene.children.find(m=>m.isMesh&&m.material===world.skyMat);let day='afternoon',quality='High',disposed=false;const skies=new Map();
 function apply(){if(disposed)return;const active=!['Game Only','Low'].includes(quality)&&day!=='night',id=day==='morning'?'sky-morning':'sky-day';if(!active){if(sky)sky.material=world.skyMat;return;}
  if(skies.has(id)){const value=skies.get(id);if(value){sky.material=value.material;world.sun.position.copy(value.direction).multiplyScalar(250).add(world.sun.target.position);world.skyMat.uniforms.sunDir.value.copy(value.direction);world.reflectionDirty=true;}return;}
  skies.set(id,null);pending++;payload(id).then(asset=>{const bytes=Uint8Array.from(atob(asset.data),x=>x.charCodeAt(0)),hdr=new RGBELoader().parse(bytes.buffer),map=new T.DataTexture(hdr.data,hdr.width,hdr.height,T.RGBAFormat,hdr.type);map.colorSpace=T.LinearSRGBColorSpace;map.minFilter=map.magFilter=T.LinearFilter;map.needsUpdate=true;map.userData.artShared=true;map.flipY=true;
   const material=new T.MeshBasicMaterial({map,side:T.BackSide,depthWrite:false,fog:false}),direction=new T.Vector3(-.55,.68,-.48);material.color.setScalar(day==='morning'?.85:1);
   let brightest=-1,bx=0,by=0;for(let y=0;y<hdr.height*.48;y+=2)for(let x=0;x<hdr.width;x+=2){const i=(y*hdr.width+x)*4,read=k=>hdr.type===T.HalfFloatType?T.DataUtils.fromHalfFloat(hdr.data[k]):hdr.data[k],l=read(i)*.2126+read(i+1)*.7152+read(i+2)*.0722;if(l>brightest){brightest=l;bx=x;by=y;}}
   const u=bx/hdr.width,v=by/hdr.height,phi=u*Math.PI*2,theta=v*Math.PI;direction.set(-Math.cos(phi)*Math.sin(theta),Math.cos(theta),-Math.sin(phi)*Math.sin(theta));direction.y=Math.max(.20,direction.y);direction.normalize();skies.set(id,{material,direction,map});loaded++;apply();
  }).catch(e=>failures.push(e.message)).finally(()=>{pending--;changed()});
 }
 const priorQuality=world.quality;world.quality=q=>{priorQuality(q);quality=q;apply()};const priorLighting=world.lighting;world.lighting=d=>{priorLighting(d);day=d;apply()};const detail=world.details;world.details=()=>({...detail(),photographicAssets:photoStatus9(),photographicSky:sky?.material!==world.skyMat&&day!=='night'});
 const onLoad=()=>{world.reflectionDirty=true};listeners.add(onLoad);const dispose=world.disposeWorldArt;world.disposeWorldArt=()=>{disposed=true;listeners.delete(onLoad);for(const value of skies.values())if(value){value.material.dispose();value.map.dispose()}dispose?.()};apply();return world;
}
