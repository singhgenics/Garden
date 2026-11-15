// Konso POS server. Run on the counter PC:  node server.js   (Node 22.5+; no npm install needed)
// Tablets and the kitchen screen open the LAN address it prints.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { all, get, run, tx, backup, DB_FILE } from './lib/db.js';
import {
  now, bdate, settings, saveSettings, DEFAULT_SETTINGS, ROLES, can, hashPin, staffByPin, pinTaken, newSession, sessionStaff,
  publicStaff, audit, fail, HttpError,
} from './lib/core.js';
import { seedIfEmpty } from './lib/seed.js';
import {
  loadOrder, openOrder, addLine, updateLine, sendKot, voidLine, billOrder, printBill, reopenOrder, payOrder, cancelOrder, LIVE,
} from './lib/orders.js';
import { runReport, reportList, dayFigures } from './lib/reports.js';
import { zDoc, testDoc, dispatch } from './lib/print.js';
import { r2 } from './public/calc.js';

import { backfillPrep, board, stats as kdsStats, recent as kdsRecent, fireNow, beat, aliveMap, STATIONS } from './lib/kds.js';
const PORT = +process.env.PORT || 8080;
const PUBLIC = path.join(import.meta.dirname, 'public');
if (seedIfEmpty()) console.log('First run: database created with the menu. Log in with PIN 1234 and change it.');
backfillPrep();

// ---------- routing ----------
const routes = [];
const route = (method, pattern, perm, fn) => {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  routes.push({ method, re, keys, perm, fn });
};
const GET = (p, perm, fn) => route('GET', p, perm, fn);
const POST = (p, perm, fn) => route('POST', p, perm, fn);
const PUT = (p, perm, fn) => route('PUT', p, perm, fn);
const DEL = (p, perm, fn) => route('DELETE', p, perm, fn);

/** A manager can authorise one action on someone else's terminal by typing their PIN. */
function authorise(ctx, perm) {
  if (can(ctx.staff, perm)) return ctx.staff;
  const pin = ctx.body?.override_pin;
  if (pin) {
    const m = staffByPin(pin, ['owner', 'manager']);
    if (m && can(m, perm)) { audit(m.id, 'override', { perm, for: ctx.staff.name }); return m; }
    fail(403, 'That PIN cannot authorise this');
  }
  fail(403, `Needs manager approval (${perm})`);
}

// ---------- login ----------
const attempts = new Map();
POST('/api/login', null, ({ body, ip }) => {
  const a = attempts.get(ip) || { n: 0, t: Date.now() };
  if (Date.now() - a.t > 5 * 60e3) { a.n = 0; a.t = Date.now(); }
  if (a.n >= 8) fail(429, 'Too many wrong PINs. Wait five minutes.');
  const s = staffByPin(String(body.pin || ''));
  if (!s) { a.n++; attempts.set(ip, a); fail(401, 'Wrong PIN'); }
  attempts.delete(ip);
  audit(s.id, 'login', ip);
  return { token: newSession(s.id), staff: publicStaff(s) };
});
POST('/api/logout', 'any', ({ token }) => { run('DELETE FROM sessions WHERE token = ?', token); return { ok: true }; });
GET('/api/me', 'any', ({ staff }) => ({ staff: publicStaff(staff), clockedIn: !!openShift(staff.id) }));

const openShift = id => get('SELECT * FROM attendance WHERE staff_id = ? AND clock_out IS NULL ORDER BY id DESC LIMIT 1', id);
POST('/api/clock', null, ({ body }) => {
  const s = staffByPin(String(body.pin || ''));
  if (!s) fail(401, 'Wrong PIN');
  const open = openShift(s.id);
  if (open) { run('UPDATE attendance SET clock_out = ? WHERE id = ?', now(), open.id); return { name: s.name, action: 'out', since: open.clock_in }; }
  run('INSERT INTO attendance (staff_id, clock_in) VALUES (?, ?)', s.id, now());
  return { name: s.name, action: 'in' };
});

// ---------- bootstrap for the POS screen ----------
GET('/api/bootstrap', 'any', ({ staff }) => ({
  staff: publicStaff(staff),
  settings: publicSettings(),
  taxes: all('SELECT * FROM taxes WHERE active = 1'),
  categories: all('SELECT * FROM categories WHERE active = 1 ORDER BY sort, name'),
  items: all(`SELECT i.*, t.kind tax_kind, t.rate tax_rate FROM items i LEFT JOIN taxes t ON t.id = i.tax_id WHERE i.active = 1 ORDER BY i.sort, i.name`),
  tables: all('SELECT * FROM tables WHERE active = 1 ORDER BY sort, name'),
  bdate: bdate(),
}));
function publicSettings() {
  const s = { ...settings() };
  return s;
}

GET('/api/floor', 'pos', () => {
  const orders = all(`SELECT o.*, t.name table_name, s.name staff_name,
      (SELECT COUNT(*) FROM order_lines l WHERE l.order_id = o.id AND l.status = 'new') unsent,
      (SELECT COUNT(*) FROM order_lines l WHERE l.order_id = o.id AND l.status = 'ready') ready
    FROM orders o LEFT JOIN tables t ON t.id = o.table_id LEFT JOIN staff s ON s.id = o.staff_id WHERE o.${LIVE} ORDER BY o.id`);
  return { orders: orders.map(o => ({ ...o, total: o.status === 'open' ? loadOrder(o.id).bill.total : o.total })) };
});

