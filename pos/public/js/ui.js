// Client toolkit: API, state, router, modals, forms, tables, toasts and browser receipt printing.

export const S = { token: localStorage.getItem('pos_token') || '', me: null, boot: null };
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = (n, sym = true) => (sym ? '₹' : '') + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const money0 = n => '₹' + Math.round(+n || 0).toLocaleString('en-IN');
export const qty = q => Number.isInteger(+q) ? String(+q) : (+q).toFixed(3).replace(/0+$/, '');
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const can = p => !!S.me && (S.me.perms || []).some(x => x === '*' || x === p);
export const today = () => S.boot?.bdate || new Date().toISOString().slice(0, 10);
export const fmtTime = s => s ? String(s).slice(11, 16) : '';
export const fmtDate = s => { if (!s) return ''; const [y, m, d] = String(s).slice(0, 10).split('-'); return `${d}-${m}-${y}`; };
export const minsSince = s => Math.floor((Date.now() - new Date(String(s).replace(' ', 'T')).getTime()) / 60000);

// ---------- API ----------
export async function api(method, path, body) {
  const res = await fetch('/api' + path, {
    method, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + S.token },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch { /* empty */ }
  if (res.status === 401 && path !== '/login') { logout(true); throw new Error('Session ended'); }
  if (res.status === 403 && /Needs manager approval/.test(data.error || '') && body !== undefined && !body.override_pin) {
    const pin = await askPin('Manager approval', data.error.replace(/\s*\(.*\)/, '') + '. Ask a manager to enter their PIN.');
    if (pin) return api(method, path, { ...body, override_pin: pin });
    throw new Error('Cancelled');
  }
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}
export const GET = p => api('GET', p);
export const POST = (p, b = {}) => api('POST', p, b);
export const PUT = (p, b = {}) => api('PUT', p, b);
export const DEL = p => api('DELETE', p);

/** Wrap an async action: shows errors as toasts and returns undefined on failure. */
export async function act(fn, okMsg) {
  try { const r = await fn(); if (okMsg) toast(okMsg, 'ok'); return r; }
  catch (e) { if (e.message !== 'Cancelled' && e.message !== 'Session ended') toast(e.message, 'bad'); }
}

export function logout(expired) {
  if (!expired && S.token) fetch('/api/logout', { method: 'POST', headers: { authorization: 'Bearer ' + S.token } });
  S.token = ''; S.me = null; S.boot = null;
  localStorage.removeItem('pos_token');
  location.hash = '#/login';
}

// ---------- router ----------
export const PAGES = {};
export const NAV = [];
/** register a page: path like 'floor' or 'order/:id' */
export function page(path, perm, render, nav) {
  PAGES[path] = { perm, render };
  if (nav) NAV.push({ path, perm, ...nav });
}
let cleanup = [];
export const onLeave = fn => cleanup.push(fn);
export function go(h) { if (location.hash === h) route(); else location.hash = h; }

export async function route() {
  cleanup.forEach(f => f()); cleanup = [];
  const h = location.hash.replace(/^#\/?/, '') || '';
  if (!S.token && h !== 'login') return go('#/login');
  if (S.token && !S.boot) {
    try { S.boot = await GET('/bootstrap'); S.me = S.boot.staff; }
    catch { return; }
  }
  const parts = h.split('/');
  let match = null, params = {};
  for (const [p, def] of Object.entries(PAGES)) {
    const pp = p.split('/');
    if (pp.length !== parts.length) continue;
    const m = {};
    if (pp.every((seg, i) => seg.startsWith(':') ? (m[seg.slice(1)] = decodeURIComponent(parts[i]), true) : seg === parts[i])) { match = def; params = m; break; }
  }
  if (!match) return go(S.me ? homeFor() : '#/login');
  if (match.perm && match.perm !== 'any' && !can(match.perm)) return go(homeFor());
  renderShell(h);
  try { await match.render($('main'), params); }
  catch (e) { $('main').innerHTML = `<div class="card bad">${esc(e.message)}</div>`; }
}
export const homeFor = () => can('pos') ? '#/floor' : can('kds') ? '#/kds' : '#/login';

const ICON = { floor: '▦', kds: '🔥', orders: '🧾', dashboard: '◔', menu: '🍜', inventory: '📦', purchases: '🛒', vendors: '🚚', staff: '👥', customers: '☺', expenses: '₹', reports: '📊', dayclose: '🌙', settings: '⚙' };
function renderShell(h) {
  const app = $('#app');
  const bare = h === 'login' || h.startsWith('order/') || h.startsWith('kds/');
  app.className = bare ? 'bare' : '';
  if (bare) { app.innerHTML = '<main class="full"></main>'; return; }
  const cur = h.split('/')[0];
  app.innerHTML = `<nav class="side" id="side">
      <div class="brand">${esc(S.boot?.settings?.business_name || 'POS')}<small>Trading day ${fmtDate(today())}</small></div>
      ${NAV.filter(n => can(n.perm)).map(n => `<a href="#/${n.path}" class="${cur === n.path ? 'on' : ''}"><span>${ICON[n.path] || '•'}</span>${esc(n.label)}</a>`).join('')}
      <div class="grow"></div>
      <div class="who"><b>${esc(S.me?.name)}</b> <span class="muted">· ${esc(S.me?.role)}</span><br>
        <a href="#" id="themeBtn" class="small">Light / dark</a> · <a href="#" id="pinBtn" class="small">My PIN</a> · <a href="#" id="outBtn" class="small">Log out</a></div>
    </nav><main></main>`;
  $('#outBtn').onclick = e => { e.preventDefault(); logout(); };
  $('#themeBtn').onclick = e => { e.preventDefault(); toggleTheme(); };
  $('#pinBtn').onclick = e => { e.preventDefault(); changeMyPin(); };
  $$('#side a[href^="#/"]').forEach(a => a.addEventListener('click', () => $('#side').classList.remove('open')));
}
export function topbar(title, actionsHtml = '') {
  return `<div class="topbar"><button class="btn ghost" id="menuBtn" onclick="document.getElementById('side').classList.toggle('open')">☰</button><h1>${esc(title)}</h1>${actionsHtml}</div>`;
}
export function toggleTheme() {
  const t = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('pos_theme', t); } catch { /* ignore */ }
}
async function changeMyPin() {
  const v = await formModal('Change my PIN', [
    { k: 'old', label: 'Current PIN', type: 'password', inputmode: 'numeric', required: true },
    { k: 'pin', label: 'New PIN (4–6 digits)', type: 'password', inputmode: 'numeric', required: true },
  ]);
  if (v) await act(() => POST('/me/pin', v), 'PIN changed');
}

// ---------- toasts ----------
export function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = `toast ${kind}`; t.textContent = msg;
  $('#toasts').append(t);
  setTimeout(() => t.remove(), kind === 'bad' ? 5000 : 2500);
}

