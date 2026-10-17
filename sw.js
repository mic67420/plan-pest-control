// PLAN PEST CONTROL — Service Worker
// But : TOUJOURS avoir la dernière version quand il y a du réseau, tout en gardant
// l'application utilisable HORS LIGNE (sous-sol, local technique, zone sans réseau).
//
// Stratégie :
// - La PAGE de l'application (index.html) : "réseau d'abord". Si le téléphone a du réseau,
//   on récupère toujours la version la plus récente (la mise à jour est visible dès le
//   lancement suivant, sans avoir à vider quoi que ce soit). Sans réseau, on retombe sur la
//   dernière version mémorisée.
// - Tout le reste (bibliothèques Konva/jsPDF/PptxGenJS/JSZip, polices, icônes) : "cache
//   d'abord, mise à jour en arrière-plan". Ces fichiers sont à version fixe, ils ne changent
//   pas d'une mise à jour de l'application à l'autre.
//
// CACHE_NAME : à incrémenter (v2, v3…) UNIQUEMENT si on change la liste des fichiers ci-dessous
// ou la version d'une bibliothèque (changer index.html seul n'oblige PAS à l'incrémenter).

const CACHE_NAME = "plan-pest-control-v1";

const CORE_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

// Bibliothèques externes utilisées par l'application (mêmes adresses que dans index.html).
const LIB_URLS = [
  "https://cdn.jsdelivr.net/npm/konva@9.3.6/konva.min.js",
  "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
  "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js",
  "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_FILES);
    // Les bibliothèques sont mémorisées une par une : l'échec de l'une (pas de réseau au
    // moment de l'installation) ne doit pas empêcher l'installation des autres fichiers.
    await Promise.all(LIB_URLS.map(async (url) => {
      try { await cache.add(new Request(url, { mode: "no-cors" })); } catch (e) { /* réessayé plus tard par le cache d'exécution */ }
    }));
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  const isPage = req.mode === "navigate" ||
    (url.origin === self.location.origin && (url.pathname.endsWith("/") || url.pathname.endsWith(".html")));

  if (isPage) {
    // Réseau d'abord ("no-cache" = on redemande toujours au serveur si la page a changé,
    // sans se contenter de la copie gardée ~10 min par GitHub Pages / le navigateur).
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const fresh = await fetch(new Request(req.url, { cache: "no-cache" }));
        if (fresh && fresh.status === 200) cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        return (await cache.match(req)) || (await cache.match("./index.html")) || Response.error();
      }
    })());
    return;
  }

  // Cache d'abord + mise à jour discrète en arrière-plan.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    const network = fetch(req).then((res) => {
      // status 0 = réponse "opaque" d'un autre site (bibliothèques, polices) : utilisable telle quelle.
      if (res && (res.status === 200 || res.status === 0)) cache.put(req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  })());
});
