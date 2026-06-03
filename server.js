const http = require('http');
const https = require('https');
const path = require('path');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');

const PROXY_TARGET = 'https://worldcup26.ir';
const ADMIN_DIR = path.join(__dirname, 'admin');
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

let db;

const M3U8_CACHE = {};
const M3U8_CACHE_TTL = 3000;

setInterval(() => {
  const now = Date.now();
  for (const key in M3U8_CACHE) {
    if (now - M3U8_CACHE[key].ts > M3U8_CACHE_TTL) delete M3U8_CACHE[key];
  }
}, M3U8_CACHE_TTL * 2);

async function seedData() {
  const adminExists = await db.collection('admin').findOne({ _id: 'admin' });
  if (!adminExists) {
    await db.collection('admin').insertOne({
      _id: 'admin',
      password: 'admin123',
      token: null,
    });
    console.log('  → Seeded admin user (default password: admin123)');
  }

  const channelCount = await db.collection('channels').countDocuments();
  if (channelCount === 0) {
    await db.collection('channels').insertMany([
      { id: 'telefe', name: 'Telefe', country: 'Argentina', logo: null, streamUrl: null, note: 'Disponible durante el Mundial' },
      { id: 'espn', name: 'ESPN', country: 'Argentina', logo: null, streamUrl: null, note: 'Disponible durante el Mundial' },
      { id: 'tycsports', name: 'TyC Sports', country: 'Argentina', logo: null, streamUrl: null, note: 'Disponible durante el Mundial' },
    ]);
    console.log('  → Seeded default channels');
  }
}

function generateCode() {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `WC26-${rand.slice(0, 4)}-${rand.slice(4, 8)}`;
}

function jsonResponse(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

async function isAdmin(req) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return false;
  const admin = await db.collection('admin').findOne({ _id: 'admin' });
  return admin && auth.slice(7) === admin.token;
}

// ─── Proxy helpers ──────────────────────────────────────────

function proxyRequest(targetUrl, res, contentType) {
  const transport = targetUrl.protocol === 'https:' ? https : http;
  const reqOpts = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
    path: targetUrl.pathname + targetUrl.search,
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  };
  const proxyReq = transport.request(reqOpts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': contentType || proxyRes.headers['content-type'] || 'application/octet-stream',
    });
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) { res.writeHead(502); }
    res.end(JSON.stringify({ error: err.message }));
  });
  proxyReq.setTimeout(15000, () => {
    proxyReq.destroy(new Error('Proxy timeout'));
  });
  proxyReq.end();
}

function isM3u8Response(proxyRes, targetUrl) {
  const ct = proxyRes.headers['content-type'] || '';
  if (ct.includes('mpegurl') || ct.includes('x-mpegURL')) return true;
  if (targetUrl.href.includes('.m3u8')) return true;
  return false;
}

function fetchStreamWithRedirect(targetUrl, res, redirects = 0) {
  if (redirects > 5) {
    if (!res.headersSent) { res.writeHead(502); }
    res.end(JSON.stringify({ error: 'Too many redirects' }));
    return;
  }

  const urlStr = targetUrl.href;
  if (urlStr.includes('.m3u8')) {
    const cached = M3U8_CACHE[urlStr];
    if (cached && Date.now() - cached.ts < M3U8_CACHE_TTL) {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/x-mpegURL',
      });
      res.end(cached.body);
      return;
    }
  }

  const transport = targetUrl.protocol === 'https:' ? https : http;
  const proxyReq = transport.request({
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
    path: targetUrl.pathname + targetUrl.search,
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  }, (proxyRes) => {
    if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
      proxyRes.resume();
      const redirectUrl = new URL(proxyRes.headers.location, targetUrl.origin);
      console.log(`  → Redirect: ${targetUrl.href}`);
      console.log(`  →   to: ${redirectUrl.href}`);
      fetchStreamWithRedirect(redirectUrl, res, redirects + 1);
      return;
    }

    if (isM3u8Response(proxyRes, targetUrl)) {
      const chunks = [];
      proxyRes.on('data', (chunk) => chunks.push(chunk));
      proxyRes.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        const base = targetUrl.href.substring(0, targetUrl.href.lastIndexOf('/') + 1);
        const proxyBase = `/proxy/video?url=`;
        const rewritten = body.split('\n').map((line) => {
          const t = line.trim();
          if (t && !t.startsWith('#') && !t.startsWith('http://') && !t.startsWith('https://')) {
            const fullUrl = t.startsWith('/') ? new URL(t, targetUrl.origin).href : base + t;
            return proxyBase + encodeURIComponent(fullUrl);
          }
          return line;
        }).join('\n');
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/x-mpegURL',
        });
        M3U8_CACHE[urlStr] = { body: rewritten, ts: Date.now() };
        res.end(rewritten);
      });
      return;
    }

    res.writeHead(proxyRes.statusCode, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': proxyRes.headers['content-type'] || 'video/MP2T',
    });
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) { res.writeHead(502); }
    res.end(JSON.stringify({ error: err.message }));
  });
  proxyReq.setTimeout(15000, () => {
    proxyReq.destroy(new Error('Proxy timeout'));
  });
  proxyReq.end();
}

