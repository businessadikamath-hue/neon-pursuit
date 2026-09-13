const fs=require('fs'),path=require('path'),base=path.resolve(__dirname,'..');
let qa=fs.readFileSync(path.join(base,'wildlife-v8-detail-qa.mjs'),'utf8').replace("'./engine/node_modules/three/build/three.module.js'","'three'").replaceAll("'./engine/","'../engine-v9/").replaceAll('work/wildlife-assets-v8/','work/wildlife-assets-v9/');
fs.writeFileSync(path.join(__dirname,'detail-qa.mjs'),qa);
for(const version of['v8','v9']){
 let ex=fs.readFileSync(path.join(base,'wildlife-v8-export-gallery.mjs'),'utf8').replace("'./engine/node_modules/three/build/three.module.js'","'three'").replaceAll("'./engine/",version==='v8'?"'../engine/":"'../engine-v9/").replace('work/wildlife-assets-v8/assembled-gallery.json.gz','work/wildlife-assets-v9/assembled-'+version+'.json.gz');
 fs.writeFileSync(path.join(__dirname,'export-'+version+'.mjs'),ex);
}
let br=fs.readFileSync(path.join(base,'wildlife-v8-browser-entry.js'),'utf8').replaceAll("'./engine/","'../engine-v9/");fs.writeFileSync(path.join(__dirname,'browser-entry.js'),br);
let bq=fs.readFileSync(path.join(base,'wildlife-v8-browser-qa.cjs'),'utf8').replace('wildlife-v8-browser.html','browser.html').replaceAll("'wildlife-assets-v8',",'').replaceAll("'wildlife-assets-v8/browser-qa.json'","'browser-qa.json'");fs.writeFileSync(path.join(__dirname,'browser-qa.cjs'),bq);
fs.writeFileSync(path.join(__dirname,'browser.html'),'<!doctype html><meta charset="utf-8"><title>Wildlife v9 actual source fixture</title><style>body{margin:0;overflow:hidden}</style><script src="browser.js"></script>');
let render=fs.readFileSync(path.join(base,'wildlife-v8-render-gallery.py'),'utf8').replace("OUT=os.path.join(ROOT,'wildlife-assets-v8')","OUT=ROOT\nVERSION=sys.argv[sys.argv.index('--version')+1] if '--version' in sys.argv else 'v9'").replace("'assembled-gallery.json.gz'","'assembled-'+VERSION+'.json.gz'").replace("'assembled-'+view+'.png'","'assembled-'+VERSION+'-'+view+'.png'").replace("'assembled-wildlife-review-v8.blend'","'assembled-'+VERSION+'-review.blend'");fs.writeFileSync(path.join(__dirname,'render-gallery.py'),render);
console.log('Prepared scoped copies of established v8 fixtures.');
