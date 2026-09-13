const fs=require('fs'),path=require('path'),crypto=require('crypto');
const folder=__dirname,root=path.resolve(folder,'../..');
for(const [file,exports] of [['treePacks.js','treeGeometry,tuftGeometry,resources'],['sceneryUnderstory.js','plant,resources'],['ultraScenery8.js','blades,resources']]){
 const source=fs.readFileSync(path.resolve(folder,'../engine-v9',file),'utf8');
 fs.writeFileSync(path.join(folder,'after-'+file),source.replaceAll("from './","from '../engine-v9/")+`\nexport {${exports}};\n`);
}
const hashes=JSON.parse(fs.readFileSync(path.join(folder,'v8-preservation-hashes.json'),'utf8'));
for(const h of hashes){h.currentSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,h.path))).digest('hex');h.unchanged=h.sha256===h.currentSha256;}
fs.writeFileSync(path.join(folder,'v8-preservation-check.json'),JSON.stringify({passed:hashes.every(h=>h.unchanged),files:hashes},null,2));
if(hashes.some(h=>!h.unchanged))throw Error('V8 changed');
console.log('Candidate exports prepared; all 5 v8 source hashes unchanged.');
const integrated=fs.readFileSync(path.resolve(folder,'../scenery-v8-entry.js'),'utf8').replace("'./engine/node_modules/three/build/three.module.js'","'three'").replaceAll("'./engine/","'../engine-v9/");
fs.writeFileSync(path.join(folder,'integrated-entry.js'),integrated);
