import {photoSurface9} from './photoResources9.js';
import * as T from 'three';

// Original seamless surfaces. Albedo, normal and roughness describe the same
// aggregate, pores and wear rather than three unrelated random patterns.
const cache=new Map(),N=512,clamp=T.MathUtils.clamp;
const hash=(x,y,seed=17)=>{let h=Math.imul(x,374761393)^Math.imul(y,668265263)^seed;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
function noise(x,y,cells,seed){const fx=x/N*cells,fy=y/N*cells,ix=Math.floor(fx),iy=Math.floor(fy);let u=fx-ix,v=fy-iy;u=u*u*(3-2*u);v=v*v*(3-2*v);const h=(a,b)=>hash((a+cells)%cells,(b+cells)%cells,seed);return T.MathUtils.lerp(T.MathUtils.lerp(h(ix,iy),h(ix+1,iy),u),T.MathUtils.lerp(h(ix,iy+1),h(ix+1,iy+1),u),v);}
function cracks(x,y,cells){const fx=x/N*cells,fy=y/N*cells,ix=Math.floor(fx),iy=Math.floor(fy);let a=99,b=99;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const cx=ix+dx,cy=iy+dy,px=cx+.18+hash((cx+cells)%cells,(cy+cells)%cells,91)*.64,py=cy+.18+hash((cx+cells)%cells,(cy+cells)%cells,19)*.64,d=Math.hypot(fx-px,fy-py);if(d<a){b=a;a=d;}else if(d<b)b=d;}return b-a;}
function mineral(x,y){const cells=76,fx=x/512*cells,fy=y/512*cells,ix=Math.floor(fx),iy=Math.floor(fy);let best=99,id=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const cx=ix+dx,cy=iy+dy,kx=(cx+cells)%cells,ky=(cy+cells)%cells,r=hash(kx,ky,67),px=cx+.13+hash(kx,ky,17)*.74,py=cy+.13+hash(kx,ky,73)*.74,d=Math.hypot((fx-px)*(1.05+r*.3),(fy-py)*(.95-r*.15));if(d<best){best=d;id=r;}}return [best,id];}
export function scenerySurface8(kind,ultra=false){
 const photographed=photoSurface9(kind,ultra);if(photographed)return photographed;
 const key=kind+(ultra?'-ultra':''),N=ultra?1024:512;
 if(cache.has(key))return cache.get(key);
 const road=['road','dirtroad','rockroad','iceroad'].includes(kind),heights=new Float32Array(N*N),colors=new Uint8Array(N*N*4),roughness=new Uint8Array(N*N*4),normals=new Uint8Array(N*N*4);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const sx=x*512/N,sy=y*512/N,p=y*N+x,i=p*4,micro=hash(x,y,827),broad=noise(sx,sy,4,97),mottle=noise(sx,sy,18,31),grain=noise(sx,sy,96,58),u=x/N;
  let h=.4+grain*.13,v=96+micro*14+mottle*10,rough=.9,rgb;
  if(kind==='road'){
   // Millimetre-sized aggregate in dark bitumen, with occasional tiny pores.
   const [radius,id]=mineral(sx,sy),stone=1-T.MathUtils.smoothstep(radius,.24+id*.15,.32+id*.15),pore=micro>.991?1:0,wear=Math.exp(-Math.pow((u-.28)/.075,2))+Math.exp(-Math.pow((u-.72)/.075,2)),tar=clamp((.029-cracks(sx,sy,5))*27,0,1)*clamp((broad-.43)*5,0,1);
   h=.20+stone*(.045+id*.018)-pore*.018-tar*.008;v=56+stone*(27+id*24)+micro*4+mottle*6-pore*10-tar*12-wear*2;rough=.91+micro*.035-stone*(.12+id*.045)-wear*.025-tar*.25;rgb=[v*(.97+id*.035),v*(.985+id*.012),v];
  }else if(kind==='rockroad'){
   const stone=clamp((grain-.30)*2.8,0,1),edge=clamp((.16-cracks(sx,sy,46))*5,0,1),dust=noise(sx,sy,10,197);
   h=.2+stone*.28-edge*.13;v=105+stone*36+micro*11+dust*12-edge*16;rough=.92+micro*.07;rgb=[v*1.08,v*.99,v*.83];
  }else if(kind==='dirtroad'){
   const tracks=Math.exp(-Math.pow((u-.24)/.055,2))+Math.exp(-Math.pow((u-.76)/.055,2)),pebble=Math.max(0,(grain-.70)*2.8),dry=clamp((mottle-.35)*1.4,0,1);
   h=.30+grain*.18+broad*.12+pebble*.23-tracks*.065;v=81+grain*33+micro*13+broad*15-tracks*13+pebble*26;rough=.86+dry*.13-tracks*.035;rgb=[v*1.05,v*.77,v*.53];
  }else if(kind==='iceroad'){
   const fissure=Math.exp(-cracks(sx,sy,7)*190),frost=clamp((noise(sx,sy,12,134)-.47)*3,0,1),bubble=micro>.998?1:0;
   h=.35+noise(sx,sy,28,151)*.020-fissure*.08+frost*.025+bubble*.015;v=128+noise(sx,sy,6,127)*12+frost*21+fissure*29+bubble*26;rough=.23+frost*.38+fissure*.2+micro*.04;rgb=[v*.75,v*.91,Math.min(235,v*1.075)];
  }else if(kind==='snow'){
   h=.35+grain*.12+broad*.08;v=192+micro*24+mottle*18;rough=.82+micro*.14;rgb=[v*.97,v,Math.min(255,v*1.03)];
  }else if(kind==='sand'){
   const ripple=Math.sin(y/N*Math.PI*32+Math.sin(x/N*Math.PI*4)*1.2);h=.35+ripple*.035+grain*.12;v=142+grain*26+micro*18+ripple*6;rough=.93+micro*.06;rgb=[v*1.12,v*.97,v*.70];
  }else if(kind==='rock'){
   const vein=clamp((.065-cracks(sx,sy,9))*13,0,1);h=.35+grain*.12+broad*.26-vein*.17;v=106+broad*44+micro*16-vein*24;rough=.85+micro*.14;rgb=[v*.96,v,v*.94];
  }else {const moss=clamp((mottle-.41)*3,0,1),litter=clamp((broad-.44)*3,0,1);h=.30+grain*.12+broad*.09;v=59+grain*22+micro*9+mottle*18;rough=.94+micro*.045;rgb=[v*(.82-litter*.08),v*(.73+moss*.22),v*(.52+moss*.09)];}
  if(ultra){const mineral=hash(x,y,191),fine=noise(sx,sy,224,79),pit=mineral>.996?1:0;h+=fine*.021-pit*.023;rough=clamp(rough+(fine-.5)*.028+pit*.025,0,1);rgb=rgb.map(v=>v+(fine-.5)*5-pit*7);}
  heights[p]=h;colors.set([...rgb.map(v=>clamp(Math.round(v),0,255)),255],i);const rv=clamp(Math.round(rough*255),0,255);roughness.set([rv,rv,rv,255],i);
 }
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const at=(xx,yy)=>heights[((yy+N)%N)*N+(xx+N)%N],dx=(at(x-1,y)-at(x+1,y))*1.65,dy=(at(x,y-1)-at(x,y+1))*1.65,n=new T.Vector3(dx,dy,1).normalize();normals.set([Math.round(n.x*127+128),Math.round(n.y*127+128),Math.round(n.z*127+128),255],(y*N+x)*4);}
 const make=(bytes,srgb)=>{const t=new T.DataTexture(bytes,N,N);if(srgb)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(kind==='road'?36:road?7:16,kind==='road'?220:road?40:18);t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.userData.artShared=true;t.needsUpdate=true;return t;};
 const result={map:make(colors,true),roughnessMap:make(roughness,false),normalMap:make(normals,false)};cache.set(key,result);return result;
}

