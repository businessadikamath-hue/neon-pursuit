import * as T from 'three';
import {anchorNearJunction,routeBlockFor} from '../engine/sceneryPolicy.js';
import {blenderScenery8} from '../engine/blenderScenery8.js';
import {plantSurface8} from '../engine/scenerySurface8.js';
export const naturalTreePack=biome=>({coastline:'native',tundra:'windswept',desert:'windswept',jungle:'oldgrowth'}[biome]||'native');

// All meshes and surface maps are generated here. No downloaded art is used.
export const TREE_PACKS = [
  {id:'native',label:'Native mosaic',description:'Mixed local silhouettes, open views and layered natural verges.'},
  {id:'windswept',label:'Weather shaped',description:'Leaning coastal crowns, frosted northern branches and open desert groves.'},
  {id:'oldgrowth',label:'Old growth',description:'Taller trunks, broad mature crowns and a denser, layered understory.'}
];

const SPECIES = {
  coastline:['Coastal live oak','Monterey cypress','Shore pine'],
  tundra:['Black spruce','Lodgepole pine','Frosted larch'],
  desert:['Palo verde','Honey mesquite','Saguaro'],
  jungle:['Royal palm','Kapok','Strangler fig']
};
const clock={value:0}, shared=new Map();
const random=seed=>()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
const clamp=T.MathUtils.clamp;

class Geometry {
  constructor(){this.p=[];this.uv=[];this.c=[];this.idx=[];this.leafCount=0;}
  point(p,uv,c){this.p.push(p.x,p.y,p.z);this.uv.push(...uv);this.c.push(c.r,c.g,c.b);return this.p.length/3-1;}
  append(data,color){const offset=this.p.length/3;this.p.push(...data.p);this.uv.push(...data.uv);for(let i=0;i<data.p.length/3;i++)this.c.push(color.r,color.g,color.b);for(const index of data.i)this.idx.push(offset+index);}
  tube(a,b,ra,rb,color,sides=7,phase=0){
    const d=b.clone().sub(a).normalize(),u=new T.Vector3(0,1,0);if(Math.abs(d.y)>.95)u.set(1,0,0);u.cross(d).normalize();const v=d.clone().cross(u),base=this.p.length/3;
    for(let j=0;j<2;j++)for(let i=0;i<=sides;i++){const f=i/sides,ang=f*Math.PI*2,r=(j?rb:ra)*(1+.075*Math.sin(ang*3+phase));this.point((j?b:a).clone().addScaledVector(u,Math.cos(ang)*r).addScaledVector(v,Math.sin(ang)*r),[f,j?b.y*.9:a.y*.9],color);}
    for(let i=0;i<sides;i++){const x=base+i,y=x+sides+1;this.idx.push(x,y,x+1,x+1,y,y+1);}
  }
  leaf(p,d,w,len,color,roll=0){
    const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),d.clone().normalize());if(roll)q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),roll));
    const base=this.p.length/3;this.leafCount++;
    if(this.ultraLeaves){
      // Actual cambered blades, with an asymmetric edge and a raised midrib.
      // Conifers use slender three-sided needles instead of broad leaf cards.
      if(this.needleLeaves){for(let needle=0;needle<3;needle++){const a=(needle-1)*.26,start=p.clone().add(new T.Vector3(a*.06,0,0).applyQuaternion(q)),nb=this.p.length/3,radius=w*.038,length=len*(.40+needle*.085);for(const [x,y,z,u,v]of [[-radius,0,0,0,0],[radius,0,0,1,0],[0,radius*.8,0,.5,0],[0,0,length,.5,1]])this.point(new T.Vector3(x+a*z,y,z).applyQuaternion(q).add(start),[u,v],color);this.idx.push(nb,nb+1,nb+3,nb+1,nb+2,nb+3,nb+2,nb,nb+3);}return;}
      const rows=8,width=w*(this.compoundLeaves?.68:.82),length=len*(this.compoundLeaves?.72:.9);
      for(let j=0;j<=rows;j++){const t=j/rows,shape=Math.pow(Math.max(.002,Math.sin(Math.PI*t)),this.palmLeaves?.60:.78),wave=Math.sin(t*20+roll)*.026;for(let side=-1;side<=1;side++){const edge=side*width*.5*shape*(1+wave)*(side<0?.94:1),height=Math.sin(t*Math.PI)*width*.10-Math.abs(side)*width*.065*shape+Math.pow(t,3)*length*.065;this.point(new T.Vector3(edge,height,length*t).applyQuaternion(q).add(p),[(side+1)/2,t],color);}}
      for(let j=0;j<rows;j++)for(let k=0;k<2;k++){const a=base+j*3+k,b=a+3;this.idx.push(a,a+1,b,a+1,b+1,b);}return;
    }
    if(this.fineLeaves){const ring=[[0,0,0,.5,0],[-w*.36,w*.016,len*.24,.14,.24],[-w*.50,0,len*.51,0,.51],[-w*.29,-w*.015,len*.81,.21,.81],[0,0,len,.5,1],[w*.29,-w*.015,len*.81,.79,.81],[w*.50,0,len*.51,1,.51],[w*.36,w*.016,len*.24,.86,.24],[0,w*.11,len*.48,.5,.48]];for(const [x,y,z,u,v]of ring)this.point(new T.Vector3(x,y,z).applyQuaternion(q).add(p),[u,v],color);for(let k=0;k<8;k++)this.idx.push(base+k,base+(k+1)%8,base+8);return;}
    for(const [x,y,z,u,v] of [[0,0,0,.5,0],[-w*.5,0,len*.43,0,.43],[0,0,len,.5,1],[w*.5,0,len*.43,1,.43],[0,w*.10,len*.43,.5,.43]])this.point(new T.Vector3(x,y,z).applyQuaternion(q).add(p),[u,v],color);
    this.idx.push(base,base+1,base+4,base+1,base+2,base+4,base+2,base+3,base+4,base+3,base,base+4);
  }
  build(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));g.setAttribute('uv',new T.Float32BufferAttribute(this.uv,2));g.setAttribute('color',new T.Float32BufferAttribute(this.c,3));g.setIndex(this.idx);g.computeVertexNormals();g.computeBoundingSphere();return g;}
}

