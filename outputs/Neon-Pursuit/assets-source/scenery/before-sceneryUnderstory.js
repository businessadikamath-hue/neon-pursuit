import * as T from 'three';
import {routeBlockFor} from '../engine/sceneryPolicy.js';
import {plantSurface8} from '../engine/scenerySurface8.js';

// Original, solid leaf/stem meshes. Shared art is retained across world eviction.
const cache=new Map(),windClock={value:0},TAU=Math.PI*2;
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const vec=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const species=['Sword fern','Wild banana','Elephant ear','Understory palm','Woody broadleaf sapling'];

class PlantGeometry {
  constructor(){this.p=[];this.c=[];this.uv=[];this.i=[];this.leaves=0;}
  point(p,c,u=0,v=0){this.p.push(p.x,p.y,p.z);this.c.push(c.r,c.g,c.b);this.uv.push(u,v);return this.p.length/3-1;}
  tube(a,b,ra,rb,c,sides=5){
    const d=b.clone().sub(a).normalize(),u=vec(0,1,0);if(Math.abs(d.y)>.96)u.set(1,0,0);u.cross(d).normalize();const v=d.clone().cross(u),base=this.p.length/3;
    for(let j=0;j<2;j++)for(let k=0;k<=sides;k++){const ang=k/sides*TAU,rr=j?rb:ra;this.point((j?b:a).clone().addScaledVector(u,Math.cos(ang)*rr).addScaledVector(v,Math.sin(ang)*rr),c,k/sides,j);}
    for(let k=0;k<sides;k++){const n=base+k,m=n+sides+1;this.i.push(n,m,n+1,n+1,m,m+1);}
  }
  // A ribbed, cambered blade with several cross-sections; no billboard cards.
  blade(base,az,length,width,lift,droop,c,steps=7,heart=false,torn=false){
    const ids=[],dir=vec(Math.sin(az),0,Math.cos(az)),side=vec(Math.cos(az),0,-Math.sin(az));
    for(let j=0;j<=steps;j++){
      const t=j/steps,shape=heart?Math.pow(Math.sin(Math.PI*Math.min(.997,.08+t*.92)),.68):Math.pow(Math.sin(Math.PI*t),.8);
      const center=base.clone().addScaledVector(dir,length*t);center.y+=lift*t-droop*t*t;
      const w=Math.max(.003,width*shape*(heart?(1.20-.40*t):1));
      const row=[];for(let k=0;k<3;k++){const s=k-1,p=center.clone().addScaledVector(side,s*w*(torn&&j%3===1?.82:1));p.y-=Math.abs(s)*w*.17;p.y+=Math.sin(t*24)*w*.025;row.push(this.point(p,c,k/2,t));}ids.push(row);
    }
    for(let j=0;j<steps;j++)for(let k=0;k<2;k++){const a=ids[j][k],b=ids[j][k+1],c=ids[j+1][k],d=ids[j+1][k+1];this.i.push(a,b,c,b,d,c);}
    this.leaves++;
  }
  build(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));g.setAttribute('color',new T.Float32BufferAttribute(this.c,3));g.setAttribute('uv',new T.Float32BufferAttribute(this.uv,2));g.setIndex(this.i);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();g.userData.artShared=true;return g;}
}

