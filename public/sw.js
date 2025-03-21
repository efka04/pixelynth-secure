// public/sw.js

const CACHE_NAME = 'pixelynth-cache-v1';
const urlsToCache = [
  // Ajoute ici les ressources à mettre en cache (ex. '/favicon.ico', '/styles.css', etc.)
];

// Installation du service worker et mise en cache des ressources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Interception des requêtes et gestion du cache pour les images
self.addEventListener('fetch', (event) => {
  // On vérifie si l'URL contient "/images/"
  if (event.request.url.includes('/images/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          // Si l'image est dans le cache, on la renvoie
          return response;
        }
        // Sinon, on la récupère depuis le réseau
        return fetch(event.request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            // On ajoute la nouvelle image dans le cache
            cache.put(event.request.url, response.clone());
            return response;
          });
        });
      })
    );
  }
});

// Activation du service worker et suppression des anciens caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
