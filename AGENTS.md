# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# LiveTV con API worldcup26.ir

**API**: `worldcup26.ir` — sin auth para GET, sin CORS.

**Proxy**: La API no tiene `Access-Control-Allow-Origin`, así que en web necesita proxy:
```bash
# Terminal 1: proxy
node server.js

# Terminal 2: web
npx expo export --platform web
npx serve dist
```

El `api.js` detecta automáticamente web vs native. En native (Android TV, Apple TV) el fetch funciona directo sin proxy.
