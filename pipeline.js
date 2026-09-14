import * as T from 'three';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';
export function pipeline(renderer){
 const target=new T.WebGLRenderTarget(1,1),scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,1);
 const fx=new T.ShaderMaterial({uniforms:T.UniformsUtils.clone(FXAAShader.uniforms),vertexShader:FXAAShader.vertexShader,fragmentShader:FXAAShader.fragmentShader.replace('gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );','gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );\n#include <colorspace_fragment>'),depthTest:false,depthWrite:false});
 const plain=new T.MeshBasicMaterial({map:target.texture,depthTest:false,depthWrite:false,toneMapped:false});const quad=new T.Mesh(new T.PlaneGeometry(2,2),plain);scene.add(quad);
 return {resize(p){const size=renderer.getDrawingBufferSize(new T.Vector2());if(target.samples!==p.samples){target.dispose();target.samples=Math.min(p.samples,renderer.capabilities.maxSamples)}target.setSize(size.x,size.y);fx.uniforms.tDiffuse.value=target.texture;fx.uniforms.resolution.value.set(1/size.x,1/size.y);quad.material=p.fxaa?fx:plain;},begin(){renderer.setRenderTarget(target)},end(){renderer.setRenderTarget(null);renderer.setViewport(0,0,innerWidth,innerHeight);renderer.render(scene,camera)}};
}
