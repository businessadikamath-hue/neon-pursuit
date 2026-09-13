// Reproducible scoped source edits. Run once against the copied v8 source.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../engine-v9');
let d=fs.readFileSync(path.resolve(root,'../engine/wildlifeDetail8.js'),'utf8');
function between(s,a,b,v){const i=s.indexOf(a),j=s.indexOf(b,i);if(i<0||j<0)throw Error(a);return s.slice(0,i)+v+'\n'+s.slice(j);}
d=between(d,'function ear(','export function detailFeather',`export function bodySurface(c,t,a){
 const rows=[[0,.08,.10,.12],[.13,.69,.72,.82],[.29,1,1,1],[.48,.86,.93,.64],[.64,.77,.92,.52],[.81,.94,.88,.90],[.94,.55,.57,.53],[1,.045,.065,.10]],s=t*(rows.length-1),i=Math.min(rows.length-2,Math.floor(s)),u=s-i,smooth=u*u*(3-2*u),v=rows[i].map((x,k)=>T.MathUtils.lerp(x,rows[i+1][k],smooth)),narrow={fox:.73,coyote:.76,deer:.79,reindeer:.88,bighorn:.92,cat:.94,hare:.87,tapir:.98,capybara:.95,seal:.95}[c.kind],w=c.width*narrow*v[1],cs=Math.cos(a),height=c.width*(cs>=0?v[2]*.90:v[3]*.83);
 return new T.Vector3(Math.sin(a)*w,c.height+cs*height,(t*1.14-.57)*c.length);
}
function ear(parts,c,side){
 const p=[],uv=[],ix=[],rows=16,cols=12,h=c.head,round=['cat','capybara','tapir'].includes(c.kind),center=[side*h*(c.kind==='cat'?.38:.23),h*(c.kind==='cat'?.32:.34),h*.09];
 for(let i=0;i<=rows;i++){const t=i/rows,profile=Math.sin(Math.PI*t)**(round?.52:.78),width=(c.kind==='hare'?.040:round?.039:.052)*profile,yy=t*c.ears*(round?.95:1.04);for(let j=0;j<=cols;j++){const q=j/cols*2-1;p.push(center[0]+side*yy*(c.kind==='deer'||c.kind==='reindeer'?.54:.28)+q*width,center[1]+yy,center[2]-.011-.022*(1-q*q)*Math.sin(t*Math.PI));uv.push(j/cols,t);}}
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+cols+1;ix.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
 add(parts,g,c.coat,[0,0,0],[1,1,1],[0,0,0],(color,x,y,z,u,v)=>{if(u>.18&&u<.82&&v<.80)color.lerp(new T.Color(c.kind==='hare'?0x9d8b83:0x7e6c60),.52);});
}
export function buildMammalFace(c,name){
 const skin=[],eyes=[],wet=[],h=c.head;
 add(skin,asset('skull-'+c.kind),c.coat,[0,0,0],[h,h,h],[0,0,0],(color,x,y,z)=>{if(y<-.12)color.lerp(new T.Color(c.belly),Math.min(.62,(-y-.12)*1.8));if(z<-.5)color.multiplyScalar(.94);});
 const fit={fox:[.298,.17,-.18,.047,-1.20,-1.015,-.053,.078],coyote:[.306,.19,-.18,.046,-1.21,-1.13,-.041,.078],deer:[.316,.26,-.14,.052,-1.32,-1.30,-.23,.17],reindeer:[.364,.26,-.14,.052,-1.32,-1.24,-.22,.20],bighorn:[.413,.24,-.18,.052,-1.25,-1.08,-.19,.18],cat:[.426,.145,-.28,.050,-.98,-.827,-.12,.19],hare:[.325,.19,-.13,.055,-1.31,-.84,-.085,.082],tapir:[.384,.19,-.13,.043,-1.32,-1.17,-.27,.11],capybara:[.354,.24,-.10,.042,-1.38,-1.015,-.074,.215],seal:[.370,.16,-.24,.061,-1.17,-.82,-.068,.14]}[c.kind];
 const [ex,ey,ez,rad,angle,nz,ny,nw]=fit;
 oval(skin,c.kind==='tapir'?0x514b43:0x2b2923,[0,ny*h,nz*h],[nw*h,h*.048,h*.022]);
 for(const side of[-1,1]){
  oval(eyes,0x101411,[side*nw*h*.55,(ny+.013)*h,(nz-.014)*h],[h*.022,h*.012,h*.010],[0,side*.2,0]);
  tube(skin,0x594b3e,[[side*nw*h*.2,(ny-.052)*h,(nz+.028)*h],[side*nw*h*.90,(ny-.072)*h,(nz+.14)*h],[side*h*(c.kind==='cat'?.28:.20),(ny-.03)*h,(nz+.30)*h]],h*.0038,14);
  const lid=[],r=rad*h;for(let i=0;i<=14;i++){const a=i/14*Math.PI;lid.push([Math.cos(a)*r*1.1,Math.sin(a)*r*.74,-r*.13]);}
  const upper=[];tube(upper,c.coat,lid,h*.009,14);const lidGeo=joinWildlifeDetail(upper);lidGeo.applyMatrix4(new T.Matrix4().compose(new T.Vector3(side*ex*h,ey*h,ez*h),new T.Quaternion().setFromEuler(new T.Euler(0,side*angle,0)),new T.Vector3(1,1,1)));skin.push(lidGeo);
  iris(eyes,wet,[side*ex*h,ey*h,ez*h],r,c.kind==='cat'?0x827848:c.kind==='fox'?0x99753f:0x493e2d,[0,side*angle,0],['deer','reindeer','bighorn'].includes(c.kind)?'horizontal':c.kind==='fox'?'slit':'round');
  if(c.ears)ear(skin,c,side);
  if(['fox','coyote','cat','seal','capybara'].includes(c.kind))for(let i=0;i<5;i++){const a=(i-2)*.12; tube(skin,0xa89d86,[[side*nw*h*.82,(ny-.014)*h,(nz+.095)*h],[side*(nw+.16)*h,(ny+a*.4)*h,(nz+.095)*h],[side*(nw+.32)*h,(ny+a)*h,(nz+.12+Math.abs(a)*.2)*h]],h*.0014,7);}
 }
 return {skin:joinWildlifeDetail(skin),eyes:joinWildlifeDetail(eyes),wet:joinWildlifeDetail(wet),fur:null,source:name};
}
`);
d=between(d,'export function buildBirdFace','export function buildGroomedFur',`export function birdHeadFrame(c){return {hz:c.heron?-.405:-.285-c.neck,y:c.owl?.078:.079,scale:c.owl?[.180,.175,.155]:c.macaw?[.114,.125,.140]:[.100,.113,.140]};}
export function birdSkull(parts,c){const f=birdHeadFrame(c);add(parts,asset('skull-bird'),c.coat,[0,f.y,f.hz],f.scale,[0,0,0],(color,x,y)=>{if(c.cap&&y>.20)color.set(0x273a41);});}
export function buildBirdFace(c,name){
 const skin=[],eyes=[],wet=[],{hz,y,scale}=birdHeadFrame(c),kind=c.toucan?'toucan':c.macaw?'parrot':c.raptor||c.owl?'raptor':c.heron?'straight':['Snow bunting','Ptarmigan','Mourning dove'].includes(name)?'seed':'straight';
 for(const side of[-1,1]){
  if(c.owl){
   // One shallow facial disc with radial feather texture, rather than beads.
   oval(skin,0xe8e5d6,[side*.045,.085,hz-.082],[.064,.072,.015],[0,side*.12,0],(col,x,y,z)=>{const a=Math.atan2(y,x),r=Math.hypot(x,y);col.multiplyScalar(.94+.035*Math.sin(a*44+r*13));});
  }
  const ex=c.owl?.043:c.macaw?.064:.055,ey=c.owl?.086:.098,ez=hz-(c.owl?.097:.040),rad=c.owl?.0175:c.raptor?.0095:.0078,angle=c.owl?-side*.10:-side*1.18;
  if(c.macaw){oval(skin,0xddcdb0,[side*.061,.087,hz-.031],[.006,.026,.038]);for(let j=0;j<3;j++)tube(skin,0x816f60,[[side*.065,.067+j*.006,hz-.053],[side*.067,.069+j*.006,hz-.032],[side*.065,.070+j*.006,hz-.007]],.00065,8);}
  iris(eyes,wet,[side*ex,ey,ez],rad,c.owl?0xc9ad39:c.raptor?0x987139:c.toucan?0x648367:0x4d4331,[0,angle,0]);
 }
 const length=c.toucan?.31:c.heron?.23:c.macaw?.108:c.owl?.070:c.raptor?.089:kind==='seed'?.051:.10,width=c.toucan?.061:c.macaw?.042:c.owl?.021:c.raptor?.026:.019,base=hz-.085;
 for(const lower of[false,true])add(skin,asset(kind+(lower?'-lower':'-upper')),lower?new T.Color(c.beak).multiplyScalar(.75).getHex():c.beak,[0,.079-(lower?.006:0),base],[width,width,length],[0,0,0],(col,x,y,z,u,v)=>{if(c.toucan)col.lerp(new T.Color(v>.70?0xbd573b:0xd6c648),v>.7?.76:.25);else if(v>.80)col.multiplyScalar(.79);});
 for(const side of[-1,1])oval(eyes,0x211f1b,[side*width*.64,.079+width*.14,base-length*.19],[.0018,.0013,.003]);
 return {skin:joinWildlifeDetail(skin),eyes:joinWildlifeDetail(eyes),wet:joinWildlifeDetail(wet)};
}
`);
d=d.replace("const z=(r()-.5)*c.length*.93,a=r()*Math.PI*2,fall=Math.sqrt(Math.max(.18,1-(z/(c.length*.60))**2)),x=Math.sin(a)*c.width*fall,y=c.height+Math.cos(a)*c.width*.87*fall,n=new T.Vector3(Math.sin(a),Math.cos(a),0),length=(['fox','reindeer'].includes(c.kind)?.040:.020)*(.6+r()),w=.0025+r()*.002,base=new T.Vector3(x,y,z),end=base.clone().addScaledVector(n,length*.62).add(new T.Vector3(0,-length*.08,length)),mid=base.clone().lerp(end,.5).addScaledVector(n,length*.21)","const t=.09+r()*.82,a=r()*Math.PI*2,base=bodySurface(c,t,a),{x,y,z}=base,n=new T.Vector3(Math.sin(a),Math.cos(a),0),length=(['fox','reindeer'].includes(c.kind)?.016:.008)*(.6+r()),w=.0008+r()*.0008,end=base.clone().addScaledVector(n,length*.12).add(new T.Vector3(0,-length*.18,length)),mid=base.clone().lerp(end,.5).addScaledVector(n,length*.09)");
d=d.replace("multiplyScalar(.78+r()*.42)","multiplyScalar(.94+r()*.12)");
d=d.replace('blenderComponents:11','blenderComponents:22');
d=d.replace("'fitted iris/pupil/cornea and eyelid rims','sculpted muzzle, nostrils and cupped ears'","'recessed smaller iris/pupil and upper lids','continuous Blender skull, jaw and muzzle; rooted cupped ears'");
fs.writeFileSync(path.join(root,'wildlifeDetail8.js'),d);
let a=fs.readFileSync(path.resolve(root,'../engine/wildlifeArt.js'),'utf8');
a=a.replace('detailFeather,installWildlifeDetails','detailFeather,installWildlifeDetails,bodySurface,birdHeadFrame,birdSkull');
a=a.replace('tinted(g,color,.07,mark)','tinted(g,color,.022,mark)');
a=between(a,'function sculptBody(','function markings(',`function sculptBody(c){const positions=[],index=[],rows=56,sides=40;for(let i=0;i<=rows;i++)for(let j=0;j<=sides;j++){const p=bodySurface(c,i/rows,j/sides*Math.PI*2);positions.push(p.x,p.y,p.z);}for(let i=0;i<rows;i++)for(let j=0;j<sides;j++){let a=i*(sides+1)+j,b=a+1;index.push(a,a+sides+1,b,b,a+sides+1,b+sides+1);}for(const end of[0,1]){const center=positions.length/3,ring=end*rows*(sides+1);positions.push(0,c.height,(end?.57:-.57)*c.length);for(let j=0;j<sides;j++)index.push(center,ring+j+(end?1:0),ring+j+(end?0:1));}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(index);g.computeVertexNormals();return g;}
function taperedNeck(parts,c,end){const path=new T.CatmullRomCurve3([new T.Vector3(0,c.height,-c.length*.24),new T.Vector3(0,c.height+c.neck*.50,-c.length*.39),new T.Vector3(...end)]),p=[],ids=[],rows=28,sides=24;for(let i=0;i<=rows;i++){const t=i/rows,at=path.getPoint(t),q=new T.Quaternion().setFromUnitVectors(up,path.getTangent(t)),r=T.MathUtils.lerp(c.width*.54,c.head*.28,t);for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,v=new T.Vector3(Math.sin(a)*r,0,Math.cos(a)*r*1.14).applyQuaternion(q).add(at);p.push(v.x,v.y,v.z);}}for(let i=0;i<rows;i++)for(let j=0;j<sides;j++){let a=i*(sides+1)+j,b=a+sides+1;ids.push(a,a+1,b,a+1,b+1,b);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ids);g.computeVertexNormals();add(parts,g,c.coat);}
`);
a=between(a,'function furGeometry(','export function buildWildlifeModel',`function furGeometry(c){const ps=[],cs=[],r=rng(Math.floor(c.length*9431+c.coat));if(c.kind==='seal')return null;const color=new T.Color(c.coat);for(let i=0;i<360;i++){const a=r()*Math.PI*2,p=bodySurface(c,.1+r()*.8,a),n=new T.Vector3(Math.sin(a),Math.cos(a),0),len=(c.kind==='fox'||c.kind==='reindeer'?.014:.006)*(1+r());ps.push(p.x-.001,p.y,p.z,p.x+.001,p.y,p.z,p.x+n.x*len*.16,p.y+n.y*len*.16-len*.2,p.z+len);const col=color.clone().multiplyScalar(.94+r()*.12);for(let k=0;k<3;k++)cs.push(col.r,col.g,col.b);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.setAttribute('color',new T.Float32BufferAttribute(cs,3));g.computeVertexNormals();return g;}
`);
a=between(a,' const hz=-c.length*.49',' if(c.kind===\'deer\'',` const hz=-c.length*.49,headY=c.height+c.neck;taperedNeck(body,c,[0,headY-.025,hz+c.head*.20]);
 const face=buildMammalFace(c,name),detail=ultra?face:null;head.push(face.skin);if(!ultra){head.push(face.eyes);face.wet?.dispose();face.fur?.dispose();}
`);
a=a.replace('side*c.head*.48,top','side*c.head*.29,top').replace('[[a,.20,.08],[a*1.7,.35,.08]','[[a,c.head*.40,c.head*.1],[a*1.7,.35,.08]');
a=a.replace('side*(.17+j*.002)','side*(c.head*.37+j*.002)').replace('side*(.17+j*.003)','side*(c.head*.37+j*.003)').replace('[.075,.012,.065]','[.066,.004,.058]');
a=a.replace("for(let side of[-1,1])for(let j=0;j<5;j++)limb(head,0xc9c8b4,[side*.1,-.03,-.29],[side*(.26+j*.018),-.045+j*.02,-.31],.002,.001);",'');
a=a.replace("oval(leg,c.coat,knee,[c.width*.20,c.width*.22,c.width*.21]);",'');
a=a.replace('c.width*.30,c.width*.20','c.width*.24,c.width*.15').replace('c.width*.16,c.width*.10','c.width*.145,c.width*.085').replace('[c.width*.18,.06,c.kind===\'hare\'?.16:.09]','[c.width*.145,.032,c.kind===\'hare\'?.135:.075]');
a=between(a,'export function buildBirdModel','function coatTexture',`export function buildBirdModel(name,{ultra=false}={}){
 const c=bird[name];if(!c)throw new Error('Unknown bird species: '+name);const body=[],wing=[],makeFeather=ultra?detailFeather:feather,face=buildBirdFace(c,name),detail=ultra?face:null,f=birdHeadFrame(c);
 // A continuous keel and tapered rump, with the neck seated inside both forms.
 const p=[],ix=[],rows=32,sides=32,profile=[[-.265,.028,.040],[-.19,.078,.092],[-.075,.101,.116],[.065,.090,.099],[.18,.064,.062],[.275,.016,.024]];
 const path=new T.CatmullRomCurve3(profile.map(x=>new T.Vector3(...x)));for(let i=0;i<=rows;i++){const q=path.getPoint(i/rows);for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;p.push(Math.sin(a)*q.y,Math.cos(a)*q.z,q.x);}}for(let i=0;i<rows;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;ix.push(a,b,a+1,a+1,b,b+1);}const torso=new T.BufferGeometry();torso.setAttribute('position',new T.Float32BufferAttribute(p,3));torso.setIndex(ix);torso.computeVertexNormals();add(body,torso,c.coat,[0,0,0],[1,1,1],[0,0,0],(col,x,y,z)=>{if(y>.02)col.lerp(new T.Color(c.back),.78);if(c.toucan&&z<-.15)col.set(0xd8b840);});
 tube(body,c.coat,c.heron?[[0,.024,-.18],[0,.065,-.255],[0,.014,-.335],[0,.065,f.hz+.035]]:[[0,.024,-.18],[0,.063,-.26],[0,f.y-.010,f.hz+.050]],c.owl?.067:c.macaw?.047:.036,18);birdSkull(body,c);body.push(face.skin);if(!ultra){body.push(face.eyes);face.wet?.dispose();}
 for(let i=0;i<9;i++){const v=(i-4)/4,len=c.tail*(c.fork?.62+Math.abs(v)*.55:1-Math.abs(v)*.20),q=[];makeFeather(q,c.raptor?0xa85936:c.macaw?0xaf3b2b:c.back,[0,0,0],len,.057,0,.004);add(body,joined(q),c.raptor?0xa85936:c.macaw?0xb5402f:c.back,[v*.040,-.020,.20],[1,1,1],[0,-Math.PI/2-v*.13,0]);}
 function vane(color,start,end,width,lift=.007){const dx=end[0]-start[0],dz=end[2]-start[2],len=Math.hypot(dx,dz),q=[];makeFeather(q,color,[0,0,0],len,width,0,lift);add(wing,joined(q),color,start,[1,1,1],[0,-Math.atan2(dz,dx),0]);}
 // Secondaries trail the forearm; primaries fan from the wrist into a tapered tip.
 for(let i=0;i<10;i++){const t=i/9,x=c.wing*(.04+t*.56),front=-c.chord*(.14+.19*t),back=c.chord*(.76-.12*t);vane(c.macaw?(i<4?0xcb4934:0xc3a537):c.back,[x,0,front],[x+c.wing*.10,0,back],c.wing*.105);}
 for(let i=0;i<9;i++){const t=i/8;vane(c.macaw?0x286c8b:c.tip,[c.wing*(.56+.10*t),.005,-c.chord*(.27+.07*t)],[c.wing*(.70+.30*Math.sin((.18+t*.82)*Math.PI*.62)),0,c.chord*(.72-.94*t)],c.chord*(.22-.055*t));}
 for(let i=0;i<14;i++){const t=i/13,x=t*c.wing*.67;vane(c.macaw?(t>.54?0xc5a137:c.coat):c.coat,[x,.010,-c.chord*(.14+.20*t)],[x+c.wing*.08,.01,c.chord*(.16-.16*t)],c.wing*.078,.003);}
 for(let side of[-1,1]){limb(body,c.heron?0x829181:0x8e7c64,[side*.040,-.073,.09],[side*.040,-.10,c.heron?.58:.20],.007,.005);for(let j=0;j<3;j++)limb(body,0x746b50,[side*.040,-.10,c.heron?.58:.20],[side*.040+(j-1)*.015,-.11,c.heron?.64:.23],.003,.0015);}
 const rightWing=joined(wing);return {name,config:c,detail,body:joined(body),wing:rightWing,leftWing:mirrorGeometry(rightWing)};
}
`);
a=a.replace("?.0009:.0023","?.0006:.0008").replace('roughness:.64','roughness:.83');
fs.writeFileSync(path.join(root,'wildlifeArt.js'),a);
console.log('Updated assigned v9 wildlife anatomy sources.');
