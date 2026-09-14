import * as T from 'three';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';
export function pipeline(renderer){
 const target=new T.WebGLRenderTarget(1,1);target.depthTexture=new T.DepthTexture(1,1);target.depthTexture.type=T.UnsignedIntType;
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,1);
 const extra=`uniform sampler2D sceneDepth;uniform float nearPlane,farPlane,clockTime,biomeId,detailLevel;uniform mat4 invProjection,viewWorld;uniform vec3 fogTint;
 float viewDepth(vec2 u){float z=texture2D(sceneDepth,u).x;return nearPlane*farPlane/(farPlane-z*(farPlane-nearPlane));}
 vec4 atmosphere(vec2 uv){float distance=viewDepth(uv);vec2 warped=uv;
 if(biomeId>1.5&&biomeId<2.5&&distance>25.){float strength=smoothstep(25.,160.,distance)*.00065;warped.x+=sin(uv.y*330.+clockTime*2.1)*sin(uv.x*24.+clockTime*.7)*strength;}
 vec4 color=ApplyFXAA(tDiffuse,resolution,warped);
 float shade=0.;for(int i=0;i<12;i++){if(float(i)>=4.+detailLevel*2.)break;float angle=float(i)*6.28318/(4.+detailLevel*2.);vec2 offset=vec2(cos(angle),sin(angle))*resolution*5.;float delta=distance-viewDepth(uv+offset);shade+=smoothstep(.035,.22,delta)*(1.-smoothstep(.8,2.8,delta));}color.rgb*=1.-shade*(.376/(4.+detailLevel*2.));
 vec4 ray4=invProjection*vec4(uv*2.-1.,1.,1.);vec3 ray=normalize((viewWorld*vec4(normalize(ray4.xyz/ray4.w),0.)).xyz);vec3 origin=viewWorld[3].xyz;
 float path=min(distance/max(.1,-normalize(ray4.xyz).z),420.),density=0.;for(int j=0;j<10;j++){if(float(j)>=3.+detailLevel*1.5)break;float d=(float(j)+.5)*path/(3.+detailLevel*1.5);vec3 p=origin+ray*d;float layer=exp(-max(0.,p.y)*.095);float billow=.72+.20*sin(p.x*.07+p.z*.035+clockTime*.08)*sin(p.z*.021-clockTime*.045);density+=layer*billow*path/(3.+detailLevel*1.5);}
 float amount=1.-exp(-density*(biomeId>2.5?.0027:biomeId>.5&&biomeId<1.5?.0012:.00065));color.rgb=mix(color.rgb,fogTint,amount);
 color.rgb*=1.-.09*pow(length(uv-.5),2.);if(detailLevel>3.){float luma=dot(color.rgb,vec3(.2126,.7152,.0722));color.rgb=mix(vec3(luma),color.rgb,1.10);float sun=pow(max(0.,1.-length(uv-vec2(.72,.24))*2.2),7.);color.rgb+=vec3(1.0,.72,.42)*sun*.045;color.rgb=clamp(color.rgb,0.,1.);};return color;}
 `;
 const uniforms={...T.UniformsUtils.clone(FXAAShader.uniforms),detailLevel:{value:0},sceneDepth:{value:target.depthTexture},nearPlane:{value:.1},farPlane:{value:2200},clockTime:{value:0},biomeId:{value:0},invProjection:{value:new T.Matrix4()},viewWorld:{value:new T.Matrix4()},fogTint:{value:new T.Color(0x9facad)}};
 const fragment=FXAAShader.fragmentShader.replace('void main()',extra+'\nvoid main()').replace('gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );','gl_FragColor = atmosphere(vUv);\n#include <colorspace_fragment>');
 const fx=new T.ShaderMaterial({uniforms,vertexShader:FXAAShader.vertexShader,fragmentShader:fragment,depthTest:false,depthWrite:false});
 const plain=new T.MeshBasicMaterial({map:target.texture,depthTest:false,depthWrite:false,toneMapped:false}),quad=new T.Mesh(new T.PlaneGeometry(2,2),plain);scene.add(quad);
 return {resize(p){uniforms.detailLevel.value=p.postDetail??(p.shadow>=4096?2:p.shadow>=2048?1:0);const size=renderer.getDrawingBufferSize(new T.Vector2());if(target.samples!==p.samples){target.dispose();target.samples=Math.min(p.samples,renderer.capabilities.maxSamples)}target.setSize(size.x,size.y);fx.uniforms.tDiffuse.value=target.texture;fx.uniforms.resolution.value.set(1/size.x,1/size.y);quad.material=p.fxaa?fx:plain;},begin(view,biome,time,day){view.updateMatrixWorld();uniforms.invProjection.value.copy(view.projectionMatrixInverse);uniforms.viewWorld.value.copy(view.matrixWorld);uniforms.clockTime.value=time;uniforms.biomeId.value={coastline:0,tundra:1,desert:2,jungle:3}[biome];uniforms.fogTint.value.set({coastline:0xaabfc4,tundra:0x9cb6c8,desert:0xcbb38c,jungle:0x668579}[biome]);uniforms.fogTint.value.multiplyScalar(day==='night'?.07:1);renderer.setRenderTarget(target)},end(){renderer.setRenderTarget(null);renderer.setViewport(0,0,innerWidth,innerHeight);renderer.render(scene,camera)}};
}
