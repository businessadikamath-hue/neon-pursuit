import * as T from 'three';

// The cinematic GLB is also the runtime source for the highest-detail hero
// vehicle.  Keeping the import optional preserves the offline procedural
// fallback when a browser refuses a local file URL.
const CAR_PART = /(?:blackline body|door|glass|pillar|plate|wheel|tire|rotor|caliper|hub|dashboard|console|seat|steering|headlight|taillight|exhaust|splitter|diffuser|grille|roof|mirror|sill|handle|hinge|stitch)/i;
const WHEEL = /road tire/i;

function cloneMaterials(root){
  root.traverse((o)=>{
    if(!o.isMesh) return;
    o.userData.blenderShared=true;
    o.castShadow=true; o.receiveShadow=true;
    if(o.material){
      const list=Array.isArray(o.material)?o.material:[o.material];
      list.forEach(m=>{m.userData.artShared=true;});
    }
  });
}

export function installBlenderAssetRuntime(onReady=()=>{}){
  const state={status:'loading',source:'gallery/blender/hero-blender-ultraplus.glb',objects:0,carParts:0,coverage:{vehicle:false,road:false,ocean:false,trees:false,rocks:false,wildlife:false,clouds:false}};
  const api={state,hero:null,coverageRoot:null,ready:false};
  // Edge/Chrome intentionally block fetches from an origin-null file page.
  // Launch.cmd remains fully offline; a local HTTP host enables the authored
  // GLB swap without emitting noisy console errors.
  if(location.protocol==='file:'){
    state.status='fallback'; state.error='Local file protocol; authored GLB swap activates from a local HTTP host.';
    return api;
  }
  const url='gallery/blender/hero-blender-ultraplus.glb';
  fetch(url).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.arrayBuffer();}).then(buffer=>{
    const source=parseGlb(buffer);
    const car=new T.Group(); car.name='Blender runtime hero vehicle · all modeled parts';
    source.traverse((o)=>{
      if(!o.isMesh||!CAR_PART.test(o.name)) return;
      const c=o.clone(true); c.name=o.name; car.add(c); state.carParts++;
    });
    cloneMaterials(car);
    car.userData.blenderAsset=true;
    car.userData.kind='black';
    car.userData.name='McLaren 720S Coupe · Blender authored hero body';
    car.userData.width=2.02; car.userData.length=4.82;
    car.userData.wheels=[]; car.traverse(o=>{if(o.isMesh&&WHEEL.test(o.name))car.userData.wheels.push(o);});
    // The imported scene is authored in the same forward convention as the
    // game.  A small scale correction matches the game chassis dimensions.
    const box=new T.Box3().setFromObject(car), size=box.getSize(new T.Vector3());
    if(size.x>0&&size.z>0){const sx=2.02/Math.max(size.x,size.z); car.scale.setScalar(sx);}
    api.hero=car; api.coverageRoot=source; api.ready=true;
    source.traverse((o)=>{if(o.isMesh){state.objects++;const n=o.name.toLowerCase(); if(n.includes('body')||n.includes('wheel')||n.includes('door'))state.coverage.vehicle=true; if(n.includes('road'))state.coverage.road=true; if(n.includes('ocean'))state.coverage.ocean=true; if(n.includes('tree')||n.includes('coastal')||n.includes('conifer')||n.includes('kapok')||n.includes('palm'))state.coverage.trees=true; if(n.includes('rock'))state.coverage.rocks=true; if(n.includes('bird')||n.includes('gull')||n.includes('feather'))state.coverage.wildlife=true; if(n.includes('cloud'))state.coverage.clouds=true;}});
    state.status='ready'; onReady(api);
  }).catch(error=>{state.status='fallback';state.error=String(error?.message||error);});
  return api;
}

