import {photoSurface9} from './photoResources9.js';
import * as T from 'three';
// Original plant microstructure, correlated across albedo/normal/roughness.
// Shared immutable maps remain safe when a world is removed from the LRU cache.
const cache=new Map(),hash=(x,y)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;};
function noise(u,v,cx,cy){const x=u*cx,y=v*cy,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,s=fx*fx*(3-2*fx),t=fy*fy*(3-2*fy),h=(a,b)=>hash((a+cx)%cx,(b+cy)%cy);return T.MathUtils.lerp(T.MathUtils.lerp(h(ix,iy),h(ix+1,iy),s),T.MathUtils.lerp(h(ix,iy+1),h(ix+1,iy+1),s),t);}
export function plantSurface9(kind='leaf'){
 if(cache.has(kind))return cache.get(kind);const bark=kind==='bark',n=bark?1024:512,col=new Uint8Array(n*n*4),norm=new Uint8Array(n*n*4),rough=new Uint8Array(n*n*4),height=new Float32Array(n*n);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const u=x/n,v=y/n,micro=hash(x,y),i=(y*n+x)*4;let h,value,r;
  if(bark){const flow=u+(noise(u,v,9,7)-.5)*.020,gap=Math.pow(1-noise(flow,v,37,4),6),fine=Math.pow(1-noise(flow,v,91,23),9),plate=noise(u,v,13,31),lichen=Math.max(0,(noise(u,v,19,17)-.74)*3.8);h=.46-gap*.34-fine*.13+(plate-.5)*.065+micro*.006;value=210-gap*71-fine*25+(plate-.5)*22+lichen*15+(micro-.5)*4;r=.86+gap*.13-lichen*.05;}
  else{const mid=Math.abs(u-.5),rib=Math.exp(-mid*235),curve=v+Math.sin(mid*3.3)*.032,veinDistance=Math.abs(((curve*14+mid*4.3)%1)-.5),secondary=Math.exp(-veinDistance*105)*(1-mid*1.6),edge=Math.pow(mid*2,4),mottle=noise(u,v,9,17);h=.42+rib*.055+secondary*.014-edge*.016+(micro-.5)*.0015;value=222+rib*10+secondary*4+(mottle-.5)*12-edge*9;r=.77+(mottle-.5)*.07+edge*.06+micro*.025;}
  height[y*n+x]=h;col.set([value,value,value,255],i);const rr=Math.round(T.MathUtils.clamp(r,0,1)*255);rough.set([rr,rr,rr,255],i);
 }
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const at=(xx,yy)=>height[((yy+n)%n)*n+(xx+n)%n],dx=(at(x-1,y)-at(x+1,y))*2,dy=(at(x,y-1)-at(x,y+1))*2,len=Math.hypot(dx,dy,1);norm.set([Math.round(128+dx/len*127),Math.round(128+dy/len*127),Math.round(128+127/len),255],(y*n+x)*4);}
 const make=(data,srgb)=>{const t=new T.DataTexture(data,n,n);if(srgb)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=8;t.userData.artShared=true;t.needsUpdate=true;return t;};const maps={map:make(col,true),normalMap:make(norm,false),roughnessMap:make(rough,false)};if(bark){const scan=photoSurface9('bark');if(scan){maps.map=scan.map;maps.normalMap=scan.normalMap;maps.roughnessMap=scan.roughnessMap;}}cache.set(kind,maps);return maps;
}