// ---------- orders ----------
POST('/api/orders', 'pos', ({ body, staff }) => openOrder(body, staff));
GET('/api/orders', 'orders', ({ q }) => {
  const from = q.from || bdate(), to = q.to || from;
  return all(`SELECT o.*, t.name table_name, s.name staff_name, c.name customer_name,
                (SELECT group_concat(invoice_no, ', ') FROM invoices i WHERE i.order_id = o.id AND i.cancelled = 0) invoice_nos,
                (SELECT COALESCE(SUM(amount),0) FROM payments p WHERE p.order_id = o.id) paid
              FROM orders o LEFT JOIN tables t ON t.id = o.table_id LEFT JOIN staff s ON s.id = o.staff_id LEFT JOIN customers c ON c.id = o.customer_id
              WHERE o.bdate BETWEEN ? AND ? ${q.status ? 'AND o.status = ?' : ''} ORDER BY o.id DESC`, from, to, ...(q.status ? [q.status] : []));
});
GET('/api/orders/:id', 'pos', ({ p }) => loadOrder(+p.id));
PUT('/api/orders/:id', 'pos', (ctx) => {
  const { p, body, staff } = ctx;
  const o = loadOrder(+p.id);
  if (!['open', 'billed'].includes(o.status)) fail(409, 'Order is closed');
  const set = {};
  for (const k of ['covers', 'customer_id', 'note']) if (k in body) set[k] = body[k];
  if ('table_id' in body && body.table_id !== o.table_id) {
    const busy = get(`SELECT id FROM orders WHERE table_id = ? AND ${LIVE} AND id != ?`, body.table_id, o.id);
    if (busy) fail(409, 'That table already has an open order. Merge instead.');
    set.table_id = body.table_id; set.type = 'dine';
  }
  const money = ['discount_type', 'discount_value', 'discount_reason', 'service_charge_pct'].filter(k => k in body);
  if (money.length) {
    if (o.status !== 'open') fail(409, 'Reopen the bill to change discounts');
    const pct = body.discount_type === 'pct' ? +body.discount_value : body.discount_type === 'amt' ? +body.discount_value / Math.max(1, o.bill.subtotal) * 100 : 0;
    if (pct > (+settings().discount_limit_pct || 0)) authorise(ctx, 'discount');
    if (body.discount_type && +body.discount_value && !body.discount_reason) fail(400, 'Give a reason for the discount');
    for (const k of money) set[k] = body[k];
    if (+body.discount_value) audit(staff.id, 'discount', { order: o.id, type: body.discount_type, value: body.discount_value, reason: body.discount_reason });
  }
  if (Object.keys(set).length) run(`UPDATE orders SET ${Object.keys(set).map(k => `${k} = ?`).join(', ')} WHERE id = ?`, ...Object.values(set), o.id);
  return loadOrder(o.id);
});
POST('/api/orders/:id/merge', 'pos', ({ p, body, staff }) => tx(() => {
  const into = loadOrder(+body.into_id), from = loadOrder(+p.id);
  if (into.status !== 'open' || from.status !== 'open') fail(409, 'Both orders must be open (not billed)');
  run('UPDATE order_lines SET order_id = ? WHERE order_id = ?', into.id, from.id);
  run("UPDATE orders SET status = 'void', void_reason = ?, closed_at = ? WHERE id = ?", `Merged into order ${into.id}`, now(), from.id);
  run('UPDATE orders SET covers = covers + ? WHERE id = ?', from.covers, into.id);
  audit(staff.id, 'merge', { from: from.id, into: into.id });
  return loadOrder(into.id);
}));
POST('/api/orders/:id/lines', 'pos', ({ p, body, staff }) => addLine(+p.id, body, staff));
PUT('/api/orders/:id/lines/:lid', 'pos', (ctx) => {
  const mayReprice = 'price' in ctx.body ? !!authorise(ctx, 'discount') : false;
  return updateLine(+ctx.p.id, +ctx.p.lid, ctx.body, ctx.staff, mayReprice);
});
POST('/api/orders/:id/lines/:lid/void', 'pos', (ctx) => {
  const l = get('SELECT status FROM order_lines WHERE id = ?', +ctx.p.lid);
  const who = l && l.status !== 'new' ? authorise(ctx, 'void') : ctx.staff;
  return voidLine(+ctx.p.id, +ctx.p.lid, ctx.body, who);
});
POST('/api/orders/:id/kot', 'pos', async ({ p, staff, body }) => ({ prints: await sendKot(+p.id, staff, { fire: !!body?.fire }), order: loadOrder(+p.id) }));
POST('/api/orders/:id/bill', 'bill', async ({ p, staff }) => {
  await sendKot(+p.id, staff);
  billOrder(+p.id, staff);
  const print = await printBill(+p.id, staff);
  return { order: loadOrder(+p.id), print };
});
POST('/api/orders/:id/print', 'pos', async ({ p, staff, body }) => {
  const o = get('SELECT status FROM orders WHERE id = ?', +p.id);
  return { print: await printBill(+p.id, staff, { reprint: o?.status !== 'open' && !!body.reprint }) };
});
POST('/api/orders/:id/reopen', 'pos', (ctx) => reopenOrder(+ctx.p.id, ctx.body.reason, authorise(ctx, 'reopen')));
POST('/api/orders/:id/pay', 'settle', async ({ p, body, staff }) => {
  await sendKot(+p.id, staff);
  const o = payOrder(+p.id, body.payments || [], staff);
  const cash = (body.payments || []).some(x => x.mode === 'cash' && +x.amount > 0);
  let print = null;
  if (o.status === 'paid' && body.print !== false) print = await printBill(o.id, staff, { drawer: cash && settings().open_drawer_on_cash });
  else if (cash && settings().open_drawer_on_cash) await dispatch('bill', [], { drawer: true }).catch(() => {});
  return { order: o, print };
});
POST('/api/orders/:id/cancel', 'pos', (ctx) => {
  const o = loadOrder(+ctx.p.id);
  const who = o.lines.some(l => l.status !== 'new' && l.status !== 'void') || o.invoices.length ? authorise(ctx, 'void') : ctx.staff;
  return cancelOrder(o.id, ctx.body, who);
});
POST('/api/payments/:id/refund', 'pos', (ctx) => tx(() => {
  const m = authorise(ctx, 'void');
  const pay = get('SELECT * FROM payments WHERE id = ?', +ctx.p.id);
  if (!pay) fail(404, 'Payment not found');
  if (!ctx.body.reason) fail(400, 'Give a reason');
  run('DELETE FROM payments WHERE id = ?', pay.id);
  run("UPDATE orders SET status = 'billed', closed_at = NULL WHERE id = ? AND status = 'paid'", pay.order_id);
  audit(m.id, 'refund', { order: pay.order_id, mode: pay.mode, amount: pay.amount, reason: ctx.body.reason });
  return loadOrder(pay.order_id);
}));
POST('/api/invoices/:id/cancel', 'pos', (ctx) => tx(() => {
  const m = authorise(ctx, 'invoice_cancel');
  const inv = get('SELECT * FROM invoices WHERE id = ?', +ctx.p.id);
  if (!inv || inv.cancelled) fail(404, 'Invoice not found');
  if (!ctx.body.reason) fail(400, 'Give a reason');
  run('UPDATE invoices SET cancelled = 1, cancel_reason = ?, cancelled_at = ? WHERE id = ?', ctx.body.reason, now(), inv.id);
  audit(m.id, 'invoice_cancel', { invoice: inv.invoice_no, total: inv.total, reason: ctx.body.reason });
  return loadOrder(inv.order_id);
}));

