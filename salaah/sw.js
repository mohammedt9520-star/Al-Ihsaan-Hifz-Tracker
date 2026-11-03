// Service worker for the student Salaah Entry page only (scope /salaah/).
// Bump CACHE whenever salaah/index.html changes so tablets pick up the new version.
const CACHE='salaah-kiosk-20261103-170000';
const CDN=['https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js','https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js'];
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(CDN.map(u=>c.add(u).catch(()=>{})))));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.indexOf('salaah-kiosk-')===0&&x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.hostname.includes('supabase'))return; // data always goes to the network
  const ok=u.hostname.includes('cdnjs')||u.hostname.includes('fonts.googleapis')||u.hostname.includes('fonts.gstatic')||(u.origin===self.location.origin&&u.pathname.indexOf('/salaah/')===0)||u.pathname==='/icon-192.png'||u.pathname==='/icon-512.png';
  if(!ok)return;
  // Stale-while-revalidate: instant from cache, refreshed in the background.
  e.respondWith(caches.open(CACHE).then(cache=>cache.match(e.request).then(cached=>{
    const net=fetch(e.request).then(r=>{if(r&&r.status===200)cache.put(e.request,r.clone());return r;}).catch(()=>cached);
    return cached||net;
  })));
});