export function plantSurface8(kind='leaf'){
 const key='plant-'+kind;if(cache.has(key))return cache.get(key);const n=256,col=new Uint8Array(n*n*4),rough=new Uint8Array(n*n*4),normal=new Uint8Array(n*n*4),height=new Float32Array(n*n);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*4,u=x/n,v=y/n,grain=hash(x,y,512),mid=Math.abs(u-.5),vein=Math.exp(-Math.abs(Math.sin(v*38+mid*28))*24),rib=Math.exp(-mid*180);let h,value,r;
  if(kind==='bark'){const furrow=Math.exp(-Math.abs(Math.sin(u*57+Math.sin(v*18)*.40))*11),flake=Math.sin(v*42+u*12)*Math.sin(u*18-v*6);h=.5-furrow*.34+flake*.042+grain*.018;value=208-furrow*64+flake*13+grain*13;r=.84+furrow*.13;}
  else{h=.4+rib*.14+vein*.025+grain*.003;value=181+(1-mid*1.1)*29+rib*16+vein*9+grain*6;r=.64+grain*.16+vein*.035;}
  height[y*n+x]=h;col.set([value,value,value,255],i);const rv=Math.round(r*255);rough.set([rv,rv,rv,255],i);
 }
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const at=(xx,yy)=>height[((yy+n)%n)*n+(xx+n)%n],v=new T.Vector3((at(x-1,y)-at(x+1,y))*2,(at(x,y-1)-at(x,y+1))*2,1).normalize();normal.set([Math.round(v.x*127+128),Math.round(v.y*127+128),Math.round(v.z*127+128),255],(y*n+x)*4);}
 const make=(bytes,srgb)=>{const t=new T.DataTexture(bytes,n,n);if(srgb)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=8;t.userData.artShared=true;t.needsUpdate=true;return t;};const result={map:make(col,true),normalMap:make(normal,false),roughnessMap:make(rough,false)};cache.set(key,result);return result;
}
