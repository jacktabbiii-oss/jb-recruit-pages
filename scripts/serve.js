/* Local preview: node scripts/serve.js  ->  http://localhost:4567/r/<slug>/<token> */
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');process.chdir(ROOT);process.env.ALERTS_ENABLED='0';
const page=require(path.join(ROOT,'api/page.js'));
http.createServer(async(req,res)=>{
  const m=req.url.match(/^\/r\/([^\/]+)\/([^\/?]+)(?:\/([^\/?]+))?/);
  if(m){req.query={slug:m[1],token:m[2],key:m[3]};return page(req,{setHeader:(k,v)=>res.setHeader(k,v),status(c){res.statusCode=c;return this},end(s){res.end(s)}});}
  const f=path.join(ROOT,'public',decodeURIComponent(req.url.split('?')[0]));
  if(fs.existsSync(f)&&fs.statSync(f).isFile()){res.end(fs.readFileSync(f))}else{res.statusCode=404;res.end()}
}).listen(process.env.PORT||4567,()=>console.log('preview on http://localhost:'+(process.env.PORT||4567)));
