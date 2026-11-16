import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';

const root = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#101923');
scene.fog = new THREE.Fog('#101923', 9, 19);
const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
camera.position.set(7.4, 6.3, 8.4);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7)); renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
root.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = .075; controls.minDistance = 5; controls.maxDistance = 15; controls.target.set(0, .2, 0);
scene.add(new THREE.HemisphereLight('#d7f4ff', '#29323a', 2.2));
const key = new THREE.DirectionalLight('#fff0d9', 3.5); key.position.set(4, 7, 5); scene.add(key);
const fill = new THREE.DirectionalLight('#58aaff', 1.35); fill.position.set(-5, 3, -4); scene.add(fill);
const crystal = new THREE.Group(); scene.add(crystal);
const layers = { atoms: new THREE.Group(), cell: new THREE.Group(), basal: new THREE.Group(), plane: new THREE.Group(), direction: new THREE.Group() };
Object.values(layers).forEach(g => crystal.add(g));
const A = 1.38, C = 2.24;
const basis = [[A,0],[-A/2,Math.sqrt(3)*A/2],[-A/2,-Math.sqrt(3)*A/2]];
const p3 = (x,y,z) => new THREE.Vector3(x,y,z);
const hexVertices = (z) => Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return p3(A*Math.cos(a),z,A*Math.sin(a));});
function line(group, pts, color, opacity=1, width=1){const g=new THREE.BufferGeometry().setFromPoints(pts);const m=new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity,linewidth:width});const o=new THREE.Line(g,m);group.add(o);return o;}
function addHexCell(){const lo=hexVertices(-C/2), hi=hexVertices(C/2);for(let i=0;i<6;i++){line(layers.cell,[lo[i],lo[(i+1)%6]],'#8da3a5',.62);line(layers.cell,[hi[i],hi[(i+1)%6]],'#8da3a5',.62);line(layers.cell,[lo[i],hi[i]],'#8da3a5',.62);}for(const v of lo.concat(hi)) layers.cell.add(new THREE.Mesh(new THREE.SphereGeometry(.026,8,8),new THREE.MeshBasicMaterial({color:'#b7d0c9'})));}
function addAtoms(){const mat=new THREE.MeshStandardMaterial({color:'#55d5b5',metalness:.35,roughness:.26,emissive:'#124e43',emissiveIntensity:.22});const gold=new THREE.MeshStandardMaterial({color:'#e8b879',metalness:.25,roughness:.3,emissive:'#543820',emissiveIntensity:.19});const sphere=new THREE.SphereGeometry(.145,20,16);const sites=[];for(let q=0;q<6;q++){const a=q*Math.PI/3;sites.push([A*Math.cos(a),-C/2,A*Math.sin(a)]);sites.push([A*Math.cos(a),C/2,A*Math.sin(a)]);}sites.push([0,-C/2,0],[0,C/2,0]);for(const b of basis){sites.push([b[0],0,b[1]]);sites.push([-b[0]/3,0,-b[1]/3]);}sites.forEach((v,i)=>{const m=new THREE.Mesh(sphere,i%4===0?gold:mat);m.position.set(...v);layers.atoms.add(m);});}
function addPlane(group, normal, color, opacity){const n=normal.clone().normalize();const lo=hexVertices(-C/2),hi=hexVertices(C/2),verts=[...lo,...hi],edges=[];for(let i=0;i<6;i++){edges.push([i,(i+1)%6],[i+6,(i+1)%6+6],[i,i+6]);}const points=[];const addUnique=p=>{if(!points.some(q=>q.distanceToSquared(p)<1e-8))points.push(p);};for(const [a,b] of edges){const va=verts[a],vb=verts[b],da=n.dot(va),db=n.dot(vb);if(Math.abs(da)<1e-7)addUnique(va.clone());if(da*db<0)addUnique(va.clone().lerp(vb,da/(da-db)));}if(points.length<3)return null;const center=points.reduce((s,p)=>s.add(p),p3(0,0,0)).multiplyScalar(1/points.length);const ref=points[0].clone().sub(center).normalize(),side=n.clone().cross(ref).normalize();points.sort((a,b)=>Math.atan2(a.clone().sub(center).dot(side),a.clone().sub(center).dot(ref))-Math.atan2(b.clone().sub(center).dot(side),b.clone().sub(center).dot(ref)));const positions=[];for(let i=1;i<points.length-1;i++)positions.push(...points[0].toArray(),...points[i].toArray(),...points[i+1].toArray());const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity,depthWrite:false}));group.add(mesh);line(group,[...points,points[0]],color,Math.min(1,opacity*3));return mesh;}
addHexCell();addAtoms();addPlane(layers.basal,p3(0,1,0),'#d9b75f',.13,3.6);
const grid=new THREE.GridHelper(8,16,'#344750','#26353d');grid.position.y=-1.32;grid.material.transparent=true;grid.material.opacity=.35;scene.add(grid);
const axes=new THREE.AxesHelper(1.45);axes.position.set(-2.1,-1.25,-1.7);scene.add(axes);
function fourField(input){const vals=input.trim().replace(/[()[\],]/g,' ').split(/\s+/).filter(Boolean).map(Number);if(vals.length!==4||vals.some(v=>!Number.isFinite(v)||!Number.isInteger(v)))return null;return vals;}
function millerPlaneNormal(h,k,i,l){const b1=p3(1,0,1/Math.sqrt(3)),b2=p3(0,0,2/Math.sqrt(3));return b1.multiplyScalar(h).add(b2.multiplyScalar(k)).add(p3(0,l*A/C,0));}
function millerDirection(u,v,t,w){const d=p3(0,0,0);[u,v,t].forEach((n,j)=>{d.x+=n*basis[j][0];d.z+=n*basis[j][1];});d.y=w*C;return d;}
function setIndicator(dir){const point=document.querySelector('#ipfPoint'),halo=document.querySelector('#ipfHalo');const baseX=110,baseY=145;let x=Math.atan2(Math.abs(dir.z),Math.abs(dir.x)+1e-8);let z=Math.atan2(Math.abs(dir.y),Math.hypot(dir.x,dir.z)+1e-8);x=Math.min(x,Math.PI/3)/(Math.PI/3);z=Math.min(z,1);const px=28+164*x,py=baseY-118*z*.68;point.setAttribute('cx',px);point.setAttribute('cy',py);halo.setAttribute('cx',px);halo.setAttribute('cy',py);document.querySelector('#ipfCoords').textContent=`IPF · ${x.toFixed(2)} / ${z.toFixed(2)}`;document.querySelector('#ipfDescription').textContent=dir.y===0?'基面内 ⟨a⟩ 方向':'含 c 轴分量的晶向';}
function update(){const plane=fourField(document.querySelector('#planeInput').value),dir=fourField(document.querySelector('#directionInput').value);const pe=document.querySelector('#planeError'),de=document.querySelector('#directionError');pe.textContent=plane?'':'请输入 4 个整数，例如 0 0 0 1';de.textContent=dir?'':'请输入 4 个整数，例如 1 1 -2 0';layers.plane.clear();layers.direction.clear();if(plane&&plane[0]+plane[1]+plane[2]!==0){pe.textContent='晶面指数须满足 h + k + i = 0';}else if(plane&&plane.some(x=>x!==0)){const n=millerPlaneNormal(...plane);if(n.length()>0)addPlane(layers.plane,n,'#ff9878',.2,4.7);document.querySelector('#normalValue').textContent=`[${n.x.toFixed(2)}, ${n.y.toFixed(2)}, ${n.z.toFixed(2)}]`;}
if(dir&&dir[0]+dir[1]+dir[2]!==0){de.textContent='晶向指数须满足 u + v + t = 0';}else if(dir&&dir.some(x=>x!==0)){const d=millerDirection(...dir);const unit=d.clone().normalize();line(layers.direction,[unit.clone().multiplyScalar(-2.65),unit.clone().multiplyScalar(2.65)],'#72aaff',1,2);const cone=new THREE.Mesh(new THREE.ConeGeometry(.09,.25,16),new THREE.MeshStandardMaterial({color:'#82b9ff',emissive:'#24538b'}));cone.position.copy(unit.clone().multiplyScalar(2.65));cone.quaternion.setFromUnitVectors(p3(0,1,0),unit);layers.direction.add(cone);const fmt=dir.map(v=>v<0?`−${Math.abs(v)}`:v).join(', ');document.querySelector('#directionValue').textContent=`[${fmt}]`;setIndicator(d);if(plane&&plane.every(Number.isInteger)){const n=millerPlaneNormal(...plane);const angle=Math.acos(THREE.MathUtils.clamp(Math.abs(n.normalize().dot(unit)),-1,1))*180/Math.PI;document.querySelector('#angleValue').textContent=`${angle.toFixed(1)}°`;document.querySelector('#relationValue').textContent=angle>89.5?'IN PLANE':'OUT OF PLANE';}}
}
document.querySelectorAll('.input-group input').forEach(el=>el.addEventListener('input',update));
document.querySelectorAll('.presets button').forEach(b=>b.addEventListener('click',()=>{document.querySelector('#planeInput').value=b.dataset.plane;document.querySelector('#directionInput').value=b.dataset.dir;update();}));
document.querySelectorAll('[data-layer]').forEach(el=>el.addEventListener('change',()=>layers[el.dataset.layer].visible=el.checked));
function setView(mode){if(mode==='top')camera.position.set(0,9,0.01);else if(mode==='side')camera.position.set(0,0.01,10);else camera.position.set(7.4,6.3,8.4);controls.target.set(0,.2,0);controls.update();document.querySelectorAll('.view-controls button').forEach(b=>b.classList.remove('selected'));document.querySelector(mode==='top'?'#viewTop':mode==='side'?'#viewSide':'#view3d').classList.add('selected');}
document.querySelector('#view3d').onclick=()=>setView('3d');document.querySelector('#viewTop').onclick=()=>setView('top');document.querySelector('#viewSide').onclick=()=>setView('side');document.querySelector('#resetView').onclick=()=>setView('3d');
function resize(){const w=root.clientWidth,h=root.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(root);resize();update();
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
let installEvent;const installBtn=document.querySelector('#installBtn');window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;installBtn.hidden=false;});installBtn.addEventListener('click',async()=>{if(!installEvent)return;installEvent.prompt();await installEvent.userChoice;installEvent=null;installBtn.hidden=true;});


