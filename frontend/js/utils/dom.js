/**
 * @file Tiny DOM helpers used across all features.
 * Keep these dependency-free so any module can import them.
 * @module utils/dom
 */

/**
 * Query a single element (thin wrapper around querySelector).
 * @param {string} sel - CSS selector.
 * @param {ParentNode} [root=document] - Scope to search within.
 * @returns {Element|null} The first matching element, or null.
 */
export function qs(sel, root = document) {
  return root.querySelector(sel);
}

/**
 * Query all matching elements and return them as a real array.
 * @param {string} sel - CSS selector.
 * @param {ParentNode} [root=document] - Scope to search within.
 * @returns {Element[]} Array of matching elements (never live, always array).
 */
export function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

/**
 * Create an element with props/attributes and children in one call.
 *
 * Props are applied intelligently:
 * - `class`/`className` → className
 * - `dataset` (object) → data-* attributes
 * - `style` (object) → inline styles
 * - `on*` functions (e.g. `onClick`) → addEventListener
 * - known DOM props (id, value, textContent, ...) → assigned directly
 * - everything else → setAttribute (good for aria-*, role, type, href, ...)
 *
 * Children may be nodes, strings (→ text nodes), or nullish (skipped).
 *
 * @param {string} tag - Tag name, e.g. 'button'.
 * @param {Object<string, any>} [props] - Properties/attributes to apply.
 * @param {...(Node|string|null|undefined)} children - Child nodes or text.
 * @returns {HTMLElement} The constructed element.
 *
 * @example
 * el('button', { class: 'seat', dataset: { id: 'B5' }, onClick: fn }, 'B5');
 */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props || {})) {
    if (value == null) continue;

    if (key === 'class' || key === 'className') {
      node.className = value;
    } else if (key === 'dataset' && typeof value === 'object') {
      Object.assign(node.dataset, value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(node.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key in node) {
      // Direct property (id, value, textContent, checked, disabled, ...)
      node[key] = value;
    } else {
      // Attribute fallback (aria-*, role, href, type, for, ...)
      node.setAttribute(key, String(value));
    }
  }

  appendChildren(node, children);
  return node;
}

/**
 * Append a flat or nested list of children to a node.
 * @param {Node} node - Parent node.
 * @param {Array<Node|string|null|undefined|Array>} children - Children to append.
 * @returns {void}
 */
function appendChildren(node, children) {
  for (const child of children) {
    if (child == null || child === false) continue;
    if (Array.isArray(child)) {
      appendChildren(node, child);
    } else if (child instanceof Node) {
      node.appendChild(child);
    } else {
      node.appendChild(document.createTextNode(String(child)));
    }
  }
}
