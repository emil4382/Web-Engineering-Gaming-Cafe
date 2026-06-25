/**
 * @file Safe localStorage JSON helpers.
 * All access is wrapped in try/catch so private-mode / disabled-storage /
 * quota errors degrade gracefully instead of throwing.
 * @module utils/storage
 */

/**
 * Read and JSON-parse a value from localStorage.
 * @template T
 * @param {string} key - Storage key.
 * @param {T} [fallback=null] - Value returned when missing or unparsable.
 * @returns {T} The parsed value, or `fallback`.
 */
export function getJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * JSON-stringify and store a value in localStorage.
 * @param {string} key - Storage key.
 * @param {*} value - Any JSON-serialisable value.
 * @returns {boolean} `true` if stored, `false` if storage was unavailable.
 */
export function setJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove a key from localStorage.
 * @param {string} key - Storage key.
 * @returns {void}
 */
export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
