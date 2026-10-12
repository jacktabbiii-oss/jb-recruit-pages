/* Page audit: run before every deploy.
   node scripts/audit.js [baseUrl]   (default http://localhost:4567, needs playwright)
   Fails on: another recruit's name on a page, template junk (undefined/NaN/${), JS errors,
   broken images/videos, sideways scroll, empty headings, hero name overflow.
   Warns on: tight-end wording on non-TE pages, stats older than 7 days. */
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const ROOT=path.join(__dirname,'..');const BASE=process.argv[2]||'http://localhost:4567';
const R=fs.readdirSync(path.join(ROOT,'recruits')).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(path.join(ROOT,'recruits',f))));
const TE_OK=[/tight end and linebacker/i,/former NFL tight end/i,/tight end room/i,/tight ends train/i,/TE pay/,/TE market/,/TE ·/,/· TE/,/Plus the tight end/i];
/* the shared template must never carry a player's name: names come from each player's JSON */
{const t=fs.readFileSync(path.join(ROOT,'template.html'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/<!--[\s\S]*?-->/g,'');
 for(const r of R)for(const n of [r.last,`${r.first} ${r.last}`,`${r.last}s`])if(n&&n.length>3&&new RegExp(`\\b${n}\\b`).test(t)&&!/example/.test(r.slug))console.log(`✗ FAIL template.html: hardcoded "${n}"`),process.exitCode=1}
(async()=>{const b=await chromium.launch({executablePath:fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined});
 let fails=0,warns=0;const out=(lvl,slug,msg)=>{console.log(`${lvl==='FAIL'?'✗':'!'} ${lvl} ${slug}: ${msg}`);lvl==='FAIL'?fails++:warns++};
 for(const r of R){if(r.active===false)continue;
  const others=R.filter(o=>o.slug!==r.slug&&!/example/.test(o.slug)).flatMap(o=>[`${o.first} ${o.last}`,o.last]).filter(n=>n&&n.length>3&&n!==r.last);
  for(const [dev,vp] of [['desktop',{width:1440,height:900}],['phone',{width:390,height:844}]]){
   const ctx=await b.newContext({viewport:vp,isMobile:dev==='phone'});const p=await ctx.newPage();const errs=[],bad=[];
   p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts\.g|ERR_TUNNEL|net::/.test(m.text()))errs.push(m.text())});
   p.on('response',res=>{const u=res.url();if(res.status()>=400&&!/\/api\/track|fonts\./.test(u))bad.push(res.status()+' '+u)});
   await p.goto(`${BASE}/r/${r.slug}/${r.token}`,{waitUntil:'networkidle'});
   await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){scrollTo(0,y);await new Promise(z=>setTimeout(z,40))}scrollTo(0,0)});await p.waitForTimeout(800);
   const info=await p.evaluate(()=>{const t=[...document.querySelectorAll('body *')].filter(e=>!['SCRIPT','STYLE'].includes(e.tagName)&&e.children.length===0).map(e=>e.textContent).join(' \n ');
     return {text:t,overflow:document.documentElement.scrollWidth-innerWidth,
      brokenImg:[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&i.src&&!/ytimg\.com/.test(i.src)).map(i=>i.getAttribute('src')),
      videos:[...document.querySelectorAll('video')].map(v=>v.getAttribute('src')),
      emptyHead:[...document.querySelectorAll('h1,h2,h3,.eyebrow')].filter(e=>!e.textContent.trim()&&!e.closest('[hidden]')).map(e=>e.id||e.className),
      h1:(()=>{const h=document.querySelector('#heroName');return [...h.children].some(c=>{c.style.display='inline-block';const w=c.getBoundingClientRect().width;c.style.display='';return w>h.clientWidth+2})})()}});
   for(const n of others)if(info.text.includes(n))out('FAIL',r.slug,`${dev}: mentions another recruit "${n}"`);
   for(const j of ['undefined','NaN','${','[object','null ·','· null'])if(info.text.includes(j))out('FAIL',r.slug,`${dev}: template junk "${j}"`);
   errs.forEach(e=>out('FAIL',r.slug,`${dev}: JS error ${e.slice(0,120)}`));bad.forEach(e=>out('FAIL',r.slug,`${dev}: ${e}`));
   info.brokenImg.forEach(s=>out('FAIL',r.slug,`${dev}: broken image ${s}`));
   if(info.overflow>2)out('FAIL',r.slug,`${dev}: page scrolls sideways by ${info.overflow}px`);
   info.emptyHead.forEach(s=>out('FAIL',r.slug,`${dev}: empty heading ${s}`));
   if(info.h1)out('FAIL',r.slug,`${dev}: hero name wider than its column`);
   if(dev==='desktop'){
    for(const v of info.videos){const res=await p.request.get(BASE+v,{headers:{range:'bytes=0-1'}});if(res.status()>=400)out('FAIL',r.slug,`video ${v} -> ${res.status()}`)}
    const og=await p.$eval('meta[property="og:image"]',m=>m.content).catch(()=>null);
    if(!og)out('FAIL',r.slug,'no share image');else{const res=await p.request.get(og.replace(/^https?:\/\/[^/]+/,BASE));if(res.status()>=400)out('FAIL',r.slug,`share image ${og} -> ${res.status()}`)}
    if(r.positionGroup&&r.positionGroup!=='TE'){const lines=info.text.split(' \n ').filter(l=>/tight end|\bTE\b/i.test(l)&&!TE_OK.some(rx=>rx.test(l))&&!/^TE$/.test(l.trim()));
      [...new Set(lines)].forEach(l=>out('WARN',r.slug,`TE wording on a ${r.positionGroup} page: "${l.trim().slice(0,90)}"`))}
    const d=(r.numbersSrc||'').match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? (\d+)/);
    if(d){const dt=new Date(`${d[1]} ${d[2]} ${new Date().getFullYear()}`);if((Date.now()-dt)/864e5>7)out('WARN',r.slug,`stats dated ${d[0]} are over a week old`)}
   }
   await ctx.close()}}
 await b.close();console.log(`\n${fails} failures, ${warns} warnings across ${R.filter(r=>r.active!==false).length} pages`);process.exit(fails?1:0)})();
