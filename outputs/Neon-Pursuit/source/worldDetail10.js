import * as T from 'three';

// V10 roadside material pass. PBR maps carry the broad surface response; this
// adds sparse, individually lit aggregate and paint wear where the camera can
// actually resolve it. Tile-local instancing keeps the detail moving with the
// recycled world without adding a network asset dependency.
const clamp=T.MathUtils.clamp;
const random=seed=>()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);

function pebbleGeometry(){
 const geo=new T.IcosahedronGeometry(1,2),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),s=1+.16*Math.sin(x*17.3+y*8.1)*Math.cos(z*13.7-x*4.2);p.setXYZ(i,x*s*(.75+.25*Math.abs(y)),y*s*.62,z*s*(.72+.28*Math.abs(x)));}
 geo.computeVertexNormals();return geo;
}

function installRoadPebbles(tile,biome,index){
 const r=random(8401+index*97+biome.length*17),matrix=new T.Matrix4(),dummy=new T.Object3D();
 const palette={coastline:[0x464b4b,0x747a77,0x9b9a88],tundra:[0x81979e,0x627982,0xb6c2c0],desert:[0x8e7961,0xaa9274,0x665b50],jungle:[0x66513f,0x846a51,0x554738]}[biome]||[0x626667,0x858987,0x4b5151];
 const geo=pebbleGeometry(),mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.94,metalness:.025});
 const count=760,pebbles=new T.InstancedMesh(geo,mat,count);pebbles.name=`V10 ${biome} road aggregate stones`;pebbles.castShadow=true;pebbles.receiveShadow=true;pebbles.frustumCulled=false;pebbles.userData.roadMicroDetail10=true;
 for(let i=0;i<count;i++){
   const x=-11.45+r()*22.9,z=-4-r()*152,scale=.010+r()*.040*(r()>.94?1.8:1),y=.052+scale*.18;
   dummy.position.set(x,y,z);dummy.rotation.set(r()*1.8,r()*6.28,r()*1.8);dummy.scale.set(scale*(.7+r()*.75),scale*(.42+r()*.55),scale*(.62+r()*.70));dummy.updateMatrix();pebbles.setMatrixAt(i,dummy.matrix);pebbles.setColorAt(i,new T.Color(palette[Math.floor(r()*palette.length)]));
 }
 pebbles.instanceMatrix.needsUpdate=true;pebbles.instanceColor.needsUpdate=true;tile.add(pebbles);

 let stripe=null;tile.traverse(m=>{const p=m.geometry?.parameters;if(m.isInstancedMesh&&p?.width===.12&&p?.height===.018&&p?.depth===3.8)stripe=m;});
 const wearMat=new T.MeshStandardMaterial({color:biome==='tundra'?0x778b8d:0x3d3a34,roughness:.88,metalness:.02,transparent:true,opacity:.58,depthWrite:false});
 const edgeGeo=new T.BoxGeometry(.018,.0045,3.55),edgeCount=(stripe?.count||100)*2,edges=new T.InstancedMesh(edgeGeo,wearMat,edgeCount);edges.name='V10 lane paint worn edge';edges.castShadow=false;edges.receiveShadow=false;edges.frustumCulled=false;edges.userData.roadMicroDetail10=true;
 let edgeIndex=0;if(stripe)for(let i=0;i<stripe.count;i++){stripe.getMatrixAt(i,matrix);const x=matrix.elements[12],y=.049,z=matrix.elements[14];for(const side of [-1,1]){dummy.position.set(x+side*.054,y,z);dummy.rotation.set(0,0,0);dummy.scale.set(.72+r()*.45,1,1);dummy.updateMatrix();edges.setMatrixAt(edgeIndex++,dummy.matrix);}}
 edges.count=edgeIndex;edges.instanceMatrix.needsUpdate=true;tile.add(edges);
 const chipGeo=new T.BoxGeometry(.036,.0032,.16),chips=new T.InstancedMesh(chipGeo,wearMat,(stripe?.count||100)*4);chips.name='V10 chipped lane paint flecks';chips.castShadow=false;chips.receiveShadow=false;chips.frustumCulled=false;chips.userData.roadMicroDetail10=true;let chipIndex=0;
 if(stripe)for(let i=0;i<stripe.count;i++){stripe.getMatrixAt(i,matrix);const x=matrix.elements[12],z=matrix.elements[14];for(let n=0;n<4;n++){dummy.position.set(x+(r()-.5)*.11,.051,z+(r()-.5)*3.45);dummy.rotation.set(0,r()*Math.PI,r()*.12);dummy.scale.set(.55+r()*1.6,.65+r()*.65,.25+r()*1.7);dummy.updateMatrix();chips.setMatrixAt(chipIndex++,dummy.matrix);}}
 chips.count=chipIndex;chips.instanceMatrix.needsUpdate=true;tile.add(chips);
 return {pebbles,edges,chips,basePebbles:count,baseEdges:edgeIndex,baseChips:chipIndex,material:mat,wearMaterial:wearMat};
}

export function installWorldDetail10(world,biome){
 if(!world||world.__worldDetail10)return world;
 world.__worldDetail10=true;const passes=world.tiles.map((tile,index)=>installRoadPebbles(tile,biome,index));let quality='High';
 const updateCounts=()=>{const factor={"Game Only":0,Low:.20,High:.58,Ultra:.82,"Ultra+":1}[quality]??.58;for(const p of passes){p.pebbles.count=Math.floor(p.basePebbles*factor);p.edges.count=Math.floor(p.baseEdges*factor);p.chips.count=Math.floor(p.baseChips*factor);p.pebbles.visible=p.edges.visible=p.chips.visible=factor>0;}};
 const oldQuality=world.quality;world.quality=q=>{oldQuality(q);quality=q;updateCounts();};
 const oldUpdate=world.update;world.update=(distance,time,x)=>{oldUpdate(distance,time,x);for(const p of passes){p.pebbles.instanceMatrix.needsUpdate=false;}};
 const oldDetails=world.details;world.details=()=>({...oldDetails(),roadMicroDetail10:{active:quality!=='Game Only',quality,aggregateStones:passes.reduce((n,p)=>n+p.pebbles.count,0),paintWearEdges:passes.reduce((n,p)=>n+p.edges.count,0),paintChips:passes.reduce((n,p)=>n+p.chips.count,0),perTile:true,material:'individually modeled aggregate and chipped reflective lane paint'}});
 updateCounts();return world;
}