// ---------- kitchen display ----------
GET('/api/kds', 'kds', ({ q }) => { beat(q.screen || 'all'); return board(q.screen || 'pass', q.station || ''); });
GET('/api/kds/info', 'kds', () => ({ stats: kdsStats(), recent: kdsRecent(), alive: aliveMap(), stations: STATIONS }));
POST('/api/kds/lines/:id', 'kds', ({ p, body }) => {
  const st = ['sent', 'ready', 'served'].includes(body.status) ? body.status : 'ready';
  run('UPDATE order_lines SET status = ?, ready_at = ?, served_at = ? WHERE id = ? AND status IN (\'sent\',\'ready\')', st, st === 'sent' ? null : now(), st === 'served' ? now() : null, +p.id);
  return { ok: true };
});
POST('/api/kds/tickets', 'kds', ({ body }) => {
  const st = body.status === 'served' ? 'served' : 'ready';
  run("UPDATE order_lines SET status = ?, ready_at = COALESCE(ready_at, ?), served_at = ? WHERE order_id = ? AND kot_no = ? AND status IN ('sent','ready') AND hold = 0",
    st, now(), st === 'served' ? now() : null, +body.order_id, +body.kot_no);
  return { ok: true };
});
// the pass: mark what is ready on a table as served (one course, or everything ready)
POST('/api/kds/served', 'kds', ({ body }) => {
  const r = run(`UPDATE order_lines SET status = 'served', served_at = ? WHERE order_id = ? AND status = 'ready' ${body.course != null ? 'AND course = ?' : ''}`,
    ...[now(), +body.order_id, ...(body.course != null ? [+body.course] : [])]);
  return { ok: true, changes: r.changes };
});
POST('/api/kds/fire', 'kds', ({ body }) => ({ ok: true, fired: fireNow(+body.order_id) }));
POST('/api/kds/recall', 'kds', ({ body }) => {
  run("UPDATE order_lines SET status = 'ready', served_at = NULL WHERE order_id = ? AND kot_no = ? AND status = 'served'", +body.order_id, +body.kot_no);
  return { ok: true };
});

