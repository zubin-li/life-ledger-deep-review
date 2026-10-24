// Stable loopback origin keeps the user's browser-local trial data between restarts.
// No fixture injection, auth service, public binding or access outside public/.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fs.realpathSync(fileURLToPath(new URL('../public',import.meta.url)));
const port=Number(process.env.LIFE_LEDGER_PREVIEW_PORT || 43117);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid LIFE_LEDGER_PREVIEW_PORT');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json','.woff2':'font/woff2','.mp4':'video/mp4'};
const server=http.createServer((req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end('Local preview is read-only over HTTP. App records stay in your browser.');return;}
 try{
  const requestPath=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const file=fs.realpathSync(path.resolve(root,'.'+(requestPath==='/'?'/index.html':requestPath)));
  if(!file.startsWith(root+path.sep)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});
  if(req.method==='HEAD')res.end();else fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
 }catch{res.writeHead(404);res.end('Not found');}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is already occupied. No existing process was stopped.`:error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Life Ledger 本地交互版：http://127.0.0.1:${port}/?mode=local&lang=zh&preview=local\nOnly this computer can connect. No online deployment or user data is modified.`));
