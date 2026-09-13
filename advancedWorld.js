import * as T from 'three';
export function advancedWorld(world,biome){
 let seed=87319;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296},batches=[];
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');
 for(let i=0;i<110;i++){const a=rand()*Math.PI*2,r=Math.sqrt(rand())*105,x=128+Math.cos(a)*r,y=128+Math.sin(a)*r;ctx.fillStyle=`hsl(${biome==='tundra'?155:105},${25+rand()*20}%,${25+rand()*35}%)`;ctx.beginPath();ctx.ellipse(x,y,biome==='tundra'?3:10,biome==='tundra'?18:20,a,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#c7d29355';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x,y-10);ctx.lineTo(x,y+10);ctx.stroke()}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const mat=new T.MeshStandardMaterial({map:texture,alphaTest:.42,side:T.DoubleSide,roughness:biome==='jungle'?.52:.84,metalness:0,color:biome==='jungle'?0x729971:0xbbc5ae});
 const dummy=new T.Object3D(),card=new T.PlaneGeometry(1,1,1,1);
 for(const [ti,tile] of world.tiles.entries()){
  if(biome==='coastline'){tile.children.forEach(m=>{if(m.geometry?.parameters?.width===38){m.material=new T.MeshStandardMaterial({color:0xa69c7c,roughness:.69});const p=m.geometry.attributes.position,colors=[];for(let j=0;j<p.count;j++){const k=T.MathUtils.clamp((-p.getX(j)-23)/23,0,1),c=new T.Color().setHSL(.12,.16,.43-k*.20);colors.push(c.r,c.g,c.b)}m.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));m.material.vertexColors=true;}});const rocks=new T.InstancedMesh(new T.DodecahedronGeometry(1,1),new T.MeshStandardMaterial({color:0x747b79,roughness:.66,metalness:.08}),18);for(let i=0;i<18;i++){dummy.position.set(-31-rand()*11,-2.4,-4-i*8.5);dummy.rotation.set(rand(),rand()*6.28,rand());dummy.scale.set(1+rand()*1.8,.7+rand(),1+rand()*2);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix)}rocks.castShadow=rocks.receiveShadow=true;tile.add(rocks);}
  if(biome==='tundra')tile.children.forEach(m=>{if(m.geometry?.type==='ConeGeometry')m.visible=false});
  const count=biome==='jungle'?3600:biome==='tundra'?44*70:biome==='coastline'?1800:500,m=new T.InstancedMesh(card,mat,count);
  for(let i=0;i<count;i++){let x,y,z,scale;
   if(biome==='tundra'){const t=tile.userData.trees[i%44],f=rand(),a=rand()*6.28,r=(1-f)*t.h*.31;x=t.x+Math.cos(a)*r;y=t.y+t.h*(.23+f*.76);z=t.z+Math.sin(a)*r;scale=.6+(1-f)*1.3;dummy.rotation.set(-.1-rand()*.5,a,rand()*.3);m.setColorAt(i,new T.Color(i%5===0?0xe1e9ea:0x688574));}
   else if(biome==='jungle'){const cluster=i%8,side=cluster%2?1:-1;let centerZ=-20-Math.floor(cluster/2)*40+Math.sin(cluster*3.7)*9;if(ti===2&&Math.abs(centerZ+80)<25)centerZ-=32;const a=rand()*6.28,r=Math.sqrt(rand())*7.8;x=side*(8.8+Math.sin(cluster)*1.4)+Math.cos(a)*r;y=12+Math.cos(cluster*2.3)*1.5+Math.sqrt(Math.max(0,60-r*r))*.35+rand();z=centerZ+Math.sin(a)*r;scale=1.7+rand()*1.1;dummy.rotation.set(-Math.PI/2+rand()*.9,rand()*6.28,rand()*6.28);}
   else {const cluster=i%24,side=cluster%2?1:-1;z=-7-Math.floor(cluster/2)*13+rand()*5;if(ti===2&&Math.abs(z+80)<17)z=-38;const a=rand()*6.28,r=rand()*1.6;x=side*(17.5+(cluster%3)*.7)+Math.cos(a)*r;y=.4+rand()*(biome==='coastline'?1.6:.55);scale=biome==='coastline'?1:.6;dummy.rotation.set(rand()-.5,rand()*6.28,rand()-.5);}
   dummy.position.set(x,y,z);dummy.scale.setScalar(scale);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);
  }m.castShadow=true;m.receiveShadow=true;tile.add(m);batches.push({mesh:m,capacity:count});
  if(biome==='jungle')for(let i=0;i<8;i++){const side=i%2?1:-1;let z=-20-Math.floor(i/2)*40+Math.sin(i*3.7)*9;if(ti===2&&Math.abs(z+80)<25)z-=32;const path=new T.CatmullRomCurve3([new T.Vector3(side*18,0,z),new T.Vector3(side*17,5,z+.4),new T.Vector3(side*13,10,z+.8),new T.Vector3(side*(8.8+Math.sin(i)*1.4),13+Math.cos(i*2.3)*1.5,z)]);const trunk=new T.Mesh(new T.TubeGeometry(path,12,.25,7,false),new T.MeshStandardMaterial({color:0x524b3a,roughness:1}));trunk.castShadow=trunk.receiveShadow=true;tile.add(trunk);}
 }
 const oldQuality=world.quality;world.quality=q=>{oldQuality(q);for(const b of batches){b.mesh.count=Math.round(b.capacity*({Low:.20,High:.45,Ultra:.75,'Ultra+':1}[q]));b.mesh.castShadow=q!=='Low';}};
 const oldLighting=world.lighting;world.lighting=day=>{oldLighting(day);if(biome==='tundra'){world.sun.color.set(0xd6e6f1);world.sun.intensity*=.65;world.hemi.intensity*=.8;}if(biome==='jungle'){world.sun.intensity*=.68;world.hemi.intensity*=.8;world.scene.environmentIntensity=.42;world.biomeFoliage.color.set(0x487746);}};
 const oldDetails=world.details;world.details=()=>({...oldDetails(),canopyCards:batches.reduce((n,b)=>n+b.mesh.count,0),atmosphere:world.preset==='Low'?'distance fog':'height fog, depth contact shading',heatHaze:biome==='desert'&&world.preset!=='Low'});
 return world;
}