// Local orientation and Schmid-factor tools. No server or materials database is used.
const orientationFields=['#rotX','#rotY','#rotZ'].map(s=>document.querySelector(s));
const loadFields=['#loadX','#loadY','#loadZ'].map(s=>document.querySelector(s));
function updateSchmid(){
  const plane=fourField(document.querySelector('#planeInput').value);
  const dir=fourField(document.querySelector('#directionInput').value);
  const load=loadFields.map(e=>Number(e.value));
  const out=document.querySelector('#schmidValue'), result=document.querySelector('#schmidResult');
  if(orientationFields.some(e=>!Number.isFinite(Number(e.value)))||load.some(v=>!Number.isFinite(v))||Math.hypot(...load)<1e-12||!plane||!dir||!plane.some(Boolean)||!dir.some(Boolean)){
    out.textContent=result.textContent='—';return;
  }
  crystal.rotation.set(...orientationFields.map(e=>THREE.MathUtils.degToRad(Number(e.value))),'XYZ');
  const crystalNormal=millerPlaneNormal(...plane).normalize();
  const crystalDirection=millerDirection(...dir).normalize();
  if(Math.abs(crystalNormal.dot(crystalDirection))>0.01){out.textContent=result.textContent='方向不在该晶面内';return;}
  const q=crystal.quaternion;
  const n=crystalNormal.clone().applyQuaternion(q).normalize();
  const d=crystalDirection.clone().applyQuaternion(q).normalize();
  const L=p3(...load).normalize();
  const signed=n.dot(L)*d.dot(L), absolute=Math.abs(signed);
  out.textContent=result.textContent=absolute.toFixed(4)+(signed<0?' (负号表示方向)':'');
  document.querySelector('#normalValue').textContent=`[${n.x.toFixed(3)}, ${n.y.toFixed(3)}, ${n.z.toFixed(3)}] 样品坐标`;
}
[...orientationFields,...loadFields].forEach(e=>e.addEventListener('input',updateSchmid));
document.querySelectorAll('.input-group input').forEach(e=>e.addEventListener('input',updateSchmid));
document.querySelectorAll('.presets button').forEach(e=>e.addEventListener('click',updateSchmid));
function exportData(format){
  const data={system:'HCP Mg',plane:document.querySelector('#planeInput').value,direction:document.querySelector('#directionInput').value,orientationXYZ_deg:orientationFields.map(e=>Number(e.value)),loadDirection_sample:loadFields.map(e=>Number(e.value)),schmidFactor:document.querySelector('#schmidValue').textContent,convention:'m=|(n·L)(d·L)|; vectors normalized; XYZ crystal-to-sample rotation',note:'Geometric Schmid factor only; does not predict activation or phase stability.'};
  let body,name,type;
  if(format==='json'){body=JSON.stringify(data,null,2);name='mg-slip-result.json';type='application/json';}
  else {body='system,plane,direction,rotation_xyz_deg,load_direction_sample,schmid_factor,convention\n'+[data.system,data.plane,data.direction,data.orientationXYZ_deg.join(' '),data.loadDirection_sample.join(' '),data.schmidFactor,JSON.stringify(data.convention)].map(v=>`"${String(v).replaceAll('"','""')}"`).join(',');name='mg-slip-result.csv';type='text/csv';}
  const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([body],{type}));link.download=name;link.click();URL.revokeObjectURL(link.href);
}
document.querySelector('#exportJson').addEventListener('click',()=>exportData('json'));
document.querySelector('#exportCsv').addEventListener('click',()=>exportData('csv'));
updateSchmid();