// ---------- generic CRUD for master data ----------
function crud(name, table, perm, fields, { readPerm = perm, order = 'name', softDelete = true, beforeSave } = {}) {
  GET(`/api/${name}`, readPerm, ({ q }) => all(`SELECT * FROM ${table} ${softDelete && !q.all ? 'WHERE active = 1' : ''} ORDER BY ${order}`));
  const pick = (body) => Object.fromEntries(fields.filter(f => f in body).map(f => [f, body[f] === '' && /_id$/.test(f) ? null : body[f]]));
  POST(`/api/${name}`, perm, (ctx) => {
    const row = pick(ctx.body); beforeSave?.(row, ctx);
    if (!Object.keys(row).length) fail(400, 'Nothing to save');
    const id = run(`INSERT INTO ${table} (${Object.keys(row).join(', ')}) VALUES (${Object.keys(row).map(() => '?').join(', ')})`, ...Object.values(row)).id;
    return get(`SELECT * FROM ${table} WHERE id = ?`, id);
  });
  PUT(`/api/${name}/:id`, perm, (ctx) => {
    const row = pick(ctx.body); beforeSave?.(row, ctx);
    if (Object.keys(row).length) run(`UPDATE ${table} SET ${Object.keys(row).map(k => `${k} = ?`).join(', ')} WHERE id = ?`, ...Object.values(row), +ctx.p.id);
    return get(`SELECT * FROM ${table} WHERE id = ?`, +ctx.p.id);
  });
  DEL(`/api/${name}/:id`, perm, ({ p }) => {
    if (softDelete) run(`UPDATE ${table} SET active = 0 WHERE id = ?`, +p.id);
    else run(`DELETE FROM ${table} WHERE id = ?`, +p.id);
    return { ok: true };
  });
}
crud('categories', 'categories', 'menu', ['name', 'station', 'sort', 'color'], { readPerm: 'any', order: 'sort, name' });
crud('items', 'items', 'menu', ['category_id', 'name', 'code', 'price', 'tax_id', 'hsn', 'veg', 'available', 'station', 'sort', 'prep', 'prep_min', 'course'], { readPerm: 'any', order: 'sort, name' });
crud('taxes', 'taxes', 'settings', ['name', 'kind', 'rate', 'hsn'], { readPerm: 'any' });
crud('tables', 'tables', 'settings', ['name', 'area', 'seats', 'sort'], { readPerm: 'any', order: 'sort, name' });
crud('vendors', 'vendors', 'vendors', ['name', 'contact', 'phone', 'email', 'gstin', 'address', 'supplies', 'terms_days', 'notes'], { readPerm: 'any' });
crud('stock', 'stock_items', 'inventory', ['name', 'category', 'unit', 'reorder_level', 'par_level', 'cost', 'vendor_id'], { readPerm: 'any', order: 'category, name' });
crud('customers', 'customers', 'pos', ['name', 'phone', 'email', 'gstin', 'address', 'notes'], { readPerm: 'pos', order: 'last_visit DESC, name', softDelete: false,
  beforeSave: (row) => { if (row.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(row.gstin.toUpperCase())) fail(400, 'That GSTIN does not look valid (15 characters)'); if (row.gstin) row.gstin = row.gstin.toUpperCase(); } });
PUT('/api/items/:id/available', 'pos', ({ p, body, staff }) => {
  run('UPDATE items SET available = ? WHERE id = ?', body.available ? 1 : 0, +p.id);
  audit(staff.id, body.available ? 'item_on' : 'item_86', +p.id);
  return { ok: true };
});
GET('/api/customers/search', 'pos', ({ q }) => all("SELECT * FROM customers WHERE phone LIKE ? OR name LIKE ? ORDER BY last_visit DESC LIMIT 10", `%${q.q || ''}%`, `%${q.q || ''}%`));
GET('/api/customers/:id/orders', 'pos', ({ p }) => all("SELECT id, bdate, total, status FROM orders WHERE customer_id = ? ORDER BY id DESC LIMIT 50", +p.id));

// ---------- recipes ----------
GET('/api/recipes/:item', 'menu', ({ p }) => all('SELECT r.*, s.name, s.unit, s.cost FROM recipes r JOIN stock_items s ON s.id = r.stock_id WHERE r.item_id = ?', +p.item));
PUT('/api/recipes/:item', 'menu', ({ p, body }) => tx(() => {
  run('DELETE FROM recipes WHERE item_id = ?', +p.item);
  for (const r of body.lines || []) if (r.stock_id && +r.qty > 0) run('INSERT OR REPLACE INTO recipes (item_id, stock_id, qty) VALUES (?, ?, ?)', +p.item, +r.stock_id, +r.qty);
  return all('SELECT r.*, s.name, s.unit, s.cost FROM recipes r JOIN stock_items s ON s.id = r.stock_id WHERE r.item_id = ?', +p.item);
}));

