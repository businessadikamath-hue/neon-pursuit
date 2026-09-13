const fs=require('fs'),path=require('path'),file=path.resolve(__dirname,'../engine-v9/wildlifeArt.js');let a=fs.readFileSync(file,'utf8');
a=a.replace('p=[],ix=[],rows=64,sides=20;for(let i=0;i<=rows;i++)','p=[],ix=[],rows=64,sides=20,frames=path.computeFrenetFrames(rows,false);for(let i=0;i<=rows;i++)');
a=a.replace('v=new T.Vector3(Math.sin(angle)*radius*flute,0,Math.cos(angle)*radius*.86*flute).applyQuaternion(q).add(at)','v=frames.normals[i].clone().multiplyScalar(Math.sin(angle)*radius*flute).addScaledVector(frames.binormals[i],Math.cos(angle)*radius*.86*flute).add(at)');
fs.writeFileSync(file,a);console.log('Used continuous parallel-transport frames for tapered horns.');
