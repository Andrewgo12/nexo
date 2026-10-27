import http from 'node:http';
import crypto from 'node:crypto';
import { Pool } from 'pg';

const port = Number(process.env.API_PORT || 8787);
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const sessions = new Map();

function json(response, status, payload, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  response.end(JSON.stringify(payload));
}

function parseCookies(request) {
  return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((part) => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }));
}

async function body(request) {
  let raw = '';
  for await (const chunk of request) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at };
}

async function currentUser(request) {
  const token = parseCookies(request).session;
  const userId = token && sessions.get(token);
  if (!userId) return null;
  const result = await pool.query('SELECT id, name, email, role, created_at FROM app_users WHERE id = $1', [userId]);
  return result.rows[0] || null;
}

function sessionCookie(token, maxAge = 60 * 60 * 24 * 7) {
  return `session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

async function handle(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const path = url.pathname;
  if (request.method === 'OPTIONS') return json(response, 204, {}, { 'Access-Control-Allow-Origin': request.headers.origin || '*', 'Access-Control-Allow-Credentials': 'true' });
  if (path === '/api/health' || path === '/api/ready') return json(response, 200, { status: 'ok', app: 'ViajaU', mode: 'node-neon' });

  if (path === '/api/auth/register' && request.method === 'POST') {
    const data = await body(request);
    if (!data.name?.trim() || !data.email?.trim() || !data.password || data.password.length < 8) return json(response, 422, { message: 'Nombre, correo y una contraseña de mínimo 8 caracteres son obligatorios.' });
    const salt = crypto.randomBytes(16);
    const passwordHash = `${salt.toString('hex')}:${crypto.scryptSync(data.password, salt, 64).toString('hex')}`;
    try {
      const result = await pool.query('INSERT INTO app_users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role, created_at', [data.name.trim(), data.email.trim().toLowerCase(), passwordHash]);
      return json(response, 201, { user: publicUser(result.rows[0]) });
    } catch (error) {
      if (error.code === '23505') return json(response, 409, { message: 'No fue posible crear la cuenta con esos datos.' });
      throw error;
    }
  }

  if (path === '/api/auth/login' && request.method === 'POST') {
    const data = await body(request);
    const result = await pool.query('SELECT * FROM app_users WHERE email = $1', [data.email?.trim().toLowerCase()]);
    const user = result.rows[0];
    const valid = user && data.password && crypto.scryptSync(data.password, Buffer.from(user.password_hash.slice(0, 32), 'hex'), 64).toString('hex') === user.password_hash;
    if (!valid) return json(response, 401, { message: 'Credenciales no válidas.' });
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, user.id);
    return json(response, 200, { user: publicUser(user) }, { 'Set-Cookie': sessionCookie(token) });
  }

  if (path === '/api/auth/me' && request.method === 'GET') {
    const user = await currentUser(request);
    return user ? json(response, 200, { user: publicUser(user) }) : json(response, 401, { message: 'No autenticado.' });
  }

  if (path === '/api/auth/logout' && request.method === 'POST') {
    const token = parseCookies(request).session;
    if (token) sessions.delete(token);
    return json(response, 200, { message: 'Sesión cerrada.' }, { 'Set-Cookie': sessionCookie('', 0) });
  }

  return json(response, 404, { message: 'Ruta API no encontrada.' });
}

const server = http.createServer((request, response) => {
  handle(request, response).catch((error) => {
    console.error('[node-api]', error);
    json(response, 500, { message: 'Error interno del servidor.' });
  });
});
server.listen(port, () => console.log(`[node-api] escuchando en http://127.0.0.1:${port}`));