// ---------- inventory ----------
POST('/api/stock/:id/move', 'inventory', ({ p, body, staff }) => tx(() => {
  const s = get('SELECT * FROM stock_items WHERE id = ?', +p.id);
  if (!s) fail(404, 'Stock item not found');
  const type = body.type;
  let q = +body.qty;
  if (!['waste', 'adjust', 'count', 'purchase'].includes(type) || isNaN(q)) fail(400, 'Bad movement');
  if (type === 'waste') q = -Math.abs(q);
  if (type === 'count') q = q - s.qty;  // body.qty is what was counted
  if (type === 'purchase') {
    const cost = +body.cost || s.cost;
    const newQty = s.qty + q;
    const avg = s.qty > 0 && newQty > 0 ? (s.qty * s.cost + q * cost) / newQty : cost;
    run('UPDATE stock_items SET cost = ? WHERE id = ?', r2(avg * 10000) / 10000, s.id);
  }
  run('UPDATE stock_items SET qty = qty + ? WHERE id = ?', q, s.id);
  run('INSERT INTO stock_moves (stock_id, qty, type, note, cost, staff_id, at, bdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', s.id, q, type, body.note || '', s.cost, staff.id, now(), bdate());
  if (type !== 'purchase') audit(staff.id, 'stock_adjust', { item: s.name, type, qty: q, note: body.note || '' });
  return get('SELECT * FROM stock_items WHERE id = ?', s.id);
}));
POST('/api/stock-count', 'inventory', ({ body, staff }) => tx(() => {
  let n = 0;
  for (const c of body.counts || []) {
    if (c.qty === '' || c.qty == null) continue;
    const s = get('SELECT * FROM stock_items WHERE id = ?', +c.id);
    const diff = +c.qty - s.qty;
    if (!s || Math.abs(diff) < 1e-9) continue;
    run('UPDATE stock_items SET qty = ? WHERE id = ?', +c.qty, s.id);
    run("INSERT INTO stock_moves (stock_id, qty, type, note, cost, staff_id, at, bdate) VALUES (?, ?, 'count', ?, ?, ?, ?, ?)", s.id, diff, body.note || 'Stock take', s.cost, staff.id, now(), bdate());
    n++;
  }
  audit(staff.id, 'stock_adjust', { stock_take: n });
  return { updated: n };
}));
GET('/api/stock/:id/moves', 'inventory', ({ p }) => all(`SELECT m.*, s.name staff_name FROM stock_moves m LEFT JOIN staff s ON s.id = m.staff_id WHERE m.stock_id = ? ORDER BY m.id DESC LIMIT 200`, +p.id));

// ---------- purchases & vendor payments ----------
GET('/api/purchases', 'purchases', ({ q }) => all(`SELECT p.*, v.name vendor, (SELECT COALESCE(SUM(amount),0) FROM vendor_payments vp WHERE vp.purchase_id = p.id) paid
  FROM purchases p LEFT JOIN vendors v ON v.id = p.vendor_id WHERE p.bill_date BETWEEN ? AND ? ${q.vendor_id ? 'AND p.vendor_id = ?' : ''} ORDER BY p.bill_date DESC, p.id DESC`,
  q.from || '2000-01-01', q.to || '2999-12-31', ...(q.vendor_id ? [+q.vendor_id] : [])));
