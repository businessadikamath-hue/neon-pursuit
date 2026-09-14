import {realCarSpecs} from './realCarSpecs.js';
const MPH_TO_MS=.44704,G=9.80665,TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// Gearing, torque curves, traction and aero are authored approximations.
// efficiency is a calibrated delivered-power factor, not a measured driveline loss.
const tuning={
 black:{grip:1.05,response:7.8,stability:.84,timbre:1,shape:'hypercar',ranks:[9,10,8,10,7],tradeoff:'Very fast at high speed; rear-drive traction and low clearance demand care.',gearSpeeds:[57,86,117,147,177,203,236],redline:8200,idleRpm:850,torquePeak:5500,shiftTime:.12,traction:10.3605,efficiency:.7740,dragArea:.56,rolling:.011,launchRpm:3900,brakeScale:1},
 silver:{grip:1.00,response:6.4,stability:1.04,timbre:.75,shape:'grand tourer',ranks:[8,9,7,8,9],tradeoff:'Calm high-speed GT; extra weight slows direction changes.',gearSpeeds:[47,74,101,127,153,179,208,244],redline:7000,idleRpm:750,torquePeak:4000,shiftTime:.20,traction:8.3777,efficiency:.89,dragArea:.64,rolling:.012,launchRpm:3000,brakeScale:1},
 red:{grip:1.17,response:9.2,stability:.79,timbre:1.32,shape:'Jesko Attack hypercar',ranks:[9,8,10,10,6],tradeoff:'Track-focused aero and instant LST response; the game cap remains separate from Koenigsegg published data.',gearSpeeds:[48,72,98,124,151,180,211,244,278],redline:8500,idleRpm:1000,torquePeak:5100,shiftTime:.08,traction:10.3386,efficiency:.8450,dragArea:.62,rolling:.010,launchRpm:4400,brakeScale:1},
 rally:{grip:1.02,response:8.4,stability:1.12,timbre:1.55,shape:'rally hatch',ranks:[5,3,9,8,10],tradeoff:'Compact AWD grip and rough-road traction; much lower high-speed power.',gearSpeeds:[39,61,89,115,141,170],redline:7200,idleRpm:850,torquePeak:3800,shiftTime:.32,traction:6.2974,efficiency:.88,dragArea:.72,rolling:.013,launchRpm:3300,brakeScale:1},
 muscle:{grip:.86,response:5.8,stability:.66,timbre:.5,shape:'long-hood muscle',ranks:[6,5,5,6,4],tradeoff:'Strong V8 response; heavy rear-drive chassis needs measured steering.',gearSpeeds:[43,68,91,108,125,149,177,204,226,255],redline:7500,idleRpm:750,torquePeak:4900,shiftTime:.22,traction:6.1724,efficiency:.88,dragArea:.80,rolling:.013,launchRpm:3400,brakeScale:1},
 roadster:{grip:1.00,response:9.5,stability:.93,timbre:1.75,shape:'open roadster',ranks:[3,2,10,7,8],tradeoff:'Light and responsive; least power and an exposed, modest top end.',gearSpeeds:[37,69,91,116,142,171],redline:7500,idleRpm:850,torquePeak:4000,shiftTime:.34,traction:5.2671,efficiency:.90,dragArea:.64,rolling:.013,launchRpm:3100,brakeScale:1},
 electric:{grip:1.04,response:6.0,stability:1.02,timbre:2.2,shape:'electric fastback',ranks:[10,9,6,8,9],tradeoff:'Exceptional AWD launch; substantial mass and gentle regenerative coasting.',gearSpeeds:[222],redline:19000,idleRpm:0,torquePeak:0,shiftTime:0,traction:11.9028,efficiency:.94,dragArea:.54,rolling:.010,launchRpm:0,brakeScale:1},
 safari:{grip:.78,response:5.2,stability:.87,timbre:.6,shape:'raised safari SUV',ranks:[4,1,3,3,7],tradeoff:'Forgiving AWD shoulders; tall, heavy and longest braking distance.',gearSpeeds:[34,53,76,97,122,151,181,217],redline:6500,idleRpm:750,torquePeak:3500,shiftTime:.26,traction:5.9660,efficiency:.88,dragArea:1.18,rolling:.017,launchRpm:2600,brakeScale:1}
};
export const referenceVehicles=Object.fromEntries(Object.entries(realCarSpecs).map(([id,reference])=>{
 const t=tuning[id],brakeMS=(reference.braking.mph*MPH_TO_MS)**2/(2*reference.braking.meters);
 return [id,{...reference,...t,id,reference,analogue:reference.analogue,torque:reference.torqueNm??0,brake:brakeMS/MPH_TO_MS}];
}));
// The default game uses deliberately boosted performance. These numbers describe
// the fictional cars, never the published real-world analogues in realCarSpecs.
const fastDrive={
 black:{topMph:265,accel:25.5},silver:{topMph:255,accel:26.5},red:{topMph:260,accel:25.2},rally:{topMph:240,accel:27.0},
 muscle:{topMph:250,accel:29.0},roadster:{topMph:235,accel:26.5},electric:{topMph:265,accel:23.0},safari:{topMph:230,accel:31.0}
};
// Authored game capability budget: acceleration, top speed, handling, braking, stability, strength.
// Strength is game durability, not a real crash-safety rating.
const balanceProfiles={
 black:{grip:1.00,response:7.3,stability:.83,brakeScale:.92,strength:3,capabilityRanks:[8,10,7,8,6,3]},
 silver:{grip:.96,response:6.4,stability:1.02,brakeScale:1.00,strength:6,capabilityRanks:[7,8,6,7,8,6]},
 red:{grip:1.18,response:9.2,stability:.72,brakeScale:1.00,strength:2,capabilityRanks:[7,9,10,9,5,2]},
 rally:{grip:1.12,response:9.0,stability:1.02,brakeScale:1.02,strength:7,capabilityRanks:[6,5,9,7,8,7]},
 muscle:{grip:.85,response:5.7,stability:.95,brakeScale:.95,strength:9,capabilityRanks:[9,7,4,6,7,9]},
 roadster:{grip:1.18,response:10.0,stability:1.11,brakeScale:1.25,strength:5,capabilityRanks:[5,4,10,9,9,5]},
 electric:{grip:.87,response:5.6,stability:.88,brakeScale:.84,strength:7,capabilityRanks:[10,10,4,5,6,7]},
 safari:{grip:.98,response:6.3,stability:1.18,brakeScale:1.10,strength:10,capabilityRanks:[8,3,5,6,10,10]}
};
const FAST_LABEL='Fast Drive: deliberately arcade acceleration and speed; real-car references are shown separately';
const fastTradeoffs={
 black:'High top speed and strong brakes; delicate bodywork and more steering work on curves.',
 silver:'Stable, durable GT with balanced brakes; heavier steering response.',
 red:'Exceptional cornering and brakes; the most fragile bodywork and nervous recovery from slides.',
 rally:'Agile AWD grip and sturdy bodywork; longer shifts and a lower top speed.',
 muscle:'Explosive launch and tough bodywork; slower steering and longer stops.',
 roadster:'Precise steering, excellent brakes and stable recovery; modest top speed and longer shifts.',
 electric:'Quickest launch, high top speed and sturdy bodywork; heavy steering and weaker brakes.',
 safari:'Strongest bodywork, stable AWD and a boosted launch; lowest top speed and less agile steering.'
};
export const vehicles=Object.fromEntries(Object.entries(referenceVehicles).map(([id,referenceModel])=>{
 const fast=fastDrive[id],balance=balanceProfiles[id],scale=fast.topMph*1.055/referenceModel.gearSpeeds.at(-1);
 return [id,{...referenceModel,...balance,...fast,damageScale:+(1.35-.075*balance.strength).toFixed(3),balanceTotal:balance.capabilityRanks.reduce((a,b)=>a+b,0),strengthLabel:'Game durability; not a real-world crash rating',fastAccel:fast.accel,driveProfile:'fast',gearSpeeds:referenceModel.gearSpeeds.map(mph=>mph*scale),referenceModel,simulationLabel:FAST_LABEL,performanceLabel:'Arcade fast drive',performanceSummary:`${fast.topMph} mph game cap · strong pull through 180–200 mph`,tradeoff:fastTradeoffs[id],ranks:balance.capabilityRanks.slice(0,5),referencePerformance:{topMph:referenceModel.topMph,acceleration:referenceModel.acceleration,braking:referenceModel.braking,powerKw:referenceModel.powerKw,torqueNm:referenceModel.torqueNm,mass:referenceModel.mass,drivetrain:referenceModel.drivetrain,gears:referenceModel.gears}}];
}));
function fastBand(mph,top){
 if(mph<=180)return 1-.09*(mph/180)**2;
 if(mph<=200){const t=(mph-180)/20;return .91-.28*t*t*(3-2*t);}
 const t=clamp((mph-200)/(top-200),0,1);return .63*Math.pow(Math.max(0,1-t*t),1.10);
}
function gearAtSpeed(mph,v){let gear=1;while(gear<v.gears&&mph>=v.gearSpeeds[gear-1]*.94)gear++;return gear;}
function torqueFraction(rpm,v){const n=rpm/v.redline,p=v.torquePeak/v.redline;if(n<p)return .56+.44*clamp(n/p,0,1);return 1-.12*clamp((n-p)/(1-p),0,1);}
function rpmForGear(mph,v,gear,throttle=1){
 if(v.gears===1)return clamp(mph/v.gearSpeeds[0]*v.redline,0,v.redline);
 const wheelRpm=mph/v.gearSpeeds[gear-1]*v.redline;
 const launch=gear===1?Math.max(v.idleRpm,v.launchRpm*throttle):v.idleRpm;
 return clamp(Math.max(wheelRpm,launch),v.idleRpm,v.redline);
}
export function longitudinal(mph,v,{throttle=1,braking=false,grade=0,surface=1,health=100,drafting=0,gear:inputGear,shifting=false}={}){
 mph=Math.max(0,mph);throttle=clamp(throttle,0,1);const speed=mph*MPH_TO_MS;
 const gear=clamp(inputGear??gearAtSpeed(mph,v),1,v.gears),rpm=rpmForGear(mph,v,gear,throttle);
 const roll=v.rolling*G*(mph>0?1:0),aero=.5*1.225*v.dragArea*speed*speed/v.mass*(1-.25*clamp(drafting,0,1));
 const engineBrake=throttle===0&&!braking?(v.gears===1?.34:.10+rpm/v.redline*.14):0;
 const referenceDrag=(roll+aero+engineBrake)/MPH_TO_MS,gravity=grade*G/MPH_TO_MS;
 const drag=v.driveProfile==='fast'?(mph>0?.30+1.05*(mph/200)**2*(1-.25*clamp(drafting,0,1))+(throttle===0&&!braking?(v.gears===1?.23:.16):0):0):referenceDrag;
 const damage=.55+.45*clamp(health/100,0,1),traction=v.traction*Math.max(.15,surface);
 let drive;
 if(v.gears===1)drive=v.powerKw*1000*v.efficiency/Math.max(speed,1)/v.mass;
 else{const ratioRadians=v.redline*TAU/60/(v.gearSpeeds[gear-1]*MPH_TO_MS);const wheelForce=v.torqueNm*torqueFraction(rpm,v)*ratioRadians*v.efficiency;drive=Math.min(wheelForce/v.mass,v.powerKw*1000*v.efficiency/Math.max(speed,1)/v.mass);}
 drive=Math.min(traction,drive)*damage*throttle;
 const unboostedPull=drive/MPH_TO_MS;
 if(v.driveProfile==='fast'){
   // Full throttle offsets rolling/aero losses on healthy dry flat pavement;
   // surface and damage still reduce thrust, while grades still act as gravity.
   const launch=v.gears===1?1+.25*Math.max(0,1-mph/80):1;
   drive=(v.fastAccel*fastBand(mph,v.topMph)*launch+drag)*MPH_TO_MS*Math.max(.15,surface)*damage*throttle;
 }
 const limiter=clamp((v.topMph-mph)/1.25,0,1);drive*=limiter;
 const pull=shifting?0:drive/MPH_TO_MS;
 const brakeMS=v.brake*MPH_TO_MS*Math.max(.15,surface)*v.brakeScale;
 const accel=braking?-brakeMS/MPH_TO_MS-gravity:pull-drag-gravity;
 return {accel,rpm,gear,pull,drag,grade,surface,drafting,shifting,load:throttle*(shifting?0:clamp(drive/Math.max(.1,traction),0,1)),availablePowerKw:v.driveProfile==='fast'?pull*MPH_TO_MS*v.mass*speed/1000:v.powerKw*v.efficiency,referenceAvailablePowerKw:v.powerKw*v.efficiency,driveProfile:v.driveProfile||'reference',simulationLabel:v.simulationLabel||'Calibrated reference approximation',unboostedPull,referenceDrag};
}
// Mutates only powertrain fields, never position, speed or steering.
// Call once per fixed step and integrate returned acceleration in mph/s.
export function advancePowertrain(mph,v,state,context={},dt=1/120){
 const throttle=context.throttle??1;
 if(!state.powertrainInitialized||state.powertrainCar!==v.id){state.gear=gearAtSpeed(mph,v);state.rpm=rpmForGear(mph,v,state.gear,throttle);state.shiftRemaining=0;state.powertrainInitialized=true;state.powertrainCar=v.id;}
 state.shiftRemaining=Math.max(0,(state.shiftRemaining||0)-dt);state.gear=clamp(state.gear,1,v.gears);let next=state.gear;
 if(state.shiftRemaining===0&&v.gears>1){if(next<v.gears&&mph>=v.gearSpeeds[next-1]*.94)next++;else if(next>1&&mph<v.gearSpeeds[next-2]*.74)next--;if(next!==state.gear){state.shiftFromRpm=state.rpm;state.gear=next;state.shiftRemaining=v.shiftTime;}}
 const shifting=state.shiftRemaining>0,result=longitudinal(mph,v,{...context,gear:state.gear,shifting});
 if(shifting){const progress=1-state.shiftRemaining/v.shiftTime;state.rpm=(state.shiftFromRpm??result.rpm)*(1-progress)+result.rpm*progress;}
 else state.rpm+=(result.rpm-state.rpm)*(1-Math.exp(-dt*18));
 return {...result,rpm:state.rpm,gear:state.gear,shiftRemaining:state.shiftRemaining};
}
function measuredAcceleration(v,target){let mph=0,time=0,state={},dt=1/120;while(mph<target&&time<120){const p=advancePowertrain(mph,v,state,{throttle:1},dt);mph+=p.accel*dt;time+=dt;}return time<120?+time.toFixed(2):null;}
export function specs(v){const stopTime=60/v.brake/v.brakeScale;return {zero60:measuredAcceleration(v,60),zero100Kph:measuredAcceleration(v,100/1.609344),zero100:measuredAcceleration(v,100),zero180:v.topMph>180?measuredAcceleration(v,180):null,zero200:v.topMph>200?measuredAcceleration(v,200):null,topMph:v.topMph,brakeTime:+stopTime.toFixed(2),brakeMeters:+(60*MPH_TO_MS*stopTime/2).toFixed(1),driftScore:Math.round((1.3-v.stability)*10),mass:Math.round(v.mass),strength:v.strength,damageScale:v.damageScale,balanceTotal:v.balanceTotal,capabilityRanks:v.capabilityRanks,analogue:v.analogue,reference:v.reference,powerKw:v.powerKw,torqueNm:v.torqueNm,drivetrain:v.drivetrain,gears:v.gears,referenceAcceleration:v.reference.acceleration.label,brakingBasis:v.reference.braking.label,simulationLabel:v.simulationLabel||'Standing-start dry flat-road reference approximation; automatic shifts; estimates, not measured telemetry',performanceLabel:v.performanceLabel||'Reference approximation',driveProfile:v.driveProfile||'reference',referencePerformance:v.referencePerformance||{topMph:v.topMph,acceleration:v.acceleration,braking:v.braking}};}
const laneCenters=[-10,-6,-2,2,6,10];
const nearestLane=x=>laneCenters.reduce((best,c)=>Math.abs(c-x)<Math.abs(best-x)?c:best,laneCenters[0]);
export function handling(s,v,steer,dt,context={}){
 const mph=s.speed/1.609344,surface=clamp(context.surface??1,.15,1.5),gripAid=context.assist?1.65:1;
 const laneAssist=!!context.laneAssist,manual=Math.abs(steer)>.001;
 if(!Number.isFinite(s.laneTarget)||laneAssist!==s.laneAssistActive)s.laneTarget=nearestLane(s.x);
 if(manual||s.manualSteering&&!manual)s.laneTarget=nearestLane(s.x);
 s.steer+=(steer-s.steer)*(1-Math.exp(-dt*v.response));
 const grip=v.grip*surface*gripAid/(1+Math.max(0,mph-75)/150*(1.3-v.stability));
 const speedResponse=clamp(mph/18,0,1),steeringVelocity=s.steer*(3.3+mph*.024)*speedResponse;
 // Relative to a curved road, an unchanged world heading drifts toward the outside.
 // Ice has lower lateral damping, so both steering momentum and curve drift persist.
 const roadDrift=-(context.curvature??0)*(s.speed/3.6)**2*2*(context.driftMultiplier??1);
 const followVelocity=clamp((s.laneTarget-s.x)*1.8,-5.0,5.0)*speedResponse;
 const target=laneAssist&&!manual?followVelocity:steeringVelocity;
 const tireResponse=Math.max(.48,Math.pow(Math.max(.10,grip),1.55)*6);
 const response=laneAssist&&!manual?Math.max(3.5,tireResponse):tireResponse;
 s.lateralV+=(target-s.lateralV)*(1-Math.exp(-response*dt));
 s.assistCorrection=laneAssist?-roadDrift:0;
 s.roadDrift=roadDrift;
 s.lateralV+=(roadDrift+s.assistCorrection)*dt;
 s.x+=s.lateralV*dt;
 s.yaw+=(Math.atan2(-s.lateralV,Math.max(7,s.speed/3.6))*(1.4-v.stability*.5)-s.yaw)*(1-Math.exp(-dt*4));
 s.slip=Math.abs(s.lateralV-steeringVelocity)/Math.max(.3,grip);s.grip=grip;
 s.laneAssistActive=laneAssist;s.manualSteering=manual;
 if(manual)s.laneTarget=nearestLane(s.x);
 const pitchTarget=context.braking?-.035:(context.throttle??0)*(v.gears===1?.022:.018);s.pitch+=(pitchTarget-s.pitch)*(1-Math.exp(-dt*5));
}
