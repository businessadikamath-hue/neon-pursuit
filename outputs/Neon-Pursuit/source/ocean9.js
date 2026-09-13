import * as T from 'three';

// Original analytic long-wave displacement and short-wave normals. The existing
// planar reflection targets/capture schedule and quality budgets are retained.
const oldWave='vec4( position.x, position.y, position.z + sin(position.x*.065 + time*.9)*.32 + sin(position.y*.095-time*.7)*.18 + sin(position.x*.11+position.y*.08-time*1.3)*.09, 1.0 )';
let normalTexture9;
function windNormals9(){if(normalTexture9)return normalTexture9;const n=512,data=new Uint8Array(n*n*4),waves=[[2,1,.26,.5],[1,3,.19,2.8],[4,-2,.14,4.2],[7,5,.10,1.7],[11,-8,.075,3.1],[17,13,.052,.9],[23,-17,.036,2.2],[31,19,.025,5.1]];for(let y=0;y<n;y++)for(let x=0;x<n;x++){let dx=0,dy=0;for(const [a,b,amp,phase]of waves){const c=Math.cos((a*x+b*y)*Math.PI*2/n+phase),len=Math.hypot(a,b);dx+=a/len*amp*c;dy+=b/len*amp*c;}const v=new T.Vector3(-dx*.52,-dy*.36,1).normalize(),i=(y*n+x)*4;data.set([Math.round(v.x*127+128),Math.round(v.y*127+128),Math.round(v.z*127+128),255],i);}normalTexture9=new T.DataTexture(data,n,n);normalTexture9.wrapS=normalTexture9.wrapT=T.RepeatWrapping;normalTexture9.generateMipmaps=true;normalTexture9.minFilter=T.LinearMipmapLinearFilter;normalTexture9.magFilter=T.LinearFilter;normalTexture9.anisotropy=8;normalTexture9.userData.artShared=true;normalTexture9.needsUpdate=true;return normalTexture9;}
const coastBoundary9=`uniform float routeDistance9;
float coastCurve9(float s){return 55.*sin(s/260.)+22.*sin(s/115.);}
float coastOffset9(float z){float a=-z;float tangent=55./260.*cos(routeDistance9/260.)+22./115.*cos(routeDistance9/115.);return coastCurve9(routeDistance9+a)-coastCurve9(routeDistance9)-tangent*a;}
`;
const waveFunction=`varying vec2 oceanUndeformed9;
vec3 oceanPosition9(vec3 p){
 vec2 sea=vec2(p.x-890.,-p.y-520.);oceanUndeformed9=sea;
 vec2 d1=normalize(vec2(.94,.34)),d2=normalize(vec2(.67,-.74));
 float a=dot(sea,d1)*.0403-time*.70,b=dot(sea,d2)*.0731-time*.94;
 float c=dot(sea,normalize(vec2(-.22,.98)))*.126-time*1.38+1.7,d=dot(sea,normalize(vec2(.97,-.24)))*.186-time*1.92+3.1;
 p.z+=.30*sin(a)+.115*sin(b)+.045*sin(c)+.020*sin(d);
 p.x+=d1.x*.095*cos(a)+d2.x*.034*cos(b)-.018*sin(c);
 p.y-=d1.y*.095*cos(a)+d2.y*.034*cos(b)+.012*sin(d);
 p.x+=coastOffset9(sea.y)*exp(-max(0.,-sea.x-40.)/140.);return p;
}
`;
const foamFragment=`varying vec3 w;varying vec2 shoreCoords9;uniform float time,illumination9;
float hash9(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise9(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash9(i),hash9(i+vec2(1.,0.)),f.x),mix(hash9(i+vec2(0.,1.)),hash9(i+1.),f.x),f.y);}
void main(){
 float shore=shoreCoords9.x+46.8+sin(shoreCoords9.y*.027)*.75;
 float breakup=noise9(shoreCoords9*.24+vec2(0.,time*.08));
 float phase=shore*.92-time*.76+sin(shoreCoords9.y*.047)*.72+breakup*.85;
 float crest=pow(max(0.,sin(phase)),13.);
 float wake=pow(max(0.,sin(phase-.55)),3.)*.22;
 float lace=smoothstep(.31,.60,noise9(shoreCoords9*2.5+time*.05)+noise9(shoreCoords9*.81)*.24);
 float band=exp(-abs(shore)*.27),foamPatch9=smoothstep(.18,.65,breakup);
 float alpha=(crest+wake)*band*lace*(.27+foamPatch9*.68);
 vec3 c=mix(vec3(.45,.58,.57),vec3(.81,.84,.79),crest)*illumination9;
 gl_FragColor=vec4(c,alpha*.68);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
function patch(w){if(!w||w.userData.ocean9)return;w.userData.ocean9=true;const m=w.material;
 m.uniforms.routeDistance9={value:0};m.uniforms.normalSampler.value=windNormals9();m.vertexShader=coastBoundary9+m.vertexShader.replace('void main()',waveFunction+'\nvoid main()').replaceAll(oldWave,'vec4(oceanPosition9(position),1.0)');
m.fragmentShader='varying vec2 oceanUndeformed9;\n'+m.fragmentShader.replace('vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );',`vec2 d1=normalize(vec2(.94,.34)),d2=normalize(vec2(.67,-.74)),d3=normalize(vec2(-.22,.98)),d4=normalize(vec2(.97,-.24));
 float waveA=dot(oceanUndeformed9,d1)*.0403-time*.70,waveB=dot(oceanUndeformed9,d2)*.0731-time*.94,waveC=dot(oceanUndeformed9,d3)*.126-time*1.38+1.7,waveD=dot(oceanUndeformed9,d4)*.186-time*1.92+3.1;
 vec2 gradient9=d1*.0128*cos(waveA)+d2*.0088*cos(waveB)+d3*.0058*cos(waveC)+d4*.0032*cos(waveD);
 vec2 microSlope9=vec2(0.);
 float phase0=dot(oceanUndeformed9,vec2(.251617,.106382))-time*1.637045;microSlope9+=vec2(.921061,.389418)*.020*cos(phase0);
 float phase1=dot(oceanUndeformed9,vec2(.230286,.360087))-time*2.047697+1.717;microSlope9+=vec2(.538771,.842452)*.015*cos(phase1);
 float phase2=dot(oceanUndeformed9,vec2(.669093,-.354090))-time*2.725118+3.434;microSlope9+=vec2(.883862,-.467747)*.014*cos(phase2);
 float phase3=dot(oceanUndeformed9,vec2(.553622,1.100600))-time*3.476477+5.151;microSlope9+=vec2(.449369,.893346)*.012*cos(phase3);
 float phase4=dot(oceanUndeformed9,vec2(2.100139,.532577))-time*4.610260+6.868;microSlope9+=vec2(.969318,.245811)*.010*cos(phase4);
 float phase5=dot(oceanUndeformed9,vec2(3.619903,-.294945))-time*5.968997+8.585;microSlope9+=vec2(.996697,-.081210)*.008*cos(phase5);
 vec3 surfaceNormal=normalize(vec3(-gradient9.x-microSlope9.x,1.,-gradient9.y-microSlope9.y));`);
 m.fragmentShader=m.fragmentShader.replace('vec3 shallow=vec3(.035,.34,.32),deep=waterColor*.65;','vec3 shallow=vec3(.043,.19,.16),deep=waterColor*.54;');
 m.uniforms.distortionScale.value=.02;m.needsUpdate=true;
}
export function installOcean9(world,biome){if(biome!=='coastline')return world;
 const lowWater=world.water.material;lowWater.uniforms.routeDistance9={value:0};lowWater.vertexShader=coastBoundary9+lowWater.vertexShader.replace('vec4 w=modelMatrix*vec4(p,1.);vWorld=w.xyz;','vec4 w=modelMatrix*vec4(p,1.);w.x+=coastOffset9(w.z)*exp(-max(0.,-w.x-40.)/140.);vWorld=w.xyz;');lowWater.needsUpdate=true;
 const foam=world.ocean().foam;if(foam){foam.material.uniforms.illumination9={value:1};foam.material.uniforms.routeDistance9={value:0};foam.material.vertexShader=coastBoundary9+'varying vec3 w;varying vec2 shoreCoords9;void main(){w=(modelMatrix*vec4(position,1.)).xyz;shoreCoords9=w.xz;w.x+=coastOffset9(w.z);gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}';foam.material.fragmentShader=foamFragment;foam.material.needsUpdate=true;}
 const quality=world.quality;world.quality=q=>{quality(q);patch(world.ocean().water);};
 const lighting=world.lighting;world.lighting=day=>{lighting(day);if(foam)foam.material.uniforms.illumination9.value=day==='night'?.065:day==='morning'?.84:1;};
 const update=world.update;world.update=(distance,time,x)=>{update(distance,time,x);lowWater.uniforms.routeDistance9.value=distance;const water=world.ocean().water;if(water?.material.uniforms.routeDistance9)water.material.uniforms.routeDistance9.value=distance;if(foam)foam.material.uniforms.routeDistance9.value=distance;};
 const details=world.details;world.details=()=>({...details(),oceanPresentation9:{active:!['Game Only','Low'].includes(world.preset),waveModel:'two analytic long swells with paired normals, mipmapped eight-direction wind ripples',foam:'broken cellular shore wash with receding lace, matched to the curved sea-level shore',normalResolution:512,shoreSeaLevel:true,reflectionScheduleChanged:false,original:true}});
 return world;
}