function swayMaterial(material,kind){
  material.onBeforeCompile=shader=>{
    shader.uniforms.treeArtTime=clock;
    shader.vertexShader='uniform float treeArtTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec2 treeArtOrigin=vec2(0.0);
      #ifdef USE_INSTANCING
        treeArtOrigin=instanceMatrix[3].xz;
      #endif
      float treeArtPhase=treeArtTime*${kind==='grass'?'1.8':'1.25'}+treeArtOrigin.x*.19+treeArtOrigin.y*.09;
      float treeArtWeight=${kind==='grass'?'pow(clamp(position.y/0.85,0.,1.),2.)':'smoothstep(1.6,8.8,position.y)'};
      transformed.x+=sin(treeArtPhase+position.y*.63)*treeArtWeight*${kind==='grass'?'.15':'.085'};
      transformed.z+=cos(treeArtPhase*.78+position.x)*treeArtWeight*${kind==='grass'?'.055':'.04'};
    `);
  };
  material.customProgramCacheKey=()=>`treeArt-${kind}`;
  return material;
}

function treeGeometry(biome,kind,lod){
  const bark=new Geometry(),leaf=new Geometry(),r=random(717+kind*913+biome.length*29),quality=[.22,.56,1,1][lod];
  leaf.fineLeaves=lod===2;
  leaf.ultraLeaves=lod===3;leaf.needleLeaves=biome==='tundra'||biome==='coastline'&&kind===2;leaf.compoundLeaves=biome==='desert'||biome==='coastline'&&kind===1;leaf.palmLeaves=biome==='jungle'&&kind===0;
  const wood=new T.Color(biome==='desert'&&kind===0?0x77805a:biome==='jungle'?0x655746:0x706358);
  const green=biome==='jungle'?.30:biome==='desert'?.22:biome==='tundra'?.39:.27;
  const col=(f=0)=>new T.Color().setHSL(green+r()*.045,.24+r()*.25,(biome==='jungle'?.22:biome==='tundra'?.24:.30)+r()*.15+f);
  const segment=(a,b,ra,rb,c=wood,n=7)=>{const phase=r()*6;if(lod===0&&ra<.019)return;bark.tube(a,b,ra,rb,c,Math.max(4,Math.ceil(n*(lod===0?.55:lod===1?.80:1))),phase);};
  const sculpt=style=>{if(lod===0)return false;bark.append(blenderScenery8[`${style}-lod${Math.min(lod,2)}`],wood);return true;};
  const vec=(x,y,z)=>new T.Vector3(x,y,z);
  let leafIndex=0;
  const foliage=(p,d,w,len,c)=>{leafIndex++;if((leafIndex*0.61803398875)%1<quality){const roll=r()*6.28;if(lod===3&&!leaf.needleLeaves){const end=p.clone().addScaledVector(d.clone().normalize(),len*.09);bark.tube(p,end,.0028,.0014,wood,3,0);leaf.leaf(end,d,w,len,c,roll);}else leaf.leaf(p,d,w*(lod===0?1.38:lod===1?1.15:1),len*(lod===0?1.25:1),c,roll);}};
  const cluster=(p,rad,count,small=false,snow=false)=>{
    // Authored sprays attach foliage to visible branchlets. Adjacent leaves
    // alternate along each stem, giving a layered crown rather than a leaf ball.
    const sprays=Math.max(3,Math.round(Math.sqrt(count)*.65)),per=Math.ceil(count/sprays);let index=0;
    for(let k=0;k<sprays;k++){const a=k*2.399+r()*.4,tip=p.clone().add(vec(Math.cos(a)*rad,.14+Math.sin(k*1.73)*rad*.36,Math.sin(a)*rad));if(lod>0)segment(p,tip,small?.009:.015,.003,wood,4);
      for(let j=0;j<per&&index<count;j++,index++){const t=.12+(j+.5)/per*.88,side=j%2?1:-1,at=p.clone().lerp(tip,t),angle=a+side*(.75+r()*.38),c=snow&&index%3===0?new T.Color(0xd8e4e8):col();at.y+=Math.sin(t*3.14)*rad*.13;foliage(at,vec(Math.cos(angle)*.7,.06+r()*.30,Math.sin(angle)*.7),small?.085:.24,small?.25:.56,c);}
    }
  };
  const conifer=(isLarch=false)=>{
    if(!sculpt('conifer'))segment(vec(0,0,0),vec(.10,8.4,0),.23,.025,wood,10);
    const tiers=isLarch?13:kind===1?11:14;
    for(let j=0;j<tiers;j++){
      const y=1.1+j*(kind===1?.62:isLarch?.54:.50),rad=(1-y/9)*(isLarch?2.4:kind===1?2.25:2.8),arms=isLarch?5:kind===1?5:6;
      for(let k=0;k<arms;k++){
        const a=k/arms*6.28+j*1.72,tip=vec(Math.sin(a)*rad,y+.08,Math.cos(a)*rad),base=vec(0,y+.15,0);segment(base,tip,.065*(1-y/10),.013);
        for(let n=1;n<=5;n++){
          const t=n/5,at=base.clone().lerp(tip,t),twig=vec(Math.sin(a+.7)*.48*(1-t*.55),-.17,Math.cos(a+.7)*.48*(1-t*.55)),end=at.clone().add(twig);segment(at,end,.017,.004);
          for(let q=0;q<12;q++){
            const p=at.clone().lerp(end,q/12),side=q%2?-1:1,d=vec(Math.sin(a+side*1.1)*.65,-.18+r()*.85,Math.cos(a+side*1.1)*.65);foliage(p,d,isLarch?.060:.086,isLarch?.44:.58,isLarch&&q%3===0?new T.Color(0xdce8e9):col());
          }
          if(isLarch&&n%2===0)segment(at.clone().add(vec(0,.025,0)),end.clone().add(vec(0,.022,0)),.031,.008,new T.Color(0xcbdde3),5);
        }
      }
    }
    cluster(vec(.06,8.0,0),.32,80,true,isLarch);
  };
  const broadleaf=(style=0)=>{
    const desert=biome==='desert',h=desert?5.6:8.5,trunk=desert?.20:biome==='jungle'?.42:.29;
    if(!sculpt(desert?'desert':biome==='jungle'?'kapok':'coastal')){segment(vec(0,0,0),vec(.18,h*.48,.12),trunk,trunk*.57,wood,11);for(let root=0;root<5;root++){const a=root*1.256;segment(vec(Math.sin(a)*trunk*2.9,.03,Math.cos(a)*trunk*2.9),vec(0,biome==='jungle'?1.65:.8,0),trunk*.37,.09,wood,6);}}
    for(let k=0;k<8;k++){
      const a=k/8*6.28+r()*.35,spread=biome==='jungle'?(style===1?4.9:4.5):style===1?3.6:3.0,tip=vec(Math.sin(a)*spread,h*(.70+r()*.18),Math.cos(a)*spread),fork=vec(Math.sin(a)*.14,h*(.35+r()*.07),Math.cos(a)*.14);
      const bend=fork.clone().lerp(tip,.48).add(vec(Math.sin(a+.7)*.15,.34,Math.cos(a+.7)*.15));segment(fork,bend,trunk*.43,trunk*.28);segment(bend,tip,trunk*.28,.028);
      for(let j=0;j<6;j++){
        const an=a+(j-2.5)*.48,base=fork.clone().lerp(tip,.48+j*.082),end=base.clone().add(vec(Math.sin(an)*(.55+r()*.9),(style===1?-.08:.30)+r()*.72,Math.cos(an)*(.55+r()*.9)));const mid=base.clone().lerp(end,.55).add(vec(0,.16,0));segment(base,mid,.042,.025);segment(mid,end,.025,.006);
        const cypress=biome==='coastline'&&kind===1;
        cluster(end,desert?.68:1.03,desert?42:cypress?94:68,desert||cypress);
        if(biome==='jungle'&&(style===1||kind===2)&&j%2===0){let last=end;for(let n=1;n<=5;n++){const next=end.clone().add(vec(Math.sin(n*.72)*.17,-n*.68,Math.cos(n*.6)*.14));segment(last,next,.018,.015,new T.Color(0x536340),5);if(n%2)foliage(next,vec(.3,-.5,.2),.22,.42,col());last=next;}}
      }
    }
    cluster(vec(.12,h*.76,.12),desert?.84:1.3,desert?85:190,desert||biome==='coastline'&&kind===1);
  };
  const palm=()=>{
    const authored=sculpt('palm');let last=vec(0,0,0);for(let j=1;j<=13;j++){const next=vec(Math.sin(j/13)*.85,j*.64,0);if(!authored)segment(last,next,.25-j*.009,.25-j*.010,new T.Color(j%2?0x968776:0x776957),11);last=next;}
    for(let k=0;k<13;k++){
      const a=k/13*6.28,base=last.clone(),length=3.8+r();let prior=base;
      for(let j=1;j<=14;j++){
        const t=j/14,at=base.clone().add(vec(Math.sin(a)*length*t,Math.sin(t*Math.PI)*1.2-t*t*1.6,Math.cos(a)*length*t));segment(prior,at,.027*(1-t)+.008,.022*(1-t)+.006,new T.Color(0x8d9664),5);
        for(const side of [-1,1]){const b=a+side*.8,d=vec(Math.sin(b),-.26-t*.25,Math.cos(b));foliage(at,d,.12,.35+Math.sin(t*Math.PI)*1.25,col(.04));}prior=at;
      }
    }
    for(let j=0;j<8;j++)cluster(last.clone().add(vec(Math.sin(j)*.2,-.30,Math.cos(j)*.2)),.12,2,true);
  };
  const cactus=()=>{
    const c=new T.Color(0x6f8b6a);segment(vec(0,0,0),vec(0,5.8,0),.38,.24,c,19);segment(vec(0,5.8,0),vec(0,5.99,0),.24,.14,c,19);segment(vec(0,5.99,0),vec(0,6.06,0),.14,.003,c,19);
    for(let k=0;k<4;k++){const a=k*1.65,h=2.1+k*.62,elbow=vec(Math.sin(a)*.85,h+.12,Math.cos(a)*.85),tip=elbow.clone().add(vec(Math.sin(a)*.07,1.25+r(),Math.cos(a)*.07)),mid=vec(Math.sin(a)*.60,h-.08,Math.cos(a)*.60);segment(vec(0,h,0),mid,.21,.20,c,13);segment(mid,elbow,.20,.19,c,13);segment(elbow,tip,.19,.13,c,13);segment(tip,tip.clone().add(vec(0,.12,0)),.13,.001,c,13);}
    for(let j=0;j<220;j++){const a=j*2.399,p=vec(Math.sin(a)*.386,.1+(j%55)*.1,Math.cos(a)*.386);foliage(p,vec(Math.sin(a),.3,Math.cos(a)),.016,.09,new T.Color(0xcfcbb1));}
  };
  if(biome==='tundra')conifer(kind===2);
  else if(biome==='coastline'&&kind===2)conifer(false);
  else if(biome==='jungle'&&kind===0)palm();
  else if(biome==='desert'&&kind===2)cactus();
  else broadleaf(kind===1?1:0);
  return {bark:bark.build(),leaves:leaf.build(),modeledLeaves:leaf.leafCount};
}

function tuftGeometry(biome){
  const g=new Geometry(),r=random(3157),dry=biome==='desert',snow=biome==='tundra',blades=dry?9:snow?10:14;
  for(let j=0;j<blades;j++){
    const a=j*2.399,rad=r()*.10,h=(dry?.23:snow?.27:.44)+r()*.39,w=.014+r()*.018;
    const c=new T.Color().setHSL(dry?.12:snow?.14:biome==='jungle'?.27:.23,dry?.26:snow?.14:.37,(dry?.42:snow?.52:.30)+r()*.18);
    const base=new T.Vector3(Math.sin(a)*rad,0,Math.cos(a)*rad),side=new T.Vector3(Math.cos(a)*w,0,-Math.sin(a)*w),bend=new T.Vector3(Math.sin(a)*h*.33,h,Math.cos(a)*h*.33),ids=[];
    for(let k=0;k<3;k++){const t=k/2,p=base.clone().addScaledVector(bend,t);p.y=h*t;const taper=1-t*.86;ids.push(g.point(p.clone().addScaledVector(side,-taper),[0,t],c));ids.push(g.point(p.clone().addScaledVector(side,taper),[1,t],c));}
    g.idx.push(ids[0],ids[1],ids[2],ids[1],ids[3],ids[2],ids[2],ids[3],ids[4],ids[3],ids[5],ids[4]);
  }
  return {geometry:g.build(),strands:blades};
}

function resources(biome){
  if(shared.has(biome))return shared.get(biome);
  const barkMaps=plantSurface8('bark'),leafMaps=plantSurface8('leaf');
  const bark=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,...barkMaps,normalScale:new T.Vector2(.8,.8),roughness:.98});
  const leaves=swayMaterial(new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,...leafMaps,normalScale:new T.Vector2(.32,.32),side:T.DoubleSide,roughness:biome==='jungle'?.87:.96,metalness:0}), 'leaf');
  const grass=swayMaterial(new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:biome==='jungle'?.60:.9}), 'grass');
  const trees=Array.from({length:3},(_,k)=>Array.from({length:3},(_,lod)=>treeGeometry(biome,k,lod))),tuft=tuftGeometry(biome);
  // Cached across environment/pack worlds. The owner may evict scene instances,
  // but should preserve these reusable resources when disposing an LRU world.
  for(const item of [...Object.values(barkMaps),...Object.values(leafMaps),bark,leaves,grass,tuft.geometry,...trees.flatMap(lods=>lods.flatMap(g=>[g.bark,g.leaves]))])item.userData.artShared=true;
  const result={bark,leaves,grass,trees,tuft};shared.set(biome,result);return result;
}

function legacyFallback(world){
  const all=new Set([...(world.foliage||[]),...(world.leafMeshes||[]),...(world.ultraObjects||[])]);
  for(const tile of world.tiles){if(tile.userData.trunks)all.add(tile.userData.trunks);for(const m of tile.children){if(m.userData.legacyVegetation||(m.isInstancedMesh&&(['CylinderGeometry','ConeGeometry'].includes(m.geometry.type)||([50000,26400,6600].includes(m.instanceMatrix.count))||(m.geometry.type==='PlaneGeometry'&&m.instanceMatrix.count>=500)))||m.geometry?.type==='TubeGeometry')all.add(m);}}
  return [...all];
}

export function installTreePacks(world,biome,packId=naturalTreePack(biome)){
  const pack=TREE_PACKS.find(p=>p.id===packId)||TREE_PACKS[0],res=resources(biome),r=random(1807),legacy=world.legacyVegetation||legacyFallback(world),groups=[],tufts=[];
  const scale=pack.id==='oldgrowth'?1.32:pack.id==='windswept'?.92:1.07,extra=pack.id==='oldgrowth'?(biome==='jungle'?44:biome==='desert'?8:18):pack.id==='native'?8:0;
  let treeCount=0;
  const dummy=new T.Object3D();
  function terrain(tile,x,z){return typeof tile.userData.terrainHeight==='function'?tile.userData.terrainHeight(x,z):x<0?-.16:-.10;}
  const treeSpeciesCount=[0,0,0];
  for(const [ti,tile] of world.tiles.entries()){
    const root=new T.Group();root.name=`Authored trees · ${pack.label}`;root.userData.treeArt=true;tile.add(root);
    const positions=tile.userData.trees.map((p,i)=>{const x=Math.sign(p.x)*Math.max(16,Math.abs(p.x)+(r()-.5)*3.4),z=clamp(p.z+(r()-.5)*5.8,-155,-4);return {...p,x,z};});
    if(biome==='jungle'){positions.length=0;for(const side of[-1,1])for(let grove=0;grove<4;grove++)for(let ring=0;ring<8;ring++){const phase=ti*7.1+grove*2.3+ring*1.7,x=side*(18.2+(ring%3)*10+Math.sin(phase)*1.6),z=clamp(-19-grove*37+(Math.floor(ring/3)-1)*7+Math.cos(phase)*2,-155,-4);positions.push({x,z,h:4.4+r()*3.8});}}
    for(let i=0;i<extra;i++){const grove=i%4,z=clamp(-20-grove*37+(r()-.5)*18,-155,-4),x=(i%3===0&&biome!=='coastline'?-1:1)*(34+Math.floor(i/4)%3*12+(r()-.5)*5);positions.push({x,z,y:terrain(tile,x,z),h:4+r()*4});}
    tile.userData.treeArtAnchors=positions;
    const bySpecies=[[],[],[]];
    positions.forEach((p,i)=>{
      const k=pack.id!=='windswept'?i%3:biome==='coastline'?(i%5===0?0:i%3===0?2:1):biome==='tundra'?(i%5===0?0:i%3===0?1:2):(i%5===0?2:i%3===0?1:0);
      const size=p.h/8*(biome==='jungle'?2.45:biome==='tundra'?1.85:biome==='desert'?1.26:1.65)*scale;
      const height=terrain(tile,p.x,p.z);dummy.position.set(p.x,height-.035,p.z);dummy.rotation.set(0,r()*6.28,pack.id==='windswept'?(biome==='tundra'?.012:-.09):0);dummy.scale.set(size*(.90+r()*.2),size,size*(.90+r()*.2));dummy.updateMatrix();bySpecies[k].push(dummy.matrix.clone());treeSpeciesCount[k]++;treeCount++;
    });
    bySpecies.forEach((transforms,k)=>{
      const lodMeshes=[];
      for(let lod=0;lod<3;lod++){
        const b=new T.InstancedMesh(res.trees[k][lod].bark,res.bark,transforms.length),l=new T.InstancedMesh(res.trees[k][lod].leaves,res.leaves,transforms.length);
        transforms.forEach((m,i)=>{b.setMatrixAt(i,m);l.setMatrixAt(i,m);const shade=.78+((i*.618+k*.19)%1)*.22;b.setColorAt(i,new T.Color().setRGB(shade,shade*.97,shade*.91));l.setColorAt(i,new T.Color().setRGB(pack.id==='windswept'&&biome==='tundra'?shade*.91:shade,shade,pack.id==='oldgrowth'?shade*.91:shade));});b.castShadow=l.castShadow=true;b.receiveShadow=l.receiveShadow=true;b.frustumCulled=l.frustumCulled=false;b.userData.treeArt=l.userData.treeArt=true;b.name=`${SPECIES[biome][k]} trunks LOD${lod}`;l.name=`${SPECIES[biome][k]} individual foliage LOD${lod}`;root.add(b,l);lodMeshes.push({b,l,modeledLeaves:res.trees[k][lod].modeledLeaves});
      }
      groups.push({tile,root,lods:lodMeshes,species:k,transforms,clearanceKey:null});
    });
    const cap=(biome==='desert'?1300:biome==='tundra'?2700:biome==='jungle'?5200:6800)*(pack.id==='oldgrowth'?1.2:1),m=new T.InstancedMesh(res.tuft.geometry,res.grass,Math.floor(cap));
    m.name=`Wind animated ${biome==='desert'?'desert bunchgrass':biome==='tundra'?'frosted tussocks':'individual grass tufts'}`;m.userData.treeArt=true;
    for(let i=0;i<m.instanceMatrix.count;i++){
      const side=i%2?1:-1;let z=-2-r()*155;if(ti===2&&Math.abs(z+80)<14)z=z<-80?-103-r()*48:-10-r()*44;
      const x=side*(14.7+r()*8.2),size=(biome==='tundra'?.50:1)*(.62+r()*.78);
      dummy.position.set(x,terrain(tile,x,z)-.015,z);dummy.rotation.set(0,r()*6.28,0);dummy.scale.set(size,size,size);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);
      m.setColorAt(i,new T.Color().setRGB(.76+r()*.24,.83+r()*.17,.74+r()*.23));
    }
    m.receiveShadow=true;m.castShadow=false;m.frustumCulled=false;root.add(m);tufts.push({tile,mesh:m,baseMatrices:m.instanceMatrix.array.slice(),validCapacity:m.instanceMatrix.count,clearanceKey:null});
  }
  const hideLegacy=()=>legacy.forEach(m=>{m.visible=false;});hideLegacy();
  let activeLeafCount=0,activeTufts=0,activeTrees=0,nearTrees=0,current=world.preset||'High';
  function ensureUltraTrees(){
    if(!res.ultraTrees){res.ultraTrees=Array.from({length:3},(_,k)=>treeGeometry(biome,k,3));for(const g of res.ultraTrees)g.bark.userData.artShared=g.leaves.userData.artShared=true;}
    for(const g of groups){if(g.lods[3])continue;const shape=res.ultraTrees[g.species],b=new T.InstancedMesh(shape.bark,res.bark,g.transforms.length),l=new T.InstancedMesh(shape.leaves,res.leaves,g.transforms.length);for(const mesh of[b,l]){mesh.count=0;mesh.visible=false;mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.userData.treeArt=mesh.userData.ultraScenery=true;mesh.instanceColor=(mesh===l?g.lods[2].l:g.lods[2].b).instanceColor.clone();}b.name=SPECIES[biome][g.species]+' close trunk and leaf stems';l.name=SPECIES[biome][g.species]+' curved close foliage';g.root.add(b,l);g.lods.push({b,l,modeledLeaves:shape.modeledLeaves});g.clearanceKey=null;world.bindRoute?.(g.root);}
  }
  function lodUpdate(){
    nearTrees=0;
    if(current==='Game Only'){activeLeafCount=activeTufts=activeTrees=0;groups.forEach(g=>g.lods.forEach(m=>{m.b.visible=m.l.visible=false;m.b.count=m.l.count=0}));tufts.forEach(t=>{t.mesh.visible=false;t.mesh.count=0});hideLegacy();return;}
    if(current==='Ultra+')ensureUltraTrees();
    const q={Low:0,High:1,Ultra:2,'Ultra+':2}[current]??1;activeLeafCount=activeTufts=activeTrees=0;
    groups.forEach(g=>{
      if(current==='Ultra+'){
        const c=world.scenePolicyClearance,block=c?routeBlockFor(g.tile,c.distance):g.tile.userData.routeBlock||0,offset=c?c.distance-block*160:g.tile.position.z,key='ultra:'+block+':'+c?.junctionPosition+':'+Math.floor(offset/12);
        if(key!==g.clearanceKey){let near=0,far=0;for(const matrix of g.transforms){const e=matrix.elements;if(anchorNearJunction(world,g.tile,e[12],e[14],21))continue;const close=Math.abs(e[12])<31&&e[14]+offset> -105&&e[14]+offset<25,lod=close?3:2,n=close?near++:far++;g.lods[lod].b.setMatrixAt(n,matrix);g.lods[lod].l.setMatrixAt(n,matrix);}g.ultraCounts=[far,near];g.lods.forEach(m=>m.b.instanceMatrix.needsUpdate=m.l.instanceMatrix.needsUpdate=true);g.clearanceKey=key;}
        g.lods.forEach((m,n)=>{const count=n===2?g.ultraCounts[0]:n===3?g.ultraCounts[1]:0;m.b.count=m.l.count=count;m.b.visible=m.l.visible=count>0;m.l.castShadow=true;if(g.tile.visible){activeTrees+=count;activeLeafCount+=count*m.modeledLeaves;if(n===3)nearTrees+=count;}});return;
      }
      const c=world.scenePolicyClearance,key=(c?routeBlockFor(g.tile,c.distance)+':'+c.junctionPosition:'none')+':'+current;
      if(key!==g.clearanceKey){let count=0;g.transforms.forEach((matrix,i)=>{const e=matrix.elements;if(current==='Low'&&i%2===1)return;if(anchorNearJunction(world,g.tile,e[12],e[14],21))return;g.lods.forEach(m=>{m.b.setMatrixAt(count,matrix);m.l.setMatrixAt(count,matrix)});count++;});g.activeCount=count;g.lods.forEach(m=>{m.b.instanceMatrix.needsUpdate=m.l.instanceMatrix.needsUpdate=true;});g.clearanceKey=key;}
      const distance=-g.tile.position.z,far=distance>290,lod=current==='Ultra+'?2:Math.max(0,q-(far?1:0));
      g.lods.forEach((m,n)=>{m.b.count=m.l.count=n===3?0:g.activeCount;m.b.visible=m.l.visible=n===lod;m.l.castShadow=current!=='Low';});
      if(g.tile.visible){activeTrees+=g.lods[lod].b.count;activeLeafCount+=g.lods[lod].modeledLeaves*g.lods[lod].l.count;}
    });
    tufts.forEach(g=>{const {tile,mesh,baseMatrices}=g,c=world.scenePolicyClearance,key=c?routeBlockFor(tile,c.distance)+':'+c.junctionPosition:'none';if(key!==g.clearanceKey){let n=0;for(let i=0;i<mesh.instanceMatrix.count;i++){const k=i*16;if(anchorNearJunction(world,tile,baseMatrices[k+12],baseMatrices[k+14],14))continue;mesh.instanceMatrix.array.set(baseMatrices.subarray(k,k+16),n++*16);}g.validCapacity=n;g.clearanceKey=key;mesh.instanceMatrix.needsUpdate=true;}const d=-tile.position.z,range=d< -180?.14:d<170?1:d<350?.50:.22,factor={Low:.10,High:.43,Ultra:.76,'Ultra+':1}[current]||.43;mesh.visible=true;mesh.count=Math.floor(g.validCapacity*factor*range*Math.max(.7,world.adaptive||1));if(tile.visible)activeTufts+=mesh.count;});
    hideLegacy();
  }
  const quality=world.quality;world.quality=name=>{quality(name);current=name;lodUpdate();};
  const update=world.update;world.update=(distance,time,x)=>{update(distance,time,x);clock.value=time;lodUpdate();};
  const details=world.details;world.details=()=>({...details(),treePack:pack.id,treePackName:pack.label,treeSpecies:SPECIES[biome],treeSpeciesCounts:treeSpeciesCount,authoredTrees:treeCount,visibleAuthoredTrees:activeTrees,individualLeaves:activeLeafCount,leafCapacity:groups.reduce((n,g)=>n+g.lods[2].modeledLeaves*g.lods[2].l.count,0),canopyCards:0,pineNeedles:biome==='tundra'?activeLeafCount:0,groundDetail:activeTufts*res.tuft.strands,grassTufts:activeTufts,grassStrands:activeTufts*res.tuft.strands,groundCapacity:tufts.reduce((n,g)=>n+g.mesh.instanceMatrix.count*res.tuft.strands,0),groundMaterial:biome==='desert'?'individual dry bunchgrass strands':biome==='tundra'?'frosted individual tussock strands':'curved individual grass strands',treeArtWind:true,legacyVegetationHidden:legacy.every(m=>!m.visible),vegetationPlacement:'terrain sampled roots; layered mixed-species groves; road and junction clearances'});
  const detail=world.details;world.details=()=>({...detail(),treeUltraDetail:{active:current==='Ultra+',nearTrees,leafModel:current==='Ultra+'?'cambered segmented leaves, attached petioles and three-sided needle bundles':'standard authored LOD',resourcesCreated:!!res.ultraTrees,routeBound:groups.every(g=>!g.lods[3]||!!g.lods[3].l.customDepthMaterial),suppressedOutsideUltra:current==='Ultra+'||groups.every(g=>!g.lods[3]||!g.lods[3].l.visible&&g.lods[3].l.count===0)}});
  world.treeArt={pack:pack.id,groups,tufts,species:SPECIES[biome],legacy};lodUpdate();return world;
}

export {treeGeometry,tuftGeometry,resources};
