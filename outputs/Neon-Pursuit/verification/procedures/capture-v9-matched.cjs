const {chromium}=require('C:/Users/adika/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const stage=path.resolve(process.argv[2]||'outputs/Neon-Pursuit'),label=process.argv[3]||'before',out=path.resolve('work/graphics-v9',label);fs.mkdirSync(out,{recursive:true});
const report={label,stage,gameSHA256:crypto.createHash('sha256').update(fs.readFileSync(path.join(stage,'game.js'))).digest('hex'),scope:'Matched actual game renderer/postprocessing: seeded scene, fixed simulation pose/time, identical camera, resolution and controls; no performance inference',cases:[],errors:[],external:[]};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const biome of (process.argv[4]?process.argv[4].split(','):['coastline','tundra','desert','jungle'])){
 const ctx=await browser.newContext({viewport:{width:1440,height:900}});await ctx.addInitScript(({biome})=>{
 let seed=73191;Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};Object.defineProperty(crypto,'getRandomValues',{value:a=>{for(let i=0;i<a.length;i++)a[i]=70821+i;return a;}});
 localStorage.setItem('neon-4-settings',JSON.stringify({car:'black',day:'afternoon',environment:biome,quality:'Game Only',fpsCap:60,units:'mph',zen:true,nature:false,sound:false,trafficOff:true,adaptiveQuality:false,laneAssist:true,geography:false}));
 const native=requestAnimationFrame.bind(window);window.__matchTime=null;window.requestAnimationFrame=cb=>native(t=>cb(window.__matchTime??t));
 },{biome});const p=await ctx.newPage();p.setDefaultTimeout(180000);p.on('pageerror',e=>report.errors.push({biome,message:e.message}));p.on('console',m=>{if(m.type()==='error')report.errors.push({biome,message:m.text()})});p.on('request',r=>{if(/^https?:/.test(r.url()))report.external.push(r.url())});
 await p.goto('file:///'+path.join(stage,'index.html').replaceAll('\\','/')+'#qa',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.neon?.test);await p.click('#start');
 for(const quality of (process.argv[5]?process.argv[5].split(','):['High','Ultra+'])){
 await p.click('#pause');await p.selectOption('#qualitySelect',quality);if(quality==='Ultra+')await p.click('#qualityConfirm');await p.click('#start');
 await p.waitForFunction(()=>!neon.getState().details.photographicAssets?.pending,null,{timeout:180000});
 const views=[['drive',{position:[7,3.2,9.2],target:[2,.75,-12],fov:50}],['road',{position:[-7,.85,7],target:[-6,.02,-8],fov:50}]];
 if(biome==='coastline'&&quality==='Ultra+')views.push(['shore',{position:[-31,.65,-15],target:[-78,-3,-100],fov:54}]);
 for(const [name,view] of views){await p.evaluate(view=>{window.__matchTime=performance.now();neon.test.setKeys(['ArrowDown']);const pose={time:12,travel:240,distance:240,speed:0,x:2,yaw:0,pitch:0,steer:0,lateralV:0,slip:0,throttle:0,gear:1,rpm:850,shiftRemaining:0,score:0,near:0,passed:0,health:100,trauma:0};neon.test.set(pose);neon.test.step(2);neon.test.set(pose);neon.test.view(view);neon.test.refreshReflections();},view);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r)))));await p.screenshot({path:path.join(out,biome+'-'+quality.replace('+','Plus')+'-'+name+'.png'),timeout:180000});report.cases.push({biome,quality,name,view,state:await p.evaluate(()=>neon.getState())});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
 }await ctx.close();console.log(label+' '+biome+' matched captures complete');
 }
 assert(report.errors.length===0&&report.external.length===0);report.passed=true;
 }finally{await browser.close();report.browserClosed=true;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}})().catch(e=>{console.error(e);process.exitCode=1});
