// Offline renderer: the shipped site plays a compressed film, never this scene.
async function createGateRenderer(canvas) {
  const gl = canvas.getContext('webgl2', {alpha:true, antialias:true, preserveDrawingBuffer:true});
  if (!gl) throw Error('WebGL2 required for export');
  function shader(type, source) { const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s; }
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,`#version 300 es
    in vec3 p; in vec2 uv; in vec3 normal; in vec4 tint;
    uniform float camera; out vec2 tex; out vec3 n; out vec4 color;
    void main(){float w=camera+p.z;gl_Position=vec4(p.x*1.5,(p.y+.7)*2.6666667,1.00334*w-.200334,w);tex=uv;n=normal;color=tint;}`));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`#version 300 es
    precision highp float; uniform sampler2D picture; in vec2 tex; in vec3 n; in vec4 color; out vec4 outColor;
    void main(){vec4 c=texture(picture,tex)*color;if(c.a<.015)discard;
      float shade=.66+.34*max(0.,dot(normalize(n),normalize(vec3(-.45,.7,-1.))));
      outColor=vec4(c.rgb*shade,c.a);}`));
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const stride=12*4, buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(const [name,size,offset] of [['p',3,0],['uv',2,3],['normal',3,5],['tint',4,8]]){const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,stride,offset*4);}
  const images=await Promise.all(['madera-v3.png'].map(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;})));
  const textures=images.map(img=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;});
  const sub=(a,b)=>a.map((v,i)=>v-b[i]), cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], norm=v=>{const d=Math.hypot(...v);return v.map(x=>x/d);};
  let mesh=[];
  function tri(a,b,c,uvs,color=[1,1,1,1],normals){const n=norm(cross(sub(b,a),sub(c,a)));[a,b,c].forEach((p,i)=>mesh.push(...p,...uvs[i],...(normals?.[i]||n),...color));}
  function quad(points,uv=[0,0,1,1],color=[1,1,1,1]){const [u,v,w,h]=uv,tex=[[u,v],[u+w,v],[u+w,v+h],[u,v+h]];tri(points[0],points[1],points[2],tex.slice(0,3),color);tri(points[0],points[2],points[3],[tex[0],tex[2],tex[3]],color);}
  function draw(texture){gl.bindTexture(gl.TEXTURE_2D,textures[texture]);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh),gl.STREAM_DRAW);gl.drawArrays(gl.TRIANGLES,0,mesh.length/12);mesh=[];}
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  const metalUV=[.11,.195,.06,.055];
  function leaf(side,angle){
    const c=Math.cos(angle),s=Math.sin(angle), width=5.68,height=6.34;
    const point=([x,y,z])=>[side*width-side*x*c-side*z*s,2.57-y,-x*s+z*c];
    // Keep front winding toward the camera on either leaf.
    const face=(pts,uv,col)=>quad(side<0?pts.map(point):[pts[1],pts[0],pts[3],pts[2]].map(point),uv,col);
    function box(x,y,w,h,front,back,uv=metalUV,color=[1,1,1,1]) {
      const a=[x,y,front],b=[x+w,y,front],c=[x+w,y+h,front],d=[x,y+h,front];
      face([a,b,c,d],uv,color);
      face([[x+w,y,back],b,c,[x+w,y+h,back]],metalUV,[.8,.65,.45,1]);
      face([[x,y,back],a,d,[x,y+h,back]],metalUV,[.75,.6,.42,1]);
      face([[x,y,back],[x+w,y,back],b,a],metalUV,color);
      face([d,c,[x+w,y+h,back],[x,y+h,back]],metalUV,[.68,.53,.35,1]);
    }
    // Timber has a broad dark end grain, with a narrow lit bevel along its edge.
    box(0,0,width,height,0,.78,side<0?[0,0,.5,1]:[.5,0,.5,1]);
    face([[width-.055,0,-.018],[width,0,.055],[width,height,.055],[width-.055,height,-.018]],[.484,0,.012,1],[1.12,1.02,.84,1]);
    for(const [y,h] of [[.178*height,.1*height],[.774*height,.105*height]]) {
      box(0,y,width,h,-.16,0,side<0?[0,y/height,.5,h/height]:[.5,y/height,.5,h/height]);
      for(const x of [.16,.406,.653,.896].map(u=>u*width)) {
        const r=.12,cy=y+h*.48,tip=[x,cy,-.285];
        const base=[[x-r,cy-r,-.16],[x+r,cy-r,-.16],[x+r,cy+r,-.16],[x-r,cy+r,-.16]];
        for(let i=0;i<4;i++){const pts=[base[i],base[(i+1)%4],tip].map(point);if(side>0)pts.reverse();tri(...pts,[[.13,.22],[.15,.22],[.14,.235]],[1.16,1.03,.8,1]);}
      }
    }
    // Raised knocker plate and a solid ring: light changes over the curved metal.
    const cx=4.18,cy=3.72;
    box(cx-.29,cy-.61,.58,.73,-.12,0,metalUV,[.68,.65,.58,1]);
    box(cx-.25,cy-.57,.50,.65,-.17,-.12,metalUV,[.85,.8,.7,1]);
    // Soft painted contact shadow cast by the ring on the oak.
    const ring=(shadow=false)=>{
      const R=.45,r=shadow?.11:.075;
      for(let i=0;i<64;i++)for(let j=0;j<(shadow?1:12);j++){
        const sample=(a,b)=>{const phi=a/64*Math.PI*2,theta=shadow?b*Math.PI:b/12*Math.PI*2;
          return [cx+(R+r*Math.cos(theta))*Math.cos(phi)+(shadow?.035:0),cy+(R+r*Math.cos(theta))*Math.sin(phi)+(shadow?.07:0),shadow?-.025:-.34+r*Math.sin(theta)];};
        const pts=[sample(i,j),sample(i+1,j),sample(i+1,j+1),sample(i,j+1)];
        const world=pts.map(point), col=shadow?[.12,.09,.06,.28]:[1.25,1.1,.86,1];
        const tex=pts.map(p=>[.11+(p[0]-cx+R+r)/(2*(R+r))*.06,.196+(p[1]-cy+R+r)/(2*(R+r))*.05]);
        const ns=pts.map(p=>{const a=Math.atan2(p[1]-cy,p[0]-cx);const local=norm([p[0]-cx-R*Math.cos(a),p[1]-cy-R*Math.sin(a),p[2]+.34]);return [-side*local[0]*c-side*local[2]*s,-local[1],-local[0]*s+local[2]*c];});
        tri(world[0],world[1],world[2],tex.slice(0,3),col,shadow?undefined:ns.slice(0,3));
        tri(world[0],world[2],world[3],[tex[0],tex[2],tex[3]],col,shadow?undefined:[ns[0],ns[2],ns[3]]);
      }
    };
    ring(true);ring();
    box(cx-.095,cy-.55,.19,.22,-.49,-.17,metalUV,[1.2,1.06,.8,1]);
    // Hinge barrels project past the door, not painted onto its face.
    for(const y of [1.16,5.0])for(let i=0;i<20;i++){
      const p=a=>[.04+Math.cos(a)*.13,y,-.03+Math.sin(a)*.13],a=i/20*Math.PI*2,b=(i+1)/20*Math.PI*2;
      const A=p(a),B=p(b);face([A,B,[B[0],y+.58,B[2]],[A[0],y+.58,A[2]]],metalUV,[1,.86,.65,1]);
    }
  }
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
  return progress=>{
    gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);if(progress>=.999)return;
    const walk=smooth((progress-.55)/.45),camera=8.5-7.8*walk,swing=smooth((progress-.035)/.74);
    gl.uniform1f(gl.getUniformLocation(program,'camera'),camera);
    // Only the solid door leaves: the courtyard is visible directly behind them.
    leaf(-1,swing*1.63);leaf(1,swing*1.63*(.975+.025*swing));draw(0);
  };
}

