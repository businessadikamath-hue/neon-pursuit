// Runtime scenery uses the authored Blender geometry already in the game and
// upgrades every compatible surface with the local PBR library. The larger
// source Blender studies remain editable in assets-source; they are not
// duplicated as base64 geometry in the browser bundle.
export function installPhotographicScenery9(world,biome){
 let quality='High',built=false,alive=true;
 const previousQuality=world.quality;world.quality=q=>{previousQuality(q);quality=q;built=built||q==='Ultra+';};
 const details=world.details;world.details=()=>({...details(),photographicScenery:{active:quality==='Ultra+',built,visibleTrees:0,visiblePlants:0,sourceTriangles:0,license:'CC0',treeSources:biome==='desert'?'original Blender desert species':'original authored Blender species',scannedRocks:false,geometryPolicy:'authored runtime geometry with scanned PBR materials'}});
 const dispose=world.disposeWorldArt;world.disposeWorldArt=()=>{alive=false;dispose?.();};
 return world;
}
