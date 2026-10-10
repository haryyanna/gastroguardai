import { json } from './_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });
  const providers = {
    gemini: Boolean(globalThis.process?.env?.GEMINI_API_KEY),
    fatsecret: Boolean(globalThis.process?.env?.FATSECRET_CLIENT_ID && globalThis.process?.env?.FATSECRET_CLIENT_SECRET)
  };
  return json(res, 200, { ok: true, api: 'ready', providers });
}
