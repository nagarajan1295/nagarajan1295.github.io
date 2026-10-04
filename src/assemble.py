"""Assembles index.template.html from style.css + body.html + the page scripts.
Run once after editing style.css or body.html, then run build.py to inline the curve data."""
import pathlib, re

d = pathlib.Path(__file__).parent
old = (d / "index.template.html").read_text(encoding="utf-8")
css = (d / "style.css").read_text(encoding="utf-8")
body = (d / "body.html").read_text(encoding="utf-8")

# ---------- inline links: [[key|text]] -> a quiet link that opens in a new tab ----------
LINKS = {
    "wb57":      "https://www.nasa.gov/specials/jsc-aircraft-ops/index.html",
    "sabre":     "https://csl.noaa.gov/projects/sabre/",
    "csl":       "https://csl.noaa.gov/",
    "nasa":      "https://www.nasa.gov/",
    "harvard":   "https://www.harvard.edu/",
    "clarkson":  "https://www.clarkson.edu/",
    "iitm":      "https://www.iitm.ac.in/",
    "ntpc":      "https://www.ntpc.co.in/",
    "fluent":    "https://www.ansys.com/products/fluids/ansys-fluent",
    "purpleair": "https://www.purpleair.com/",
    "plantower": "https://www.plantower.com/",
    "teensy":    "https://www.pjrc.com/store/teensy41.html",
    "lattepanda":"https://www.lattepanda.com/",
    "aaar":      "https://www.aaar.org/",
    "amt":       "https://amt.copernicus.org/",
    "ast":       "https://www.tandfonline.com/journals/uast20",
    "dhaniyala": "https://sites.clarkson.edu/suresh-dhaniyala/",
    "seshadri":  "https://wsai.iitm.ac.in/faculty/satyanarayanan_seshadri/",
}
EXT = ('<svg class="ext" viewBox="0 0 16 16" aria-hidden="true"><path d="M9 2h5v5M14 2 7.5 8.5M12 9.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3.5" '
       'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>')

def link(m):
    key, text = m.group(1), m.group(2)
    return f'<a class="ref" href="{LINKS[key]}" target="_blank" rel="noopener">{text}</a>'

body = re.sub(r"\[\[(\w+)\|([^\]]+)\]\]", link, body)
body = body.replace("[[fn]]", '<a class="fn" href="#footnote" aria-label="See footnote">*</a>')
body = body.replace("[[ext]]", EXT)
assert "[[" not in body, "unresolved token"

# ---------- scripts: keep the working ones from the existing page ----------
a = old.index("const CURVES = /*CURVES*/;")
b = old.index("/* ---------- copy email")
js_main = old[a:b]
js_main = js_main.replace("W=680,H=300", "W=680,H=320")
js_main = js_main.replace("calc(20px + (100% - 40px) * '", "calc(17px + (100% - 34px) * '")
assert "H=320" in js_main and "17px" in js_main

js_tail = r"""/* ---------- copy email ---------- */
document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{
  const t=b.dataset.copy; let ok=false;
  try{ await navigator.clipboard.writeText(t); ok=true; }catch(e){
    const ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select();
    try{ ok=document.execCommand('copy'); }catch(_){} ta.remove(); }
  b.textContent=ok?'Copied':'Press Ctrl+C';
  setTimeout(()=>{b.textContent='Copy'},2000);
}));

/* ---------- contact sheet: scales in over a blurred backdrop, and out again ---------- */
const mailDialog=document.getElementById('mailDialog');
document.querySelectorAll('[data-open-mail]').forEach(b=>b.addEventListener('click',()=>{
  if(typeof mailDialog.showModal==='function') mailDialog.showModal(); else window.location.href='mailto:radhakn@clarkson.edu';
}));
function closeSheet(){
  if(!mailDialog.open) return;
  if(reduceMotion){ mailDialog.close(); return; }
  if(mailDialog.classList.contains('closing')) return;
  mailDialog.classList.add('closing');
  let done=false, timer=0;
  const finish=()=>{
    if(done) return; done=true; clearTimeout(timer);
    mailDialog.removeEventListener('animationend',onEnd);
    mailDialog.classList.remove('closing'); mailDialog.close();
  };
  const onEnd=ev=>{ if(ev.target===mailDialog) finish(); };
  mailDialog.addEventListener('animationend',onEnd);
  timer=setTimeout(finish,420);
}
mailDialog.addEventListener('click',e=>{ if(e.target===mailDialog) closeSheet(); });
mailDialog.addEventListener('cancel',e=>{ e.preventDefault(); closeSheet(); });
mailDialog.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closeSheet));
mailDialog.querySelectorAll('a.sheet-row').forEach(a=>a.addEventListener('click',()=>setTimeout(closeSheet,200)));

/* ---------- image viewer ---------- */
const lb=document.getElementById('lb'),lbi=lb.querySelector('img');
document.addEventListener('click',e=>{
  const im=e.target.closest('figure img');
  if(im){lbi.src=im.src;lbi.alt=im.alt;lb.classList.add('on');}
  else if(lb.classList.contains('on')) lb.classList.remove('on');
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')lb.classList.remove('on')});
"""

head_end = old.index("<style>")
head = old[:head_end]

page = (head + "<style>\n" + css + "</style>\n"
        "<script>\n  /* apply a saved theme choice before first paint (falls back to the system setting) */\n"
        "  try{ var th=localStorage.getItem('theme'); if(th==='light'||th==='dark') document.documentElement.setAttribute('data-theme',th); }catch(e){}\n</script>\n"
        "</head>\n<body>\n\n" + body + "\n<script>\n" + js_main + js_tail + "</script>\n"
        '<script data-goatcounter="https://nagarajan1295.goatcounter.com/count"\n        async src="//gc.zgo.at/count.js"></script>\n'
        "</body>\n</html>\n")
(d / "index.template.html").write_text(page, encoding="utf-8")
print("assembled", len(page), "bytes")
