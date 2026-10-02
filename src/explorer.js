/* ---------- inlet explorer: exact simulation data at 3, 7 and 11 mm, smooth interpolation in between ---------- */
(function(){
  const XMAX=0.3, YMAX=7, CASES=[3,7,11];
  const cases={3:CURVES["3"],7:CURVES["7"],11:CURVES["11"]};
  const flow={3:7.8,7:43,11:101};
  const L={3:document.getElementById('L3'),7:document.getElementById('L7'),11:document.getElementById('L11')};
  const range=document.getElementById('sizeRange'), chips=[...document.querySelectorAll('#sizeChips .chip[data-d]')];
  const peakline=document.getElementById('peakline'), peaktag=document.getElementById('peaktag');
  const rDia=document.getElementById('rDia'), rPeak=document.getElementById('rPeak'), rPos=document.getElementById('rPos'),
        rFlow=document.getElementById('rFlow'), rFlowNote=document.getElementById('rFlowNote'), rPeakNote=document.getElementById('rPeakNote'),
        status=document.getElementById('status');
  const svg=document.getElementById('chart'), playBtn=document.getElementById('playBtn');
  const bubble=document.getElementById('bubble'), control=document.getElementById('control');

  const lerp=(a,b,t)=>a+(b-a)*t;
  function samp(c,x){ const X=c.x,Y=c.y,n=X.length;
    if(x<=X[0]) return Y[0]; if(x>=X[n-1]) return Y[n-1];
    let lo=0,hi=n-1; while(hi-lo>1){const m=(lo+hi)>>1; if(X[m]<=x) lo=m; else hi=m;}
    return lerp(Y[lo],Y[hi],(x-X[lo])/(X[hi]-X[lo]));
  }
  const peak={}; CASES.forEach(k=>{const c=cases[k]; let i=0; c.y.forEach((v,j)=>{if(v>c.y[i]) i=j;}); peak[k]={x:c.x[i],y:c.y[i],end:c.x[c.x.length-1]};});
  const color={3:'var(--a3)',7:'var(--a2)',11:'var(--a4)'};

  /* between two simulated cases: line the peaks up, then blend the two real curves */
  function curve(d){
    const a=d<=7?3:7, b=d<=7?7:11, s=d<=7?(d-3)/4:(d-7)/4;
    const xp=lerp(peak[a].x,peak[b].x,s), xend=lerp(peak[a].end,peak[b].end,s), pts=[];
    for(let i=0;i<=140;i++){
      const x=xend*i/140, u=x-xp;
      pts.push([x,lerp(samp(cases[a],peak[a].x+u),samp(cases[b],peak[b].x+u),s)]);
    }
    let pk=pts[0]; pts.forEach(p=>{if(p[1]>pk[1]) pk=p;});
    return {pts,pk};
  }

  /* chart: the three simulated curves stay faint; the bold curve follows the slider */
  const M={l:56,r:18,t:16,b:44}, W=680,H=300, pw=W-M.l-M.r, ph=H-M.t-M.b;
  const X=x=>M.l+x/XMAX*pw, Y=y=>M.t+ph-y/YMAX*ph, NS='http://www.w3.org/2000/svg';
  const mk=(n,at,txt)=>{const e=document.createElementNS(NS,n);for(const k in at)e.setAttribute(k,at[k]);if(txt!=null)e.textContent=txt;svg.appendChild(e);return e;};
  for(let y=0;y<=YMAX;y++){ mk('line',{x1:M.l,x2:W-M.r,y1:Y(y),y2:Y(y),class:'gridline'}); mk('text',{x:M.l-8,y:Y(y)+4,'text-anchor':'end'},y); }
  for(let i=0;i<=6;i++){ const x=i*0.05; mk('text',{x:X(x),y:H-M.b+18,'text-anchor':'middle'},x.toFixed(2)); }
  mk('line',{x1:M.l,x2:M.l,y1:M.t,y2:H-M.b,class:'axis'}); mk('line',{x1:M.l,x2:W-M.r,y1:H-M.b,y2:H-M.b,class:'axis'});
  mk('text',{x:M.l+pw/2,y:H-6,'text-anchor':'middle'},'Axial length (m)');
  mk('text',{x:14,y:M.t+ph/2,'text-anchor':'middle',transform:`rotate(-90 14 ${M.t+ph/2})`},'Turbulence intensity (%)');
  CASES.forEach(k=>{
    const c=cases[k];
    mk('path',{d:c.x.map((x,i)=>(i?'L':'M')+X(x).toFixed(1)+' '+Y(c.y[i]).toFixed(1)).join(' '),class:'cv',stroke:color[k],'stroke-width':1.6,opacity:.45});
    mk('text',{x:X(peak[k].x)+8,y:Y(peak[k].y)-6},k+' mm');
  });
  const drop=mk('line',{class:'drop',y1:M.t,y2:H-M.b,x1:0,x2:0,stroke:'var(--text)'});
  const live=mk('path',{class:'cv',d:'','stroke-width':3.6,stroke:'var(--accent)'});
  const dot=mk('circle',{r:6,cx:0,cy:0,fill:'var(--accent)',stroke:'var(--plot)','stroke-width':2});

  let lastText=-1;
  function render(d){
    d=Math.min(11,Math.max(3,d));
    // picture: bottom layer stays opaque, the next case fades in over it (no dimming, no jump)
    if(d<=7){ L[3].style.opacity=1; L[7].style.opacity=(d-3)/4; L[11].style.opacity=0; }
    else    { L[3].style.opacity=0; L[7].style.opacity=1; L[11].style.opacity=(d-7)/4; }
    const {pts,pk}=curve(d);
    live.setAttribute('d',pts.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)).join(' '));
    dot.setAttribute('cx',X(pk[0])); dot.setAttribute('cy',Y(pk[1]));
    drop.setAttribute('x1',X(pk[0])); drop.setAttribute('x2',X(pk[0]));
    const pct=pk[0]/XMAX*100; peakline.style.left=pct+'%'; peaktag.style.left=Math.min(92,Math.max(8,pct))+'%'; peaktag.textContent='peak '+pk[1].toFixed(1)+'%';
    const p=(d-3)/8; range.style.setProperty('--p',(p*100)+'%');
    bubble.style.left='calc(20px + (100% - 40px) * '+p+')'; bubble.textContent=d.toFixed(1)+' mm';
    range.value=d;
    // text readouts: refresh only when they would visibly change
    if(Math.abs(d-lastText)>0.04||d===3||d===11){
      lastText=d;
      const near=CASES.find(k=>Math.abs(k-d)<0.05);
      rDia.textContent=d.toFixed(1)+' mm';
      rPeak.textContent=(near?'':'≈ ')+pk[1].toFixed(1)+' %'; rPos.textContent=(near?'':'≈ ')+pk[0].toFixed(3)+' m';
      rPeakNote.textContent=near?'peak centerline turbulence intensity':'peak turbulence intensity (interpolated)';
      rFlow.textContent=near?flow[near]+' LPM':'between cases';
      rFlowNote.textContent=near?'sampling flow rate (simulated case)':'simulated at 7.8, 43 and 101 LPM';
      const lo=d<=7?3:7, hi=d<=7?7:11;
      status.textContent=near?('Simulated case: '+near+' mm, '+flow[near]+' LPM.')
        :('Between the '+lo+' mm and '+hi+' mm cases: the curve and picture are interpolated between the two simulations.');
      range.setAttribute('aria-valuetext',d.toFixed(1)+' millimeters');
      chips.forEach(c=>c.setAttribute('aria-pressed',!!near&&+c.dataset.d===near));
    }
  }

  /* tick labels under the slider (click to jump) */
  const ticks=document.getElementById('ticks');
  [[3,'3 mm','7.8 LPM'],[7,'7 mm','43 LPM'],[11,'11 mm','101 LPM']].forEach(([v,a,b])=>{
    const s=document.createElement('span'); s.style.left=((v-3)/8*100)+'%'; s.innerHTML='<b>'+a+'</b><br>'+b;
    s.addEventListener('click',()=>{ unpulse(); goTo(v); }); ticks.appendChild(s);
  });

  /* ONE animation loop drives everything (chips, ticks and the sweep), driven by the clock so it never stalls */
  const ease=t=>-(Math.cos(Math.PI*t)-1)/2;
  let cur=3, raf=0, job=null;     // job: {legs:[{to,dur,hold}], i, from, t0, holdUntil, loop}
  function unpulse(){ control.classList.remove('pulse'); }
  function frame(now){
    raf=0; if(!job) return;
    const leg=job.legs[job.i];
    if(job.holdUntil===0){
      const t=Math.min(1,(now-job.t0)/leg.dur);
      cur=lerp(job.from,leg.to,ease(t)); render(cur);
      if(t>=1){ cur=leg.to; render(cur); job.holdUntil=now+leg.hold; }
    } else if(now>=job.holdUntil){
      job.i++;
      if(job.i>=job.legs.length){
        if(!job.loop){ job=null; setPlayLabel(); return; }
        job.i=0;
      }
      job.from=cur; job.t0=now; job.holdUntil=0;
    }
    raf=requestAnimationFrame(frame);
  }
  function run(legs,loop){
    cancelAnimationFrame(raf);
    job={legs,i:0,from:cur,t0:performance.now(),holdUntil:0,loop:!!loop};
    setPlayLabel(); raf=requestAnimationFrame(frame);
  }
  function stop(){ cancelAnimationFrame(raf); raf=0; job=null; setPlayLabel(); }
  function goTo(v){ run([{to:v,dur:Math.max(900,Math.abs(v-cur)*450),hold:0}],false); }
  function setPlayLabel(){ playBtn.innerHTML=(job&&job.loop)?'&#10074;&#10074; Pause':'&#9654; Play sweep'; }

  range.addEventListener('input',()=>{
    unpulse(); stop();
    let v=+range.value; const s=CASES.find(k=>Math.abs(k-v)<0.07); if(s!==undefined) v=s;   // easy to land exactly on a simulated case
    cur=v; render(cur);
  });
  chips.forEach(c=>c.addEventListener('click',()=>{ unpulse(); goTo(+c.dataset.d); }));

  /* play sweep: 3 -> 7 -> 11 -> 7 -> 3 and round again, slow, pausing briefly at each simulated case */
  playBtn.addEventListener('click',()=>{
    if(job&&job.loop){ stop(); return; }
    unpulse();
    const legs=[{to:7,dur:5200,hold:1600},{to:11,dur:5200,hold:1600},{to:7,dur:5200,hold:1600},{to:3,dur:5200,hold:1600}];
    // start from wherever the slider is: skip legs that would go backwards
    let start=0; if(cur>=10.95) start=2; else if(cur>7.05) start=1; else if(Math.abs(cur-7)<=0.05) start=1;
    const ordered=legs.slice(start).concat(legs.slice(0,start));
    run(ordered,true);
  });

  /* step buttons and arrow keys: move half a millimetre, stopping on each simulated case */
  function stepBy(dir){
    unpulse();
    let to=Math.min(11,Math.max(3,cur+dir*0.5));
    const hit=CASES.filter(k=>dir>0?(k>cur+0.05&&k<=to+1e-4):(k<cur-0.05&&k>=to-1e-4));
    if(hit.length) to=dir>0?Math.min(...hit):Math.max(...hit);
    if(Math.abs(to-cur)<1e-3) return;
    run([{to,dur:450,hold:0}],false);
  }
  document.getElementById('stepDown').addEventListener('click',()=>stepBy(-1));
  document.getElementById('stepUp').addEventListener('click',()=>stepBy(1));
  range.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'||e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();stepBy(1);}
    else if(e.key==='ArrowLeft'||e.key==='ArrowDown'||e.key==='PageDown'){e.preventDefault();stepBy(-1);}
  });

  cur=3; render(cur);
  window.__explorer={render,run,stop,get cur(){return cur;}};   // for testing only
})();

