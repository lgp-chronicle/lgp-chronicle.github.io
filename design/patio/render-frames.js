// Offline camera/geometry renderer. The website only plays the exported frames.
async function createGateRenderer(canvas) {
  const ctx=canvas.getContext('2d'), W=canvas.width,H=canvas.height;
  const images=await Promise.all(['marco-v2.png','puerta-fortaleza.png'].map(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src})));
  const [frame,wood]=images;
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
  let camera=12;
  const project=([x,y,z])=>[W*.5+x*W/16*12/(camera+z),H*.5-y*H/9*12/(camera+z)];
  function path(points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath()}
  function triangle(image,src,dst){
    const [a,b,c]=src,[p,q,r]=dst,den=a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]);
    if(Math.abs(den)<.0001)return;
    const coeff=(v0,v1,v2)=>[(v0*(b[1]-c[1])+v1*(c[1]-a[1])+v2*(a[1]-b[1]))/den,(v0*(c[0]-b[0])+v1*(a[0]-c[0])+v2*(b[0]-a[0]))/den,(v0*(b[0]*c[1]-c[0]*b[1])+v1*(c[0]*a[1]-a[0]*c[1])+v2*(a[0]*b[1]-b[0]*a[1]))/den];
    const x=coeff(p[0],q[0],r[0]),y=coeff(p[1],q[1],r[1]);
    const center=[(p[0]+q[0]+r[0])/3,(p[1]+q[1]+r[1])/3];
    ctx.save();path(dst.map(v=>{const dx=v[0]-center[0],dy=v[1]-center[1],d=Math.hypot(dx,dy);return [v[0]+dx/d*.42,v[1]+dy/d*.42]}));ctx.clip();
    ctx.transform(x[0],y[0],x[1],y[1],x[2],y[2]);ctx.drawImage(image,0,0);ctx.restore();
  }
  function texture(image,at,uv,shade=0){
    const nx=16,ny=10;
    for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
      const u=x/nx,v=y/ny,U=(x+1)/nx,V=(y+1)/ny;
      const s=[[u,v],[U,v],[U,V],[u,V]].map(([a,b])=>[(uv[0]+a*uv[2])*image.width,(uv[1]+b*uv[3])*image.height]);
      const d=[[u,v],[U,v],[U,V],[u,V]].map(([a,b])=>project(at(a,b)));
      triangle(image,[s[0],s[1],s[2]],[d[0],d[1],d[2]]);triangle(image,[s[0],s[2],s[3]],[d[0],d[2],d[3]]);
    }
    if(shade){ctx.fillStyle='rgba(24,12,5,'+shade+')';path([[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>project(at(u,v))));ctx.fill()}
  }
  function leaf(side,angle){
    if(camera<7)return; // Both leaves are already outside the camera frustum.
    const hinge=side*5.68,depth=.56,c=Math.cos(angle),s=Math.sin(angle);
    const point=(u,v,z=0)=>[hinge-side*5.68*u*c-side*z*s,2.57-6.34*v,-5.68*u*s+z*c];
    const uv=side<0?[0,0,.5,1]:[.5,0,.5,1];
    const front=(u,v)=>point(side<0?u:1-u,v,0);
    const face=[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>project(point(u,v)));
    ctx.save();ctx.shadowBlur=22*W/1280;ctx.shadowOffsetX=-side*12;ctx.shadowOffsetY=12;ctx.shadowColor='#190c09a0';ctx.fillStyle='#21160e';path(face);ctx.fill();ctx.restore();
    // Cut end grain, underside and top have real thickness. Beveled edges catch the light.
    texture(wood,(u,v)=>point(1,v,u*depth),[.47,0,.035,1],.30);
    texture(wood,(u,v)=>point(u,0,v*depth),[0,.05,1,.03],.15);
    texture(wood,(u,v)=>point(u,1,v*depth),[0,.96,1,.03],.45);
    texture(wood,front,uv,.08+smooth(angle/1.6)*.17);
    ctx.strokeStyle=side<0?'#d9a85b88':'#e1af6666';ctx.lineWidth=1.5;path(face);ctx.stroke();
    // Raised transverse straps project ahead of the timber instead of flattening into it.
    for(const [v,span] of [[.178,.100],[.774,.105]]){
      const d=.065;
      const p=(u,t,z)=>point(side<0?u:1-u,v+t*span,z);
      texture(wood,(u,t)=>p(u,t,-d),[uv[0],v,uv[2],span],.05+smooth(angle/1.6)*.13);
      texture(wood,(u,t)=>p(u,1,-d+t*d),[uv[0],v+span-.015,uv[2],.015],.38);
    }
    // Solid hinge pins, seen next to the jamb as the leaves rotate away.
    for(const v of [.18,.78]){
      const a=project(point(.018,v,-.08)),b=project(point(.018,v+.10,-.08));
      const g=ctx.createLinearGradient(a[0]-5,a[1],a[0]+5,a[1]);g.addColorStop(0,'#4b2c10');g.addColorStop(.45,'#c9913f');g.addColorStop(1,'#51300f');
      ctx.strokeStyle=g;ctx.lineWidth=Math.max(2,W/1280*8*12/(camera+.1));ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
    }
  }
  return progress=>{
    ctx.clearRect(0,0,W,H);
    const swing=smooth((progress-.04)/.72),walk=smooth((progress-.55)/.45);
    camera=12-11.3*walk;
    const angle=swing*1.63;
    if(progress<.999){
      // The right leaf trails the left slightly, then both clear the doorway together.
      leaf(1,angle*(.97+.03*swing));leaf(-1,angle);
      const scale=12/camera;
      ctx.drawImage(frame,W*(1-scale)/2,H*(1-scale)/2,W*scale,H*scale);
    }
  };
}
