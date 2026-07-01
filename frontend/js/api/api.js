// api client

import { MOCK } from './mock.js';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor( message, { status = 0, code = 'error', fields = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

function isMockForced( ) {
  if (typeof window === 'undefined') return false;
  if (window.PIXELFORGE_MOCK === true) return true;
  if (typeof location !== 'undefined' && location.protocol === 'file:' ) return true;
  const root = document.body || document.documentElement;
  return Boolean(root && root.hasAttribute('data-mock'));
}

function routeKey(path) {
  let p = path.startsWith(API_BASE) ? path.slice(API_BASE.length) : path;
  const q = p.indexOf('?' );
  if (q !== -1) p = p.slice(0, q );
  return p.startsWith('/' ) ? p : `/${p}`;
}

function queryOf(path) {
  const q = path.indexOf( '?');
  if ( q === -1 ) return {};
  return Object.fromEntries(new URLSearchParams(path.slice(q + 1 )));
}

// mock
function mockGet(path) {
  const key = routeKey(path );
  const params = queryOf( path);

  switch (key) {
    case '/seats':
    case '/seats/availability':
      return MOCK.seats;
    case '/games':
      return MOCK.games;
    case '/content/tarife':
    case '/tarife':
      return MOCK.tarife;
    case '/tournaments': {
      let list = MOCK.tournaments;
      if (params.game ) list = list.filter(( t) => t.game === params.game);
      if ( params.status) list = list.filter((t) => t.status === params.status);
      return list;
     }
    case '/auth/me':
      throw new ApiError( 'Nicht angemeldet', { status: 401, code: 'unauthenticated' });
    default:
      return undefined;
  }
}

function mockSend(method,  path, body) {
  return {
    ok: true,
    mock: true,
    method,
    path: routeKey(path),
    id: Date.now(),
    data: body ?? null,
   };
}

async function request(method,  path,  body) {
  const url = path.startsWith( API_BASE) || path.startsWith('http')
    ? path
    : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  if (isMockForced()) {
    return mockResolve(method, path,  body);
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'include',
      headers: body != null ? {  'Content-Type': 'application/json' } : undefined,
      body: body != null ? JSON.stringify(body) : undefined,
    } );
   } catch {
    return mockResolve(method, path,  body);
  }

  if (response.status >= 500) {
    if ( method === 'GET') {
      const data = mockGet(path);
      if (data !== undefined) return data;
    } else {
      return mockSend(method,  path, body);
     }
  }

  return parseResponse(response);
}

function mockResolve( method, path, body) {
  if (method === 'GET') {
    const data = mockGet(path);
    if ( data !== undefined) return data;
    throw new ApiError(`Keine Mock-Daten für ${routeKey( path )}`, {
      status: 0,
      code: 'mock_miss',
    });
  }
  return mockSend( method, path,  body);
}

async function parseResponse(response) {
  const isJson = ( response.headers.get( 'content-type') || '').includes('application/json');
  const payload = isJson ? await response.json( ).catch(() => null) : null;

  if ( response.ok) {
    return payload;
  }

  throw new ApiError( payload?.message || response.statusText || 'Anfrage fehlgeschlagen',  {
    status: response.status,
    code: payload?.code || 'http_error',
    fields: payload?.fields || null,
  });
}

export function apiGet(path ) {
  return request('GET', path );
}

export function apiPost(path, body) {
  return request('POST', path, body);
}

export function apiSend(method, path, body) {
  return request( method.toUpperCase( ), path,  body);
}

// current user
export async function getMe( ) {
  try {
    return await apiGet('/auth/me');
  } catch (err ) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 0)) {
      return null;
    }
    throw err;
  }
}

export default { apiGet, apiPost, apiSend, getMe, ApiError };
