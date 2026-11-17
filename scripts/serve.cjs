'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root = path.join(__dirname,'..','dist');
const routes = {'/':['index.html','text/html; charset=utf-8'],'/index.html':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8']};
http.createServer((req,res) => {
  const route = routes[new URL(req.url,'http://localhost').pathname];
  if (!route || req.method !== 'GET') { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200,{'Content-Type':route[1],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});
  res.end(fs.readFileSync(path.join(root,route[0])));
}).listen(8085,'127.0.0.1',()=>console.log('FluentTalk demo: http://127.0.0.1:8085/'));
