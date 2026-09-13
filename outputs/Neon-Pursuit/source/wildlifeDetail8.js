import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {blenderWildlife8} from './blenderWildlife8.js';

// Original close-range anatomy. Blender supplies shaped bills and asymmetric
// feather vanes; all fitting, iris fibers and fur grooming are authored here.
const up=new T.Vector3(0,1,0),assetCache=new Map();
const random=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function asset(name){if(!assetCache.has(name)){const a=blenderWildlife8[name],g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(a.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(a.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(a.uv,2));g.setIndex(a.i);g.userData.artShared=true;assetCache.set(name,g);}return assetCache.get(name).clone();}
function add(parts,g,color,position=[0,0,0],scale=[1,1,1],rotation=[0,0,0],mark){
 const mat=new T.Matrix4().compose(new T.Vector3(...position),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),new T.Vector3(...scale));
 const base=new T.Color(color),colors=[],p=g.attributes.position;
 for(let i=0;i<p.count;i++){const c=base.clone();if(mark)mark(c,p.getX(i),p.getY(i),p.getZ(i),g.attributes.uv?.getX(i)||0,g.attributes.uv?.getY(i)||0);colors.push(c.r,c.g,c.b);}
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.applyMatrix4(mat);parts.push(g);
}
function oval(parts,color,p,s,rot=[0,0,0],mark){add(parts,new T.SphereGeometry(1,32,20),color,p,s,rot,mark);}
function tube(parts,color,points,radius,segments=18){add(parts,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,radius,6,false),color);}
export function joinWildlifeDetail(parts){if(!parts.length)return null;const all=parts.map(g=>{if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));return g.index?g.toNonIndexed():g;});const joined=mergeGeometries(all,false);new Set([...all,...parts]).forEach(g=>g.dispose());joined.computeBoundingSphere();return joined;}
function iris(parts,wet,p,radius,color,rotation,pupilShape='round'){
 const local=[],glass=[],r=random(4371),irisColor=new T.Color(color);
 oval(local,0x12110d,[0,0,0],[radius*1.04,radius*.96,radius*.65]);
 const pos=[],colors=[];
 for(let i=0;i<80;i++){const a=i/80*Math.PI*2,b=(i+1)/80*Math.PI*2,k=.70+r()*.55,c=irisColor.clone().multiplyScalar(k);for(const v of [[Math.cos(a)*radius,Math.sin(a)*radius,-radius*.40],[Math.cos(b)*radius,Math.sin(b)*radius,-radius*.40],[Math.cos((a+b)/2)*radius*.28,Math.sin((a+b)/2)*radius*.28,-radius*.59]]){pos.push(...v);colors.push(c.r,c.g,c.b);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();local.push(g);
 oval(local,0x050707,[0,0,-radius*.60],[radius*(pupilShape==='horizontal'?.66:pupilShape==='slit'?.14:.42),radius*(pupilShape==='horizontal'?.20:pupilShape==='slit'?.69:.46),radius*.12]);
 oval(glass,0xf2e8d8,[0,0,-radius*.48],[radius*.96,radius*.91,radius*.23]);
 // Preserve authored iris vertex colors while applying the fitting transform.
 for(const [from,to]of [[local,parts],[glass,wet]]){const geo=joinWildlifeDetail(from);geo.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),new T.Vector3(1,1,1)));to.push(geo);}
}
export function bodySurface(c,t,a){
 const rows=[[0,.08,.10,.12],[.13,.69,.72,.82],[.29,1,1,1],[.48,.86,.93,.64],[.64,.77,.92,.52],[.81,.94,.88,.90],[.94,.55,.57,.53],[1,.045,.065,.10]],s=t*(rows.length-1),i=Math.min(rows.length-2,Math.floor(s)),u=s-i,v=rows[i].map((x,k)=>{const a=rows[Math.max(0,i-1)][k],b=x,c=rows[i+1][k],d=rows[Math.min(rows.length-1,i+2)][k];return Math.max(.035,.5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u));}),narrow={fox:.73,coyote:.76,deer:.79,reindeer:.88,bighorn:.92,cat:.94,hare:.87,tapir:.98,capybara:.95,seal:.95}[c.kind],w=c.width*narrow*v[1],cs=Math.cos(a),height=c.width*(cs>=0?v[2]*.90:v[3]*.83);
 return new T.Vector3(Math.sin(a)*w,c.height+cs*height,(t*1.14-.57)*c.length);
}
// Intersect each skull triangle in its yz plane. This fits features to the
// exact exported surface instead of relying on ellipsoid approximations.
function skullSideX(kind,y,z){const g=blenderWildlife8['skull-'+kind];let best=0;for(let i=0;i<g.i.length;i+=3){const a=g.i[i]*3,b=g.i[i+1]*3,c=g.i[i+2]*3,ay=g.p[a+1],az=g.p[a+2],by=g.p[b+1],bz=g.p[b+2],cy=g.p[c+1],cz=g.p[c+2],den=(bz-cz)*(ay-cy)+(cy-by)*(az-cz);if(Math.abs(den)<1e-12)continue;const u=((bz-cz)*(y-cy)+(cy-by)*(z-cz))/den,v=((cz-az)*(y-cy)+(ay-cy)*(z-cz))/den,w=1-u-v;if(u>=-1e-6&&v>=-1e-6&&w>=-1e-6)best=Math.max(best,u*g.p[a]+v*g.p[b]+w*g.p[c]);}return best;}
function cheekPatch(parts,c,f,side){const p=[],ix=[],rows=9,sides=36;for(let i=0;i<=rows;i++){const r=i/rows;for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,y=.087+Math.sin(a)*.026*r,z=-.031+Math.cos(a)*.038*r,x=skullSideX('bird',(y-f.y)/f.scale[1],z/f.scale[2])*f.scale[0]+.0005;p.push(side*x,y,f.hz+z);}}for(let i=0;i<rows;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;ix.push(...(side===1?[a,a+1,b,a+1,b+1,b]:[a,b,a+1,a+1,b,b+1]));}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();add(parts,g,0xddcdb0);}
function ear(parts,c,side){
 const p=[],uv=[],ix=[],rows=16,cols=12,h=c.head,round=['cat','capybara','tapir'].includes(c.kind),center=[side*h*(c.kind==='cat'?.38:.23),h*(c.kind==='cat'?.32:.34),h*.09];
 for(let i=0;i<=rows;i++){const t=i/rows,profile=Math.sin(Math.PI*t)**(round?.52:.78),width=(c.kind==='hare'?.040:round?.039:.052)*profile,yy=t*c.ears*(round?.95:1.04);for(let j=0;j<=cols;j++){const q=j/cols*2-1;p.push(center[0]+side*yy*(c.kind==='deer'||c.kind==='reindeer'?.54:.28)+q*width,center[1]+yy,center[2]-.011-.022*(1-q*q)*Math.sin(t*Math.PI));uv.push(j/cols,t);}}
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+cols+1;ix.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
 add(parts,g,c.coat,[0,0,0],[1,1,1],[0,0,0],(color,x,y,z,u,v)=>{if(u>.18&&u<.82&&v<.80)color.lerp(new T.Color(c.kind==='hare'?0x9d8b83:0x7e6c60),.52);});
}
function facialGroom(c){if(c.kind==='seal')return null;const a=blenderWildlife8['skull-'+c.kind],p=[],colors=[],r=random(c.coat+3259),color=new T.Color(c.coat),down=new T.Vector3(0,-.15,1);for(let i=0;i<1100;i++){const j=Math.floor(r()*(a.i.length/3))*3,ids=[a.i[j],a.i[j+1],a.i[j+2]],u=r(),v=r()*(1-u),w=1-u-v,base=new T.Vector3(),n=new T.Vector3();for(let k=0;k<3;k++){const weight=[u,v,w][k],id=ids[k];base.addScaledVector(new T.Vector3(...a.p.slice(id*3,id*3+3)),weight*c.head);n.addScaledVector(new T.Vector3(...a.n.slice(id*3,id*3+3)),weight);}if(base.z<-c.head*.45)continue;n.normalize();const tangent=down.clone().addScaledVector(n,-down.dot(n)).normalize(),side=n.clone().cross(tangent).multiplyScalar(.00022),len=(c.kind==='fox'?.0035:.0020)*(.5+r()),tip=base.clone().addScaledVector(tangent,len).addScaledVector(n,len*.12),col=color.clone().multiplyScalar(.93+r()*.14);for(const q of[base.clone().sub(side),base.clone().add(side),tip]){p.push(q.x,q.y,q.z);colors.push(col.r,col.g,col.b);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;}
export function buildMammalFace(c,name){
 const skin=[],eyes=[],wet=[],h=c.head;
 add(skin,asset('skull-'+c.kind),c.coat,[0,0,0],[h,h,h],[0,0,0],(color,x,y,z)=>{if(y<-.12)color.lerp(new T.Color(c.belly),Math.min(.62,(-y-.12)*1.8));if(z<-.5)color.multiplyScalar(.94);});
 const fit={fox:[.298,.17,-.18,.047,-1.20,-1.015,-.053,.078],coyote:[.306,.19,-.18,.046,-1.21,-1.13,-.041,.078],deer:[.316,.26,-.14,.052,-1.32,-1.30,-.23,.17],reindeer:[.364,.26,-.14,.052,-1.32,-1.24,-.22,.20],bighorn:[.413,.24,-.18,.052,-1.25,-1.08,-.19,.18],cat:[.426,.145,-.28,.050,-.98,-.634,-.12,.19],hare:[.325,.19,-.13,.055,-1.31,-.84,-.085,.082],tapir:[.384,.19,-.13,.043,-1.32,-1.17,-.27,.11],capybara:[.354,.24,-.10,.042,-1.38,-1.015,-.074,.215],seal:[.370,.16,-.24,.061,-1.17,-.82,-.068,.14]}[c.kind];
 const [,ey,ez,rad,angle,nz,ny,nw]=fit,ex=skullSideX(c.kind,ey,ez)-rad*.20;
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
 return {skin:joinWildlifeDetail(skin),eyes:joinWildlifeDetail(eyes),wet:joinWildlifeDetail(wet),fur:facialGroom(c),source:name};
}

export function detailFeather(parts,color,start,length,width,angle=0,lift=.025){
 const g=asset('flight-feather'),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);p.setXYZ(i,start[0]+x*length,start[1]+y*width+Math.sin(x*Math.PI)*lift,start[2]+z*width+x*angle);}
 g.computeVertexNormals();add(parts,g,color,[0,0,0],[1,1,1],[0,0,0],(c,x,y,z,u,v)=>{const shaft=Math.abs(v-.5)<.05;const barb=Math.sin(u*218+Math.abs(v-.5)*53);c.multiplyScalar(shaft?.72:.91+barb*.085);});
}
export function birdHeadFrame(c){return {hz:c.heron?-.405:-.285-c.neck,y:c.owl?.078:.079,scale:c.owl?[.164,.147,.163]:c.macaw?[.111,.099,.152]:[.098,.084,.170]};}
export function birdSkull(parts,c){const f=birdHeadFrame(c);add(parts,asset('skull-bird'),c.coat,[0,f.y,f.hz],f.scale,[0,0,0],(color,x,y)=>{if(c.cap&&y>.20)color.set(0x273a41);});}
export function buildBirdFace(c,name){
 const skin=[],eyes=[],wet=[],{hz,y,scale}=birdHeadFrame(c),kind=c.toucan?'toucan':c.macaw?'parrot':c.raptor||c.owl?'raptor':c.heron?'straight':['Snow bunting','Ptarmigan','Mourning dove'].includes(name)?'seed':'straight';
 for(const side of[-1,1]){
  if(c.owl){
   // One shallow facial disc with radial feather texture, rather than beads.
   oval(skin,0xe8e5d6,[side*.045,.085,hz-.115],[.061,.068,.009],[0,side*.12,0],(col,x,y,z)=>{const a=Math.atan2(y,x),r=Math.hypot(x,y);col.multiplyScalar(.94+.035*Math.sin(a*44+r*13));});
  }
  const ey=c.owl?.086:.098,ez=hz-(c.owl?.124:.040),rad=c.owl?.0175:c.raptor?.0095:.0078,angle=c.owl?-side*.10:-side*1.18,ex=c.owl?.043:skullSideX('bird',(ey-y)/scale[1],(ez-hz)/scale[2])*scale[0]-rad*.15+(c.macaw?.001:0);
  if(c.macaw){cheekPatch(skin,c,{hz,y,scale},side);for(let j=0;j<3;j++)tube(skin,0x816f60,[[side*(skullSideX('bird',(.067+j*.006-y)/scale[1],-.053/scale[2])*scale[0]+.001),.067+j*.006,hz-.053],[side*(skullSideX('bird',(.069+j*.006-y)/scale[1],-.032/scale[2])*scale[0]+.001),.069+j*.006,hz-.032],[side*(skullSideX('bird',(.070+j*.006-y)/scale[1],-.007/scale[2])*scale[0]+.001),.070+j*.006,hz-.007]],.00065,8);}
  iris(eyes,wet,[side*ex,ey,ez],rad,c.owl?0xc9ad39:c.raptor?0x987139:c.toucan?0x648367:0x4d4331,[0,angle,0]);
 }
 const length=c.toucan?.31:c.heron?.23:c.macaw?.108:c.owl?.070:c.raptor?.089:kind==='seed'?.051:.10,width=c.toucan?.061:c.macaw?.042:c.owl?.021:c.raptor?.026:.019,base=hz-.085;
 for(const lower of[false,true])add(skin,asset(kind+(lower?'-lower':'-upper')),lower?(c.macaw?0x2d2b25:new T.Color(c.beak).multiplyScalar(.75).getHex()):c.beak,[0,.079-(lower?.006:0),base],[width,width,length],[0,0,0],(col,x,y,z,u,v)=>{if(c.toucan)col.lerp(new T.Color(v>.70?0xbd573b:0xd6c648),v>.7?.76:.25);else if(v>.80)col.multiplyScalar(.79);});
 for(const side of[-1,1])oval(eyes,0x211f1b,[side*width*.64,.079+width*.14,base-length*.19],[.0018,.0013,.003]);
 return {skin:joinWildlifeDetail(skin),eyes:joinWildlifeDetail(eyes),wet:joinWildlifeDetail(wet)};
}

