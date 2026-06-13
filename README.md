# LiveTV

Live TV streaming app para el Mundial 2026, con soporte para Android TV, Apple TV y Web.

## Stack

- **Framework**: [Expo 56](https://docs.expo.dev/versions/v56.0.0/) (React Native 0.85)
- **Router**: Expo Router
- **Video**: `expo-video`, `hls.js`
- **Backend/Proxy**: Node.js (HTTP server sin frameworks)
- **Storage**: JSON file o MongoDB
- **API externa**: `worldcup26.ir` (sin CORS)

## Arquitectura

```
┌──────────────────────────────────────────────────┐
│                   Cliente                         │
│  ┌────────────────┐  ┌─────────────────────────┐ │
│  │  Native (TV)   │  │     Web (Vercel)         │ │
│  │  Android/iOS   │  │  expo export --web       │ │
│  └───────┬────────┘  └───────────┬─────────────┘ │
└──────────┼───────────────────────┼───────────────┘
           │                       │
           │  fetch directo        │  fetch proxy
           ▼                       ▼
┌──────────────────────────────────────────────────┐
│           Servidor (Render)                       │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │
│  │  Proxy   │  │   API    │  │ Admin Panel     │ │
│  │ /get/*   │  │ /api/*   │  │ /admin          │ │
│  └──────────┘  └──────────┘  └────────────────┘ │
│  ┌──────────┐  ┌────────────────────────────────┐│
│  │ Storage  │  │  MongoDB / JSON                 ││
│  └──────────┘  └────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

### ¿Por qué un proxy?

La API `worldcup26.ir` no tiene `Access-Control-Allow-Origin`, por lo que el browser bloquea las requests directas. En native (Android TV / Apple TV) no hay restricción de CORS, por lo que el fetch es directo.

El `api.js` y `subscription.js` detectan automáticamente si es web o native.

## Deploy

### Server (Node.js — Render)

```bash
node server.js
```

Variables de entorno:

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto (default 4000) |
| `MONGODB_URI` | Opcional — si se omite usa JSON file |

### Web (Vercel)

Conectar el repo de GitHub desde [vercel.com/new](https://vercel.com/new). El `vercel.json` ya está configurado:

- Build: `npx expo export --platform web`
- Output: `dist/`

### Android TV

```bash
eas build --platform android
```

### iOS / Apple TV

```bash
eas build --platform ios
```

## Desarrollo local

```bash
# Terminal 1: proxy
node server.js

# Terminal 2: web
npx expo export --platform web
npx serve dist
```

Para desarrollo con hot-reload:

```bash
npx expo start --web
```

## Licencia

MIT