GET('/api/purchases/:id', 'purchases', ({ p }) => ({
  ...get('SELECT p.*, v.name vendor FROM purchases p LEFT JOIN vendors v ON v.id = p.vendor_id WHERE p.id = ?', +p.id),
  lines: all('SELECT l.*, s.name, s.unit FROM purchase_lines l JOIN stock_items s ON s.id = l.stock_id WHERE purchase_id = ?', +p.id),
  payments: all('SELECT * FROM vendor_payments WHERE purchase_id = ?', +p.id),
}));
POST('/api/purchases', 'purchases', ({ body, staff }) => tx(() => {
  const lines = (body.lines || []).filter(l => l.stock_id && +l.qty > 0);
  if (!body.vendor_id || !lines.length) fail(400, 'Pick a vendor and add at least one item');
  let taxable = 0, tax = 0;
  for (const l of lines) { l.taxable = r2(+l.qty * +l.rate); l.tax = r2(l.taxable * (+l.tax_rate || 0) / 100); taxable += l.taxable; tax += l.tax; }
  const total = r2(taxable + tax + (+body.other_charges || 0));
  const pid = run('INSERT INTO purchases (vendor_id, bill_no, bill_date, taxable, tax, total, notes, staff_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    +body.vendor_id, body.bill_no || '', body.bill_date || bdate(), r2(taxable), r2(tax), total, body.notes || '', staff.id, now()).id;
  for (const l of lines) {
    run('INSERT INTO purchase_lines (purchase_id, stock_id, qty, rate, tax_rate, taxable, tax) VALUES (?, ?, ?, ?, ?, ?, ?)', pid, +l.stock_id, +l.qty, +l.rate, +l.tax_rate || 0, l.taxable, l.tax);
    const s = get('SELECT * FROM stock_items WHERE id = ?', +l.stock_id);
    // GST paid on purchases is a cost for a 5% restaurant (no input credit), so it goes into unit cost.
    const unit = (l.taxable + l.tax) / +l.qty;
    const newQty = s.qty + +l.qty;
    const avg = s.qty > 0 && newQty > 0 ? (s.qty * s.cost + +l.qty * unit) / newQty : unit;
    run('UPDATE stock_items SET qty = qty + ?, cost = ? WHERE id = ?', +l.qty, Math.round(avg * 10000) / 10000, s.id);
    run("INSERT INTO stock_moves (stock_id, qty, type, ref, note, cost, staff_id, at, bdate) VALUES (?, ?, 'purchase', ?, ?, ?, ?, ?, ?)",
      s.id, +l.qty, `purchase ${pid}`, body.bill_no || '', unit, staff.id, now(), bdate());
  }
  if (+body.paid_now > 0) run('INSERT INTO vendor_payments (vendor_id, purchase_id, amount, mode, ref, date, staff_id, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    +body.vendor_id, pid, +body.paid_now, body.pay_mode || 'cash', body.pay_ref || '', bdate(), staff.id, now());
  return { id: pid };
}));
POST('/api/purchases/:id/cancel', 'purchases', ({ p, body, staff }) => tx(() => {
  const pu = get('SELECT * FROM purchases WHERE id = ?', +p.id);
  if (!pu || pu.cancelled) fail(404, 'Purchase not found');
  for (const l of all('SELECT * FROM purchase_lines WHERE purchase_id = ?', pu.id)) {
    run('UPDATE stock_items SET qty = qty - ? WHERE id = ?', l.qty, l.stock_id);
    run("INSERT INTO stock_moves (stock_id, qty, type, ref, note, staff_id, at, bdate) VALUES (?, ?, 'adjust', ?, 'Purchase cancelled', ?, ?, ?)", l.stock_id, -l.qty, `purchase ${pu.id}`, staff.id, now(), bdate());
  }
  run('UPDATE purchases SET cancelled = 1 WHERE id = ?', pu.id);
  audit(staff.id, 'purchase_cancel', { id: pu.id, reason: body.reason || '' });
  return { ok: true };
}));
POST('/api/vendor-payments', 'purchases', ({ body, staff }) => {
  if (!body.vendor_id || !(+body.amount > 0)) fail(400, 'Vendor and amount needed');
  return { id: run('INSERT INTO vendor_payments (vendor_id, purchase_id, amount, mode, ref, date, staff_id, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    +body.vendor_id, body.purchase_id || null, +body.amount, body.mode || 'bank', body.ref || '', body.date || bdate(), staff.id, now()).id };
});
GET('/api/vendors/:id/ledger', 'vendors', ({ p }) => {
  const rows = [
    ...all("SELECT bill_date date, 'Bill ' || bill_no || ' (#' || id || ')' AS detail, total debit, 0 credit FROM purchases WHERE vendor_id = ? AND cancelled = 0", +p.id),
    ...all("SELECT date, 'Paid by ' || mode || CASE WHEN ref != '' THEN ' ' || ref ELSE '' END AS detail, 0 debit, amount credit FROM vendor_payments WHERE vendor_id = ?", +p.id),
  ].sort((a, b) => a.date.localeCompare(b.date));
  let bal = 0;
  for (const r of rows) { bal += r.debit - r.credit; r.balance = r2(bal); }
  return { vendor: get('SELECT * FROM vendors WHERE id = ?', +p.id), rows, balance: r2(bal) };
});
GET('/api/vendor-balances', 'vendors', () => all(`SELECT v.id, v.name, v.phone, v.gstin, v.supplies, v.terms_days,
   (SELECT COALESCE(SUM(total),0) FROM purchases p WHERE p.vendor_id = v.id AND p.cancelled = 0) billed,
   (SELECT COALESCE(SUM(amount),0) FROM vendor_payments vp WHERE vp.vendor_id = v.id) paid,
   (SELECT MAX(bill_date) FROM purchases p WHERE p.vendor_id = v.id AND p.cancelled = 0) last_bill
   FROM vendors v WHERE v.active = 1 ORDER BY v.name`).map(v => ({ ...v, due: r2(v.billed - v.paid) })));

// ---------- staff ----------
GET('/api/staff', 'staff', () => all('SELECT id, name, role, phone, monthly_salary, joined, active FROM staff ORDER BY active DESC, name'));
POST('/api/staff', 'staff', ({ body, staff }) => {
  if (!body.name || !/^\d{4,6}$/.test(String(body.pin || ''))) fail(400, 'Name and a 4–6 digit PIN are required');
  if (!ROLES.includes(body.role)) fail(400, 'Pick a role');
  if (body.role === 'owner' && staff.role !== 'owner') fail(403, 'Only the owner can add an owner');
  if (pinTaken(body.pin)) fail(409, 'Someone already uses that PIN');
  return { id: run('INSERT INTO staff (name, role, pin_hash, phone, monthly_salary, joined, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    body.name, body.role, hashPin(body.pin), body.phone || '', +body.monthly_salary || 0, body.joined || '', now()).id };
});
PUT('/api/staff/:id', 'staff', ({ p, body, staff }) => {
  const t = get('SELECT * FROM staff WHERE id = ?', +p.id);
  if (!t) fail(404, 'Not found');
  if ((t.role === 'owner' || body.role === 'owner') && staff.role !== 'owner') fail(403, 'Only the owner can change an owner');
  if (body.pin) {
    if (!/^\d{4,6}$/.test(String(body.pin))) fail(400, 'PIN must be 4–6 digits');
    if (pinTaken(body.pin, t.id)) fail(409, 'Someone already uses that PIN');
    run('UPDATE staff SET pin_hash = ? WHERE id = ?', hashPin(body.pin), t.id);
    run('DELETE FROM sessions WHERE staff_id = ?', t.id);
  }
  run('UPDATE staff SET name = ?, role = ?, phone = ?, monthly_salary = ?, joined = ?, active = ? WHERE id = ?',
    body.name ?? t.name, ROLES.includes(body.role) ? body.role : t.role, body.phone ?? t.phone, +(body.monthly_salary ?? t.monthly_salary),
    body.joined ?? t.joined, body.active === undefined ? t.active : body.active ? 1 : 0, t.id);
  if (body.active === false || body.active === 0) run('DELETE FROM sessions WHERE staff_id = ?', t.id);
  audit(staff.id, 'staff_edit', { id: t.id, pin_changed: !!body.pin });
  return { ok: true };
});
POST('/api/me/pin', 'any', ({ body, staff }) => {
  const me = get('SELECT * FROM staff WHERE id = ?', staff.id);
  if (!staffByPin(body.old) || staffByPin(body.old).id !== me.id) fail(401, 'Current PIN is wrong');
  if (!/^\d{4,6}$/.test(String(body.pin || ''))) fail(400, 'PIN must be 4–6 digits');
  if (pinTaken(body.pin, me.id)) fail(409, 'Someone already uses that PIN');
  run('UPDATE staff SET pin_hash = ? WHERE id = ?', hashPin(body.pin), me.id);
  return { ok: true };
});
GET('/api/attendance', 'staff', ({ q }) => all(`SELECT a.*, s.name, ROUND((julianday(COALESCE(a.clock_out, datetime('now','localtime'))) - julianday(a.clock_in)) * 24, 2) hours
  FROM attendance a JOIN staff s ON s.id = a.staff_id WHERE substr(a.clock_in,1,10) BETWEEN ? AND ? ORDER BY a.clock_in DESC`, q.from || bdate(), q.to || bdate()));
POST('/api/attendance', 'staff', ({ body }) => ({ id: run('INSERT INTO attendance (staff_id, clock_in, clock_out, note) VALUES (?, ?, ?, ?)', +body.staff_id, body.clock_in, body.clock_out || null, body.note || 'manual entry').id }));

// ---------- expenses ----------
GET('/api/expenses', 'expenses', ({ q }) => all('SELECT e.*, s.name staff_name FROM expenses e LEFT JOIN staff s ON s.id = e.staff_id WHERE date BETWEEN ? AND ? ORDER BY date DESC, id DESC', q.from || bdate(), q.to || bdate()));
POST('/api/expenses', 'expenses', ({ body, staff }) => {
  if (!(+body.amount > 0) || !body.category) fail(400, 'Category and amount needed');
  return { id: run('INSERT INTO expenses (date, category, amount, mode, paid_to, note, staff_id, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    body.date || bdate(), body.category, +body.amount, body.mode || 'cash', body.paid_to || '', body.note || '', staff.id, now()).id };
});
DEL('/api/expenses/:id', 'reports', ({ p, staff }) => { audit(staff.id, 'expense_delete', get('SELECT * FROM expenses WHERE id = ?', +p.id)); run('DELETE FROM expenses WHERE id = ?', +p.id); return { ok: true }; });

// ---------- dashboard, reports, day close ----------
GET('/api/dashboard', 'dashboard', () => {
  const bd = bdate();
  const today = dayFigures(bd);
  const last7 = all(`SELECT bdate, SUM(total) total, COUNT(DISTINCT order_id) bills FROM invoices WHERE cancelled = 0 AND bdate > date(?, '-14 day') GROUP BY bdate ORDER BY bdate`, bd);
  const low = all('SELECT id, name, unit, qty, reorder_level FROM stock_items WHERE active = 1 AND qty <= reorder_level ORDER BY qty / NULLIF(reorder_level, 0)');
  const live = get(`SELECT COUNT(*) n, COALESCE(SUM(covers),0) c FROM orders WHERE ${LIVE}`);
  const hourly = all(`SELECT CAST(substr(date, 12, 2) AS INTEGER) h, SUM(total) total FROM invoices WHERE cancelled = 0 AND bdate = ? GROUP BY h`, bd);
  const month = get(`SELECT COALESCE(SUM(total),0) total, COUNT(DISTINCT order_id) bills FROM invoices WHERE cancelled = 0 AND substr(bdate,1,7) = substr(?,1,7)`, bd);
  const dues = get(`SELECT COALESCE(SUM(total),0) - (SELECT COALESCE(SUM(amount),0) FROM vendor_payments) v FROM purchases WHERE cancelled = 0`).v;
  const onShift = all('SELECT s.name, s.role, a.clock_in FROM attendance a JOIN staff s ON s.id = a.staff_id WHERE a.clock_out IS NULL ORDER BY a.clock_in');
  return { bdate: bd, today, last7, low, live, hourly, month, vendorDues: r2(dues), onShift };
});
GET('/api/reports', 'reports', () => reportList());
GET('/api/reports/:kind', 'reports', ({ p, q }) => runReport(p.kind, q.from || bdate(), q.to || q.from || bdate()) || fail(404, 'Unknown report'));
GET('/api/dayclose', 'dayclose', ({ q }) => dayFigures(q.date || bdate()));
POST('/api/dayclose', 'dayclose', async ({ body, staff }) => {
  const bd = body.date || bdate();
  const z0 = dayFigures(bd);
  if (z0.openOrders && !body.force) fail(409, `${z0.openOrders} order(s) are still open. Settle or cancel them first.`);
  const opening = body.opening_cash !== undefined ? +body.opening_cash : z0.cash.opening;
  const expected = r2(opening + z0.cash.sales - z0.cash.expenses - z0.cash.vendors);
  const counted = +body.counted_cash;
  run(`INSERT INTO day_closes (bdate, opening_cash, expected_cash, counted_cash, difference, notes, data, staff_id, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(bdate) DO UPDATE SET opening_cash = excluded.opening_cash, expected_cash = excluded.expected_cash, counted_cash = excluded.counted_cash,
       difference = excluded.difference, notes = excluded.notes, data = excluded.data, staff_id = excluded.staff_id, at = excluded.at`,
    bd, opening, expected, counted, r2(counted - expected), body.notes || '', JSON.stringify(z0), staff.id, now());
  audit(staff.id, 'day_close', { bdate: bd, expected, counted });
  let backupFile = null;
  try { backupFile = backup(`close-${bd}`); } catch (e) { console.error('Backup failed', e); }
  const z = { ...dayFigures(bd), by: staff.name };
  let print;
  try { print = await dispatch('bill', zDoc(z)); } catch (e) { print = { error: e.message, browser: true, blocks: zDoc(z) }; }
  return { z, print, backup: backupFile && path.basename(backupFile) };
});
GET('/api/dayclose/:date/print', 'dayclose', async ({ p, staff }) => {
  const z = { ...dayFigures(p.date), by: staff.name };
  try { return await dispatch('bill', zDoc(z)); } catch (e) { return { error: e.message, browser: true, blocks: zDoc(z) }; }
});

// ---------- settings, printers, backup ----------
GET('/api/settings', 'settings', () => ({ settings: settings(), defaults: DEFAULT_SETTINGS }));
PUT('/api/settings', 'settings', ({ body, staff }) => {
  for (const k of ['gst_prefix', 'vat_prefix']) if (k in body && !/^[A-Z0-9-]{1,5}$/i.test(body[k])) fail(400, 'Invoice prefixes: 1–5 letters or digits (the full number must stay within 16 characters)');
  if (body.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(String(body.gstin).toUpperCase())) fail(400, 'That GSTIN does not look valid');
  if (body.gstin) body.gstin = String(body.gstin).toUpperCase();
  audit(staff.id, 'settings', Object.keys(body));
  return { settings: saveSettings(body) };
});
POST('/api/print/test', 'settings', async ({ body }) => dispatch(body.printer || 'bill', testDoc(body.printer || 'bill')));
POST('/api/print/drawer', 'settle', async () => dispatch('bill', [], { drawer: true }));
GET('/api/backup', 'settings', () => ({ __file: backup('manual') }));
GET('/api/audit', 'settings', ({ q }) => all('SELECT a.*, s.name FROM audit a LEFT JOIN staff s ON s.id = a.staff_id ORDER BY a.id DESC LIMIT ?', +q.limit || 300));

// ---------- HTTP plumbing ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (!url.pathname.startsWith('/api/')) return serveStatic(url.pathname, res);
    const r = routes.find(x => x.method === req.method && x.re.test(url.pathname));
    if (!r) fail(404, 'No such endpoint');
    const m = url.pathname.match(r.re);
    const p = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    const body = ['POST', 'PUT'].includes(req.method) ? await readBody(req) : {};
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    const ctx = { p, q: Object.fromEntries(url.searchParams), body, token, ip: req.socket.remoteAddress, staff: null };
    if (r.perm) {
      ctx.staff = sessionStaff(token);
      if (!ctx.staff) fail(401, 'Please log in');
      if (r.perm !== 'any' && !can(ctx.staff, r.perm)) fail(403, 'You do not have access to this');
    }
    const out = await r.fn(ctx);
    if (out && out.__file) {
      res.writeHead(200, { 'content-type': 'application/octet-stream', 'content-disposition': `attachment; filename="${path.basename(out.__file)}"` });
      return fs.createReadStream(out.__file).pipe(res);
    }
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify(out ?? {}));
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status === 500) console.error(e);
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: e.message || 'Server error' }));
  }
});