function plant(kind,lod){
  const wood=new PlantGeometry(),leaf=new PlantGeometry(),r=rng(4727+kind*301),fine=lod===1,green=()=>new T.Color().setHSL(.25+r()*.09,.32+r()*.22,.22+r()*.17),stem=new T.Color(0x697947),bark=new T.Color(0x726248);
  const tube=(a,b,ra=.02,rb=.008,col=stem)=>wood.tube(a,b,ra,rb,col,fine?6:4);
  if(kind===0){
    const n=fine?9:6;for(let k=0;k<n;k++){const a=k/n*TAU,len=.95+r()*.65,h=.50+r()*.32;let last=vec(0,.04,0);const count=fine?13:8;
      for(let j=1;j<=count;j++){const t=j/count,p=vec(Math.sin(a)*len*t,.06+Math.sin(t*Math.PI*.78)*h,Math.cos(a)*len*t);tube(last,p,.012*(1-t)+.003,.009*(1-t)+.002);if(j<count)for(const side of [-1,1])leaf.blade(p,a+side*1.08,.12+Math.sin(t*Math.PI)*.39,.035+Math.sin(t*Math.PI)*.022,.06,.09,green(),fine?5:3);last=p;}
    }
  }else if(kind===1||kind===2){
    const n=kind===1?(fine?7:5):(fine?8:5);for(let k=0;k<n;k++){const a=k/n*TAU+.14*r(),h=kind===1?1.1+r()*1.3:.48+r()*.75,base=vec(Math.sin(a)*.16,.01,Math.cos(a)*.16),tip=vec(Math.sin(a)*.32,h,Math.cos(a)*.32);tube(base,tip,kind===1?.067:.034,.02);leaf.blade(tip,a,kind===1?1.4+r()*.58:.88+r()*.48,kind===1?.32:.52,kind===1?.65:.35,kind===1?.95:.58,green(),fine?12:6,kind===2,kind===1);}
    if(kind===1)for(let k=0;k<5;k++)tube(vec(Math.sin(k)*.11,0,Math.cos(k)*.11),vec(Math.sin(k)*.07,1.1,Math.cos(k)*.07),.07,.03,new T.Color(k%2?0x9b8864:0x71824d));
  }else if(kind===3){
    let last=vec();for(let j=1;j<=7;j++){const p=vec(j*j*.003,j*.13,0);tube(last,p,.10-j*.006,.095-j*.006,new T.Color(j%2?0x807453:0x6d6247));last=p;}
    const n=fine?8:5;for(let k=0;k<n;k++){const a=k/n*TAU,len=1.3+r()*.5;let prev=last;const count=fine?12:7;for(let j=1;j<=count;j++){const t=j/count,p=last.clone().add(vec(Math.sin(a)*len*t,Math.sin(t*Math.PI)*.55-t*t*.29,Math.cos(a)*len*t));tube(prev,p,.02*(1-t)+.005,.016*(1-t)+.004);for(const side of [-1,1])leaf.blade(p,a+side*.95,.20+Math.sin(t*Math.PI)*.60,.045,.09,.20,green(),fine?5:3);prev=p;}}
  }else{
    tube(vec(),vec(.09,2.2,0),.075,.025,bark);const n=fine?9:6;for(let k=0;k<n;k++){const a=k*2.399,y=.55+k*.16,base=vec(.04,y,0),tip=vec(Math.sin(a)*(.55+r()*.37),y+.34+r()*.35,Math.cos(a)*(.55+r()*.37));tube(base,tip,.026,.005,bark);for(let j=0;j<(fine?7:4);j++){const t=.25+j/(fine?9:6),p=base.clone().lerp(tip,t),side=j%2?-1:1;leaf.blade(p,a+side*.85,.28+r()*.21,.085,.18,.13,green(),fine?6:3);}}
  }
  return {wood:wood.build(),leaf:leaf.build(),leaves:leaf.leaves};
}

