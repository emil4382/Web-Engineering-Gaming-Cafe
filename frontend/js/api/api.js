/**
 * @file Thin REST client for the PixelForge backend.
 *
 * Responsibilities:
 * - JSON `fetch` wrapper with cookie credentials (`credentials: 'include'`).
 * - Normalised errors via {@link ApiError} (`status`, `code`, `message`, `fields`).
 * - **Graceful mock fallback** so the site works as a static page with no
 *   backend: on a network error (or when mock mode is forced), GET requests
 *   resolve from `js/api/mock.js` and POST/PUT/DELETE resolve to a simulated
 *   success.
 *
 * Endpoint paths follow the backend plan, e.g. `/api/seats`, `/api/games`,
 * `/api/menu`, `/api/tournaments`, `/api/leaderboard`, `/api/auth/me`.
 *
 * @module api/api
 */

import { MOCK } from './mock.js';

/** Base path for all API routes. */
const API_BASE = '/api';

/**
 * Error thrown for any failed API call. Carries enough structure for both
 * inline form validation (`fields`) and generic error UIs (`status`/`message`).
 */
export class ApiError extends Error {
  /**
   * @param {string} message - Human-readable message.
   * @param {Object} [opts]
   * @param {number} [opts.status=0] - HTTP status (0 = network/offline).
   * @param {string} [opts.code='error'] - Stable machine code.
   * @param {Object<string,string>} [opts.fields] - Per-field validation errors.
   */
  constructor(message, { status = 0, code = 'error', fields = null } = {}) {
    super(message);
    this.name = 'ApiError';
    /** @type {number} */
    this.status = status;
    /** @type {string} */
    this.code = code;
    /** @type {Object<string,string>|null} */
    this.fields = fields;
  }
}

/**
 * Whether mock mode is forced on. True when:
 * - `window.PIXELFORGE_MOCK === true`, or
 * - `<body data-mock>` / `<html data-mock>` is present, or
 * - the page is opened via the `file:` protocol (no server at all).
 * @returns {boolean}
 */
function isMockForced() {
  if (typeof window === 'undefined') return false;
  if (window.PIXELFORGE_MOCK === true) return true;
  if (typeof location !== 'undefined' && location.protocol === 'file:') return true;
  const root = document.body || document.documentElement;
  return Boolean(root && root.hasAttribute('data-mock'));
}

/* ------------------------------------------------------------------ */
/* Mock routing                                                       */
/* ------------------------------------------------------------------ */

/**
 * Strip the API base and query string from a path → a clean route key.
 * @param {string} path - e.g. '/api/seats?date=2026-06-26' or '/seats'.
 * @returns {string} e.g. '/seats'.
 */
function routeKey(path) {
  let p = path.startsWith(API_BASE) ? path.slice(API_BASE.length) : path;
  const q = p.indexOf('?');
  if (q !== -1) p = p.slice(0, q);
  return p.startsWith('/') ? p : `/${p}`;
}

/**
 * Parse the query string of a path into a plain object.
 * @param {string} path - Full path, possibly with `?a=b&c=d`.
 * @returns {Object<string,string>} Decoded query params.
 */
function queryOf(path) {
  const q = path.indexOf('?');
  if (q === -1) return {};
  return Object.fromEntries(new URLSearchParams(path.slice(q + 1)));
}

/**
 * Resolve a GET request from the mock dataset. Returns `undefined` when no
 * mock route matches (caller then rethrows the original network error).
 * @param {string} path - Request path.
 * @returns {*} Mock payload, or `undefined` if unhandled.
 */
function mockGet(path) {
  const key = routeKey(path);
  const params = queryOf(path);

  switch (key) {
    case '/seats':
    case '/seats/availability':
      return MOCK.seats;
    case '/games':
      return MOCK.games;
    case '/menu':
      return MOCK.menu;
    case '/content/tarife':
    case '/tarife':
      return MOCK.tarife;
    case '/tournaments': {
      let list = MOCK.tournaments;
      if (params.game) list = list.filter((t) => t.game === params.game);
      if (params.status) list = list.filter((t) => t.status === params.status);
      return list;
    }
    case '/leaderboard': {
      const type = params.type === 'team' ? 'team' : 'solo';
      const game = params.game || 'valorant';
      return MOCK.leaderboards[type][game] || [];
    }
    case '/auth/me':
      // No session in static/mock mode → behave like "logged out" (401).
      throw new ApiError('Nicht angemeldet', { status: 401, code: 'unauthenticated' });
    default:
      return undefined;
  }
}

