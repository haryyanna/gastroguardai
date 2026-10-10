import { json } from '../server/_lib/http.js';
import adminDeleteUser from '../server/admin/delete-user.js';
import adminUsers from '../server/admin/users.js';
import chatCompletions from '../server/chat/completions.js';
import checkinCreate from '../server/checkins/create.js';
import checkinHasToday from '../server/checkins/has-today.js';
import communityCreate from '../server/community/create.js';
import communityDelete from '../server/community/delete.js';
import communityLike from '../server/community/like.js';
import communityList from '../server/community/list.js';
import communityUpdate from '../server/community/update.js';
import fatsecretAnalyze from '../server/fatsecret/analyze.js';
import fatsecretSearch from '../server/fatsecret/search.js';
import health from '../server/health.js';
import userEnsure from '../server/users/ensure.js';

const routes = new Map([
  ['admin/delete-user', adminDeleteUser],
  ['admin/users', adminUsers],
  ['chat/completions', chatCompletions],
  ['checkins/create', checkinCreate],
  ['checkins/has-today', checkinHasToday],
  ['community/create', communityCreate],
  ['community/delete', communityDelete],
  ['community/like', communityLike],
  ['community/list', communityList],
  ['community/update', communityUpdate],
  ['fatsecret/analyze', fatsecretAnalyze],
  ['fatsecret/search', fatsecretSearch],
  ['health', health],
  ['users/ensure', userEnsure],
]);

export default async function handler(req, res) {
  let route;
  try {
    const pathname = new URL(req.url || '/', 'https://vercel.invalid').pathname;
    route = decodeURIComponent(pathname.replace(/^\/api\/?/, '').replace(/\/+$/, ''));
  } catch {
    return json(res, 400, { ok: false, error: 'Invalid API route' });
  }

  const routeHandler = routes.get(route);
  if (!routeHandler) {
    return json(res, 404, { ok: false, error: 'API route not found' });
  }

  return routeHandler(req, res);
}