export function buildGroomedFur(c){
 if(c.kind==='seal')return null;
 const positions=[],colors=[],uv=[],r=random(c.coat),coat=new T.Color(c.coat),belly=new T.Color(c.belly),count=['fox','reindeer'].includes(c.kind)?2100:1400;
 for(let i=0;i<count;i++){const t=.09+r()*.82,a=r()*Math.PI*2,base=bodySurface(c,t,a),{x,y,z}=base,n=new T.Vector3(Math.sin(a),Math.cos(a),0),length=(['fox','reindeer'].includes(c.kind)?.016:.008)*(.6+r()),w=.0008+r()*.0008,end=base.clone().addScaledVector(n,length*.12).add(new T.Vector3(0,-length*.18,length)),mid=base.clone().lerp(end,.5).addScaledVector(n,length*.09),tangent=new T.Vector3(Math.cos(a),-Math.sin(a),0).multiplyScalar(w);
  const verts=[base.clone().sub(tangent),base.clone().add(tangent),mid.clone().sub(tangent),base.clone().add(tangent),mid.clone().add(tangent),mid.clone().sub(tangent),mid.clone().sub(tangent),mid.clone().add(tangent),end];
  const color=coat.clone().lerp(belly,Math.cos(a)<-.3?.5:0).multiplyScalar(.94+r()*.12);
  if(c.kind==='cat'){const spot=Math.sin(z*38+x*7)*Math.sin(x*31-y*9);if(spot>.60)color.multiplyScalar(.27);}
  for(const v of verts){positions.push(v.x,v.y,v.z);colors.push(color.r,color.g,color.b);uv.push(0,0);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.computeBoundingSphere();return g;
}

export function installWildlifeDetails(world,buildGround,buildBird){
 const art=world.wildlifeArt;let quality='High',built=false,closeSubjects=0;const bindings=[],swaps=[],geometries=new Set(),materials=new Set(),matrix=new T.Matrix4(),root=new T.Group(),airRoot=new T.Group();root.name='Ultra+ close ground wildlife anatomy';airRoot.name='Ultra+ close airborne wildlife anatomy';root.visible=airRoot.visible=false;art.root.add(root);art.air.add(airRoot);
 function detailMaterial(type){const m=type==='wet'?new T.MeshPhysicalMaterial({vertexColors:true,roughness:.08,clearcoat:1,clearcoatRoughness:.035,transparent:true,opacity:.06,depthWrite:false}):new T.MeshStandardMaterial({vertexColors:true,roughness:type==='eyes'?.30:.94,side:T.DoubleSide});materials.add(m);return m;}
 function attach(source,geometry,type,range=110,space='ground'){if(!geometry)return;geometries.add(geometry);const mesh=new T.InstancedMesh(geometry,detailMaterial(type),source.instanceMatrix.count);mesh.name=source.name+' detailed '+type;mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=type==='fur';mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);(space==='air'?airRoot:root).add(mesh);bindings.push({source,mesh,range,space});}
 function replace(mesh,g){swaps.push({mesh,low:mesh.geometry,high:g});geometries.add(g);}
 function ensure(){if(built)return;built=true;
  for(const set of art.groundSets){const model=buildGround(set.model.name,{ultra:true});replace(set.parts.head,model.parts.head);for(const [k,g]of Object.entries(model.parts))if(k!=='head'&&g)g.dispose();attach(set.parts.head,model.detail.eyes,'eyes');attach(set.parts.head,model.detail.wet,'wet');attach(set.parts.head,model.detail.fur,'fur',65);attach(set.parts.body,buildGroomedFur(model.config),'fur',65);}
  for(const set of art.birdSets){const model=buildBird(set.model.name,{ultra:true});replace(set.body,model.body);replace(set.wings,model.wing);replace(set.leftWings,model.leftWing);attach(set.body,model.detail.eyes,'eyes',150,'air');attach(set.body,model.detail.wet,'wet',150,'air');}
  if(world.bindRoute)world.bindRoute(root);
  // Aerial paths use the source bird's coordinate space. Do not road-bend its
  // eyes when the existing body/wing materials are intentionally unbent.
  if(world.bindRoute&&art.birdSets[0]?.body.material.customProgramCacheKey().includes(':route-art-'))world.bindRoute(airRoot);
 }
 function refresh(){const active=quality==='Ultra+';if(active)ensure();root.visible=airRoot.visible=active;closeSubjects=0;for(const s of swaps)s.mesh.geometry=active?s.high:s.low;
  for(const b of bindings){let n=0;if(active&&b.source.visible)for(let i=0;i<b.source.count;i++){b.source.getMatrixAt(i,matrix);const e=matrix.elements;if(e[12]**2+(e[13]-2)**2+(e[14]-5)**2>b.range*b.range)continue;b.mesh.setMatrixAt(n++,matrix);}b.mesh.count=n;b.mesh.visible=active&&n>0;b.mesh.instanceMatrix.needsUpdate=true;if(b.mesh.material.roughness===.30)closeSubjects+=n;}
 }
 const oldQuality=world.quality;world.quality=q=>{oldQuality(q);quality=q;refresh();};
 const oldUpdate=world.update;world.update=(...args)=>{oldUpdate(...args);refresh();};
 const oldDifficulty=world.setNatureDifficulty;world.setNatureDifficulty=(...args)=>{oldDifficulty(...args);refresh();};
 const routeBound=mesh=>(Array.isArray(mesh.material)?mesh.material:[mesh.material]).every(m=>m.customProgramCacheKey().includes(':route-art-'));
 const oldDetails=world.details;world.details=()=>({...oldDetails(),wildlifeUltraDetail:{active:quality==='Ultra+',built,closeSubjects,transportAgreement:bindings.every(b=>routeBound(b.mesh)===routeBound(b.source)),groundRouteBound:built&&bindings.filter(b=>b.space==='ground').every(b=>routeBound(b.mesh)),airUnbent:built&&bindings.filter(b=>b.space==='air').every(b=>!routeBound(b.mesh)&&!routeBound(b.source)),extraBatches:bindings.filter(b=>b.mesh.visible).length,blenderComponents:22,geometryTriangles:[...geometries].reduce((n,g)=>n+(g.index?.count??g.attributes.position.count)/3,0),features:['recessed smaller iris/pupil and upper lids','continuous Blender skull, jaw and muzzle; rooted cupped ears','directional fur and whiskers','Blender hooked/spear/conical bills','asymmetric layered feathers with shafts and barbs'],limits:'Stylized authored anatomy; no scanned animals, skeletal skinning or simulated individual hair'}});
 const oldDispose=world.disposeWildlifeArt;world.disposeWildlifeArt=()=>{for(const s of swaps)s.mesh.geometry=s.low;root.removeFromParent();airRoot.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());oldDispose();};
 world.wildlifeUltraDetail={root,airRoot,refresh,bindings,swaps};return world;
}
