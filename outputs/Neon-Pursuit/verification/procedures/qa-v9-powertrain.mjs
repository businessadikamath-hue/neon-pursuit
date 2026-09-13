import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {vehicles,advancePowertrain,specs} from './engine-v9/vehiclePhysics.js';
const report={scope:'Actual authored powertrain, dry flat road, 120 Hz; acceleration, real automatic shifts, coast and braking for every car.',vehiclePhysicsSHA256:crypto.createHash('sha256').update(fs.readFileSync(new URL('./engine-v9/vehiclePhysics.js',import.meta.url))).digest('hex'),realCarSpecsSHA256:crypto.createHash('sha256').update(fs.readFileSync(new URL('./engine-v9/realCarSpecs.js',import.meta.url))).digest('hex'),cars:[]};
for(const [id,v] of Object.entries(vehicles)){
 let mph=0,time=0,s={},times={},dt=1/120;
 while(mph<200&&time<15){const p=advancePowertrain(mph,v,s,{throttle:1},dt);mph+=p.accel*dt;time+=dt;for(const target of [60,180,200])if(mph>=target&&!times[target])times[target]=+time.toFixed(3);}
 assert(times[180]<9&&times[200]<10);
 mph=200;s={};const coast=[];for(let i=0;i<1200;i++){const p=advancePowertrain(mph,v,s,{throttle:0},dt);mph=Math.max(0,mph+p.accel*dt);if((i+1)%120===0)coast.push(+mph.toFixed(3));}
 assert(coast[9]>184&&coast[9]<190);assert(coast.every((x,i)=>x<(i?coast[i-1]:200)));
 mph=200;s={};time=0;while(mph>0&&time<15){const p=advancePowertrain(mph,v,s,{throttle:0,braking:true},dt);mph=Math.max(0,mph+p.accel*dt);time+=dt;}
 assert.equal(mph,0);report.cars.push({id,name:v.name||v.analogue,times,coastMphAtEachSecond:coast,brake200To0:+time.toFixed(3),spec:specs(v)});
}
report.passed=true;fs.writeFileSync('work/stage-v9/FAST-DRIVE-V9.json',JSON.stringify(report,null,2));console.log(report.cars.map(c=>({car:c.id,zero180:c.times[180],zero200:c.times[200],coast10:c.coastMphAtEachSecond[9]})));
