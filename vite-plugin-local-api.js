import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const readBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString();
    if (!raw) return resolve({});
    try {
      resolve(JSON.parse(raw));
    } catch {
      resolve({});
    }
  });
  req.on('error', reject);
});

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const ROUTES = {
  '/api/admin/delete-user': './server/admin/delete-user.js',
  '/api/admin/users': './server/admin/users.js',
  '/api/chat/completions': './server/chat/completions.js',
  '/api/checkins/create': './server/checkins/create.js',
  '/api/checkins/has-today': './server/checkins/has-today.js',
  '/api/community/create': './server/community/create.js',
  '/api/community/delete': './server/community/delete.js',
  '/api/community/like': './server/community/like.js',
  '/api/community/list': './server/community/list.js',
  '/api/community/update': './server/community/update.js',
  '/api/fatsecret/analyze': './server/fatsecret/analyze.js',
  '/api/fatsecret/search': './server/fatsecret/search.js',
  '/api/health': './server/health.js',
  '/api/users/ensure': './server/users/ensure.js'
};

const loadEnv = () => {
  try {
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  } catch {
    // ignore
  }
};

export function localApiPlugin() {
  loadEnv();

  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        const routeFile = ROUTES[url];
        if (!routeFile) return next();

        try {
          const handlerPath = path.resolve(__dirname, routeFile);
          const mod = await import(`${pathToFileURL(handlerPath).href}?t=${Date.now()}`);
          const handler = mod.default;

          const urlObj = new URL(req.url, 'http://localhost');
          const query = Object.fromEntries(urlObj.searchParams);

          let body = {};
          if (req.method === 'POST' || req.method === 'PUT') {
            body = await readBody(req);
          }

          const mockReq = { method: req.method, query, body, headers: req.headers };
          const mockRes = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            json(payload) { sendJson(res, this.statusCode || 200, payload); },
            setHeader(k, v) { res.setHeader(k, v); },
            end(data) { res.end(data); }
          };

          await handler(mockReq, mockRes);
        } catch (err) {
          sendJson(res, 500, { ok: false, error: err.message || 'API error' });
        }
      });
    }
  };
}
