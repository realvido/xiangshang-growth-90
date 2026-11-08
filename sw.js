/* Public standalone package only. User notes stay in localStorage. */
const ROOT=new URL('./',self.registration.scope).href;
const PREFIX='xiangshang-public-'+encodeURIComponent(new URL(ROOT).pathname)+'-';
const CACHE=PREFIX+'20261105-v1';
const FILES=['index.html','style.css','app.js','curriculum.js','icon.svg','icon-192.png','icon-512.png','manifest.webmanifest'];
const ASSETS=FILES.map(name=>new URL(name,ROOT).href);
const SHELL=ASSETS[0];
function eligible(r){return r.ok&&!r.redirected&&r.type!=='opaque';}
async function validShell(r){return eligible(r)&&(await r.clone().text()).includes('name="xiangshang-shell" content="standalone-v1"');}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const entries=await Promise.all(ASSETS.map(async url=>{
  const r=await fetch(url,{cache:'reload',credentials:'same-origin'});
  if(!eligible(r)||(url===SHELL&&!(await validShell(r))))throw Error('Incomplete standalone assets');
  return [url,r];
 }));
 const cache=await caches.open(CACHE);
 await Promise.all(entries.map(([url,r])=>cache.put(url,r)));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await Promise.all((await caches.keys()).filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==new URL(ROOT).origin)return;
 const navigation=event.request.mode==='navigate'&&(url.pathname===new URL(ROOT).pathname||url.pathname===new URL(SHELL).pathname);
 const known=ASSETS.includes(url.href);
 if(!navigation&&!known)return;
 event.respondWith((async()=>{
  const key=navigation?SHELL:url.href;
  const cache=await caches.open(CACHE);
  const cached=await cache.match(key);
  if(cached)return cached;
  const r=await fetch(event.request);
  if(eligible(r)&&(!navigation||await validShell(r)))await cache.put(key,r.clone());
  return r;
 })());
});