function resources(){
  if(cache.has('jungle'))return cache.get('jungle');
  const bytes=new Uint8Array(128*128*4),r=rng(16291);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const mid=Math.abs(x-64),vein=Math.abs(Math.sin(y*.46+mid*.25)),v=180+(mid<2?34:0)+(vein<.14?25:0)-mid*.22+r()*17;bytes.set([v,v,v,255],(y*128+x)*4);}
  const texture=new T.DataTexture(bytes,128,128);texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;texture.anisotropy=8;texture.userData.artShared=true;
  const leaf=new T.MeshStandardMaterial({vertexColors:true,...plantSurface8('leaf'),normalScale:new T.Vector2(.38,.38),side:T.DoubleSide,roughness:.88,metalness:0});
  leaf.onBeforeCompile=shader=>{shader.uniforms.understoryTime=windClock;shader.vertexShader='uniform float understoryTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    vec2 understoryOrigin=vec2(0.0);
    #ifdef USE_INSTANCING
      understoryOrigin=instanceMatrix[3].xz;
    #endif
    float understoryBend=pow(clamp(position.y/2.2,0.0,1.0),1.6);
    transformed.x+=sin(understoryTime*1.12+understoryOrigin.x*.37+understoryOrigin.y*.17+position.y)*understoryBend*.085;
    transformed.z+=cos(understoryTime*.85+understoryOrigin.y*.21)*understoryBend*.035;
  `);};leaf.customProgramCacheKey=()=> 'treeArt-understory-v7';
  const wood=new T.MeshStandardMaterial({vertexColors:true,...plantSurface8('bark'),normalScale:new T.Vector2(.33,.33),roughness:.98});leaf.userData.artShared=wood.userData.artShared=true;
  const shapes=Array.from({length:5},(_,k)=>[plant(k,0),plant(k,1)]),result={shapes,leaf,wood,texture};cache.set('jungle',result);return result;
}

export function installUnderstory(world,biome){
  if(world.understoryArt)return world;
  const groups=[],roots=[],res=biome==='jungle'?resources():null,dummy=new T.Object3D();let current=world.preset||'High',plants=0,leaves=0,triangles=0,culled=0;
  if(res)for(const [ti,tile] of world.tiles.entries()){
    const root=new T.Group();root.name='Jungle understory · ferns, banana, aroids, palms and saplings';root.userData.understoryArt=true;tile.add(root);roots.push(root);
    const r=rng(7713+ti*317),bySpecies=Array.from({length:5},()=>[]),anchors=tile.userData.treeArtAnchors||tile.userData.trees||[];
    for(let j=0;j<anchors.length;j++)for(let n=0;n<6;n++){
      const anchor=anchors[j],kind=(j+n*2)%5,a=n/6*TAU+r()*.60,rad=1.9+r()*3.1,scale=.66+r()*.59;
      const footprint=2.65*scale+.25;
      let x=anchor.x+Math.sin(a)*rad,z=T.MathUtils.clamp(anchor.z+Math.cos(a)*rad,-156,-4);
      x=Math.sign(x||1)*Math.max(14.2+footprint,Math.abs(x));
      const y=typeof tile.userData.terrainHeight==='function'?tile.userData.terrainHeight(x,z):(anchor.y||0);
      dummy.position.set(x,y-.025,z);dummy.rotation.set(0,r()*TAU,0);dummy.scale.setScalar(scale);dummy.updateMatrix();bySpecies[kind].push({matrix:dummy.matrix.clone(),x,z,radius:footprint,rank:r(),shade:.78+r()*.22});
    }
    for(let kind=0;kind<5;kind++){
      const positions=bySpecies[kind],lods=[];
      for(let lod=0;lod<2;lod++){
        const shape=res.shapes[kind][lod],b=new T.InstancedMesh(shape.wood,res.wood,positions.length),l=new T.InstancedMesh(shape.leaf,res.leaf,positions.length);
        for(const m of [b,l]){m.name=`${species[kind]} ${m===b?'stems':'modeled leaves'} LOD${lod}`;m.userData.understoryArt=true;m.receiveShadow=true;m.castShadow=true;m.frustumCulled=false;root.add(m);}
        lods.push({b,l,leafCount:shape.leaves,triangles:(shape.wood.index.count+shape.leaf.index.count)/3});
      }
      groups.push({tile,root,kind,positions,lods,key:null,hidden:0});
    }
    if(world.bindRoute)world.bindRoute(root);
  }
  function refresh(){
    plants=leaves=triangles=culled=0;const gameOnly=current==='Game Only'||world.preset==='Game Only';roots.forEach(root=>{root.visible=!gameOnly;});
    for(const group of groups){
      const {tile,positions,lods}=group,policy=world.scenePolicyClearance,block=policy?routeBlockFor(tile,policy.distance):Number.isFinite(tile.userData.routeBlock)?tile.userData.routeBlock:null;
      const distance=-(tile.position.z||0)+80,far=distance>270||distance< -100,lod=current==='Low'||far?0:1;
      const factor=gameOnly?0:({Low:.20,High:.60,Ultra:.84,'Ultra+':1}[current]??.60)*(distance>440?.38:far?.66:1)*Math.max(.60,world.adaptive||1);
      const limit=Math.floor(positions.length*factor),junction=Number.isFinite(policy?.junctionPosition)?policy.junctionPosition:null;
      const key=[gameOnly,lod,limit,block,junction].join('|');
      if(key!==group.key){
        group.key=key;let count=0;group.hidden=0;
        for(const p of positions){
          const absolute=block===null?null:block*160-p.z;
          const blocked=junction!==null&&absolute!==null&&Math.abs(absolute-junction)<14+p.radius&&Math.abs(p.x)<55+p.radius;
          if(blocked){group.hidden++;continue;}if(count>=limit)continue;
          for(const m of [lods[lod].b,lods[lod].l]){m.setMatrixAt(count,p.matrix);m.setColorAt(count,new T.Color(p.shade,p.shade,p.shade*.96));}count++;
        }
        lods.forEach((entry,index)=>{entry.b.count=entry.l.count=index===lod?count:0;entry.b.instanceMatrix.needsUpdate=entry.l.instanceMatrix.needsUpdate=true;if(entry.b.instanceColor)entry.b.instanceColor.needsUpdate=true;if(entry.l.instanceColor)entry.l.instanceColor.needsUpdate=true;});
      }
      lods.forEach((entry,index)=>{entry.b.visible=entry.l.visible=!gameOnly&&index===lod;entry.b.castShadow=entry.l.castShadow=current!=='Low';if(gameOnly)entry.b.count=entry.l.count=0;});
      if(!gameOnly&&tile.visible){plants+=lods[lod].l.count;leaves+=lods[lod].l.count*lods[lod].leafCount;triangles+=lods[lod].l.count*lods[lod].triangles;}culled+=group.hidden;
    }
  }
  const previousQuality=world.quality;world.quality=function(name,...args){const result=previousQuality?.call(world,name,...args);current=name;refresh();return result;};
  const previousUpdate=world.update;world.update=function(distance,time,...args){const result=previousUpdate?.call(world,distance,time,...args);windClock.value=time||0;refresh();return result;};
  const previousDetails=world.details;world.details=()=>({...previousDetails?.call(world),understorySpecies:res?species:[],understoryPlants:plants,understoryLeaves:leaves,understoryTriangles:triangles,understoryCapacity:groups.reduce((n,g)=>n+g.positions.length,0),understoryJunctionSuppressed:culled,understoryWind:!!res,understoryPlacement:'Terrain sampled clumps around tree anchors; modeled foliage outside 14 m road corridor; dynamic junction setback'});
  world.understoryArt={groups,roots,refresh,species:res?species:[],geometryTriangles:res?res.shapes.map((lods,kind)=>({species:species[kind],lods:lods.map(g=>(g.wood.index.count+g.leaf.index.count)/3)})):[]};refresh();return world;
}


export {plant,resources};
