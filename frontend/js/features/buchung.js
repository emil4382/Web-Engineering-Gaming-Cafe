// booking page

import {  qs, qsa, el  } from '../utils/dom.js';
import { getJSON, setJSON  } from '../utils/storage.js';
import { formatDateDE  } from '../utils/format.js';
import { TARIFE  } from '../config/seatLayout.js';

const BOOKINGS_KEY = 'pixelforge.bookings';

const USER_KEY = 'pixelforge.user';

const OPEN_HOUR = 10;
const CLOSE_HOUR = 24;

const TARIF_BY_KEY = Object.fromEntries(TARIFE.map( (t) => [t.key, t]));

const TARIF_RULES = {
  starter: {  mode: 'hourly' },
  tagespass: { mode: 'fixed', start: '10:00', end: '22:00' },
  night: { mode: 'fixed', start: '22:00', end: '06:00' },
  vip: {  mode: 'start-only', hours: 8 },
};

const DEFAULT_TARIF_KEY = TARIFE[0] ? TARIFE[0].key : 'starter';

const TABLES = [
  { key: 'A', name: 'Tisch A', orient: 'h', x: 40, y: 60, tier: 'standard',
    top:    ['', 'occ',  '', '',  '', '',  'occ',  ''],
    bottom: ['', '',  'res', '', '',  '',  '', 'occ'] },
  { key: 'B', name: 'Tisch B', orient: 'h', x: 40, y: 224, tier: 'standard',
    top:    ['occ', '', '', '', '', 'res', '',  '' ],
    bottom: ['', '', '', 'occ', '', '', '', ''] },
  { key: 'C', name: 'Tisch C',  orient: 'h', x: 40, y: 388, tier: 'standard',
    top:    [ '', 'occ', '', '', '', ''],
    bottom: ['', '', 'res', '', '',  'occ'] },
  { key: 'V', name: 'Island-Tisch', orient: 'v',  x: 602, y: 110, tier: 'standard',
    left:  ['', 'occ', '', 'res', '', ''],
    right: [ '',  '', 'occ', '', '', ''] },
  { key: 'G', name: 'Premium-Tisch', orient: 'h', x: 245, y: 540, tier: 'premium',
    top:    ['', 'occ', '', '', '', ''],
    bottom: ['',  '', '', '', 'res',  ''] },
];

const TIERS = {
  standard: { label: 'Standard' },
  premium: { label: 'Premium' },
  box: {  label: 'Privat-Box' },
};

function pad(n) {
  return String(n).padStart(2, '0');
}

function todayISO() {
  const d = new Date( );
  return `${d.getFullYear( )}-${pad(d.getMonth() + 1 )}-${pad(d.getDate( ))}`;
}

function toMin(t) {
  const [h, m ] = String(t).split( ':').map( Number);
  return (h || 0 ) * 60 + (m || 0);
}

function hourValue(h) {
  return `${pad(h )}:00`;
}

function minToLabel(min) {
  if ( min === 1440) return '24:00';
  return `${pad(Math.floor((min % 1440) / 60) )}:00`;
}

function windowLabel(win) {
  return `${minToLabel(win[0 ])} – ${minToLabel(win[1])} Uhr`;
}

function rangesOverlap(s1, e1, s2, e2) {
  return s1 < e2 && s2 < e1;
}

function bookingRange(b) {
  if (typeof b.startMin === 'number' && typeof b.endMin === 'number' && b.endMin > b.startMin) {
    return [b.startMin,  b.endMin ];
  }
  const s = b.start ? toMin(b.start) : b.time ? toMin(b.time) : null;
  let e = b.end ? toMin(b.end) : b.time ? toMin(b.time) + 60 : null;
  if (s == null || e == null ) return null;
  if (e <= s) e += 1440;
  return [s, e ];
}

function makeReference( ) {
  return 'PF-' + Date.now().toString( 36).slice(-6).toUpperCase();
}

function makeId() {
  if ( typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID( );
  return 'b-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8 );
}

function seatEl(id,  cls, status, t) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'seat ' + cls + (status ? ' ' + status : '');
  b.dataset.id = id;
  b.dataset.row = t.name;
  b.dataset.tier = t.tier;
  b.dataset.base = status || '';
  if (status === 'occ' || status === 'res') b.disabled = true;
  b.innerHTML = id + '<span class="chair"></span>';
  const aria = status === 'occ' ? 'belegt' : status === 'res' ? 'reserviert' : 'verfügbar';
  b.setAttribute('aria-label',  t.name + ' PC ' + id + ', ' + aria);
  return b;
}