// ---------- modals ----------
export function modal({ title, body, foot = '', wide = false, onOpen }) {
  return new Promise(resolve => {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ${wide ? 'wide' : ''}"><div class="mh"><h2>${esc(title)}</h2><button class="btn ghost sm" data-x>✕</button></div>
      <div class="mb">${body}</div>${foot ? `<div class="mf">${foot}</div>` : ''}</div>`;
    document.body.append(bg);
    const close = v => { bg.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
    const onKey = e => { if (e.key === 'Escape') close(undefined); };
    document.addEventListener('keydown', onKey);
    bg.addEventListener('mousedown', e => { if (e.target === bg) close(undefined); });
    $('[data-x]', bg).onclick = () => close(undefined);
    onOpen?.(bg, close);
  });
}
export const confirmBox = (title, text, okLabel = 'OK', danger = false) => modal({
  title, body: `<p>${esc(text)}</p>`,
  foot: `<button class="btn ghost" data-c>Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(okLabel)}</button>`,
  onOpen: (m, close) => { $('[data-c]', m).onclick = () => close(false); $('[data-ok]', m).onclick = () => close(true); },
});

export function askPin(title, text = '') {
  return modal({
    title, body: `${text ? `<p class="muted">${esc(text)}</p>` : ''}<input type="password" inputmode="numeric" autocomplete="off" id="mpin" placeholder="PIN" style="font-size:1.4rem;text-align:center">`,
    foot: `<button class="btn ghost" data-c>Cancel</button><button class="btn primary" data-ok>Approve</button>`,
    onOpen: (m, close) => {
      const i = $('#mpin', m); i.focus();
      const ok = () => close(i.value || undefined);
      $('[data-ok]', m).onclick = ok; $('[data-c]', m).onclick = () => close(undefined);
      i.onkeydown = e => { if (e.key === 'Enter') ok(); };
    },
  });
}

/**
 * Form in a modal. fields: [{k, label, type:'text'|'number'|'select'|'textarea'|'checkbox'|'date'|'password', options:[[v,l]], value, required, step, list, help, full}]
 * Resolves with the values object, or undefined if cancelled.
 */
export function formModal(title, fields, values = {}, { okLabel = 'Save', wide = false, extraFoot = '' } = {}) {
  const val = f => values[f.k] ?? f.value ?? '';
  const input = f => {
    const req = f.required ? 'required' : '';
    const attrs = `name="${f.k}" ${req} ${f.step ? `step="${f.step}"` : ''} ${f.inputmode ? `inputmode="${f.inputmode}"` : ''} ${f.list ? `list="dl-${f.k}"` : ''} ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ''}`;
    if (f.type === 'select') return `<select ${attrs}>${f.options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val(f)) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    if (f.type === 'textarea') return `<textarea ${attrs} rows="3">${esc(val(f))}</textarea>`;
    if (f.type === 'checkbox') return `<input type="checkbox" ${attrs} ${val(f) ? 'checked' : ''}>`;
    return `<input type="${f.type || 'text'}" ${attrs} value="${esc(val(f))}">${f.list ? `<datalist id="dl-${f.k}">${f.list.map(o => `<option value="${esc(o)}">`).join('')}</datalist>` : ''}`;
  };
  const body = `<form id="mf" class="grid2">${fields.map(f => f.type === 'checkbox'
    ? `<label class="chk" style="${f.full ? 'grid-column:1/-1' : ''}">${input(f)} ${esc(f.label)}</label>`
    : f.type === 'html' ? `<div style="grid-column:1/-1">${f.html}</div>`
    : `<label class="f" style="${f.full || f.type === 'textarea' ? 'grid-column:1/-1' : ''}"><span>${esc(f.label)}</span>${input(f)}${f.help ? `<small>${esc(f.help)}</small>` : ''}</label>`).join('')}</form>`;
  return modal({
    title, body, wide,
    foot: `${extraFoot}<button class="btn ghost" data-c>Cancel</button><button class="btn primary" data-ok>${esc(okLabel)}</button>`,
    onOpen: (m, close) => {
      const form = $('#mf', m);
      (form.querySelector('input:not([type=checkbox]),select,textarea'))?.focus();
      const submit = () => {
        if (!form.reportValidity()) return;
        const out = {};
        for (const f of fields) {
          if (f.type === 'html') continue;
          const el = form.elements[f.k];
          out[f.k] = f.type === 'checkbox' ? el.checked : f.type === 'number' ? (el.value === '' ? '' : +el.value) : el.value;
        }
        close(out);
      };
      $('[data-ok]', m).onclick = submit;
      $('[data-c]', m).onclick = () => close(undefined);
      $$('[data-extra]', m).forEach(b => b.onclick = () => close({ __extra: b.dataset.extra }));
      form.onsubmit = e => { e.preventDefault(); submit(); };
      form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); submit(); } });
    },
  });
}

