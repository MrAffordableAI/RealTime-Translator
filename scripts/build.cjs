'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..'), out = path.join(root,'dist');
fs.mkdirSync(out,{recursive:true});
for (const name of ['index.html','app.js']) fs.copyFileSync(path.join(root,name),path.join(out,name));
const unexpected = fs.readdirSync(out).filter(name => !['index.html','app.js'].includes(name));
if (unexpected.length) throw new Error('Unexpected build output; use a clean dist directory.');
console.log('Frontend-only build verified: index.html, app.js');
