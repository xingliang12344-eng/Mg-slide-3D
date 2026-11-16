const $=s=>document.querySelector(s);
const elA=$("#elementA"),elB=$("#elementB"),temp=$("#temperature"),aIn=$("#aComp"),bIn=$("#bComp");
const svg=$("#triangle"),grid=$("#gridLines"),point=$("#point"),halo=$("#pointHalo");
function valid(){const a=Number(aIn.value),b=Number(bIn.value);return Number.isFinite(a)&&Number.isFinite(b)&&a>=0&&b>=0&&a+b<=100}
function xy(a,b){const mg=100-a-b;return {x:(mg*300+a*70+b*530)/100,y:(mg*45+a*430+b*430)/100}}
function drawGrid(){grid.innerHTML="";for(let p=10;p<100;p+=10){let t=p/100;
  // Lines of constant Mg, A and B in barycentric coordinates
  const lines=[
    [xy(0,100-p),xy(p,0)],
    [xy(p,0),xy(p,100-p)],
    [xy(0,p),xy(100-p,p)]
  ];
  lines.forEach(([u,v])=>{const l=document.createElementNS("http://www.w3.org/2000/svg","line");l.setAttribute("x1",u.x);l.setAttribute("y1",u.y);l.setAttribute("x2",v.x);l.setAttribute("y2",v.y);l.setAttribute("class","grid-line");grid.appendChild(l)});
}}
function refresh(){const A=elA.value,B=elB.value,T=Number(temp.value),a=Number(aIn.value),b=Number(bIn.value);
 $("#tempValue").textContent=T;$("#tempChip").textContent=T+" °C";$("#systemName").textContent=`Mg–${A}–${B}`;
 $("#labelA").textContent=A+" (100%)";$("#labelB").textContent=B+" (100%)";
 $("#systemReadout").textContent=`Mg–${A}–${B}`;$("#conditionReadout").textContent=`${T} °C / ${$("#pressure").value} Pa`;
 if(valid()){const q=xy(a,b);point.setAttribute("cx",q.x);point.setAttribute("cy",q.y);halo.setAttribute("cx",q.x);halo.setAttribute("cy",q.y);
 const mg=100-a-b;$("#compositionReadout").textContent=`Mg ${mg.toFixed(1)} · ${A} ${a.toFixed(1)} · ${B} ${b.toFixed(1)}`;
 }else{$("#compositionReadout").textContent="成分输入无效：A + B 必须 ≤ 100 wt.%";}}
[elA,elB,temp,aIn,bIn,$("#pressure")].forEach(x=>x.addEventListener("input",refresh));
$("#locate").addEventListener("click",()=>{if(!valid()){alert("请确保 A、B 均为非负数，且 A + B ≤ 100 wt.%");return}refresh()});
$("#reset").addEventListener("click",()=>{aIn.value=5;bIn.value=5;refresh()});
elA.addEventListener("change",()=>{if(elA.value===elB.value)elB.value=[...elB.options].map(o=>o.value).find(v=>v!==elA.value);refresh()});
elB.addEventListener("change",()=>{if(elA.value===elB.value)elA.value=[...elA.options].map(o=>o.value).find(v=>v!==elB.value);refresh()});
drawGrid();refresh();
