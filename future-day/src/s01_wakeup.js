/* 06:30 醒来 */
(()=>{
const SUBS=[
 {a:5.0,b:10.2,text:'清晨六点半，卧室的窗帘缓缓打开，阳光照进房间。'},
 {a:10.6,b:16.4,text:'室内系统根据天气和睡眠状态，调整光线、温度与空气流通。'},
 {a:17.0,b:22.4,text:'床边的屏幕亮起，显示今天的天气、日程和个人事务。'},
 {a:23.0,b:27.0,who:"AI",text:'早上好。今天晴，气温二十二度。'},
 {a:27.3,b:30.4,who:"AI",text:'上午没有固定安排。'},
 {a:30.8,b:37.2,who:"AI",text:'附近山谷的天气适合户外活动，预计九点出发，车程四十分钟。'},
 {a:38.0,b:43.2,text:'居住者可以查看日程，也可以临时更改计划。'},
];



const R=seeded(7);
const dust=[...Array(80)].map(()=>({x:R(),y:R(),s:R(),p:R()*6.28}));
const stars=[...Array(140)].map(()=>({x:R()*W,y:R()*H*0.75,r:R()*1.8+.4,p:R()*6.28}));
const bokeh=[...Array(14)].map(()=>({x:R()*W,y:R()*H*0.8,r:60+R()*140,a:.05+R()*.08}));

/* ---------------- TITLE ---------------- */
function drawTitle(t){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#070b1e');g.addColorStop(1,'#26285a');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const hz=ctx.createRadialGradient(W/2,H+160,40,W/2,H+160,900);
  hz.addColorStop(0,`rgba(255,170,110,${.15+.35*prog(t,0,4.5)})`);hz.addColorStop(1,'rgba(255,170,110,0)');
  ctx.fillStyle=hz;ctx.fillRect(0,0,W,H);
  for(const s of stars){ctx.globalAlpha=(.4+.6*Math.abs(Math.sin(t*1.3+s.p)))*(1-.5*prog(t,2,4.5));ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,7);ctx.fill()}
  ctx.globalAlpha=1;
  const a1=ease(prog(t,.4,1.5))*(1-prog(t,3.6,4.4)), a2=ease(prog(t,1.3,2.2))*(1-prog(t,3.6,4.4));
  ctx.globalAlpha=a1; txt('未来的一天',W/2,H/2-10+(1-a1)*16,120,'#ffffff',700,'center');
  ctx.globalAlpha=a2; ctx.fillStyle='#ffcf9a';ctx.fillRect(W/2-150,H/2+40,300,2);
  txt('06:30  ·  醒来',W/2,H/2+110,48,'#ffcf9a',400,'center');
  ctx.globalAlpha=1;
}

/* ---------------- ROOM ---------------- */
const WX=150,WY=120,WW=560,WH=500;
function drawView(t,L){
  ctx.save();ctx.beginPath();ctx.rect(WX,WY,WW,WH);ctx.clip();
  const sky=ctx.createLinearGradient(0,WY,0,WY+WH);
  sky.addColorStop(0,mix('#141c48','#78b2ee',L));sky.addColorStop(.55,mix('#38376a','#ffd9ad',L));sky.addColorStop(1,mix('#6a4566','#ffb07a',L));
  ctx.fillStyle=sky;ctx.fillRect(WX,WY,WW,WH);
  // stars fading
  for(let i=0;i<25;i++){const s=stars[i];ctx.globalAlpha=(1-L)*.8;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(WX+s.x%WW,WY+(s.y%220),s.r*.8,0,7);ctx.fill()}
  ctx.globalAlpha=1;
  const night=window.BED&&BED.night;const sx=night?WX+150:WX+330, sy=night?WY+110:lerp(WY+460,WY+235,easeOut(prog(t,4.5,22)));
  if(night){circle(sx,sy,26,'#f4f1dc');circle(sx+10,sy-6,24,mix('#141c48','#78b2ee',L))}else{
  const gl=ctx.createRadialGradient(sx,sy,10,sx,sy,260);gl.addColorStop(0,`rgba(255,226,160,${.25+.5*L})`);gl.addColorStop(1,'rgba(255,226,160,0)');
  ctx.fillStyle=gl;ctx.fillRect(WX,WY,WW,WH);
  ctx.fillStyle='#fff3cf';ctx.beginPath();ctx.arc(sx,sy,36,0,7);ctx.fill();}
  const layer=(base,amp,f,ph,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(WX,WY+WH);
    for(let x=WX;x<=WX+WW;x+=8){const y=base-amp*(.6*Math.sin(x*f+ph)+.4*Math.sin(x*f*2.3+ph*1.7));ctx.lineTo(x,y)}
    ctx.lineTo(WX+WW,WY+WH);ctx.fill()};
  layer(WY+360,45,.012,1,mix('#4c4878','#b7b9d8',L));
  layer(WY+400,40,.017,3,mix('#3a3c66','#8fa7c6',L));
  // future towers
  const towers=[[WX+70,150,26],[WX+120,210,34],[WX+190,120,22],[WX+450,180,30],[WX+500,250,24]];
  for(const [x,h,w] of towers){ctx.fillStyle=mix('#2e3560','#9aaecb',L);rr(x,WY+430-h,w,h+80,w/2);ctx.fill();
    ctx.fillStyle=`rgba(255,214,140,${.9*(1-L)})`;for(let k=0;k<h/22;k++)ctx.fillRect(x+w/2-3,WY+440-h+k*22,6,6)}
  ctx.strokeStyle=mix('#2e3560','#9aaecb',L);ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(WX+137,WY+260,34,9,0,0,7);ctx.stroke();
  layer(WY+455,30,.02,5,mix('#262b52','#6f957f',L));
  // birds
  const bp=window.BED?-1:prog(t,7,17);if(bp>0&&bp<1){ctx.strokeStyle='rgba(40,40,60,.7)';ctx.lineWidth=2.5;
    for(let i=0;i<3;i++){const bx=WX+40+bp*520+i*28,by=WY+170+i*14+Math.sin(t*3+i)*6,fl=Math.sin(t*12+i)*6;
      ctx.beginPath();ctx.moveTo(bx-9,by-fl);ctx.lineTo(bx,by);ctx.lineTo(bx+9,by-fl);ctx.stroke()}}
  ctx.restore();
}
function curtain(x0,w,dir,top,bot){
  const n=9;
  for(let i=0;i<n;i++){const a=i/n,b=(i+1)/n,xa=x0+dir*a*w,xb=x0+dir*b*w;
    ctx.fillStyle=i%2?'#457780':'#5b9097';ctx.beginPath();ctx.moveTo(xa,top);ctx.lineTo(xb,top);
    ctx.lineTo(xb,bot+(i%2?8:0));ctx.lineTo(xa,bot+(i%2?0:8));ctx.closePath();ctx.fill()}
  const e=x0+dir*w, g=ctx.createLinearGradient(e-dir*30,0,e,0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.18)');
  ctx.fillStyle=g;ctx.fillRect(Math.min(e,e-dir*30),top,30,bot-top+8);
}
function drawBedroom(t){
  const O=window.BED||{};const L=O.L??ease(prog(t,5,12)), open=O.open??ease(prog(t,5,10.5)), sys=O.sys??prog(t,10.6,13);
  // wall
  const wg=ctx.createLinearGradient(0,0,0,770);wg.addColorStop(0,'#f2e5d4');wg.addColorStop(1,'#e8d4bd');
  ctx.fillStyle=wg;ctx.fillRect(-800,0,W+1600,775);
  ctx.fillStyle='#ddc9b2';ctx.fillRect(-800,0,W+1600,28);
  // floor
  ctx.fillStyle='#c79f7b';ctx.fillRect(-800,770,W+1600,400);
  ctx.fillStyle='#b98f6b';[792,830,882,950,1040].forEach((y,i)=>ctx.fillRect(-800,y,W+1600,3+i));
  ctx.fillStyle='#a77f5d';ctx.fillRect(-800,762,W+1600,14);
  drawView(t,O.sky??L);
  // window frame + sill
  ctx.strokeStyle='#f8f3ea';ctx.lineWidth=18;ctx.strokeRect(WX,WY,WW,WH);
  ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(WX+WW/2,WY);ctx.lineTo(WX+WW/2,WY+WH);ctx.stroke();
  ctx.fillStyle='#f8f3ea';ctx.fillRect(WX-26,WY+WH+6,WW+52,16);
  // curtains
  ctx.fillStyle='#7d6b58';rr(WX-80,WY-40,WW+160,10,5);ctx.fill();
  const cw=lerp((WW+140)/2,80,open);
  curtain(WX-70,cw,1,WY-32,WY+WH+60); curtain(WX+WW+70,cw,-1,WY-32,WY+WH+60);
  // plant
  ctx.fillStyle='#d9c1a3';rr(40,690,100,82,10);ctx.fill();
  ctx.fillStyle='#5f8a5e';for(let i=0;i<7;i++){ctx.save();ctx.translate(90,695);ctx.rotate(-1.2+i*.4+Math.sin(t*.8+i)*.03);ctx.beginPath();ctx.ellipse(0,-60,16,62,0,0,7);ctx.fill();ctx.restore()}
  // wall art
  ctx.fillStyle='#fbf7f0';rr(950,210,300,200,6);ctx.fill();
  ctx.save();rr(966,226,268,168,3);ctx.clip();ctx.fillStyle='#f4d9bf';ctx.fillRect(966,226,268,168);
  ctx.fillStyle='#f0a77a';ctx.beginPath();ctx.arc(1160,300,30,0,7);ctx.fill();
  ctx.fillStyle='#8eaac4';ctx.beginPath();ctx.moveTo(966,394);ctx.lineTo(1050,300);ctx.lineTo(1120,360);ctx.lineTo(1180,320);ctx.lineTo(1234,394);ctx.fill();ctx.restore();
  // thermostat
  rr(790,320,70,100,14);ctx.fillStyle='#262c3a';ctx.fill();
  const temp=lerp(21.3,22.0,sys);
  txt(temp.toFixed(1)+'°',825,380,22,`rgba(150,210,255,${.35+.65*sys})`,600,'center');
  // vent
  rr(1600,64,210,34,8);ctx.fillStyle='#d6c3ad';ctx.fill();
  ctx.fillStyle='#b9a58e';for(let i=0;i<6;i++)ctx.fillRect(1614+i*33,72,20,18);
  // bed
  ctx.fillStyle='#7a5b45';ctx.fillRect(770,710,30,62);ctx.fillRect(1470,710,30,62);
  rr(760,655,780,62,10);ctx.fillStyle='#8a6a52';ctx.fill();
  rr(1500,430,58,330,22);ctx.fillStyle='#7c5d47';ctx.fill();
  rr(770,600,730,66,16);ctx.fillStyle='#f6f2ec';ctx.fill();
  ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(1420,590,78,28,0,0,7);ctx.fill();
  // head
  ctx.fillStyle='#f0c6a3';ctx.beginPath();ctx.arc(1400,560,36,0,7);ctx.fill();
  ctx.fillStyle='#2c2331';ctx.beginPath();ctx.arc(1412,552,38,-1.9,1.25);ctx.fill();
  // blanket
  const br=Math.sin(t*1.6)*3, stir=O.stir??Math.sin(Math.PI*prog(t,13.4,15.6))*10;
  ctx.fillStyle='#6b8cc0';ctx.beginPath();ctx.moveTo(772,705);ctx.lineTo(772,615);
  ctx.bezierCurveTo(850,585+br,950,558+br,1050,563+br);ctx.bezierCurveTo(1150,568+br,1220,538+br-stir,1300,556+br-stir);
  ctx.bezierCurveTo(1350,570,1372,592,1376,612);ctx.lineTo(1376,705);
  for(let x=1376;x>=772;x-=40)ctx.quadraticCurveTo(x-10,712,x-20,705);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#5876a8';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(900,640);ctx.quadraticCurveTo(980,600,1080,610);ctx.moveTo(1150,640);ctx.quadraticCurveTo(1230,600,1300,600);ctx.stroke();
  ctx.fillStyle='#e9eef7';ctx.beginPath();ctx.moveTo(1330,568-stir*.5);ctx.quadraticCurveTo(1365,575,1378,612);ctx.lineTo(1356,614);ctx.quadraticCurveTo(1350,590,1318,580-stir*.5);ctx.fill();
  // rug
  ctx.fillStyle='#9db2c8';ctx.beginPath();ctx.ellipse(1130,860,460,48,0,0,7);ctx.fill();
  ctx.strokeStyle='#b8c9da';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(1130,860,400,34,0,0,7);ctx.stroke();
  // bedside table
  ctx.fillStyle='#8a6a52';rr(1575,640,210,128,10);ctx.fill();ctx.fillStyle='#7a5b45';ctx.fillRect(1590,768,16,10);ctx.fillRect(1754,768,16,10);
  ctx.strokeStyle='#6f523e';ctx.lineWidth=3;ctx.strokeRect(1595,690,170,56);
  ctx.fillStyle='#d8c3a5';ctx.fillRect(1672,712,16,6);
  ctx.fillStyle='#2a2f3d';ctx.fillRect(1662,628,16,14);rr(1600,534,140,98,10);ctx.fill();
  // tint (night -> day)
  ctx.save();ctx.globalCompositeOperation='multiply';ctx.fillStyle=mix('#2a3263','#fff9f2',L*.92+.08*sys);ctx.fillRect(-800,0,W+1600,H+200);ctx.restore();
  // screen on table (emissive)
  const on=O.screen??easeOut(prog(t,16.2,16.9));
  if(on>0){ctx.save();ctx.globalAlpha=on;rr(1606,540,128,86,6);const sg=ctx.createLinearGradient(0,540,0,626);sg.addColorStop(0,'#1d3d63');sg.addColorStop(1,'#0f2238');ctx.fillStyle=sg;ctx.fill();
    txt(O.clock||'06:30',1620,572,20,'#ffffff',700);ctx.fillStyle='#ffd66b';ctx.beginPath();ctx.arc(1712,566,9,0,7);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.18)';rr(1618,584,104,14,4);ctx.fill();rr(1618,604,70,12,4);ctx.fill();
    const sgl=ctx.createRadialGradient(1670,585,10,1670,585,170);sgl.addColorStop(0,'rgba(120,190,255,.25)');sgl.addColorStop(1,'rgba(120,190,255,0)');
    ctx.globalCompositeOperation='lighter';ctx.fillStyle=sgl;ctx.fillRect(1480,420,380,330);ctx.restore()}
  // ceiling light strip
  if(sys>0){ctx.save();ctx.globalCompositeOperation='lighter';const cg=ctx.createLinearGradient(0,26,0,170);cg.addColorStop(0,`rgba(255,236,200,${.35*sys})`);cg.addColorStop(1,'rgba(255,236,200,0)');ctx.fillStyle=cg;ctx.fillRect(-800,26,W+1600,150);
    ctx.fillStyle=`rgba(255,244,220,${.9*sys})`;ctx.fillRect(-800,24,W+1600,5);ctx.restore()}
  // sun shaft
  const xa=Math.max(WX,WX-70+cw), xb=Math.min(WX+WW,WX+WW+70-cw);
  if(xb>xa&&open>0&&!O.night){const dx=760,dy=330;
    const shaft=new Path2D();shaft.moveTo(xa,WY);shaft.lineTo(xb,WY);shaft.lineTo(xb+dx,WY+dy);shaft.lineTo(xb+dx,WY+WH+dy);shaft.lineTo(xa+dx,WY+WH+dy);shaft.lineTo(xa,WY+WH);shaft.closePath();
    ctx.save();ctx.globalCompositeOperation='lighter';
    const sg=ctx.createLinearGradient(WX,WY,WX+dx,WY+dy+WH/2);sg.addColorStop(0,`rgba(255,205,140,${.30*open})`);sg.addColorStop(1,'rgba(255,205,140,0)');
    ctx.fillStyle=sg;ctx.fill(shaft);
    ctx.fillStyle=`rgba(255,215,160,${.22*open})`;ctx.beginPath();ctx.moveTo(xa+380,800);ctx.lineTo(xb+380,800);ctx.lineTo(xb+560,1000);ctx.lineTo(xa+560,1000);ctx.fill();
    for(const d of dust){const x=WX+d.x*(WW+dx)+Math.sin(t*.5+d.p)*12,y=WY+d.y*(WH+dy)-((t*12*(.5+d.s))%60);
      if(ctx.isPointInPath(shaft,x,y)){ctx.fillStyle=`rgba(255,240,210,${open*(.3+.5*Math.abs(Math.sin(t+d.p)))})`;ctx.beginPath();ctx.arc(x,y,1.2+d.s*2,0,7);ctx.fill()}}
    ctx.restore()}
  // airflow
  const air=O.air??prog(t,11,13.5);
  if(air>0){ctx.save();ctx.strokeStyle=`rgba(255,255,255,${.55*air})`;ctx.lineWidth=3;ctx.lineCap='round';
    for(let i=0;i<5;i++){const ph=(t*.6+i*.2)%1;ctx.globalAlpha=Math.sin(ph*Math.PI);ctx.beginPath();
      for(let k=0;k<=20;k++){const u=k/20*ph;const x=1620+i*40-u*260,y=104+u*220+Math.sin(u*12+i)*10;k?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}ctx.restore()}
  // HUD chips
  const chips=[
    {a:11.0,x:1040,y:96,tx:960,ty:28,col:'#ffd27a',k:'光线',v:`自动调节 · 色温 ${Math.round(lerp(3200,4800,prog(t,11,13.5)))}K`},
    {a:11.6,x:880,y:338,tx:860,ty:370,col:'#7cc4ff',k:'温度',v:`${temp.toFixed(1)} ℃`},
    {a:12.2,x:1290,y:180,tx:1600,ty:96,col:'#8ff0c4',k:'新风',v:`低速循环 · CO₂ ${Math.round(lerp(780,520,prog(t,12.2,15)))} ppm`},
    {a:12.8,x:930,y:448,tx:1395,ty:530,col:'#c7a7ff',k:'睡眠',v:'7 小时 42 分 · 深睡 1 小时 58 分'},
  ];
  if(!O.noChips)for(const ch of chips){const al=easeOut(prog(t,ch.a,ch.a+.5))*(1-prog(t,16.0,16.5));if(al<=0)continue;
    ctx.save();ctx.globalAlpha=al;ctx.font=`500 26px ${F}`;const vw=ctx.measureText(ch.v).width;const w=vw+130,hgt=50;
    ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(ch.tx,ch.ty);
    const cx=ch.tx<ch.x?ch.x:ch.x+w;ctx.lineTo(cx,ch.y+hgt/2);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ch.tx,ch.ty,6,0,7);ctx.fill();
    rr(ch.x,ch.y+(1-al)*10,w,hgt,25);ctx.fillStyle='rgba(16,24,44,.72)';ctx.fill();
    ctx.fillStyle=ch.col;ctx.beginPath();ctx.arc(ch.x+26,ch.y+25+(1-al)*10,7,0,7);ctx.fill();
    txt(ch.k,ch.x+44,ch.y+34+(1-al)*10,24,ch.col,700);txt(ch.v,ch.x+104,ch.y+34+(1-al)*10,26,'#fff',500);ctx.restore()}
}
function drawRoomShot(t){
  const z=ease(prog(t,16.4,18.3));const s0=1+.045*prog(t,4.5,16.4);const s=s0*Math.pow(9.4/s0,z);
  const zc=easeOut(prog(t,16.4,17.6));const cx=lerp(960,1670,zc),cy=lerp(540,583,zc);
  ctx.save();ctx.translate(W/2,H/2);ctx.scale(s,s);ctx.translate(-cx,-cy);drawBedroom(t);ctx.restore();
}

