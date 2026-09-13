// Bounded v9 source transformation from the untouched v8 model baseline.
const fs=require('fs'),path=require('path');
const dir=path.resolve(__dirname,'../engine-v9');
let source=fs.readFileSync(path.join(dir,'models.js'),'utf8');
const replace=(a,b)=>{if(!source.includes(a))throw Error('Missing expected v8 source: '+a.slice(0,80));source=source.replace(a,b);};
replace("import {attachVehicleDetailTier} from './vehicleDetailTier.js';","import {attachVehicleDetailTier} from './vehicleDetailTier.js';\nimport {fittedCanopy} from './vehicleCanopyV9.js';");
replace('color:0x111518,roughness:.84','color:0x0d1012,roughness:.89');
replace('color:0x12181c,metalness:.38,roughness:.34','color:0x101417,metalness:.12,roughness:.45');
replace('color:0xadb4b8,metalness:1,roughness:.26','color:0x90979d,metalness:1,roughness:.31');
replace('color:0x172128,metalness:.15,roughness:.54','color:0x080c0e,metalness:0,roughness:.72');
replace('color:0x12232b,metalness:0,roughness:.09','color:0x192328,metalness:0,roughness:.045');
replace('clearcoat:.35,clearcoatRoughness:.045,envMapIntensity:1.25,transparent:true,opacity:.87','clearcoat:.15,clearcoatRoughness:.035,envMapIntensity:.92,transparent:true,opacity:.77');
replace('emissiveIntensity:1.6,toneMapped:false','emissiveIntensity:.75,toneMapped:true');
replace('emissiveIntensity:1.25,toneMapped:false','emissiveIntensity:.65,toneMapped:true');
replace('trim.map=weave;trim.bumpMap=weave;trim.bumpScale=.0015;','trim.bumpMap=weave;trim.bumpScale=.00035;');
replace('rubber.normalScale=new T.Vector2(.15,.15)','rubber.normalScale=new T.Vector2(.055,.055)');
replace("new T.TubeGeometry(curve,points.length-1,.0024,4,false)","new T.TubeGeometry(curve,points.length-1,.0015,4,false)");
replace("g.userData.bodySource='Original Blender-modeled body'","g.userData.bodySource='Original Blender continuous-surface body v9'");
replace("metalness:def.id==='safari'?.29:.48,roughness:def.id==='safari'?.34:.22","metalness:def.id==='safari'?.18:.34,roughness:def.id==='safari'?.34:.24");
source=source.replaceAll('normalScale:new T.Vector2(.022,.022)','normalScale:new T.Vector2(.006,.006)').replaceAll('paint.normalScale=new T.Vector2(.022,.022)','paint.normalScale=new T.Vector2(.006,.006)');
const canopyStart=source.indexOf(' loft(g,p.cabin,glass);'),canopyEnd=source.indexOf('\nfunction finishBody',canopyStart);
if(canopyStart<0||canopyEnd<0)throw Error('Canopy boundaries missing');
source=source.slice(0,canopyStart)+' fittedCanopy(g,p,paint,glass,trim,cabinSection);}\n'+source.slice(canopyEnd);
replace("for(const z of p.axles){const arch=new T.Mesh(new T.TorusGeometry(p.radius+.05,.028,7,32,Math.PI),def.id==='safari'||def.id==='rally'?trim:paint);arch.rotation.y=Math.PI/2;arch.position.set(side*(w-.018),p.radius,z);arch.castShadow=true;g.add(arch)}","if(def.id==='safari'||def.id==='rally')for(const z of p.axles){const arch=new T.Mesh(new T.TorusGeometry(p.radius+.05,.016,8,48,Math.PI),trim);arch.rotation.y=Math.PI/2;arch.position.set(side*(w-.025),p.radius,z);arch.castShadow=true;g.add(arch)}");
// Sculpted Blender surfaces now provide the hood creases; these raised tubes
// were decorative overlays that produced the metallic-wire appearance.
for(const pattern of [
 'line(g,[[side*.37,.635,-1.94],[side*.45,.712,-1.42],[side*.47,.688,-.86]],.008,paint);',
 'line(g,[[side*.40,.735,-2.19],[side*.48,.817,-1.51],[side*.40,.822,-.56]],.0075,paint);',
 'line(g,[[side*.44,.715,-2.38],[side*.5,.844,-1.62],[side*.44,.80,-.54]],.010,paint);'
])replace(pattern,'');
replace('metalness:.38,roughness:.27,clearcoat:1','metalness:.27,roughness:.29,clearcoat:1');
source=source.replaceAll('artRevision:10','artRevision:11');
fs.writeFileSync(path.join(dir,'models.js'),source);
let tier=fs.readFileSync(path.join(dir,'vehicleDetailTier.js'),'utf8');
tier=tier.replace('procedural detail v8 Ultra+','procedural detail v9 Ultra+').replace('color:0x879098,metalness:.95,roughness:.28','color:0x687078,metalness:.95,roughness:.36').replace('color:0xaeb8be,metalness:1,roughness:.23','color:0x90999f,metalness:1,roughness:.31').replace('rubberHero.normalScale.set(.07,.07)','rubberHero.normalScale.set(.035,.035)').replace('heroPaint.normalScale.set(.022,.022)','heroPaint.normalScale.set(.006,.006)').replace('new T.Vector2(.018,.018)','new T.Vector2(.003,.003)');
fs.writeFileSync(path.join(dir,'vehicleDetailTier.js'),tier);
for(const name of ['validate-ultraplus.mjs','validate-body-assets.mjs','validate-models.mjs']){const file=path.join(__dirname,name);fs.writeFileSync(file,fs.readFileSync(file,'utf8').replaceAll('../engine/','../engine-v9/'));}
console.log('Refined v9 runtime model surfaces and materials.');
