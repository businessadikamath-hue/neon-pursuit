import * as T from 'three';
import {photoSurface9} from './photoResources9.js';

// Final presentation pass for the surfaces that remain visible behind the
// close vehicle and vegetation layers.  The game keeps authored geometry, but
// the distant terrain now receives the same correlated colour, normal and
// roughness treatment as the road and shoreline.
const hillKind={coastline:'rock',tundra:'snow',desert:'sand',jungle:'rock'};
const biomeTint={coastline:0x76847d,tundra:0xd0dbe0,desert:0xb18b61,jungle:0x637660};

function patchMaterial(mat,biome){
  if(mat.userData.qualityPass10)return mat;
  const previous=mat.onBeforeCompile;
  mat.onBeforeCompile=shader=>{
    previous?.(shader);
    shader.vertexShader='varying vec3 qualityTerrainPosition10;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nqualityTerrainPosition10=position;');
    shader.fragmentShader='varying vec3 qualityTerrainPosition10;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      float strata10=sin(qualityTerrainPosition10.x*.071+qualityTerrainPosition10.z*.037)*sin(qualityTerrainPosition10.z*.113-qualityTerrainPosition10.x*.021);
      diffuseColor.rgb*=1.0+strata10*.018;
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor=clamp(roughnessFactor+strata10*.012,0.0,1.0);
    `);
  };
  mat.customProgramCacheKey=()=>`quality-pass-10-${biome}`;
  mat.userData.qualityPass10=true;
  return mat;
}

export function installQualityPass10(world,renderer,biome){
  if(!world||world.qualityPass10)return world;
  world.qualityPass10=true;
  let current=world.preset||'High';
  const entries=[];
  const kind=hillKind[biome]||'rock';
  world.hills?.traverse?.(object=>{
    if(!object.isMesh)return;
    const material=new T.MeshStandardMaterial({
      color:biomeTint[biome]||0x758078,
      vertexColors:true,
      roughness:biome==='tundra'?.92:biome==='desert'?.97:.94,
      metalness:0,
      fog:true,
    });
    patchMaterial(material,biome);
    object.material=material;
    object.receiveShadow=true;
    object.castShadow=false;
    entries.push({object,material});
  });
  function apply(name){
    current=name;
    const maps=photoSurface9(kind,name==='Ultra+');
    for(const entry of entries){
      const m=entry.material;
      if(maps){
        m.map=name==='Game Only'||name==='Low'?null:maps.map;
        m.normalMap=name==='Game Only'||name==='Low'?null:maps.normalMap;
        m.roughnessMap=name==='Game Only'||name==='Low'?null:maps.roughnessMap;
        m.normalScale.set(biome==='desert'?.24:biome==='tundra'?.17:.30,biome==='desert'?.24:biome==='tundra'?.17:.30);
        if(m.map)m.map.anisotropy=Math.min(name==='Ultra+'?16:name==='Ultra'?8:4,renderer.capabilities.getMaxAnisotropy());
      }
      m.needsUpdate=true;
    }
  }
  const previousQuality=world.quality;
  world.quality=name=>{const result=previousQuality?.call(world,name);apply(name);return result;};
  const previousDetails=world.details;
  world.details=()=>({...previousDetails?.call(world),qualityPass10:{active:current!=='Game Only',terrainMaterial:entries.length?'scanned colour, normal and roughness':'none',hillMeshes:entries.length,distantTerrainResolution:'96 x 64 displaced mesh',nearTerrainResolution:'160 x 80 heightfield',surfaceKind:kind}});
  apply(current);
  return world;
}
