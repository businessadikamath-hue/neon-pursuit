const {chromium}=require('C:/Users/adika/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{const out=path.join(__dirname,'gallery'),browser=await chromium.launch({channel:'msedge',headless:true,args:['--allow-file-access-from-files']});const errors=[],details=[];try{
 const page=await browser.newPage({viewport:{width:1600,height:1840}});page.on('pageerror',e=>errors.push(e.message));await page.goto('file:///'+path.join(out,'index.html').replaceAll('\\','/'));await page.waitForFunction(()=>window.galleryReady);
 for(const version of ['v8','v9']){
  for(const [name,rear,npc] of [['front',false,false],['rear',true,false],['traffic',false,true],['traffic-rear',true,true]]){
   await page.setViewportSize({width:1600,height:1840});await page.evaluate(({version,rear,npc})=>{window.setVersion(version);window.setCarBatching(true);window.vehicleQuality='Ultra+';window.drawGallery(rear,npc);},{version,rear,npc});await page.screenshot({path:path.join(out,version+'-'+name+'.png')});
  }
  for(const [name,id,far,npc] of [['black-close','black',false,false],['black-far','black',true,false],['silver-close','silver',false,false],['traffic-close',3,false,true]]){
   await page.setViewportSize({width:1600,height:1100});details.push({version,name,...await page.evaluate(args=>window.drawDetail(...args),[id,'Ultra+',far,npc])});await page.screenshot({path:path.join(out,version+'-'+name+'.png')});
  }
 }
 for(const [name,rear,npc] of [['front',false,false],['rear',true,false],['traffic',false,true],['traffic-rear',true,true]]){
  await page.setViewportSize({width:1600,height:1840});await page.evaluate(({rear,npc})=>{window.setVersion('v9');window.setCarBatching(false);window.vehicleQuality='Ultra+';window.drawGallery(rear,npc);},{rear,npc});await page.screenshot({path:path.join(out,'v9-unbatched-'+name+'.png')});
 }
 fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify({passed:errors.length===0,errors,captures:20,details,fixture:'Identical camera, light, renderer, quality, viewport, and environment; actual installed v8 versus staged v9 source'},null,2));if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({passed:true,captures:20,details}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