// ---------- tables ----------
/** cols: [{k, label, t:'money'|'num'|'text'|'date', fmt:(v,row)=>html}] */
export function table(cols, rows, { onRow, totals = false, empty = 'Nothing here yet.', id = '' } = {}) {
  if (!rows.length) return `<div class="card muted">${esc(empty)}</div>`;
  const cell = (c, r) => {
    const v = r[c.k];
    if (c.fmt) return c.fmt(v, r);
    if (c.t === 'money') return money(v, false);
    if (c.t === 'num') return typeof v === 'number' ? qty(Math.round(v * 1000) / 1000) : esc(v);
    if (c.t === 'date') return esc(fmtDate(v));
    return esc(v);
  };
  const isNum = c => c.t === 'money' || c.t === 'num';
  const foot = totals ? `<tfoot><tr>${cols.map((c, i) => `<td class="${isNum(c) ? 'num' : ''}">${i === 0 ? 'Total' : c.t === 'money' ? money(rows.reduce((a, r) => a + (+r[c.k] || 0), 0), false) : c.sum ? qty(rows.reduce((a, r) => a + (+r[c.k] || 0), 0)) : ''}</td>`).join('')}</tr></tfoot>` : '';
  const html = `<div class="tbl-wrap"><table class="t" ${id ? `id="${id}"` : ''}><thead><tr>${cols.map(c => `<th class="${isNum(c) ? 'num' : ''}">${esc(c.label)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r, i) => `<tr data-i="${i}" class="${onRow ? 'click' : ''}">${cols.map(c => `<td class="${isNum(c) ? 'num' : ''}">${cell(c, r)}</td>`).join('')}</tr>`).join('')}</tbody>${foot}</table></div>`;
  if (onRow) queueMicrotask(() => $$(`${id ? '#' + id : 'table.t'} tbody tr`).forEach(tr => tr.onclick = e => { if (!e.target.closest('button,input,select,a')) onRow(rows[+tr.dataset.i]); }));
  return html;
}
export function csv(cols, rows, name) {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const text = [cols.map(c => q(c.label)).join(','), ...rows.map(r => cols.map(c => q(c.t === 'money' ? (+r[c.k] || 0).toFixed(2) : r[c.k])).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv' }));
  a.download = name + '.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- date ranges ----------
export function rangeFor(key) {
  const d = new Date(today() + 'T12:00:00');
  const iso = x => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  const add = (x, n) => { const y = new Date(x); y.setDate(y.getDate() + n); return y; };
  switch (key) {
    case 'yesterday': return [iso(add(d, -1)), iso(add(d, -1))];
    case 'week': return [iso(add(d, -((d.getDay() + 6) % 7))), iso(d)];
    case 'month': return [iso(new Date(d.getFullYear(), d.getMonth(), 1)), iso(d)];
    case 'lastmonth': return [iso(new Date(d.getFullYear(), d.getMonth() - 1, 1)), iso(new Date(d.getFullYear(), d.getMonth(), 0))];
    case 'fy': { const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; return [`${y}-04-01`, iso(d)]; }
    default: return [iso(d), iso(d)];
  }
}
export function rangePicker(state, onChange) {
  const id = 'rp' + Math.random().toString(36).slice(2, 7);
  queueMicrotask(() => {
    const root = document.getElementById(id);
    if (!root) return;
    $$('[data-r]', root).forEach(b => b.onclick = () => { [state.from, state.to] = rangeFor(b.dataset.r); onChange(); });
    $('[name=from]', root).onchange = e => { state.from = e.target.value; onChange(); };
    $('[name=to]', root).onchange = e => { state.to = e.target.value; onChange(); };
  });
  return `<div class="row" id="${id}"><div class="seg">${[['today', 'Today'], ['yesterday', 'Yesterday'], ['week', 'This week'], ['month', 'This month'], ['lastmonth', 'Last month'], ['fy', 'This FY']]
    .map(([k, l]) => `<button data-r="${k}">${l}</button>`).join('')}</div>
    <input type="date" name="from" value="${state.from}" style="width:auto"> – <input type="date" name="to" value="${state.to}" style="width:auto"></div>`;
}

// ---------- printing ----------
/** Print server-built receipt blocks through the browser (any installed printer, incl. USB thermal on Windows). */
export function printBlocks(blocks, width = 48) {
  const mm = width <= 32 ? 58 : 80;
  const lines = [];
  for (const b of blocks) {
    if (b.cut) { lines.push('<div class="cut"></div>'); continue; }
    if (b.feed) { lines.push('<div>&nbsp;</div>'.repeat(b.feed)); continue; }
    if (b.drawer) continue;
    if (b.hr) { lines.push(`<div>${esc(b.hr.repeat(width))}</div>`); continue; }
    lines.push(`<div class="${b.a === 'c' ? 'c' : b.a === 'r' ? 'r' : ''} ${b.b ? 'b' : ''} ${b.s === 2 ? 's2' : ''}">${esc(b.t) || '&nbsp;'}</div>`);
  }
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.append(f);
  const charMm = (mm - 8) / width;
  f.contentDocument.write(`<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: ${mm}mm auto; margin: 0; }
    body { margin: 0; padding: 2mm 4mm; width: ${mm - 8}mm; font: ${(charMm / 0.6).toFixed(2)}mm/1.25 "Courier New", Courier, monospace; color: #000; }
    div { white-space: pre; overflow: hidden; } .c { text-align: center; } .r { text-align: right; } .b { font-weight: 700; }
    .s2 { font-size: 2em; line-height: 1.1; } .cut { border-top: 1px dashed #000; margin: 3mm 0; page-break-after: always; }
  </style></head><body>${lines.join('')}</body></html>`);
  f.contentDocument.close();
  setTimeout(() => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 2000); }, 150);
}
/** Handle a print result from the server: printed on a thermal printer, or needs the browser. */
export function handlePrint(r) {
  if (!r) return;
  const list = Array.isArray(r) ? r : [r];
  const browser = list.filter(x => x.browser && x.blocks?.length);
  for (const x of list) if (x.error) toast(`Printer: ${x.error}. Printing here instead.`, 'bad');
  if (browser.length) printBlocks(browser.flatMap(x => [...x.blocks, ...(browser.length > 1 ? [{ cut: true }] : [])]), browser[0].width || 48);
  else if (list.some(x => x.sent)) toast('Sent to printer', 'ok');
}

export function beep() {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)();
    const o = c.createOscillator(), g = c.createGain();
    o.frequency.value = 880; g.gain.value = 0.15; o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + 0.25);
  } catch { /* no audio */ }
}
