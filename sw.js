const CACHE='hifz-20260706-350000';
const CDN=['https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js','https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(CDN.map(u=>c.add(u).catch(()=>{})))));
});
self.addEventListener('message',e=>{
  if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.hostname.includes('supabase'))return;
  if(u.hostname.includes('cdnjs')||u.hostname.includes('fonts.googleapis')||u.hostname.includes('fonts.gstatic')){
    e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{if(r&&r.status===200)caches.open(CACHE).then(cc=>cc.put(e.request,r.clone()));return r;})));
    return;
  }
  if(u.origin===self.location.origin){
    // Stale-while-revalidate: serve cache instantly, refresh in background
    e.respondWith(caches.open(CACHE).then(function(cache){
      return cache.match(e.request).then(function(cached){
        var networkUpdate=fetch(e.request).then(function(r){if(r&&r.status===200)cache.put(e.request,r.clone());return r;}).catch(function(){return cached;});
        return cached||networkUpdate;
      });
    }));
    return;
  }
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});
