import {wildlifeCatalog} from './wildlifeArt.js';
import {vehicles} from './vehiclePhysics.js';
const TClamp=(value,min,max)=>Math.max(min,Math.min(max,value));
// Manufacturer engine families inform these original synthesis profiles. Pulse
// weights, acoustic resonances and mixes are authored, not measured recordings.
const ENGINE_PROFILES={
 black:{name:'McLaren 720S · original twin-turbo V8 pulse model',cylinders:8,weights:[1,.79,.98,.80,1.02,.78,1,.81],width:.043,body:1.02,harmonic:.34,bass:.17,grit:.052,exhaustHz:420,exhaustOpen:2450,intakeHz:970,turbo:.048,bankHz:165},
 silver:{name:'Aston Martin DB12 · original twin-turbo V8 pulse model',cylinders:8,weights:[1,.58,.66,1.04,.60,.97,1.01,.61],width:.072,body:1.08,harmonic:.23,bass:.26,grit:.039,exhaustHz:285,exhaustOpen:1680,intakeHz:680,turbo:.035,bankHz:115},
 red:{name:'Koenigsegg Jesko Attack · original twin-turbo flat-plane V8 pulse model',cylinders:8,weights:[1,.97,1.02,.98,1.01,.96,1.03,.99],width:.031,body:1.00,harmonic:.43,bass:.13,grit:.043,exhaustHz:590,exhaustOpen:3700,intakeHz:1370,turbo:.42,bankHz:220},
 rally:{name:'Toyota GR Yaris · original turbo inline-three pulse model',cylinders:3,weights:[1,.88,1.06],width:.075,body:1.08,harmonic:.32,bass:.20,grit:.074,exhaustHz:400,exhaustOpen:2050,intakeHz:920,turbo:.061,bankHz:135},
 muscle:{name:'Ford Mustang GT · original cross-plane V8 pulse model',cylinders:8,weights:[1,.31,.45,1.03,.39,.86,.98,.35],width:.083,body:1.12,harmonic:.29,bass:.32,grit:.068,exhaustHz:245,exhaustOpen:2050,intakeHz:620,turbo:0,bankHz:90},
 roadster:{name:'Mazda MX-5 · original naturally aspirated inline-four pulse model',cylinders:4,weights:[1,.96,1.02,.97],width:.052,body:1.00,harmonic:.44,bass:.15,grit:.045,exhaustHz:410,exhaustOpen:2540,intakeHz:1160,turbo:0,bankHz:180},
 electric:{name:'Tesla Model S Plaid · original three-motor electromagnetic model',cylinders:0,weights:[],width:0,body:.73,harmonic:.14,bass:.11,grit:.024,exhaustHz:0,exhaustOpen:0,intakeHz:0,turbo:0,bankHz:0},
 safari:{name:'Defender P400 · original boosted inline-six pulse model',cylinders:6,weights:[1,.98,.96,1.02,1,.97],width:.093,body:1.14,harmonic:.23,bass:.29,grit:.043,exhaustHz:270,exhaustOpen:1420,intakeHz:610,turbo:.033,bankHz:105}
};
const waveCaches=new WeakMap();
function combustionWave(context,car,kind){
 let cache=waveCaches.get(context);if(!cache){cache=new Map();waveCaches.set(context,cache);}const key=`${car}/${kind}`;if(cache.has(key))return cache.get(key);
 const p=ENGINE_PROFILES[car],real=new Float32Array(193),imag=new Float32Array(193),width=p.width*(kind==='intake'?1.6:kind==='body'?3.8:1);
 for(let harmonic=1;harmonic<real.length;harmonic++){
  let re=0,im=0;
  for(let cylinder=0;cylinder<p.cylinders;cylinder++){
   const angle=Math.PI*2*harmonic*(cylinder/p.cylinders+(kind==='intake'?.18:0));
   const weight=kind==='intake'?.8+p.weights[(cylinder+1)%p.cylinders]*.2:p.weights[cylinder];
   re+=Math.cos(angle)*weight;im-=Math.sin(angle)*weight;
  }
  // Asymmetric exhaust pressure pulse plus a weaker delayed pressure return.
  const x=harmonic*width,attenuation=1/(1+x*x),pulseRe=(re+im*x)*attenuation,pulseIm=(im-re*x)*attenuation,reflection=harmonic*.093;
  real[harmonic]=(pulseRe+Math.cos(reflection)*pulseRe*.19-Math.sin(reflection)*pulseIm*.19)/p.cylinders;
  imag[harmonic]=(pulseIm+Math.sin(reflection)*pulseRe*.19+Math.cos(reflection)*pulseIm*.19)/p.cylinders;
  if(kind==='body'){const filter=1/(1+(harmonic/Math.max(2,p.cylinders*.7))**4);real[harmonic]*=filter;imag[harmonic]*=filter;}
 }
 const wave=context.createPeriodicWave(real,imag);cache.set(key,wave);return wave;
}
const RECORDING_SECONDS=660,CROSSFADE_SECONDS=6;
export class AudioEngine{
 constructor(){this.enabled=false;this.nature=false;this.car='black';this.biome='coastline';this.gear=1;this.layers={};this.recordings=[];this.recordingErrors=[];this.recordingRetryAfter={};this.recordingBase=new URL('audio/',document.baseURI).href;this.recordingCrossfades=0;}
 configure(car,biome){const next=vehicles[car]?car:'black',changed=next!==this.car;this.car=next;this.biome=biome;
  if(changed){this.previousGear=null;this.shiftDirection=null;this.poweredShiftUntil=0;this.lastDriverPedal=0;this.lastSpeed=null;this.lastDriveTime=null;this.lastAcceleration=0;this.shiftEvents=0;this.shiftSuppressedEvents=0;this.lastShift=null;this.lastShiftSuppression='car configuration';if(this.ctx){this.layers.shift.gain.gain.cancelScheduledValues(this.ctx.currentTime);this.layers.shift.gain.gain.setValueAtTime(0,this.ctx.currentTime);}}
  if(this.voices&&(changed||this.waveCar!==this.car)){
   if(this.car==='electric')for(const name of ['engine','harmonic','sub','top','coast'])this.layers[name].src.type='sine';
   else for(const [name,kind] of [['engine','exhaust'],['harmonic','intake'],['sub','body'],['top','exhaust'],['coast','body']])this.layers[name].src.setPeriodicWave(combustionWave(this.ctx,this.car,kind));
   this.waveCar=this.car;
  }
  if(this.ctx&&this.nature)this.ensureRecording();}
 unlock(){this.silenced=false;if(!this.ctx){const c=this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=c.createGain();this.master.gain.value=0;this.compressor=c.createDynamicsCompressor();Object.assign(this.compressor.threshold,{value:-12});this.compressor.knee.value=9;this.compressor.ratio.value=8;this.compressor.attack.value=.004;this.compressor.release.value=.18;this.limiter=c.createWaveShaper();this.limiter.curve=Float32Array.from({length:4096},(_,i)=>.95*Math.tanh((i/4095*2-1)*1.45));this.limiter.oversample='2x';this.analyser=c.createAnalyser();this.analyser.fftSize=2048;this.master.connect(this.compressor);this.compressor.connect(this.limiter);this.limiter.connect(this.analyser);this.analyser.connect(c.destination);this.samples=new Float32Array(2048);
 const buffer=c.createBuffer(1,752000,16000),a=buffer.getChannelData(0);let seed=998;for(let i=0;i<a.length;i++){seed=(seed*1664525+1013904223)>>>0;a[i]=((seed/4294967296)*2-1)*.45;}for(let i=0;i<1024;i++){const k=i/1023;a[a.length-1024+i]=a[a.length-1024+i]*(1-k)+a[i]*k;}a[a.length-1]=a[0];this.buffer=buffer;
 const layer=(name,freq=0,type='sine',filterHz=800)=>{const gain=c.createGain();gain.gain.value=0;gain.connect(this.master);let src;if(freq){src=c.createOscillator();src.type=type;src.frequency.value=freq;if(['engine','harmonic','sub','top','coast'].includes(name)){const filter=c.createBiquadFilter();filter.type=name==='harmonic'?'bandpass':'lowpass';filter.Q.value=name==='harmonic'?.75:.65;filter.frequency.value=name==='sub'?250:1800;src.connect(filter);filter.connect(gain);gain.filter=filter;}else src.connect(gain);}else{src=c.createBufferSource();src.buffer=buffer;src.loop=true;src.playbackRate.value=.82+Math.random()*.36;const filter=c.createBiquadFilter();filter.type=['turbo','intakeAir','mechanical'].includes(name)?'bandpass':'lowpass';filter.frequency.value=filterHz;filter.Q.value=.65;src.connect(filter);filter.connect(gain);gain.filter=filter;}src.start(0,freq?0:Math.random()*40);this.layers[name]={src,gain};return src;};
 this.voices=[layer('engine',90,'triangle'),layer('harmonic',180),layer('sub',45)];layer('grit',0,'sine',1700);layer('turbo',0,'sine',2500);layer('intakeAir',0,'sine',1100);layer('mechanical',0,'sine',750);layer('motorRear',640);layer('top',500);layer('coast',160);layer('brake',0,'sine',1800);layer('shift',0,'sine',900);layer('impact',45,'triangle');layer('wind',0,'sine',700);layer('ocean',0,'sine',450);layer('weather',0,'sine',2200);layer('rustle',0,'sine',2800);layer('rainLow',0,'sine',1100);layer('insectsA',5800);layer('insectsB',7300);layer('birds',2100);layer('animals',140,'triangle');layer('traffic',95,'triangle');layer('siren',700,'triangle');this.configure(this.car,this.biome);}
 if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});if(this.nature){this.ensureRecording();for(const record of this.recordings)this.playRecording(record,true);}}
 recordingError(record,error){const text=`${record.biome}: ${error?.message||error||'Audio loading failed'}`;record.error=text;if(!this.recordingErrors.includes(text))this.recordingErrors.push(text);this.recordingErrors=this.recordingErrors.slice(-8);}
 silence(){
  // Visibility changes may stop animation frames immediately. Silence both
  // transports synchronously instead of relying on the next fade/update tick.
  this.active=false;this.silenced=true;this.previousGear=null;this.shiftDirection=null;this.poweredShiftUntil=0;this.lastDriverPedal=0;this.lastSpeed=null;this.lastDriveTime=null;this.lastAcceleration=0;this.lastShiftSuppression='silenced';
  if(this.ctx){const t=this.ctx.currentTime;for(const param of [this.master.gain,this.layers.shift.gain.gain]){param.cancelScheduledValues(t);param.setValueAtTime(0,t);}}
  for(const record of this.recordings){record.playToken=(record.playToken||0)+1;record.pendingPlay=false;record.mix=0;record.audio.volume=0;record.audio.pause();}
  this.recordingTick=performance.now();this.engineTelemetry={...this.engineTelemetry,driverPedal:0,poweredShiftInterruption:false,shiftAllowed:false,shiftDirection:null,shiftCut:1,suppressionReason:'silenced',lastSuppressionReason:'silenced'};
 }
 playRecording(record,userGesture=false){
  if(this.silenced||record.audio.error||!record.audio.paused||record.pendingPlay)return;if(record.autoplayBlocked&&!userGesture)return;
  const token=record.playToken=(record.playToken||0)+1;record.pendingPlay=true;
  record.audio.play().then(()=>{
   // An older play() promise cannot undo a pause or overwrite a newer resume.
   if(token!==record.playToken){if(this.silenced){record.audio.volume=0;record.audio.pause();}return;}
   record.pendingPlay=false;record.autoplayBlocked=false;record.error=null;
  }).catch(error=>{if(token!==record.playToken)return;record.pendingPlay=false;record.autoplayBlocked=error.name==='NotAllowedError';this.recordingError(record,error);});
 }
 makeRecording(biome){
  // Direct HTML audio works with file:// without routing opaque-origin media
  // through WebAudio's CORS-sensitive MediaElementAudioSourceNode.
  const audio=new Audio(),record={audio,biome,duration:0,offset:0,loaded:false,error:null,mix:0,retiring:false,created:performance.now()};audio.preload='auto';audio.volume=0;audio.loop=false;audio.src=new URL(`${biome}.mp3`,this.recordingBase).href;
  audio.addEventListener('loadedmetadata',()=>{record.duration=audio.duration;record.offset=Math.random()*Math.max(0,audio.duration-90);try{audio.currentTime=record.offset;}catch(error){this.recordingError(record,error);}});
  audio.addEventListener('canplay',()=>{record.loaded=true;record.error=null;});audio.addEventListener('error',()=>{this.recordingRetryAfter[biome]=performance.now()+30000;this.recordingError(record,audio.error?.message||`Media error ${audio.error?.code||'unknown'}`);});
  this.recordings.push(record);audio.load();return record;
 }
 ensureRecording(force=false){
  const current=this.recordings.find(record=>!record.retiring&&record.biome===this.biome);
  if(current&&!force&&(!current.audio.error||performance.now()<(this.recordingRetryAfter[this.biome]||0)))return current;
  const next=this.makeRecording(this.biome);for(const record of this.recordings)if(record!==next)record.retiring=true;
  this.recordingCrossfades+=this.recordings.length>1?1:0;
  while(this.recordings.length>3){const stale=this.recordings.shift();stale.audio.pause();stale.audio.removeAttribute('src');stale.audio.load();}
  return next;
 }
 updateRecordings(active){
  const now=performance.now(),dt=Math.min(.15,Math.max(0,(now-(this.recordingTick||now))/1000));this.recordingTick=now;
  const wanted=active&&this.nature;if(wanted)this.ensureRecording();let current=this.recordings.find(record=>!record.retiring&&record.biome===this.biome);
  if(wanted&&current?.loaded&&current.duration-current.audio.currentTime<CROSSFADE_SECONDS+1){current=this.ensureRecording(true);}
  const replacementReady=!!current?.loaded&&!current.audio.paused;
  for(const record of [...this.recordings]){
   if(wanted&&(record===current||record.mix>.001))this.playRecording(record);
   const target=wanted&&(!record.retiring||!replacementReady)?1:0;
   record.mix=TClamp(record.mix+Math.sign(target-record.mix)*dt/(wanted?CROSSFADE_SECONDS:.22),0,1);
   // Equal-power fades keep long recording transitions from making a hole.
   record.audio.volume=.88*Math.sin(record.mix*Math.PI*.5);
   if(record.retiring&&record.mix<=.001&&replacementReady){record.audio.pause();record.audio.removeAttribute('src');record.audio.load();this.recordings.splice(this.recordings.indexOf(record),1);}
   else if(!wanted&&record.mix<=.001)record.audio.pause();
  }
  return !!current?.loaded&&!current.audio.paused&&current.audio.volume>.015;
 }
 impact(severity=1,kind='vehicle'){if(!this.ctx||!this.enabled)return;const c=this.ctx,t=c.currentTime,v=vehicles[this.car],strength=TClamp(Number(severity)||.1,.08,1.5),g=this.layers.impact.gain.gain;this.lastImpact={severity:strength,kind,time:t};this.ambientEvent(true);g.cancelScheduledValues(t);g.setValueAtTime((.45+v.mass/6500)*strength,t);const frequency=kind==='tree'?73:kind==='barrier'?96:45;this.layers.impact.src.frequency.setValueAtTime(frequency*(.75+v.timbre*.25),t);this.layers.impact.src.frequency.exponentialRampToValueAtTime(25,t+.22);g.exponentialRampToValueAtTime(.001,t+.18+strength*.30);
  const src=c.createBufferSource(),filter=c.createBiquadFilter(),burst=c.createGain();src.buffer=this.buffer;filter.type='bandpass';filter.frequency.value=kind==='tree'?540:kind==='barrier'?2100:1450;filter.Q.value=kind==='barrier'?3:.8;src.connect(filter);filter.connect(burst);burst.connect(this.master);burst.gain.setValueAtTime(.0001,t);burst.gain.exponentialRampToValueAtTime(.30*strength,t+.008);burst.gain.exponentialRampToValueAtTime(.0001,t+.22+strength*.19);src.start(t,Math.random()*35);src.stop(t+.75);src.onended=()=>{src.disconnect();filter.disconnect();burst.disconnect();};}
 update(speed,throttle,active,time,context={}){if(!this.ctx)return;if(active)this.silenced=false;this.active=active;const c=this.ctx,t=c.currentTime,v=vehicles[this.car],mph=Math.max(0,speed/1.609344),electric=this.car==='electric',rpm=Math.max(electric?0:400,Number.isFinite(context.rpm)?context.rpm:1300+mph*20),rawGear=Math.max(1,Math.round(context.gear||1)),gear=electric?1:rawGear;
 this.master.gain.setTargetAtTime(active&&(this.enabled||this.nature)?.88:0,t,.12);const gain=(n,x,tau=.10)=>this.layers[n].gain.gain.setTargetAtTime(x,t,tau),freq=(n,x)=>this.layers[n].src.frequency.setTargetAtTime(x,t,.055);const eng=this.enabled?1:0,recordingPlaying=this.updateRecordings(active),nat=this.nature?(recordingPlaying?.15:1):0;
 const elapsed=Number.isFinite(this.lastDriveTime)?time-this.lastDriveTime:0;
 if(elapsed<0){this.previousGear=null;this.shiftDirection=null;this.poweredShiftUntil=0;this.lastDriverPedal=0;this.lastSpeed=null;this.layers.shift.gain.gain.cancelScheduledValues(t);this.layers.shift.gain.gain.setValueAtTime(0,t);this.lastShiftSuppression='clock reset';}
 const inferred=elapsed>0&&this.lastSpeed!==null&&this.lastSpeed!==undefined?(mph-this.lastSpeed)/elapsed:(this.lastAcceleration||0),acceleration=Number.isFinite(context.acceleration)?context.acceleration:inferred;
 const pedal=TClamp(context.throttleAmount??(throttle?1:0),0,1),driverPedal=TClamp(context.driverThrottle??context.throttleAmount??(throttle?1:0),0,1),rawAccelerationNegative=acceleration<-.05,braking=!!context.braking;
 const gearChanged=this.previousGear!==null&&this.previousGear!==undefined&&gear!==this.previousGear,upshift=gearChanged&&gear>this.previousGear;
 // A legitimate powered upshift briefly loses speed while torque is cut. Admit
 // only a gear increase immediately preceded by driver-powered acceleration;
 // never use this exception for sustained deceleration, a downshift or release.
 if(!context.shifting||braking||driverPedal<=.03||gearChanged&&!upshift)this.poweredShiftUntil=0;
 if(!electric&&upshift&&context.shifting&&!braking&&driverPedal>.03&&(this.lastDriverPedal||0)>.03&&this.lastAcceleration>.05&&elapsed>=0&&elapsed<.15)this.poweredShiftUntil=t+Math.min(.65,Math.max(.10,v.shiftTime||.15)+.08);
 const poweredShiftInterruption=rawAccelerationNegative&&!!context.shifting&&!braking&&driverPedal>.03&&t<(this.poweredShiftUntil||0),decelerating=rawAccelerationNegative&&!poweredShiftInterruption;
 const shiftAllowed=!!active&&!!eng&&!electric&&driverPedal>.03&&!braking&&!decelerating;
 if(!context.shifting)this.shiftDirection=null;if(gearChanged)this.shiftDirection=upshift?'up':'down';
 const suppressReason=electric?'electric fixed drive':!active?'inactive':!eng?'vehicle audio disabled':braking?'braking':decelerating?'deceleration':driverPedal<=.03?'coasting or no driver pedal':gearChanged&&!upshift?'downshift':null;
 const shiftParam=this.layers.shift.gain.gain;
 if(!shiftAllowed||gearChanged&&!upshift){shiftParam.cancelScheduledValues(t);shiftParam.setValueAtTime(0,t);this.lastShiftSuppression=suppressReason;}
 if(gearChanged&&(!shiftAllowed||!upshift)){this.shiftSuppressedEvents=(this.shiftSuppressedEvents||0)+1;}
 if(upshift&&shiftAllowed){shiftParam.cancelScheduledValues(t);shiftParam.setValueAtTime(.29,t);shiftParam.exponentialRampToValueAtTime(.0001,t+.12);shiftParam.setValueAtTime(0,t+.14);this.shiftEvents=(this.shiftEvents||0)+1;this.lastShift={from:this.previousGear,to:gear,time:t,direction:'up',driverPedal,accelerationMphPerSecond:acceleration};this.lastShiftSuppression=null;}
 const profile=ENGINE_PROFILES[this.car],load=TClamp(context.load??pedal,0,1.4),cut=context.shifting&&shiftAllowed&&this.shiftDirection==='up'?.18:1,drive=(electric?.13:.16)+pedal*(electric?.51:.59)+Math.min(1,load)*.25;
 const flutter=1+Math.sin(t*29.1)*.0009+Math.sin(t*47.3+.7)*.00065+(1-Math.min(1,rpm/2200))*Math.sin(t*13.7)*.003;
 const cycle=Math.max(electric?0:3.33,rpm/120)*flutter,base=electric?Math.max(28,rpm/60*5.7):cycle,variation=.97+.018*Math.sin(t*3.71)+.012*Math.sin(t*6.13+.6);
 // Each combustion waveform spans a full four-stroke (720-degree) cycle.
 // Its cylinder-count pulse train, rather than oscillator labels, sets firing Hz.
 freq('engine',base);freq('harmonic',electric?base*2.003:cycle);freq('sub',electric?32+mph*.23:cycle);freq('top',electric?base*3.007:cycle);freq('coast',electric?base*.53:cycle);freq('motorRear',base*1.007);
 const running=electric?Math.min(1,mph/8+pedal*.5):1;
 gain('engine',eng*profile.body*drive*cut*variation*running);gain('harmonic',eng*profile.harmonic*(.12+pedal*.63+Math.min(1,load)*.25)*cut*running);gain('sub',eng*profile.bass*(.16+pedal*.79)*Math.sqrt(cut)*running);
 gain('grit',eng*profile.grit*(.12+pedal*.6+load*.28)*cut);gain('intakeAir',eng*(electric?.008:.052)*pedal*(.25+Math.min(1,rpm/6000)));gain('mechanical',eng*(electric?.019:.029)*(electric?Math.min(1,mph/35):.3+rpm/13000));gain('motorRear',eng*(electric?.105*pedal*running:0));
 const boost=profile.turbo*pedal*Math.max(0,(rpm-1300)/4300);gain('turbo',eng*Math.min(profile.turbo,boost),.32);this.layers.turbo.gain.filter.frequency.setTargetAtTime(1450+rpm*.19,t,.28);
 const open=TClamp(pedal*.75+load*.25,0,1),exhaustFilter=electric?3200:profile.exhaustHz+profile.exhaustOpen*open+rpm*.085;
 this.layers.engine.gain.filter.frequency.setTargetAtTime(exhaustFilter,t,.09);this.layers.harmonic.gain.filter.frequency.setTargetAtTime(electric?3300:profile.intakeHz+rpm*.075,t,.13);this.layers.sub.gain.filter.frequency.setTargetAtTime(electric?200:profile.bankHz+rpm*.017,t,.14);this.layers.top.gain.filter.frequency.setTargetAtTime(electric?5200:2800+rpm*.15,t,.13);this.layers.coast.gain.filter.frequency.setTargetAtTime(electric?1000:profile.exhaustHz+rpm*.042,t,.22);this.layers.grit.gain.filter.frequency.setTargetAtTime(420+rpm*.22+open*800,t,.15);this.layers.intakeAir.gain.filter.frequency.setTargetAtTime(electric?1600:profile.intakeHz+rpm*.09,t,.16);
 gain('top',eng*Math.max(0,mph/v.topMph-.68)*(electric?.11:.23)*pedal);gain('coast',eng*(1-pedal)*(electric?.07:.08)*Math.min(1,mph/14));gain('brake',eng*(braking?Math.min(.29,mph/500)*v.mass/1600:0));this.layers.brake.gain.filter.frequency.setTargetAtTime(1100*v.timbre,t,.2);this.layers.shift.gain.filter.frequency.setTargetAtTime(electric?900:profile.intakeHz*1.05,t,.2);
 this.gear=gear;this.previousGear=gear;this.lastSpeed=mph;this.lastDriveTime=time;this.lastAcceleration=acceleration;this.lastDriverPedal=driverPedal;this.engineTelemetry={cylinders:profile.cylinders,cycleHz:electric?0:cycle,firingHz:electric?0:cycle*profile.cylinders,motorOrderHz:electric?base:0,exhaustFilterHz:exhaustFilter,intakeResonanceHz:electric?0:profile.intakeHz+rpm*.075,driverPedal,throttleAmount:pedal,load,accelerationMphPerSecond:acceleration,rawAccelerationNegative,poweredShiftInterruption,decelerating,shiftAllowed,shiftDirection:this.shiftDirection||null,shiftCut:cut,shiftEvents:this.shiftEvents||0,suppressedShiftEvents:this.shiftSuppressedEvents||0,lastShift:this.lastShift||null,suppressionReason:suppressReason,lastSuppressionReason:this.lastShiftSuppression||null,waveform:electric?'Three continuous electromagnetic orders':'Original 192-harmonic combustion-cycle wavetables'};
 gain('wind',nat*(.035+mph/2200)*(1+.28*Math.sin(time*.137)+.17*Math.sin(time*.071)));gain('ocean',nat*(this.biome==='coastline'?.16*(.65+.20*Math.sin(time*.29)+.15*Math.sin(time*.173)):0),.25);gain('weather',nat*({coastline:.018,tundra:.035,desert:.06,jungle:.10}[this.biome]));
 this.layers.weather.gain.filter.frequency.setTargetAtTime({coastline:1200,tundra:450,desert:900,jungle:3400}[this.biome],t,.5);
 gain('birds',0);if(active&&this.nature&&t>(this.nextBird||0)){this.birdCall();this.nextBird=t+1.2+Math.random()*5;}if(active&&this.nature&&t>(this.nextAmbient||0)){this.ambientEvent();this.nextAmbient=t+2+Math.random()*7;}
 gain('animals',0);const gust=.70+.17*Math.sin(time*.109)+.13*Math.sin(time*.047+2);gain('rustle',nat*({coastline:.065,tundra:.018,desert:.009,jungle:.07}[this.biome])*gust,.65);gain('rainLow',nat*(this.biome==='jungle'?.08*(.8+.2*Math.sin(time*.079)):0),1.4);freq('insectsA',5800+Math.sin(time*7.9)*42);freq('insectsB',7300+Math.sin(time*11.3)*85);gain('insectsA',nat*({coastline:.002,tundra:0,desert:.012,jungle:.019}[this.biome])*(.65+.35*Math.sin(time*.21)**2),.4);gain('insectsB',nat*({coastline:0,tundra:0,desert:.006,jungle:.012}[this.biome])*(.55+.45*Math.sin(time*.137+2)**2),.4);
 const traffic=(context.traffic||[]).slice(0,8).reduce((n,o)=>n+Math.max(0,1-Math.abs(o.z)/70)*.018,0);freq('traffic',90+(context.traffic?.[0]?.mph||50)*1.6);gain('traffic',eng*Math.min(.14,traffic));freq('siren',720+Math.sin(time*5)*240);gain('siren',eng*(context.police?.14:0));this.rpm=rpm;this.lastContext=context;
 }
 ambientEvent(impact=false){const c=this.ctx,t=c.currentTime,settings=impact?[80,1.2,.25]:{coastline:[1700,3.7,.045],tundra:[4200,.13,.08],desert:[650,2.8,.045],jungle:[6200,1.8,.035]}[this.biome],src=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain(),pan=c.createStereoPanner();src.buffer=this.buffer;filter.type=impact?'lowpass':'bandpass';filter.frequency.value=settings[0]*(.7+Math.random()*.6);filter.Q.value=impact?.5:1.4;pan.pan.value=impact?0:Math.random()*1.8-.9;src.connect(filter);filter.connect(g);g.connect(pan);pan.connect(this.master);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(settings[2],t+.025);g.gain.exponentialRampToValueAtTime(.0001,t+settings[1]);src.start(t,Math.random()*35);src.stop(t+settings[1]+.05);src.onended=()=>{src.disconnect();filter.disconnect();g.disconnect();pan.disconnect()};}
 birdCall(){const bank={coastline:[[1100,650,.85,'sawtooth',3],[2400,3200,.18,'sine',4],[260,175,.27,'triangle',3]],tundra:[[420,320,.7,'sine',2],[2900,1900,.12,'sine',5],[640,480,.19,'triangle',5]],desert:[[2200,1150,.75,'sawtooth',1],[540,330,.28,'triangle',3],[470,390,.65,'sine',3]],jungle:[[1200,700,.46,'sawtooth',3],[850,1240,.18,'triangle',5],[620,430,.4,'triangle',2]]};const species=Math.floor(Math.random()*bank[this.biome].length),[a,b,d,type,n]=bank[this.biome][species],c=this.ctx,pan=c.createStereoPanner();pan.pan.value=Math.random()*1.8-.9;pan.connect(this.master);this.lastBird={biome:this.biome,species,name:wildlifeCatalog[this.biome].birds[species],a,b,d,type,n,pan:pan.pan.value};for(let i=0;i<n;i++){const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+i*(d+.08);o.type=type;o.frequency.setValueAtTime(a,t);o.frequency.exponentialRampToValueAtTime(b,t+d*.8);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.015+Math.random()*.018,t+.025);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(pan);o.start(t);o.stop(t+d+.02);o.onended=()=>{o.disconnect();g.disconnect();if(i===n-1)pan.disconnect()};}}
 state(){if(this.analyser)this.analyser.getFloatTimeDomainData(this.samples);const rms=this.samples?Math.sqrt(this.samples.reduce((n,x)=>n+x*x,0)/this.samples.length):0,peak=this.samples?this.samples.reduce((n,x)=>Math.max(n,Math.abs(x)),0):0,current=this.recordings.find(record=>!record.retiring&&record.biome===this.biome),playing=this.recordings.some(record=>record.loaded&&!record.audio.paused&&record.audio.volume>.015);return {unlocked:!!this.ctx,state:this.ctx?.state,enabled:this.enabled,nature:this.nature,car:this.car,biome:this.biome,lastBird:this.lastBird,lastImpact:this.lastImpact,engineProfile:ENGINE_PROFILES[this.car].name,engineDynamics:{...this.engineTelemetry,lastSpeedMph:this.lastSpeed??null,lastAccelerationMphPerSecond:this.lastAcceleration??0},engineSource:'Original procedural approximation; not a recorded real-car engine',soundscape:{coastline:'surf wash, tree wind, leaf rustle, gulls/terns/cormorants',tundra:'ice wind, crackles, owls/buntings/ptarmigan',desert:'dry wind, insects, hawks/ravens/doves',jungle:'rain, foliage, insects, macaws/toucans/herons'}[this.biome],signature:`${this.car}/${ENGINE_PROFILES[this.car].cylinders}/${vehicles[this.car].timbre}/${this.biome}`,rpm:this.rpm||0,gear:this.gear,rms,peak,limiter:{type:'Dynamics compression and oversampled tanh soft limiting',compressionDb:this.compressor?.reduction||0,digitalClipSamples:this.samples?this.samples.reduce((n,x)=>n+(Math.abs(x)>=.999?1:0),0):0},layers:Object.fromEntries(Object.entries(this.layers).map(([n,l])=>[n,l.gain.gain.value])),recording:{source:'Original procedural 11-minute recordings; no downloaded audio',transport:'Local HTMLAudio playback; independent of WebAudio CORS',expectedDurationSeconds:RECORDING_SECONDS,durationSeconds:current?.duration||0,offsetSeconds:current?.offset||0,loaded:!!current?.loaded,playing,crossfadeSeconds:CROSSFADE_SECONDS,crossfades:this.recordingCrossfades,fallbackActive:!!this.active&&this.nature&&!playing,errors:[...this.recordingErrors],tracks:this.recordings.map(record=>({biome:record.biome,durationSeconds:record.duration,offsetSeconds:record.offset,currentTime:record.audio.currentTime,loaded:record.loaded,paused:record.audio.paused,volume:record.audio.volume,retiring:record.retiring,error:record.error}))},loopSeconds:current?.loaded?current.duration:this.buffer?.duration||0,fallbackLoopSeconds:this.buffer?.duration||0,looping:playing||!!this.buffer,seamJump:this.buffer?Math.abs(this.buffer.getChannelData(0)[0]-this.buffer.getChannelData(0).at(-1)):0};}
}
