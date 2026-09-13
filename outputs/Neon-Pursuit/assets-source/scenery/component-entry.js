import * as T from 'three';
import * as oldTrees from './before-treePacks.js';
import * as newTrees from './after-treePacks.js';
import * as oldPlants from './before-sceneryUnderstory.js';
import * as newPlants from './after-sceneryUnderstory.js';
import * as oldGround from './before-ultraScenery8.js';
import * as newGround from './after-ultraScenery8.js';
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1280,900);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;document.body.appendChild(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color(0xc2ccd1);const camera=new T.PerspectiveCamera(36,1280/900,.01,300);scene.add(new T.HemisphereLight(0xcbdff0,0x797461,2.2));const sun=new T.DirectionalLight(0xfff1dd,3.1);sun.position.set(-8,13,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=sun.shadow.camera.bottom=-12;sun.shadow.camera.right=sun.shadow.camera.top=12;sun.shadow.normalBias=.02;scene.add(sun);
const plane=new T.Mesh(new T.PlaneGeometry(100,100),new T.MeshStandardMaterial({color:0x7d8175,roughness:1}));plane.rotation.x=-Math.PI/2;plane.position.y=-.035;plane.receiveShadow=true;scene.add(plane);let current=null;
const cases=[
 {id:'coastal-oak',title:'Coastal live oak · full crown',biome:'coastline',kind:0,lod:3},
 {id:'shore-pine',title:'Shore pine · full crown',biome:'coastline',kind:2,lod:3},
 {id:'tundra-High',title:'Black spruce · High tier',biome:'tundra',kind:0,lod:1},
 {id:'tundra-UltraPlus',title:'Black spruce · Ultra+ tier',biome:'tundra',kind:0,lod:3},
 {id:'mesquite',title:'Honey mesquite · full crown',biome:'desert',kind:1,lod:3},
 {id:'jungle-kapok',title:'Kapok · full crown',biome:'jungle',kind:1,lod:3},
 {id:'jungle-palm',title:'Royal palm · full crown',biome:'jungle',kind:0,lod:3},
 {id:'kapok-root',title:'Kapok · Blender trunk and buttress roots',biome:'jungle',kind:1,lod:3,closeRoot:true},
 {id:'grass-litter',title:'Close grass and fallen leaves',biome:'jungle',ground:true},
 {id:'fern-aroid',title:'Jungle fern and aroid',biome:'jungle',understory:true}
];
function model(c,version){const group=new T.Group(),trees=version==='before'?oldTrees:newTrees,plants=version==='before'?oldPlants:newPlants,ground=version==='before'?oldGround:newGround;
 if(c.ground){const res=ground.resources(c.biome),base=trees.resources(c.biome);for(let i=0;i<5;i++){const g=new T.Mesh(res.specs[0].geometry,res.specs[0].material);g.position.set((i-2)*.48,0,Math.sin(i*2.4)*.26);g.rotation.y=i*2.399;g.scale.setScalar(.8+(i%3)*.2);group.add(g);}for(let i=0;i<3;i++){const g=new T.Mesh(res.specs[1].geometry,res.specs[1].material);g.position.set((i-1)*.8,.005,.5);g.rotation.y=i*2;group.add(g);}const tuft=new T.Mesh(base.tuft.geometry,base.grass);tuft.position.set(-.4,0,-.5);group.add(tuft);}
 else if(c.understory){const res=plants.resources();for(const[k,x]of[[0,-.95],[2,.8]]){const g=res.shapes[k][1];for(const[geo,mat]of[[g.wood,res.wood],[g.leaf,res.leaf]]){const mesh=new T.Mesh(geo,mat);mesh.position.x=x;group.add(mesh);}}}
 else {const res=trees.resources(c.biome),g=trees.treeGeometry(c.biome,c.kind,c.lod);group.add(new T.Mesh(g.bark,res.bark));if(!c.closeRoot)group.add(new T.Mesh(g.leaves,res.leaves));}
 group.traverse(m=>{if(m.isMesh)m.castShadow=m.receiveShadow=true});return group;
}
const release=g=>g.traverse(m=>{if(m.isMesh&&!m.geometry.userData.artShared)m.geometry.dispose()});
function show(id,version){const c=cases.find(c=>c.id===id);if(current){scene.remove(current);release(current)}current=model(c,version);scene.add(current);const a=model(c,'before'),b=model(c,'after'),box=new T.Box3().setFromObject(a).union(new T.Box3().setFromObject(b)),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());release(a);release(b);if(c.closeRoot){camera.position.set(2.5,1.55,3.9);camera.lookAt(0,.8,0);}else{const fit=Math.max(size.y,size.x/(1280/900))*1.63,angle=(c.ground||c.understory)?.45:.2;camera.position.copy(center).add(new T.Vector3(fit*.30,fit*angle,fit));camera.lookAt(center);}document.getElementById('label').textContent=(version==='before'?'V8 reference':'V9 candidate')+' · '+c.title;renderer.render(scene,camera);let triangles=0;current.traverse(m=>{if(m.isMesh)triangles+=m.geometry.index.count/3});return {id,version,triangles,camera:camera.position.toArray(),target:c.closeRoot?[0,.8,0]:center.toArray(),renderer:{...renderer.info.render}};}
window.components={cases:cases.map(c=>c.id),show};show(cases[0].id,'before');
