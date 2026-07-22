/* Sauerteig-Wissensbibliothek - Service Worker */
var CACHE = 'smk-biblio-v3';
var SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192-v2.png',
  './icon-512-v2.png',
  './icon-180-v2.png',
  './Sauerteig-Wissensbibliothek-SMK.pdf'
];
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    // add individually so one missing file (e.g. renamed PDF) doesn't break install
    return Promise.all(SHELL.map(function(u){return c.add(u).catch(function(){});}));
  }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){if(k!==CACHE)return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method!=='GET')return;
  var url = new URL(req.url);
  // Google Fonts: stale-while-revalidate
  if(url.hostname.indexOf('fonts.googleapis.com')>-1 || url.hostname.indexOf('fonts.gstatic.com')>-1){
    e.respondWith(caches.open(CACHE).then(function(c){
      return c.match(req).then(function(hit){
        var net=fetch(req).then(function(res){c.put(req,res.clone());return res;}).catch(function(){return hit;});
        return hit||net;
      });
    }));
    return;
  }
  // same-origin navigations: network-first, fallback to cached index
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).catch(function(){return caches.match('./index.html');}));
    return;
  }
  // same-origin static: cache-first
  if(url.origin===self.location.origin){
    e.respondWith(caches.match(req).then(function(hit){
      return hit || fetch(req).then(function(res){
        var copy=res.clone();caches.open(CACHE).then(function(c){c.put(req,copy);});return res;
      }).catch(function(){return hit;});
    }));
  }
});