// Small self-contained GLB reader. The shipped cinematic uses plain mesh
// primitives, so pulling the full GLTFLoader into the 25 MB game bundle would
// add startup cost for players who launch the offline file directly.
function parseGlb(buffer){
  const view=new DataView(buffer); if(view.getUint32(0,true)!==0x46546c67)throw new Error('Invalid GLB');
  let offset=12,json=null,bin=null;
  while(offset<buffer.byteLength){const len=view.getUint32(offset,true),type=view.getUint32(offset+4,true);const data=buffer.slice(offset+8,offset+8+len);if(type===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(data));else if(type===0x004e4942)bin=data;offset+=8+len;}
  if(!json||!bin)throw new Error('GLB missing JSON or BIN');
  const component={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
  const width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};
  const accessor=(a)=>{const ac=json.accessors[a],bv=json.bufferViews[ac.bufferView],Ctor=component[ac.componentType],n=ac.count*width[ac.type],base=(bv.byteOffset||0)+(ac.byteOffset||0),stride=bv.byteStride||Ctor.BYTES_PER_ELEMENT*width[ac.type];if(stride===Ctor.BYTES_PER_ELEMENT*width[ac.type])return new Ctor(bin,base,n);const out=new Ctor(n),step=Ctor.BYTES_PER_ELEMENT*width[ac.type],dv=new DataView(bin);for(let i=0;i<ac.count;i++)for(let c=0;c<width[ac.type];c++){const p=base+i*stride+c*Ctor.BYTES_PER_ELEMENT;out[i*width[ac.type]+c]=Ctor===Float32Array?dv.getFloat32(p,true):Ctor===Uint32Array?dv.getUint32(p,true):Ctor===Uint16Array?dv.getUint16(p,true):Ctor===Int16Array?dv.getInt16(p,true):Ctor===Int8Array?dv.getInt8(p):dv.getUint8(p);}return out;};
  const scene=new T.Group(); scene.name='Blender all-object asset library'; const nodes=(json.nodes||[]).map((n,i)=>{const o=new T.Object3D();o.name=n.name||`Blender object ${i}`;if(n.matrix)o.matrix.fromArray(n.matrix),o.matrixAutoUpdate=false;else {if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale);}return o;});
  (json.meshes||[]).forEach((m,mi)=>{const nodeIndexes=(json.nodes||[]).map((n,i)=>n.mesh===mi?i:-1).filter(i=>i>=0);for(const ni of nodeIndexes){const node=nodes[ni];for(const prim of m.primitives||[]){const g=new T.BufferGeometry();const attrs=prim.attributes||{};for(const [key,a] of Object.entries(attrs)){const attr=accessor(a);const item=width[json.accessors[a].type];const name=key==='POSITION'?'position':key==='NORMAL'?'normal':key==='TEXCOORD_0'?'uv':null;if(name)g.setAttribute(name,new T.BufferAttribute(attr,item));}if(prim.indices!==undefined)g.setIndex(new T.BufferAttribute(accessor(prim.indices),1));g.computeVertexNormals();g.computeBoundingSphere();const n=node.name.toLowerCase();const color=n.includes('glass')?0x16465b:n.includes('tree')||n.includes('leaf')||n.includes('coastal')||n.includes('conifer')||n.includes('kapok')||n.includes('palm')?0x2d6a3b:n.includes('road')||n.includes('aggregate')?0x565b5f:n.includes('ocean')?0x07526b:n.includes('rock')?0x74624e:n.includes('tire')||n.includes('rubber')?0x090b0d:n.includes('body')?0x34434d:0x1b2329;const mat=new T.MeshStandardMaterial({color,roughness:n.includes('glass')?.18:n.includes('body')?.24:.62,metalness:n.includes('body')||n.includes('wheel')?.68:.05,transparent:n.includes('glass'),opacity:n.includes('glass')?.55:1});const mesh=new T.Mesh(g,mat);mesh.name=node.name;mesh.userData.blenderMesh=true;node.add(mesh);}}});
  const childSet=new Set();(json.nodes||[]).forEach((n,i)=>{for(const c of n.children||[]){nodes[i].add(nodes[c]);childSet.add(c);}});nodes.forEach((n,i)=>{if(!childSet.has(i))scene.add(n);});return scene;
}

export function cloneBlenderHero(api){
  if(!api?.ready||!api.hero) return null;
  const hero=api.hero.clone(true);
  hero.userData={...api.hero.userData,blenderAsset:true,blenderShared:true,wheels:[]};
  hero.traverse(o=>{if(o.isMesh&&WHEEL.test(o.name))hero.userData.wheels.push(o);});
  return hero;
}