// ─── HTTP Server ────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const method = req.method;
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  // ─── PROXY: /get/* → worldcup26.ir ──────────────────────
  if (pathname.startsWith('/get/')) {
    const targetUrl = new URL(PROXY_TARGET + pathname + parsedUrl.search);
    console.log(`  → ${targetUrl.href}`);
    proxyRequest(targetUrl, res);
    return;
  }

  // ─── PROXY: /proxy/video — M3U8 stream proxy ────────────
  if (pathname === '/proxy/video' && method === 'GET') {
    const videoUrl = parsedUrl.searchParams.get('url');
    if (!videoUrl) { jsonResponse(res, 400, { error: 'Missing url param' }); return; }
    console.log(`  → Video proxy: ${videoUrl}`);
    fetchStreamWithRedirect(new URL(videoUrl), res);
    return;
  }

  // ─── API: Admin login ───────────────────────────────────
  if (pathname === '/api/admin/login' && method === 'POST') {
    const body = await parseBody(req);
    const admin = await db.collection('admin').findOne({ _id: 'admin' });
    if (body.password === admin.password) {
      const token = crypto.randomBytes(16).toString('hex');
      await db.collection('admin').updateOne(
        { _id: 'admin' },
        { $set: { token } }
      );
      jsonResponse(res, 200, { success: true, token });
    } else {
      jsonResponse(res, 401, { success: false, error: 'Contraseña incorrecta' });
    }
    return;
  }

  // ─── API: List codes ────────────────────────────────────
  if (pathname === '/api/admin/codes' && method === 'GET') {
    if (!(await isAdmin(req))) { jsonResponse(res, 401, { error: 'No autorizado' }); return; }
    const codes = await db.collection('codes').find().toArray();
    const mapped = codes.map((c) => ({
      id: c.id,
      code: c.code,
      createdAt: c.createdAt,
      expiresAt: c.expiresAt,
      status: c.status,
      redeemedAt: c.redeemedAt,
      deviceId: c.deviceId,
      deviceName: c.deviceName,
    }));
    jsonResponse(res, 200, mapped);
    return;
  }

  // ─── API: Create code ───────────────────────────────────
  if (pathname === '/api/admin/codes' && method === 'POST') {
    if (!(await isAdmin(req))) { jsonResponse(res, 401, { error: 'No autorizado' }); return; }
    const body = await parseBody(req);
    const days = body.days || 30;
    const now = new Date();
    const expires = new Date(now.getTime() + days * 86400000);
    const code = {
      id: crypto.randomUUID(),
      code: generateCode(),
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      status: 'active',
      redeemedAt: null,
      deviceId: null,
      deviceName: null,
    };
    await db.collection('codes').insertOne(code);
    jsonResponse(res, 201, code);
    return;
  }

  // ─── API: Revoke/delete code ────────────────────────────
  if (pathname.startsWith('/api/admin/codes/') && method === 'DELETE') {
    if (!(await isAdmin(req))) { jsonResponse(res, 401, { error: 'No autorizado' }); return; }
    const codeId = pathname.split('/').pop();
    await db.collection('codes').deleteOne({ id: codeId });
    jsonResponse(res, 200, { success: true });
    return;
  }

  // ─── API: Get channels ──────────────────────────────────
  if (pathname === '/api/admin/channels' && method === 'GET') {
    if (!(await isAdmin(req))) { jsonResponse(res, 401, { error: 'No autorizado' }); return; }
    const channels = await db.collection('channels').find().toArray();
    jsonResponse(res, 200, channels);
    return;
  }

  // ─── API: Update channels ───────────────────────────────
  if (pathname === '/api/admin/channels' && method === 'PUT') {
    if (!(await isAdmin(req))) { jsonResponse(res, 401, { error: 'No autorizado' }); return; }
    const body = await parseBody(req);
    if (body.channels) {
      await db.collection('channels').deleteMany({});
      await db.collection('channels').insertMany(body.channels);
    }
    const channels = await db.collection('channels').find().toArray();
    jsonResponse(res, 200, { success: true, channels });
    return;
  }

  // ─── API: Change admin password ─────────────────────────
  if (pathname === '/api/admin/password' && method === 'PUT') {
    if (!(await isAdmin(req))) { jsonResponse(res, 401, { error: 'No autorizado' }); return; }
    const body = await parseBody(req);
    const admin = await db.collection('admin').findOne({ _id: 'admin' });
    if (body.currentPassword !== admin.password) {
      jsonResponse(res, 400, { error: 'Contraseña actual incorrecta' });
      return;
    }
    await db.collection('admin').updateOne(
      { _id: 'admin' },
      { $set: { password: body.newPassword } }
    );
    jsonResponse(res, 200, { success: true });
    return;
  }

  // ─── API: Activate code (from TV) ───────────────────────
  if (pathname === '/api/subscriptions/activate' && method === 'POST') {
    const body = await parseBody(req);
    const code = await db.collection('codes').findOne({ code: body.code });

    if (!code) {
      jsonResponse(res, 404, { success: false, error: 'Código no encontrado' });
      return;
    }
    if (code.status === 'redeemed') {
      jsonResponse(res, 400, { success: false, error: 'Código ya utilizado' });
      return;
    }
    if (code.status === 'revoked') {
      jsonResponse(res, 400, { success: false, error: 'Código revocado' });
      return;
    }
    if (new Date(code.expiresAt) < new Date()) {
      await db.collection('codes').updateOne(
        { id: code.id },
        { $set: { status: 'expired' } }
      );
      jsonResponse(res, 400, { success: false, error: 'Código expirado' });
      return;
    }

    const channels = await db.collection('channels').find().toArray();

    await db.collection('codes').updateOne(
      { id: code.id },
      {
        $set: {
          status: 'redeemed',
          redeemedAt: new Date().toISOString(),
          deviceId: body.deviceId || 'unknown',
          deviceName: body.deviceName || 'TV',
        }
      }
    );

    jsonResponse(res, 200, {
      success: true,
      expiresAt: code.expiresAt,
      channels,
    });
    return;
  }

  // ─── API: Verify subscription ───────────────────────────
  if (pathname === '/api/subscriptions/verify' && method === 'GET') {
    const deviceId = parsedUrl.searchParams.get('deviceId') || '';
    const channels = await db.collection('channels').find().toArray();

    const active = await db.collection('codes').findOne({
      deviceId,
      status: 'redeemed',
      expiresAt: { $gt: new Date().toISOString() },
    });

    if (active) {
      jsonResponse(res, 200, {
        valid: true,
        expiresAt: active.expiresAt,
        channels,
      });
    } else {
      jsonResponse(res, 200, { valid: false, channels });
    }
    return;
  }

  // ─── API: Public channels (no auth) ─────────────────────
  if (pathname === '/api/channels' && method === 'GET') {
    const channels = await db.collection('channels').find().toArray();
    jsonResponse(res, 200, channels);
    return;
  }

  // ─── SERVE: Admin panel ─────────────────────────────────
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const filePath = pathname === '/admin'
      ? path.join(ADMIN_DIR, 'index.html')
      : path.join(ADMIN_DIR, pathname.replace('/admin/', ''));
    try {
      const content = require('fs').readFileSync(filePath);
      const ext = path.extname(filePath);
      const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }

  // ─── 404 ─────────────────────────────────────────────────
  res.writeHead(404);
  res.end('Not found');
});

MongoClient.connect(MONGODB_URI)
  .then(async (client) => {
    db = client.db('DashTv');
    await seedData();
    console.log('  → MongoDB connected');
    server.listen(PORT, () => {
      console.log(`DashTV server running on http://localhost:${PORT}`);
      console.log(`  Proxy  : /get/* → ${PROXY_TARGET}/get/*`);
      console.log(`  Admin  : http://localhost:${PORT}/admin`);
      console.log(`  API    : /api/admin/* /api/subscriptions/* /api/channels`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