function readBody(req) {
  return new Promise((resolve, reject) => {
    let d = '';
    req.on('data', c => { d += c; if (d.length > 2e6) req.destroy(); });
    req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch { reject(new HttpError(400, 'Bad JSON')); } });
    req.on('error', reject);
  });
}

function serveStatic(p, res) {
  let file = path.normalize(path.join(PUBLIC, p === '/' ? 'index.html' : p));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, 'index.html');
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}

// Daily safety backup the first time the server runs each day.
function dailyBackup() {
  const dir = path.join(path.dirname(DB_FILE), 'backups');
  const tag = new Date().toISOString().slice(0, 10);
  if (!fs.existsSync(dir) || !fs.readdirSync(dir).some(f => f.includes(tag))) { try { backup('daily'); } catch (e) { console.error('Backup failed', e); } }
}
dailyBackup();
setInterval(dailyBackup, 3600e3).unref();

server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.error(`\nPort ${PORT} is busy: the POS is probably already running. Open http://localhost:${PORT} in the browser.\nTo use another port: PORT=8090 node server.js\n`);
  else console.error(e);
  process.exit(1);
});
server.listen(PORT, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log(`POS running.\n  On this computer: http://localhost:${PORT}`);
  for (const ip of ips) console.log(`  Tablets / kitchen screen on the same Wi-Fi: http://${ip}:${PORT}`);
  console.log(`  Database: ${DB_FILE}`);
});
