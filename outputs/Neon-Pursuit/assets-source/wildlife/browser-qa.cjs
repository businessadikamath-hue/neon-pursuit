const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require('C:/Users/adika/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1440,height:900}}),report={passed:false,rows:[],errors:[],externalRequests:[]};page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))report.externalRequests.push(r.url());});
try{
 await page.goto(pathToFileURL(path.join(__dirname,'browser.html')).href);await page.waitForFunction(()=>window.wildlifeFixture);
 for(const biome of ['coastline','tundra','desert','jungle']){
  await page.evaluate(b=>wildlifeFixture.build(b),biome);
  for(const quality of ['High','Ultra+','Game Only','Low','Ultra','Ultra+']){
   const r=await page.evaluate(q=>wildlifeFixture.set(q,100,6),quality),d=r.details.wildlifeUltraDetail;
   assert.equal(d.active,quality==='Ultra+');assert(d.transportAgreement);
   if(quality==='Ultra+'){assert(d.closeSubjects>0);assert(d.groundRouteBound);assert(d.airUnbent);assert(await page.evaluate(()=>wildlifeFixture.matrices()));for(const b of r.extra)if(b.space==='ground')assert(b.depthKey?.includes(':route-art-'));}
   else {assert.equal(r.rootVisible,false);assert.equal(r.airRootVisible,false);assert.equal(d.extraBatches,0);for(const b of r.extra){assert.equal(b.count,0);assert.equal(b.visible,false);}}
   if(quality==='Game Only'){assert.equal(r.details.wildlife,0);assert.equal(r.details.birds,0);assert.equal(r.hazards.length,0);}
   for(const h of r.hazards){assert(h.render);assert(Math.abs(h.x-h.render.x)<1e-5);assert(Math.abs(h.z-h.render.z)<1e-5);}
   report.rows.push({biome,quality,detail:d,hazards:r.hazards,draw:r.draw});
  }
  const far=await page.evaluate(()=>wildlifeFixture.far());assert.equal(far.details.wildlifeUltraDetail.closeSubjects,0);assert(far.extra.every(b=>b.count===0&&!b.visible));report.rows.push({biome,quality:'Ultra+ far',detail:far.details.wildlifeUltraDetail});
  await page.screenshot({path:path.join(__dirname,`browser-${biome}-far.png`)});
  await page.evaluate(()=>wildlifeFixture.set('Ultra+',100,6));
  for(const type of ['ground','bird']){await page.evaluate(t=>wildlifeFixture.focus(t),type);await page.screenshot({path:path.join(__dirname,`browser-${biome}-${type}-close.png`)});}
 }
 // Walk an actual moving junction through the crossing region and verify
 // all reported collision hazards keep the exact rendered center coordinates.
 let activeHazards=0;for(const [distance,time]of [[100,.3],[100,27.3],[280,12],[650,23],[2873,123.45]]){const r=await page.evaluate(([d,t])=>wildlifeFixture.set('Ultra+',d,t),[distance,time]);assert(r.details.wildlifeUltraDetail.transportAgreement);for(const h of r.hazards){activeHazards++;assert(h.render);assert(Math.abs(h.x-h.render.x)<1e-5);assert(Math.abs(h.z-h.render.z)<1e-5);}}
 assert(activeHazards>0);report.activeHazardsVerified=activeHazards;assert.equal(report.errors.length,0);assert.equal(report.externalRequests.length,0);report.passed=true;
}catch(error){report.failure=error.stack;process.exitCode=1;}finally{await browser.close();fs.writeFileSync(path.join(__dirname,'browser-qa.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,rows:report.rows.length,errors:report.errors,externalRequests:report.externalRequests,failure:report.failure},null,2));}})();
