/**
 * MathQuest - Service Worker
 * Estratégia: Network-First para desenvolvimento, Cache-First para assets estáticos.
 */
const CACHE_NAME = 'mathquest-v3';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/css/variables.css',
    '/assets/css/main.css',
    '/assets/css/animations.css',
    '/assets/css/responsive.css',
    '/assets/js/data/tricks.js',
    '/assets/js/data/challenges.js',
    '/assets/js/engine/storageManager.js',
    '/assets/js/engine/animationEngine.js',
    '/assets/js/engine/progressionEngine.js',
    '/assets/js/engine/soundEngine.js',
    '/assets/js/engine/gameEngine.js',
    '/assets/js/operations/addition.js',
    '/assets/js/operations/subtraction.js',
    '/assets/js/operations/multiplication.js',
    '/assets/js/operations/division.js',
    '/assets/js/modes/discoveryMode.js',
    '/assets/js/modes/challengeMode.js',
    '/assets/js/modes/detectiveMode.js',
    '/assets/js/ui/rewards.js',
    '/assets/js/ui/screens.js',
    '/assets/js/ui/components.js',
    '/assets/images/icon.svg'
];

// Instalação: Salva os arquivos estáticos no cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Interceptação de rede
self.addEventListener('fetch', (event) => {
    // 1. FILTRO CRÍTICO: Ignora requisições que não são do próprio site (ex: chrome-extension)
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // 2. Ignora métodos que não são GET (ex: POST)
    if (event.request.method !== 'GET') {
        return;
    }

    // 3. Estratégia: Network-First para o HTML/JS (desenvolvimento) e Cache-First para o resto
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Se a rede respondeu, atualiza o cache com a versão nova
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Se a rede falhou (offline), busca no cache
                return caches.match(event.request);
            })
    );
});