/**
 * Simulate a successful write in mock mode. Echoes the body and adds an id so
 * optimistic UIs have something to render.
 * @param {string} method - HTTP method.
 * @param {string} path - Request path.
 * @param {*} body - Request body.
 * @returns {{ok:true, mock:true, method:string, path:string, data:*}}
 */
function mockSend(method, path, body) {
  return {
    ok: true,
    mock: true,
    method,
    path: routeKey(path),
    id: Date.now(),
    data: body ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Core request                                                       */
/* ------------------------------------------------------------------ */

/**
 * Perform a JSON request, falling back to the mock layer on network errors
 * or when mock mode is forced.
 *
 * @param {string} method - HTTP method ('GET' | 'POST' | 'PUT' | 'DELETE' …).
 * @param {string} path - API path, with or without the `/api` prefix.
 * @param {*} [body] - JSON-serialisable request body (writes only).
 * @returns {Promise<*>} Parsed JSON response (or mock payload).
 * @throws {ApiError} On HTTP error responses, or when offline with no mock route.
 */
async function request(method, path, body) {
  const url = path.startsWith(API_BASE) || path.startsWith('http')
    ? path
    : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  // Forced mock mode: never even attempt the network.
  if (isMockForced()) {
    return mockResolve(method, path, body);
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'include',
      headers: body != null ? { 'Content-Type': 'application/json' } : undefined,
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Network failure (backend down / offline) → graceful mock fallback.
    return mockResolve(method, path, body);
  }

  // Server reachable but failing (e.g. DB not set up) → for GETs, prefer mock
  // data so the page still renders content instead of an error state.
  if (method === 'GET' && response.status >= 500) {
    const data = mockGet(path);
    if (data !== undefined) return data;
  }

  return parseResponse(response);
}

/**
 * Shared mock resolution for GET vs writes.
 * @param {string} method - HTTP method.
 * @param {string} path - Request path.
 * @param {*} body - Request body.
 * @returns {*} Mock payload.
 * @throws {ApiError} When a GET route is unknown to the mock layer.
 */
function mockResolve(method, path, body) {
  if (method === 'GET') {
    const data = mockGet(path);
    if (data !== undefined) return data;
    throw new ApiError(`Keine Mock-Daten für ${routeKey(path)}`, {
      status: 0,
      code: 'mock_miss',
    });
  }
  return mockSend(method, path, body);
}

/**
 * Convert a fetch Response into parsed JSON or a thrown {@link ApiError}.
 * @param {Response} response - The fetch response.
 * @returns {Promise<*>} Parsed body for 2xx responses.
 * @throws {ApiError} For non-2xx responses.
 */
async function parseResponse(response) {
  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (response.ok) {
    return payload;
  }

  throw new ApiError(payload?.message || response.statusText || 'Anfrage fehlgeschlagen', {
    status: response.status,
    code: payload?.code || 'http_error',
    fields: payload?.fields || null,
  });
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * GET a resource.
 * @param {string} path - API path.
 * @returns {Promise<*>} Parsed response.
 */
export function apiGet(path) {
  return request('GET', path);
}

/**
 * POST a JSON body.
 * @param {string} path - API path.
 * @param {*} [body] - JSON body.
 * @returns {Promise<*>} Parsed response.
 */
export function apiPost(path, body) {
  return request('POST', path, body);
}

/**
 * Send any method with an optional JSON body (PUT, PATCH, DELETE, …).
 * @param {string} method - HTTP method.
 * @param {string} path - API path.
 * @param {*} [body] - JSON body.
 * @returns {Promise<*>} Parsed response.
 */
export function apiSend(method, path, body) {
  return request(method.toUpperCase(), path, body);
}

/**
 * Fetch the currently authenticated user, or `null` when logged out / offline.
 * Never throws for the common "not logged in" case (401) — returns `null` so
 * callers (e.g. the navbar auth reflector) can stay fail-silent.
 * @returns {Promise<Object|null>} The user object, or `null`.
 */
export async function getMe() {
  try {
    return await apiGet('/auth/me');
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 0)) {
      return null;
    }
    throw err;
  }
}

export default { apiGet, apiPost, apiSend, getMe, ApiError };