/* ---------------- UI CLOSE-UP ---------------- */
const SX=316,SY=126,SW=1288,SH=728;
function routePts(mx,my,mw,mh){const p=[];const P=[[mx+60,my+mh-46],[mx+170,my+mh-30],[mx+220,my+70],[mx+330,my+76]];
  for(let i=0;i<=60;i++){const u=i/60,a=1-u;p.push([a*a*a*P[0][0]+3*a*a*u*P[1][0]+3*a*u*u*P[2][0]+u*u*u*P[3][0],a*a*a*P[0][1]+3*a*a*u*P[1][1]+3*a*u*u*P[2][1]+u*u*u*P[3][1]])}return p}
function drawUIShot(t){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#f3e0c8');g.addColorStop(1,'#e2c4a5');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(const b of bokeh){const rg=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);rg.addColorStop(0,`rgba(255,240,215,${b.a*2})`);rg.addColorStop(1,'rgba(255,240,215,0)');ctx.fillStyle=rg;ctx.fillRect(b.x-b.r,b.y-b.r,b.r*2,b.r*2)}
  const sun=ctx.createLinearGradient(0,0,W,H);sun.addColorStop(0,'rgba(255,200,130,.35)');sun.addColorStop(.5,'rgba(255,200,130,0)');ctx.fillStyle=sun;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#8a6a52';ctx.fillRect(0,905,W,175);ctx.fillStyle='#9a7a60';ctx.fillRect(0,905,W,14);
  const en=ease(prog(t,17.85,18.9));const sc=lerp(1.03,1,en);const dy=Math.sin(t*.5)*3;
  ctx.save();ctx.translate(W/2,H/2+dy);ctx.scale(sc,sc);ctx.translate(-W/2,-H/2);
  ctx.fillStyle='#232733';ctx.beginPath();ctx.moveTo(880,870);ctx.lineTo(1040,870);ctx.lineTo(1080,912);ctx.lineTo(840,912);ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.18)';rr(SX-10,SY+20,SW+20,SH+20,46);ctx.fill();
  rr(SX-16,SY-16,SW+32,SH+32,44);ctx.fillStyle='#1a1e29';ctx.fill();
  ctx.save();rr(SX,SY,SW,SH,30);ctx.clip();
  const sg=ctx.createLinearGradient(SX,SY,SX+SW,SY+SH);sg.addColorStop(0,'#0e1a2c');sg.addColorStop(1,'#16314f');ctx.fillStyle=sg;ctx.fillRect(SX,SY,SW,SH);
  const ag=ctx.createRadialGradient(SX+SW-120,SY+60,10,SX+SW-120,SY+60,520);ag.addColorStop(0,'rgba(255,190,120,.18)');ag.addColorStop(1,'rgba(255,190,120,0)');ctx.fillStyle=ag;ctx.fillRect(SX,SY,SW,SH);
  // header
  const hA=easeOut(prog(t,18.3,19.0));ctx.globalAlpha=hA;
  txt('06:30',SX+48,SY+112,88,'#ffffff',700);txt('早上好  ·  周六',SX+54,SY+160,30,'#9fb6d4',400);
  // AI orb
  const ox=SX+SW-96,oy=SY+92,spk=SUBS.some(s=>s.who==='AI'&&t>=s.a&&t<=s.b)?1:0;
  if(spk){for(let i=0;i<3;i++){const ph=(t*1.2+i/3)%1;ctx.strokeStyle=`rgba(140,200,255,${.5*(1-ph)})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(ox,oy,44+ph*50,0,7);ctx.stroke()}}
  const og=ctx.createLinearGradient(ox-44,oy-44,ox+44,oy+44);og.addColorStop(0,'#7cc8ff');og.addColorStop(1,'#a98bff');ctx.fillStyle=og;ctx.beginPath();ctx.arc(ox,oy,44,0,7);ctx.fill();
  ctx.fillStyle='#fff';for(let i=0;i<5;i++){const h=spk?8+Math.abs(Math.sin(t*9+i*1.7))*26:6;rr(ox-26+i*11,oy-h/2,6,h,3);ctx.fill()}
  txt('AI 助手',ox-70,oy+12,28,'#cfe3ff',500,'right');
  // cards
  const cw=(SW-96-48)/3,cy=SY+200,ch=232;
  const confirmed=t>=39.35;
  const cards=[19.0,19.4,19.8];
  // weather
  let x=SX+48,al=easeOut(prog(t,cards[0],cards[0]+.6));
  card(x,cy,cw,ch,al*hA,t>23&&t<27.2);ctx.globalAlpha=al*hA;
  ctx.save();ctx.translate(x+72,cy+82);ctx.rotate(t*.4);ctx.strokeStyle='#ffd66b';ctx.lineWidth=5;ctx.lineCap='round';
  for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(0,-38);ctx.lineTo(0,-48);ctx.stroke()}ctx.fillStyle='#ffd66b';ctx.beginPath();ctx.arc(0,0,28,0,7);ctx.fill();ctx.restore();
  txt('22°',x+140,cy+110,76,'#ffffff',700);txt('晴 · 微风 2 级',x+32,cy+170,30,'#ffffff',500);txt('湿度 48%   空气质量 优',x+32,cy+210,24,'#8fa9c8',400);
  // schedule
  x=SX+48+cw+24;al=easeOut(prog(t,cards[1],cards[1]+.6));card(x,cy,cw,ch,al*hA,(t>27.3&&t<30.6)||(t>39.4&&t<41));ctx.globalAlpha=al*hA;
  txt('今日日程',x+32,cy+52,26,'#8fa9c8',500);
  const rows=[[confirmed?'09:00':'上午',confirmed?'出发 · 山谷徒步':'无固定安排',confirmed],['下午','空闲',0],['19:00','朋友来家晚餐',0]];
  rows.forEach((r,i)=>{const yy=cy+106+i*46;if(r[2]){rr(x+20,yy-32,cw-40,44,12);ctx.fillStyle=`rgba(47,191,113,${.25*prog(t,39.35,39.8)})`;ctx.fill()}
    txt(r[0],x+32,yy,26,r[2]?'#7ff0b0':'#9fb6d4',600);txt(r[1],x+124,yy,28,'#ffffff',400)});
  // personal
  x=SX+48+2*(cw+24);al=easeOut(prog(t,cards[2],cards[2]+.6));card(x,cy,cw,ch,al*hA,false);ctx.globalAlpha=al*hA;
  txt('个人事务',x+32,cy+52,26,'#8fa9c8',500);
  [['睡眠','7h42m · 良好'],['包裹','1 件今日送达'],['待办','2 项']].forEach((r,i)=>{const yy=cy+106+i*46;txt(r[0],x+32,yy,26,'#9fb6d4',600);txt(r[1],x+104,yy,28,'#ffffff',400)});
  // suggestion
  const sA=easeOut(prog(t,30.8,31.5));
  if(sA>0){const bx=SX+48,by=SY+458+(1-sA)*40,bw=SW-96,bh=226;ctx.globalAlpha=sA*hA;
    card(bx,by,bw,bh,1,t>30.8&&t<37.3);ctx.globalAlpha=sA*hA;
    const mx=bx+18,my=by+18,mw=400,mh=bh-36;rr(mx,my,mw,mh,18);ctx.fillStyle='#10243a';ctx.fill();
    ctx.save();rr(mx,my,mw,mh,18);ctx.clip();
    ctx.strokeStyle='#1d3c5c';ctx.lineWidth=7;[[mx,my+60,mx+mw,my+40],[mx+40,my,mx+120,my+mh],[mx,my+mh-50,mx+mw,my+mh-80],[mx+260,my,mx+300,my+mh]].forEach(l=>{ctx.beginPath();ctx.moveTo(l[0],l[1]);ctx.lineTo(l[2],l[3]);ctx.stroke()});
    ctx.fillStyle='#24506f';[[mx+280,my+60],[mx+330,my+50],[mx+370,my+68]].forEach(([px,py])=>{ctx.beginPath();ctx.moveTo(px-30,py+30);ctx.lineTo(px,py-24);ctx.lineTo(px+30,py+30);ctx.fill()});
    ctx.fillStyle='#2b7cb4';ctx.beginPath();ctx.ellipse(mx+340,my+120,44,22,0,0,7);ctx.fill();
    const pts=routePts(mx,my,mw,mh),n=Math.floor(60*ease(prog(t,31.2,34)));
    ctx.strokeStyle='#ffd66b';ctx.lineWidth=5;ctx.setLineDash([12,9]);ctx.lineDashOffset=-t*30;ctx.beginPath();pts.slice(0,n+1).forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.setLineDash([]);
    ctx.restore();
    const pin=(px,py,lab,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(px,py,11,0,7);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();txt(lab,px,py-20,22,'#fff',600,'center')};
    pin(pts[0][0],pts[0][1],'家','#7cc4ff');if(n>=60)pin(pts[60][0],pts[60][1],'山谷','#2fbf71');
    const tx=bx+450;rr(tx,by+30,72,34,17);ctx.fillStyle='#2fbf71';ctx.fill();txt('推荐',tx+36,by+56,22,'#fff',600,'center');
    txt('山谷徒步',tx+90,by+60,40,'#ffffff',700);
    txt('附近山谷天气适合户外活动',tx,by+112,28,'#d6e4f5',400);
    txt('09:00 出发  ·  车程 40 分钟',tx,by+156,26,'#9fd0ff',500);txt('晴 18–24 ℃  ·  湖畔步道 6.2 km',tx,by+196,24,'#8fa9c8',400);
    // buttons
    const b1x=bx+bw-240,b2x=bx+bw-240,byy=by+40,byy2=by+124;
    const p1=Math.sin(Math.PI*prog(t,39.05,39.45));
    ctx.save();ctx.translate(b1x+100,byy+28);ctx.scale(1-p1*.06,1-p1*.06);rr(-100,-28,200,56,28);ctx.fillStyle=confirmed?'#2fbf71':'#3d8bff';ctx.fill();
    txt(confirmed?'✓ 已加入':'加入日程',0,10,26,'#fff',600,'center');ctx.restore();
    const p2=Math.sin(Math.PI*prog(t,41.2,41.6));
    ctx.save();ctx.translate(b2x+100,byy2+28);ctx.scale(1-p2*.06,1-p2*.06);rr(-100,-28,200,56,28);ctx.strokeStyle='#9fd0ff';ctx.lineWidth=2;ctx.stroke();
    if(t>41.4){ctx.fillStyle='rgba(159,208,255,.15)';ctx.fill()}txt('更改计划',0,10,26,'#9fd0ff',600,'center');ctx.restore();
    // popover
    const pA=easeOut(prog(t,41.5,41.9))*(1-prog(t,43.3,43.7));
    if(pA>0){ctx.globalAlpha=pA*hA;const px=b2x-250,py=by-108-(1-pA)*10;rr(px,py,450,96,20);ctx.fillStyle='#f4f8ff';ctx.fill();
      txt('出发时间',px+24,py+36,22,'#5b6b82',500);
      ['08:30','09:00','10:00','改天'].forEach((s,i)=>{const cx2=px+24+i*104;rr(cx2,py+48,92,36,18);ctx.fillStyle=s==='09:00'?'#3d8bff':'#e1e9f5';ctx.fill();txt(s,cx2+46,py+74,22,s==='09:00'?'#fff':'#33445c',600,'center')})}
  }
  ctx.globalAlpha=1;
  // glass sheen
  const sh=ctx.createLinearGradient(SX,SY,SX+SW*.6,SY+SH);sh.addColorStop(0,'rgba(255,255,255,.07)');sh.addColorStop(.4,'rgba(255,255,255,0)');ctx.fillStyle=sh;ctx.fillRect(SX,SY,SW,SH);
  ctx.restore();ctx.restore();
  // hand
  if(t>37.4&&t<44.2){const k1=ease(prog(t,37.5,38.9)),k2=ease(prog(t,40.2,41.15)),k3=ease(prog(t,42.6,43.8));
    const B1=[SX+48+SW-96-140,SY+458+68],B2=[SX+48+SW-96-140,SY+458+152];
    let hx=lerp(1900,B1[0],k1),hy=lerp(1250,B1[1],k1);hx=lerp(hx,B2[0],k2);hy=lerp(hy,B2[1],k2);hx=lerp(hx,2000,k3);hy=lerp(hy,1300,k3);
    const pr=Math.max(Math.sin(Math.PI*prog(t,39.05,39.45)),Math.sin(Math.PI*prog(t,41.2,41.6)));
    // map to screen transform
    hx=W/2+(hx-W/2)*sc;hy=H/2+dy+(hy-H/2)*sc;
    if(pr>.2){ctx.strokeStyle=`rgba(255,255,255,${pr*.8})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(hx,hy,20+pr*24,0,7);ctx.stroke()}
    hand(hx+4,hy+4,pr,'#4d6293')}
}


window.drawBedroom=drawBedroom;
SCENES.push({time:'06:30',title:'醒来',dur:44.6,subs:SUBS,tagFrom:5.2,draw(t){
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  if(t<18.4)drawRoomShot(t);
  if(t>=17.7){ctx.save();ctx.globalAlpha=ease(prog(t,17.85,18.35));drawUIShot(t);ctx.restore()}
  if(t<4.6){ctx.save();ctx.globalAlpha=1-ease(prog(t,3.9,4.6));drawTitle(t);ctx.restore()}
}});
})();