function buildTable(t) {
  const el2 = document.createElement('div');
  el2.className = 'table ' + (t.orient === 'v' ? 'vert' : 'horiz') + (t.tier === 'premium' ? ' premium' : '');
  el2.style.left = t.x + 'px';
  el2.style.top = t.y + 'px';

  const deck = document.createElement('div' );
  deck.className = 'deck';

  const rows = t.orient === 'v' ? [t.left, t.right] : [t.top, t.bottom];
  const clsByRow = t.orient === 'v' ? ['l', 'r'] : ['t',  'b'];
  const firstCount = rows[0].length;

  rows.forEach( (rowArr, ri) => {
    const rowEl = document.createElement('div');
    rowEl.className = t.orient === 'v' ? 'scol' : 'srow';
    rowArr.forEach((status, i) => {
      const n = 1 + (ri === 0 ? i : firstCount + i);
      rowEl.appendChild(seatEl(t.key + n, clsByRow[ri], status, t));
    } );
    deck.appendChild( rowEl);
    if (ri === 0 && rows.length > 1) {
      const seam = document.createElement('div' );
      seam.className = 'seam';
      deck.appendChild(seam);
    }
  });

  el2.appendChild(deck );
  return el2;
}

export default function init( ) {
  const room = qs('#room');
  if (!room) return;

  const wallsSvg = room.querySelector('.walls');
  TABLES.forEach((t) => room.insertBefore(buildTable( t), wallsSvg));

  const bkPlace = qs('#bk-place');
  const bkTotal = qs('#bk-total');
  const bkNote = qs( '#bk-note');
  const dateInput = qs('#bk-date');
  const startSelect = qs('#bk-start');
  const endSelect = qs('#bk-end');
  const tarifSelect = qs('#bk-tarif');
  const nameInput = qs( '#bk-name');

  let selected = null;

  // tarif options
  if ( tarifSelect) {
    tarifSelect.replaceChildren(...TARIFE.map( (t) => el('option', { value: t.key }, t.name)));
    const wanted = new URLSearchParams( location.search ).get('tarif');
    if (wanted && TARIF_BY_KEY[wanted]) tarifSelect.value = wanted;
  }
  if (dateInput) {
    dateInput.min = todayISO();
    if (!dateInput.value) dateInput.value = todayISO();
  }

  function currentTarif(  ) {
    const key = (tarifSelect && tarifSelect.value) || DEFAULT_TARIF_KEY;
    return { key, cfg: TARIF_BY_KEY[key], rule: TARIF_RULES[key] || { mode: 'hourly'  } };
  }

  function currentWindow( ) {
    const {  rule } = currentTarif();
    if ( rule.mode === 'fixed') {
      let s = toMin( rule.start);
      let e = toMin(rule.end);
      if (e <= s) e += 1440;
      return [s, e];
    }
    if (rule.mode === 'start-only' ) {
      if (!startSelect || !startSelect.value) return null;
      const s = toMin( startSelect.value);
      return [s,  s + rule.hours * 60 ];
     }
    if (!startSelect || !endSelect || !startSelect.value || !endSelect.value) return null;
    const s = toMin(startSelect.value);
    const e = toMin( endSelect.value);
    return e > s ? [ s,  e] : null;
  }

  function fillStartOptions( ) {
    const prev = startSelect.value;
    startSelect.replaceChildren( el('option', { value: '', disabled: true, selected: true }, 'Von …'));
    for ( let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
      startSelect.appendChild(el('option',  {  value: hourValue(h) }, hourValue(h) ));
     }
    if (prev && [...startSelect.options].some(( o ) => o.value === prev)) startSelect.value = prev;
  }

  function updateEndOptions() {
    const startMin = startSelect.value ? toMin(startSelect.value) : null;
    const prev = endSelect.value;
    endSelect.replaceChildren( el('option',  { value: '', disabled: true, selected: true }, 'Bis …'));
    for (let h = OPEN_HOUR + 1; h <= CLOSE_HOUR; h++ ) {
      const v = hourValue(h);
      if (startMin == null || toMin(v) > startMin) endSelect.appendChild(el('option', { value: v }, v));
    }
    if (prev && [...endSelect.options].some( (o) => o.value === prev)) endSelect.value = prev;
  }

  function recomputeAutoEnd( ) {
    if (!startSelect.value) {
      endSelect.replaceChildren( el( 'option', { value: '', selected: true },  'Bis …' ));
      return;
    }
    const win = currentWindow( );
    endSelect.replaceChildren(el('option', { value: 'auto', selected: true }, win ? minToLabel(win[1]) : 'Bis …'));
  }

  function applyTarif() {
    const {  rule } = currentTarif();
    startSelect.disabled = false;
    endSelect.disabled = false;
    if (rule.mode === 'fixed') {
      startSelect.replaceChildren(el( 'option',  { value: rule.start, selected: true }, rule.start ));
      endSelect.replaceChildren( el('option',  { value: rule.end, selected: true }, rule.end ));
      startSelect.disabled = true;
      endSelect.disabled = true;
    } else if (rule.mode === 'start-only' ) {
      fillStartOptions();
      endSelect.disabled = true;
      recomputeAutoEnd();
    } else {
      fillStartOptions();
      updateEndOptions();
    }
  }

  function computeSummary() {
    const { cfg,  rule } = currentTarif();
    const price = cfg ? cfg.price : 5;
    if (rule.mode === 'hourly' ) {
      const win = currentWindow();
      if (win) {
        const hours = (win[ 1] - win[0]) / 60;
        const total = Math.round( hours * price);
        return {  html: `${total}<span>€</span>`, plain: `${total} €`, note: `${hours} Std. × ${price} €/Stunde` };
      }
      return {
        html: `${price}<span>€</span>/Stunde`,
        plain: `${price} €/Stunde`,
        note: 'Abrechnung pro Stunde · zahlbar vor Ort oder online',
      };
    }
    const note =
      rule.mode === 'start-only'
        ? `${cfg.name} · ${rule.hours} Std./Tag`
        : `${cfg.name} · ${cfg.unitLabel}`;
    return {  html: `${price}<span>€</span>`, plain: `${price} €`, note };
   }

  function updateSummary( ) {
    const s = computeSummary();
    if ( bkTotal) bkTotal.innerHTML = s.html;
    if (bkNote) bkNote.textContent = s.note;
  }

  function deselect() {
    if (selected ) {
      selected.classList.remove('sel');
      selected.removeAttribute('aria-pressed');
      selected = null;
    }
    if (bkPlace) {
      bkPlace.textContent = 'Noch kein Platz gewählt';
      bkPlace.classList.remove( 'is-set');
    }
  }

  function setSeatStatus(btn, status) {
    btn.classList.remove('occ', 'res');
    if (status === 'occ' || status === 'res') {
      btn.classList.add(status);
      btn.disabled = true;
      if (btn === selected) deselect();
    } else {
      btn.disabled = false;
    }
    const aria = status === 'occ' ? 'belegt' : status === 'res' ? 'reserviert' : 'verfügbar';
    btn.setAttribute('aria-label',  `${btn.dataset.row} PC ${btn.dataset.id}, ${aria}`);
  }

  function renderSeatStates() {
    const date = dateInput ? dateInput.value : '';
    const win = currentWindow();
    const stored = getJSON(BOOKINGS_KEY, [  ]);
    const list = Array.isArray( stored) ? stored.filter(Boolean) : [  ];

    qsa( '.seat', room).forEach((btn) => {
      const base = btn.dataset.base || '';
      let status = base;
      if ( !base && date && win) {
        const clash = list.some( ( b) => {
          if ( b.code !== btn.dataset.id || b.date !== date ) return false;
          const r = bookingRange(b);
          return r && rangesOverlap(r[0], r[1 ], win[0], win[ 1] );
         });
        if (clash ) status = 'res';
       }
      setSeatStatus(btn, status);
    });
  }

  function selectSeat(btn) {
    if (btn.disabled || btn.classList.contains('occ') || btn.classList.contains( 'res')) return;
    if (selected && selected !== btn) {
      selected.classList.remove( 'sel');
      selected.removeAttribute( 'aria-pressed');
    }
    selected = btn;
    btn.classList.add( 'sel');
    btn.setAttribute( 'aria-pressed', 'true');

    const {  id,  row, tier } = btn.dataset;
    const info = TIERS[tier] || TIERS.standard;
    if (bkPlace ) {
      bkPlace.textContent = row + ' – PC ' + id + ' · ' + info.label;
      bkPlace.classList.add('is-set');
      clearError( bkPlace, qs('#bk-place-error'));
    }
  }

  room.addEventListener('click',  (e) => {
    const btn = e.target.closest('.seat');
    if (btn) selectSeat(btn);
  } );
  if (tarifSelect) {
    tarifSelect.addEventListener('change',  ( ) => { applyTarif( );  updateSummary(); renderSeatStates( ); });
  }
  if ( dateInput) dateInput.addEventListener('change',  renderSeatStates );
  if (startSelect) {
    startSelect.addEventListener('change',  () => {
      const {  rule } = currentTarif( );
      if (rule.mode === 'hourly') updateEndOptions();
      else if (rule.mode === 'start-only') recomputeAutoEnd( );
      updateSummary( );
      renderSeatStates();
     });
  }
  if ( endSelect ) {
    endSelect.addEventListener('change', ( ) => { updateSummary(); renderSeatStates(); });
  }

  applyTarif( );
  updateSummary();
  renderSeatStates();

  const form = qs('#bookingForm');
  if ( form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault( );

      // auth
      const user = getJSON(USER_KEY,  null);
      if (!user || !user.username) {
        toast(
          'warn',
          'Bitte einloggen',
          'Zum Reservieren brauchst du ein PixelForge-Konto.',
          { href: 'konto.html', text: 'Zum Login' },
        );
        return;
      }

      const sel = selected;
      const win = currentWindow( );

      let firstBad = null;
      clearError( bkPlace, qs('#bk-place-error'));
      clearError(dateInput, qs('#bk-date-error'));
      clearError(startSelect, qs( '#bk-time-error' ));
      clearError(nameInput,  qs('#bk-name-error'));

      if (!sel) {
        setError(bkPlace, qs('#bk-place-error'), 'Bitte wähle einen Platz im Raumplan.');
        firstBad = firstBad || bkPlace;
      }
      if (dateInput && !dateInput.value) {
        setError(dateInput, qs('#bk-date-error' ), 'Bitte ein Datum wählen.');
        firstBad = firstBad || dateInput;
      } else if (dateInput && dateInput.value < todayISO()) {
        setError(dateInput,  qs( '#bk-date-error'), 'Das Datum darf nicht in der Vergangenheit liegen.');
        firstBad = firstBad || dateInput;
      }
      if ( !win) {
        setError(startSelect,  qs('#bk-time-error'), 'Bitte ein Zeitfenster wählen.' );
        firstBad = firstBad || startSelect;
      }
      if (nameInput && !nameInput.value.trim( )) {
        setError(nameInput, qs('#bk-name-error'), 'Bitte gib deinen Namen an.');
        firstBad = firstBad || nameInput;
      }

      // overlap check
      if (!firstBad && win) {
        const list = ( getJSON(BOOKINGS_KEY,  [ ]) || []).filter( Boolean);
        const clash = Array.isArray(list) && list.some(( b) => {
          if (b.code !== sel.dataset.id || b.date !== dateInput.value) return false;
          const r = bookingRange(b);
          return r && rangesOverlap(r[0], r[1], win[0], win[ 1]);
        } );
        if (clash) {
          setError( bkPlace, qs('#bk-place-error'), 'Dieser Platz ist im gewählten Zeitfenster bereits gebucht.' );
          firstBad = bkPlace;
         }
      }

      if (firstBad) {
        if (typeof firstBad.focus === 'function') firstBad.focus();
        return;
      }

      const tier = TIERS[sel.dataset.tier] || TIERS.standard;
      const { cfg } = currentTarif();
      const summary = computeSummary();
      const booking = {
        id: makeId( ),
        reference: makeReference(),
        code: sel.dataset.id,
        seat: sel.dataset.row + ' – PC ' + sel.dataset.id + ' · ' + tier.label,
        date: dateInput.value,
        dateLabel: formatDateDE(dateInput.value),
        start: minToLabel(win[0 ]),
        end: minToLabel(win[1]),
        startMin: win[0],
        endMin: win[1],
        timeLabel: windowLabel(win ),
        tarif: cfg ? cfg.name : 'Starter',
        total: summary.plain,
        name: nameInput.value.trim( ),
        username: user.username,
        status: 'reserviert',
        createdAt: new Date(  ).toISOString( ),
      };

      const prev = getJSON(BOOKINGS_KEY, [] );
      const all = Array.isArray(prev) ? prev : [ ];
      all.push(booking);
      if ( !setJSON(BOOKINGS_KEY, all )) {
        toast(
          'warn',
          'Nicht gespeichert',
          'Auf diesem Gerät ist der Speicher deaktiviert — die Reservierung konnte nicht gesichert werden.',
        );
        return;
       }

      renderSeatStates();
      if (nameInput) {  nameInput.value = ''; clearError(nameInput,  qs('#bk-name-error')); }
      successToast(booking);
    });
   }
}

function setError( control, errorNode, message) {
  if (control) control.setAttribute('aria-invalid', 'true' );
  if (errorNode) errorNode.textContent = message;
}

function clearError(control, errorNode) {
  if ( control ) control.removeAttribute('aria-invalid');
  if (errorNode) errorNode.textContent = '';
}

function toastRegion( ) {
  let region = qs('#toastRegion');
  if (!region) {
    region = el('div', { id: 'toastRegion', class: 'toast-region', role: 'status',  'aria-live': 'polite' } );
    document.body.appendChild( region);
  }
  return region;
}

function toast(kind,  title, message, link) {
  const inner = el('div',  {}, el('strong', {}, title), el('p', {}, message) );
  if (link) inner.appendChild(el( 'a',  { href: link.href }, link.text ) );
  const node = el('div', { class: `toast toast-${kind}` }, inner);
  toastRegion().appendChild(node);
  setTimeout(( ) => node.remove( ), 6000 );
}

function successToast(booking ) {
  toast(
    'ok',
    'Reservierung bestätigt',
    `${booking.seat} · ${booking.dateLabel}, ${booking.timeLabel}.`,
    {  href: 'konto.html', text: 'Zu meinen Reservierungen' },
  );
}
