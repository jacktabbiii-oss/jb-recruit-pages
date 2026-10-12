const {chromium}=require('playwright');const fs=require('fs');
const [slug,photo,out,pos]=process.argv.slice(2);
const R=JSON.parse(fs.readFileSync(`/home/claude/jb-recruit-pages/recruits/${slug}.json`));
const P='/home/claude/jb-recruit-pages/public';const F=(process.env.FONTS||__dirname+'/node_modules/@fontsource');
const b64=(f,t)=>`data:${t};base64,`+fs.readFileSync(f).toString('base64');
const html=`<html><head><style>
@font-face{font-family:BS;font-weight:900;src:url(${b64(F+'/big-shoulders-display/files/big-shoulders-display-latin-900-normal.woff2','font/woff2')})}
@font-face{font-family:PM;font-weight:500;src:url(${b64(F+'/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2','font/woff2')})}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;overflow:hidden;background:#0A1120;color:#EAF0F8;position:relative;font-family:PM}
.ph{position:absolute;right:0;top:0;width:820px;height:630px;background:url(${b64(P+photo,'image/webp')}) ${pos||'50% 30%'}/cover no-repeat}
.fade{position:absolute;inset:0;background:linear-gradient(90deg,#0A1120 0%,#0A1120 30%,rgba(10,17,32,.85) 42%,rgba(10,17,32,.2) 62%,rgba(10,17,32,0) 80%),linear-gradient(0deg,rgba(10,17,32,.55),transparent 30%)}
.l{position:absolute;left:68px;top:60px;bottom:60px;display:flex;flex-direction:column;width:520px}
.logo{height:44px;width:auto;align-self:flex-start}
h1{font-family:BS;font-weight:900;font-size:160px;line-height:.82;text-transform:uppercase;margin-top:auto}
h1 span{display:block;color:#2B9BFF}
.tag{margin-top:22px;font-size:23px;letter-spacing:.04em;color:#C3CDDD}.tag b{color:#fff}
.for{margin-top:14px;font-size:16px;letter-spacing:.14em;text-transform:uppercase;color:#2B9BFF}
.bar{position:absolute;left:0;right:0;bottom:0;height:8px;background:linear-gradient(90deg,#2B9BFF,#2B9BFF 40%,transparent)}
</style></head><body><div class="ph"></div><div class="fade"></div>
<div class="l"><img class="logo" src="${b64(P+'/jb-logo.png','image/png')}">
<h1>${R.first}<span>${R.last}</span></h1>
<div class="tag"><b>${R.position}</b> · ${R.school}${R.number?` · #${R.number}`:``}</div>
<div class="for">${R.ogFor||`Prepared for ${R.first} and the ${R.last}s`}</div></div><div class="bar"></div></body></html>`;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1200,height:630}});await p.setContent(html);await p.waitForTimeout(400);await p.screenshot({path:out,type:'jpeg',quality:90});await b.close();console.log(out)})();
