/* ---------- inlet explorer: real simulation data only, no interpolation ---------- */
(function(){
  const XMAX=0.3, YMAX=7, CASES=[3,7,11];
  const cases={3:CURVES["3"],7:CURVES["7"],11:CURVES["11"]};
  const flow={3:7.8,7:43,11:101};
  const L={3:document.getElementById('L3'),7:document.getElementById('L7'),11:document.getElementById('L11')};
  const range=document.getElementById('sizeRange'), chips=[...document.querySelectorAll('#sizeChips .chip[data-d]')];
  const peakline=document.getElementById('peakline'), peaktag=document.getElementById('peaktag');
  const rDia=document.getElementById('rDia'), rPeak=document.getElementById('rPeak'), rPos=document.getElementById('rPos'),
        rFlow=document.getElementById('rFlow'), rFlowNote=document.getElementById('rFlowNote'), status=document.getElementById('status');
  const svg=document.getElementById('chart'), playBtn=document.getElementById('playBtn');
  const bubble=document.getElementById('bubble'), control=document.getElementById('control');

  const lerp=(a,b,t)=>a+(b-a)*t;
  const peak={}; CASES.forEach(k=>{const c=cases[k]; let i=0; c.y.forEach((v,j)=>{if(v>c.y[i]) i=j;}); peak[k]={x:c.x[i],y:c.y[i]};});
  const color={3:'var(--a3)',7:'var(--a2)',11:'var(--a4)'};

  /* chart scaffold: the three simulated curves, drawn straight from the data */
  const M={l:56,r:18,t:16,b:44}, W=680,H=300, pw=W-M.l-M.r, ph=H-M.t-M.b;
  const X=x=>M.l+x/XMAX*pw, Y=y=>M.t+ph-y/YMAX*ph, NS='http://www.w3.org/2000/svg';
  const mk=(n,at,txt)=>{const e=document.createElementNS(NS,n);for(const k in at)e.setAttribute(k,at[k]);if(txt!=null)e.textContent=txt;svg.appendChild(e);return e;};
  for(let y=0;y<=YMAX;y++){ mk('line',{x1:M.l,x2:W-M.r,y1:Y(y),y2:Y(y),class:'gridline'}); mk('text',{x:M.l-8,y:Y(y)+4,'text-anchor':'end'},y); }
  for(let i=0;i<=6;i++){ const x=i*0.05; mk('text',{x:X(x),y:H-M.b+18,'text-anchor':'middle'},x.toFixed(2)); }
  mk('line',{x1:M.l,x2:M.l,y1:M.t,y2:H-M.b,class:'axis'}); mk('line',{x1:M.l,x2:W-M.r,y1:H-M.b,y2:H-M.b,class:'axis'});
  mk('text',{x:M.l+pw/2,y:H-6,'text-anchor':'middle'},'Axial length (m)');
  mk('text',{x:14,y:M.t+ph/2,'text-anchor':'middle',transform:`rotate(-90 14 ${M.t+ph/2})`},'Turbulence intensity (%)');
  const path={}, label={};
  CASES.forEach(k=>{
    const c=cases[k];
    path[k]=mk('path',{d:c.x.map((x,i)=>(i?'L':'M')+X(x).toFixed(1)+' '+Y(c.y[i]).toFixed(1)).join(' '),class:'cv',stroke:color[k]});
    label[k]=mk('text',{x:X(peak[k].x)+8,y:Y(peak[k].y)-6},k+' mm');
  });
  const drop=mk('line',{class:'drop',y1:M.t,y2:H-M.b,x1:0,x2:0,style:'display:none'});
  const dot=mk('circle',{class:'dot',r:6,cx:0,cy:0,style:'display:none'});

  function render(d){
    d=Math.min(11,Math.max(3,d));
    // picture: a visual cross-fade between neighbouring simulated cases (a transition only)
    if(d<=7){ L[3].style.opacity=1; L[7].style.opacity=(d-3)/4; L[11].style.opacity=0; }
    else    { L[3].style.opacity=0; L[7].style.opacity=1; L[11].style.opacity=(d-7)/4; }
    const near=CASES.reduce((a,b)=>Math.abs(b-d)<Math.abs(a-d)?b:a);
    const on=Math.abs(near-d)<0.05;
    const lo=d<=7?3:7, hi=d<=7?7:11;
    CASES.forEach(k=>{
      let w=1.5,o=0.3;                                          // other cases: faint
      if(on){ if(k===near){w=3.6;o=1;} }
      else  { if(k===lo||k===hi){w=2.4;o=0.85;} }               // between: both neighbouring cases shown as they are
      path[k].style.strokeWidth=w; path[k].style.opacity=o; label[k].style.opacity=on&&k!==near?0.4:1;
    });
    if(on){
      dot.style.display=''; drop.style.display='';
      dot.setAttribute('cx',X(peak[near].x)); dot.setAttribute('cy',Y(peak[near].y)); dot.setAttribute('fill',color[near]);
      drop.setAttribute('x1',X(peak[near].x)); drop.setAttribute('x2',X(peak[near].x)); drop.setAttribute('stroke',color[near]);
      const pct=peak[near].x/XMAX*100; peakline.style.display=''; peaktag.style.display='';
      peakline.style.left=pct+'%'; peaktag.style.left=Math.min(92,Math.max(8,pct))+'%'; peaktag.textContent='peak '+peak[near].y.toFixed(1)+'%';
      rPeak.textContent=peak[near].y.toFixed(1)+' %'; rPos.textContent=peak[near].x.toFixed(3)+' m';
      rFlow.textContent=flow[near]+' LPM'; rFlowNote.textContent='sampling flow rate (simulated case)';
      status.textContent='Simulated case: '+near+' mm, '+flow[near]+' LPM. Peak turbulence '+peak[near].y.toFixed(1)+'% at '+peak[near].x.toFixed(3)+' m.';
    } else {
      dot.style.display='none'; drop.style.display='none'; peakline.style.display='none'; peaktag.style.display='none';
      rPeak.textContent='n/a'; rPos.textContent='n/a'; rFlow.textContent='between cases';
      rFlowNote.textContent='simulated at 7.8, 43 and 101 LPM';
      status.textContent='Between the '+lo+' mm and '+hi+' mm cases. No simulation at this size: the curves shown are the two simulated cases, and the picture is only a transition.';
    }
    rDia.textContent=d.toFixed(1)+' mm';
    range.value=d; range.setAttribute('aria-valuetext',d.toFixed(1)+' millimeters');
    const p=(d-3)/8; range.style.setProperty('--p',(p*100)+'%');
    bubble.style.left='calc(16px + (100% - 32px) * '+p+')'; bubble.textContent=d.toFixed(1)+' mm';
    chips.forEach(c=>c.setAttribute('aria-pressed',on&&+c.dataset.d===near));
  }

  /* tick labels under the slider (click to jump) */
  const ticks=document.getElementById('ticks');
  [[3,'3 mm','7.8 LPM'],[7,'7 mm','43 LPM'],[11,'11 mm','101 LPM']].forEach(([v,a,b])=>{
    const s=document.createElement('span'); s.style.left=((v-3)/8*100)+'%'; s.innerHTML='<b>'+a+'</b><br>'+b;
    s.addEventListener('click',()=>{ stopPlay(); unpulse(); animateTo(v); }); ticks.appendChild(s);
  });

  /* smooth, slow animation toward a target diameter (sine ease in and out) */
  let raf=null, cur=3;
  const ease=t=>-(Math.cos(Math.PI*t)-1)/2;
  function animateTo(target,ms){
    return new Promise(res=>{
      cancelAnimationFrame(raf); const from=cur;
      if(Math.abs(target-from)<1e-3){cur=target;render(cur);res();return;}
      const dur=ms||Math.max(1000,Math.abs(target-from)*450), t0=performance.now();
      (function step(now){
        const t=Math.min(1,(now-t0)/dur); cur=lerp(from,target,ease(t)); render(cur);
        if(t<1) raf=requestAnimationFrame(step); else res();
      })(t0);
    });
  }
  function unpulse(){ control.classList.remove('pulse'); }
  range.addEventListener('input',()=>{
    unpulse(); stopPlay(); cancelAnimationFrame(raf);
    let v=+range.value; const s=CASES.find(k=>Math.abs(k-v)<0.25); if(s!==undefined) v=s;   // snap to a simulated case
    cur=v; render(cur);
  });
  chips.forEach(c=>c.addEventListener('click',()=>{ unpulse(); stopPlay(); animateTo(+c.dataset.d); }));

  /* play sweep: 3 -> 7 -> 11 -> 7 -> 3, each leg slow, with a pause at each simulated case */
  let playing=false, token=0;
  function stopPlay(){ playing=false; token++; playBtn.innerHTML='&#9654; Play sweep'; }
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  playBtn.addEventListener('click',async()=>{
    if(playing){ stopPlay(); cancelAnimationFrame(raf); return; }
    unpulse(); playing=true; const my=++token; playBtn.innerHTML='&#10074;&#10074; Pause';
    const path2=cur>=10.9?[7,3]:cur>=6.9?[11,7,3]:[7,11,7,3];
    while(playing&&my===token){
      for(const target of path2){
        if(!(playing&&my===token)) return;
        await animateTo(target,5500);
        if(!(playing&&my===token)) return;
        await wait(1800);
      }
      path2.splice(0,path2.length,7,11,7,3);
    }
  });

  cur=3; render(cur);
})();

