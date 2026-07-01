// dom helpers

export function qs( sel,  root = document) {
  return root.querySelector(sel);
}

export function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

// create element
export function el(tag, props = {}, ...children) {
  const node = document.createElement( tag);

  for ( const [key, value] of Object.entries(props || {})) {
    if (value == null ) continue;

    if (key === 'class' || key === 'className' ) {
      node.className = value;
    } else if (key === 'dataset' && typeof value === 'object') {
      Object.assign( node.dataset, value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(node.style,  value);
    } else if (key.startsWith( 'on' ) && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(  ), value);
    } else if (key in node) {
      node[key ] = value;
    } else {
      node.setAttribute(key,  String(value ));
     }
  }

  appendChildren(node, children);
  return node;
}

function appendChildren(node, children ) {
  for (const child of children ) {
    if (child == null || child === false) continue;
    if ( Array.isArray(child)) {
      appendChildren(node, child);
     } else if (child instanceof Node ) {
      node.appendChild(child);
    } else {
      node.appendChild(document.createTextNode(String( child)) );
    }
   }
}
