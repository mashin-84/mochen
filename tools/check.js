const fs=require('fs');const f=process.argv[2];const h=fs.readFileSync(f,'utf8');
const m=[...h.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
try{m.forEach(x=>new Function(x[1]));console.log('syntax ok',m.length)}catch(e){console.log('SYNTAX',e.message)}
(async()=>{const {chromium}=require('playwright');const b=await chromium.launch();const errs=[];
for(const [w,hh] of [[1280,720],[844,390]]){const p=await b.newPage({viewport:{width:w,height:hh}});p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(f));await p.waitForTimeout(1500);await p.screenshot({path:`/home/claude/shot_${w}.png`});}
console.log('pageerrors',errs.length,errs.slice(0,3));await b.close()})();
