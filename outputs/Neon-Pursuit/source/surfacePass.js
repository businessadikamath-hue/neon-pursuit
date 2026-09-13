import * as T from 'three';
// Original analytic surface detail. No external textures or media.
export function surfacePass(world,biome){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;const ridge=Math.sin(y*.48+Math.sin(x*.049)*2.5),grain=Math.sin(x*71.3+y*93.7)*Math.cos(x*17.2-y*43.1);const v=128+ridge*(biome==='desert'?42:12)+grain*17;pixels.data.set([v,v,v,255],i)}ctx.putImageData(pixels,0,0);const tex=new T.CanvasTexture(canvas);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(12,16);
 world.tiles.forEach((tile,ti)=>{tile.traverse(m=>{if(m.userData.heightfield){m.material.bumpMap=tex;m.material.bumpScale=biome==='desert'?.20:.08;m.material.roughness=biome==='tundra'?.63:.94}});
 const wet=biome==='jungle',snow=biome==='tundra';
 if(wet||snow){const mat=new T.MeshPhysicalMaterial({color:snow?0xadc9dd:0x213d40,roughness:snow?.26:.09,metalness:.15,clearcoat:1,transparent:true,opacity:snow?.33:.48,depthWrite:false});
 const mesh=new T.InstancedMesh(new T.CircleGeometry(1,24),mat,40),d=new T.Object3D();for(let i=0;i<40;i++){d.position.set(-10+(i%6)*4+Math.sin(i*3)*.35,.052,-5-(i%20)*7.6);d.rotation.set(-Math.PI/2,0,0);d.scale.set(snow?.20:.45+.2*Math.sin(i),snow?3.5:1.2+.4*Math.cos(i),1);d.updateMatrix();mesh.setMatrixAt(i,d.matrix)}mesh.receiveShadow=true;tile.add(mesh);}
 const mat=new T.MeshStandardMaterial({color:biome==='desert'?0xb49a76:biome==='tundra'?0xb7cbd6:biome==='jungle'?0x394b36:0x7e847b,roughness:.93,bumpMap:tex,bumpScale:.11});
 const pebbles=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),mat,160),d=new T.Object3D();for(let i=0;i<160;i++){let z=-3-(i%40)*3.85;if(ti===2&&Math.abs(z+80)<14)z=-30;d.position.set((i%2?1:-1)*(14.2+(i%5)*.14),.03,z);d.rotation.set(i*.73,i*1.21,0);d.scale.set(.07+(i%3)*.04,.06,.12);d.updateMatrix();pebbles.setMatrixAt(i,d.matrix)}pebbles.receiveShadow=true;tile.add(pebbles);
 });return world;
}
let contactTexture;
export function contactShadow(g,w,l){if(!contactTexture){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gradient=x.createRadialGradient(32,32,3,32,32,32);gradient.addColorStop(0,'rgba(0,0,0,.65)');gradient.addColorStop(.55,'rgba(0,0,0,.38)');gradient.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gradient;x.fillRect(0,0,64,64);contactTexture=new T.CanvasTexture(c)}const m=new T.Mesh(new T.PlaneGeometry(w*1.7,l*1.35),new T.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));m.rotation.x=-Math.PI/2;m.position.y=.043;g.add(m);g.userData.ownedMaterials.push(m.material);
 const seamMat=new T.MeshStandardMaterial({color:0x151b20,roughness:.58,metalness:.45});g.userData.ownedMaterials.push(seamMat);
 for(const side of [-1,1]){const sill=new T.Mesh(new T.BoxGeometry(.027,.045,l*.43),seamMat);sill.position.set(side*w*.49,.30,0);g.add(sill);const handle=new T.Mesh(new T.BoxGeometry(.034,.034,.15),seamMat);handle.position.set(side*w*.475,.59,l*.12);g.add(handle);const seam=new T.Mesh(new T.BoxGeometry(.018,.24,.012),seamMat);seam.position.set(side*w*.478,.45,l*.21);g.add(seam)}
}
