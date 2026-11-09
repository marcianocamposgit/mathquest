from pathlib import Path
p = Path(r'D:\Projetos\MathQuest\src\frontend\service-worker.js')
p.write_text(r'''/**
 * MathQuest - Service Worker (definitivo)
 * Cache-First: assets estaticos (CSS, JS, imagens, sons)
 * Network-First: HTML (sempre busca versao nova)
 * Nunca cachear: /pai/, chamadas API, extensoes do Chrome
 */
const CACHE_NAME = 'mathquest-v4';
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

// Instalacao: salva assets estaticos no cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
    self.skipWaiting();
});

// Ativacao: limpa caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(names.map((n) => n !== CACHE_NAME ? caches.delete(n) : undefined))
        )
    );
    self.clients.claim();
});

// Interceptacao de rede
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ignora: extensoes do Chrome, outros dominios internos
    if (!url.protocol.startsWith('http')) return;

    // Ignora: metodos que nao sao GET
    if (event.request.method !== 'GET') return;

    // NUNCA cachear: painel do pai (precisa de dados frescos)
    if (url.pathname.startsWith('/pai')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // NUNCA cachear: chamadas API (onrender, localhost:8001)
    if (url.hostname.includes('onrender.com') || url.pathname.startsWith('/api')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Assets estaticos (CSS, JS, imagens): Cache-First
    if (url.pathname.match(/\.(css|js|svg|png|jpg|webp|woff2|json)$/)) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;
                return fetch(event.request).then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // HTML e tudo mais: Network-First (busca novo, fallback pro cache)
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
''', encoding='utf-8', newline='\n')
print('[OK] Service Worker v4 criado')
