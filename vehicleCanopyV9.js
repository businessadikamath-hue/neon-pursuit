import * as T from 'three';

// Original fitted glazing. Top and side panels share exactly the same boundary;
// painted frames are thin patches on that surface, not round rods over a bubble.
export function fittedCanopy(root,profile,paint,glass,seal,sample){
 const sections=profile.cabin,a=sections[0],b=sections[1],c=sections.at(-2),d=sections.at(-1);
 const point=(z,u,side=0,offset=0)=>{
  const s=sample(sections,z),roof=s[5]*.95,base=s[2]+.027,crown=Math.max(s[4],base+.032),edge=crown-.026;
  if(side){const bulge=Math.min(.012,(edge-base)*.18),x=(s[1]*.98)*(1-u)+roof*u,y=base*(1-u)+edge*u+bulge*Math.sin(Math.PI*u);return [side*(x+offset),y,z];}
  return [u*roof,crown-.026*u*u+offset,z];
 };
 function patch(z0,z1,u0,u1,side,mat,offset=0,nz=28,nu=10){
  const positions=[],uv=[],indices=[];
  for(let i=0;i<=nz;i++)for(let j=0;j<=nu;j++){positions.push(...point(z0+(z1-z0)*i/nz,u0+(u1-u0)*j/nu,side,offset));uv.push(j/nu,i/nz);}
  for(let i=0;i<nz;i++)for(let j=0;j<nu;j++){const k=i*(nu+1)+j;if(side>0)indices.push(k,k+1,k+nu+1,k+1,k+nu+2,k+nu+1);else indices.push(k,k+nu+1,k+1,k+1,k+nu+1,k+nu+2);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new T.Mesh(geometry,mat);mesh.castShadow=mat===paint;mesh.receiveShadow=true;root.add(mesh);return mesh;
 }
 patch(a[0],d[0],-1,1,0,glass);
 for(const side of [-1,1]){
  patch(a[0],d[0],0,1,side,glass);
  patch(a[0],d[0],0,.045,side,seal,.004,28,1);
  patch(a[0],d[0],.947,1,side,paint,.004,28,1);
  // A and C pillars follow the windshield rake with a broad painted landing.
  for(const [z0,z1] of [[a[0],a[0]+.043],[b[0]-.035,b[0]+.012],[c[0]-.013,c[0]+.046],[d[0]-.065,d[0]]])patch(z0,z1,0,1,side,paint,.005,3,8);
  if(c[0]-b[0]>1.2){const z=b[0]+(c[0]-b[0])*.53;patch(z-.028,z+.028,0,1,side,seal,.006,2,8);}
 }
 // A continuous crowned roof uses the exact same glass surface beneath it.
 if(profile.roof){const [front,rear]=profile.roof;patch(front,rear,-1,1,0,paint,.006,24,12);}
 for(const [z0,z1] of [[a[0],a[0]+.035],[d[0]-.043,d[0]]])patch(z0,z1,-1,1,0,seal,.004,2,12);
 root.userData.glazingSource='Original fitted continuous canopy v9';
}
