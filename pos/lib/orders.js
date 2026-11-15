// Order lifecycle: open → lines added → KOT sent (stock deducted) → billed (invoices numbered) → paid.
import { all, get, run, tx, nextNumber } from './db.js';
import { now, bdate, fy, settings, billOpts, audit, fail } from './core.js';
import { computeBill, r2 } from '../public/calc.js';
import { kotDoc, billDoc, dispatch } from './print.js';
import { prepFor, holdFor, screenFor } from './kds.js';

export const LIVE = "status IN ('open','billed')";

export function loadOrder(id) {
  const o = get('SELECT * FROM orders WHERE id = ?', id);
  if (!o) fail(404, 'Order not found');
  o.lines = all('SELECT * FROM order_lines WHERE order_id = ? ORDER BY id', id);
  o.payments = all('SELECT * FROM payments WHERE order_id = ? ORDER BY id', id);
  o.invoices = all('SELECT * FROM invoices WHERE order_id = ? ORDER BY id', id).map(i => ({ ...i, data: JSON.parse(i.data || '{}') }));
  o.table = o.table_id ? get('SELECT * FROM tables WHERE id = ?', o.table_id) : null;
  o.customer = o.customer_id ? get('SELECT * FROM customers WHERE id = ?', o.customer_id) : null;
  o.staff = o.staff_id ? get('SELECT id, name FROM staff WHERE id = ?', o.staff_id) : null;
  o.bill = computeBill(o.lines, billOpts(o));
  const live = o.invoices.filter(i => !i.cancelled);
  o.due = r2((live.length ? live.reduce((a, i) => a + i.total, 0) : o.bill.total) - o.payments.reduce((a, p) => a + p.amount, 0));
  return o;
}

export function openOrder({ type = 'dine', table_id, covers = 0, customer_id }, staff) {
  if (type === 'dine') {
    if (!table_id) fail(400, 'Pick a table');
    const busy = get(`SELECT id FROM orders WHERE table_id = ? AND ${LIVE}`, table_id);
    if (busy) return loadOrder(busy.id);
  }
  const id = run('INSERT INTO orders (type, table_id, covers, customer_id, staff_id, opened_at, bdate, service_charge_pct) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    type, type === 'dine' ? table_id : null, covers, customer_id || null, staff.id, now(), bdate(), +settings().service_charge_pct || 0).id;
  return loadOrder(id);
}

const mustBeOpen = o => { if (o.status !== 'open') fail(409, o.status === 'billed' ? 'Bill already printed. Reopen the order to change it.' : 'Order is closed'); };

export function addLine(orderId, { item_id, qty = 1, note = '', name, price }, staff) {
  return tx(() => {
    const o = get('SELECT * FROM orders WHERE id = ?', orderId);
    if (!o) fail(404, 'Order not found');
    mustBeOpen(o);
    const it = get(`SELECT i.*, t.kind tax_kind, t.rate tax_rate, c.station cat_station, c.name cat_name FROM items i
                    LEFT JOIN taxes t ON t.id = i.tax_id LEFT JOIN categories c ON c.id = i.category_id WHERE i.id = ?`, item_id);
    if (!it) fail(404, 'Item not found');
    if (!it.available) fail(409, `${it.name} is marked unavailable`);
    const k = it.prep ? { prep: it.prep, prep_min: it.prep_min || 6, course: it.course >= 0 ? it.course : 1 } : prepFor(it.name, it.cat_name || '', it.station || it.cat_station || '');
    const same = get("SELECT * FROM order_lines WHERE order_id = ? AND item_id = ? AND status = 'new' AND note = ? AND price = ?",
      orderId, item_id, note, price ?? it.price);
    if (same) run('UPDATE order_lines SET qty = qty + ? WHERE id = ?', qty, same.id);
    else run(`INSERT INTO order_lines (order_id, item_id, name, qty, price, tax_kind, tax_rate, hsn, station, note, added_by, added_at, prep, prep_min, course)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      orderId, it.id, name || it.name, qty, price ?? it.price, it.tax_kind || 'GST', it.tax_rate ?? 5, it.hsn || '',
      it.station || it.cat_station || 'kitchen', note, staff.id, now(), k.prep, k.prep_min, k.course);
    return loadOrder(orderId);
  });
}

export function updateLine(orderId, lineId, patch, staff, mayReprice) {
  return tx(() => {
    const o = get('SELECT * FROM orders WHERE id = ?', orderId);
    mustBeOpen(o);
    const l = get('SELECT * FROM order_lines WHERE id = ? AND order_id = ?', lineId, orderId);
    if (!l) fail(404, 'Line not found');
    if (l.status !== 'new') fail(409, 'This item has already gone to the kitchen. Void it instead.');
    if (patch.qty !== undefined && +patch.qty <= 0) { run('DELETE FROM order_lines WHERE id = ?', lineId); return loadOrder(orderId); }
    if (patch.price !== undefined && +patch.price !== l.price) {
      if (!mayReprice) fail(403, 'Changing a price needs a manager');
      audit(staff.id, 'price_override', { order: orderId, item: l.name, from: l.price, to: +patch.price });
    }
    run('UPDATE order_lines SET qty = ?, note = ?, price = ? WHERE id = ?',
      patch.qty ?? l.qty, patch.note ?? l.note, patch.price ?? l.price, lineId);
    return loadOrder(orderId);
  });
}

// ---------- stock ----------
function consume(line, sign, type, staffId) {
  for (const r of all('SELECT r.stock_id, r.qty, s.cost FROM recipes r JOIN stock_items s ON s.id = r.stock_id WHERE r.item_id = ?', line.item_id)) {
    const q = sign * r.qty * line.qty;
    run('UPDATE stock_items SET qty = qty + ? WHERE id = ?', q, r.stock_id);
    run('INSERT INTO stock_moves (stock_id, qty, type, ref, note, cost, staff_id, at, bdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      r.stock_id, q, type, `order ${line.order_id}`, `${line.qty} x ${line.name}`, r.cost, staffId, now(), bdate());
  }
}

/** Send every unsent line to its station; one KOT number per station per send. Returns print results. */
export async function sendKot(orderId, staff, { fire = false } = {}) {
  const jobs = tx(() => {
    const o = loadOrder(orderId);
    const fresh = o.lines.filter(l => l.status === 'new');
    if (!fresh.length) return [];
    const byStation = {};
    for (const l of fresh) (byStation[l.station] ||= []).push(l);
    const out = [];
    for (const [station, lines] of Object.entries(byStation)) {
      const kotNo = nextNumber('KOT', bdate());
      for (const l of lines) {
        const hold = !fire && holdFor(o, l, fresh) ? 1 : 0;   // later courses wait for the earlier ones (dine-in only)
        run("UPDATE order_lines SET status = 'sent', kot_no = ?, sent_at = ?, hold = ?, fired_at = ? WHERE id = ?", kotNo, now(), hold, hold ? null : now(), l.id);
        consume(l, -1, 'sale', staff.id);
      }
      out.push({ station, blocks: kotDoc({ order: o, lines, kotNo, station, table: o.table, staff }) });
    }
    return out;
  });
  return printAll(jobs);
}

async function printAll(jobs) {
  const results = [];
  const st = settings();
  for (const j of jobs) {
    // Paper only if the owner wants it, or the screen for this station has gone quiet and a real printer is set up.
    const pm = st.printers?.[j.station]?.mode;
    const fallback = !st.print_kot && st.kds_fallback_print !== false && (pm === 'network' || pm === 'system') && !screenFor(j.station);
    if (!st.print_kot && !fallback) continue;
    try { results.push({ station: j.station, fallback, ...(await dispatch(j.station, j.blocks)) }); }
    catch (e) { results.push({ station: j.station, fallback, error: e.message, browser: true, blocks: j.blocks }); }
  }
  return results;
}

export async function voidLine(orderId, lineId, { reason, wasted }, staff) {
  if (!reason) fail(400, 'Give a reason for the void');
  const job = tx(() => {
    const o = loadOrder(orderId);
    mustBeOpen(o);
    const l = o.lines.find(x => x.id === +lineId);
    if (!l || l.status === 'void') fail(404, 'Line not found');
    if (l.status === 'new') { run('DELETE FROM order_lines WHERE id = ?', l.id); return null; }
    run("UPDATE order_lines SET status = 'void', void_reason = ?, voided_by = ?, wasted = ?, voided_at = ? WHERE id = ?", reason, staff.id, wasted ? 1 : 0, now(), l.id);
    consume(l, +1, 'void-return', staff.id);
    if (wasted) consume(l, -1, 'waste', staff.id);
    audit(staff.id, 'void_item', { order: orderId, item: l.name, qty: l.qty, reason, wasted: !!wasted });
    return { station: l.station, blocks: kotDoc({ order: o, lines: [{ ...l, void_reason: reason }], kotNo: l.kot_no, station: l.station, table: o.table, staff, voided: true }) };
  });
  const prints = job ? await printAll([job]) : [];
  return { order: loadOrder(orderId), prints };
}

/** Number the invoices (GST series and VAT series) and lock the order. Idempotent. */
export function billOrder(orderId, staff) {
  return tx(() => {
    const o = loadOrder(orderId);
    if (o.status === 'billed' || o.status === 'paid') return o;
    if (o.status !== 'open') fail(409, 'Order is closed');
    if (o.lines.some(l => l.status === 'new')) fail(409, 'Send the KOT first');
    if (!o.bill.invoices.length) fail(409, 'Nothing to bill');
    const s = settings();
    const date = now(), bd = bdate(), period = fy(date.slice(0, 10));
    for (const inv of o.bill.invoices) {
      const prefix = inv.series === 'VAT' ? s.vat_prefix : s.gst_prefix;
      const n = nextNumber(`INV-${inv.series}`, period);
      const invoiceNo = `${prefix}/${period}/${String(n).padStart(5, '0')}`;
      const cust = o.customer || {};
      run(`INSERT INTO invoices (order_id, series, number, fy, invoice_no, date, bdate, customer_name, customer_gstin, customer_address,
             subtotal, discount, service_charge, taxable, cgst, sgst, vat, round_off, total, data)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        o.id, inv.series, n, period, invoiceNo, date, bd, cust.name || '', cust.gstin || '', cust.address || '',
        inv.subtotal, inv.discount, inv.serviceCharge, inv.taxableValue, inv.cgst, inv.sgst, inv.vat, inv.roundOff, inv.total,
        JSON.stringify(inv));
    }
    run("UPDATE orders SET status = 'billed', billed_at = ?, bdate = ?, total = ? WHERE id = ?", date, bd, o.bill.total, o.id);
    audit(staff.id, 'bill', { order: o.id, total: o.bill.total });
    return loadOrder(orderId);
  });
}

export function invoiceView(o) {
  return o.invoices.filter(i => !i.cancelled).map(i => ({ ...i.data, invoice_no: i.invoice_no, date: i.date,
    customer_name: i.customer_name, customer_gstin: i.customer_gstin, customer_address: i.customer_address }));
}

export async function printBill(orderId, staff, { reprint = false, drawer = false } = {}) {
  const o = loadOrder(orderId);
  const preview = o.status === 'open';
  const invoices = preview ? o.bill.invoices : invoiceView(o);
  const blocks = billDoc({ order: o, invoices, payments: o.payments, table: o.table, staff: o.staff, customer: o.customer,
    preview, copyLabel: reprint ? 'DUPLICATE' : '' });
  if (reprint) audit(staff.id, 'reprint', { order: o.id });
  try { return await dispatch('bill', blocks, { drawer }); }
  catch (e) { return { error: e.message, browser: true, blocks }; }
}

export function reopenOrder(orderId, reason, staff) {
  if (!reason) fail(400, 'Give a reason');
  return tx(() => {
    const o = loadOrder(orderId);
    if (o.status !== 'billed') fail(409, 'Only a billed, unpaid order can be reopened');
    if (o.payments.length) fail(409, 'Payments already taken. Refund them first.');
    run("UPDATE invoices SET cancelled = 1, cancel_reason = ?, cancelled_at = ? WHERE order_id = ? AND cancelled = 0", `Reopened: ${reason}`, now(), o.id);
    run("UPDATE orders SET status = 'open', billed_at = NULL WHERE id = ?", o.id);
    audit(staff.id, 'reopen', { order: o.id, reason, invoices: o.invoices.map(i => i.invoice_no) });
    return loadOrder(orderId);
  });
}

/** Take payment(s). Bills the order first if needed. Cash over the amount due is returned as change. */
export function payOrder(orderId, payments, staff) {
  return tx(() => {
    let o = loadOrder(orderId);
    if (o.status === 'open') o = billOrder(orderId, staff);
    if (o.status !== 'billed') fail(409, 'Order is not awaiting payment');
    let due = o.due;
    const list = payments.filter(p => +p.amount > 0);
    if (!list.length) fail(400, 'Enter an amount');
    // non-cash first, so cash absorbs any change
    list.sort((a, b) => (a.mode === 'cash') - (b.mode === 'cash'));
    for (const p of list) {
      const tendered = r2(+p.amount);
      let amount = tendered;
      if (amount > due + 0.004) {
        if (p.mode !== 'cash') fail(400, `${p.mode.toUpperCase()} amount is more than the balance due (${due})`);
        amount = due;
      }
      if (amount <= 0) continue;
      run('INSERT INTO payments (order_id, mode, amount, tendered, ref, at, bdate, staff_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        o.id, p.mode, amount, p.mode === 'cash' ? tendered : null, p.ref || '', now(), bdate(), staff.id);
      due = r2(due - amount);
    }
    if (due <= 0.004) {
      run("UPDATE orders SET status = 'paid', closed_at = ? WHERE id = ?", now(), o.id);
      if (o.customer_id) run('UPDATE customers SET visits = visits + 1, spend = spend + ?, last_visit = ? WHERE id = ?', o.bill.total, now(), o.customer_id);
    }
    return loadOrder(orderId);
  });
}

export function cancelOrder(orderId, { reason, wasted }, staff) {
  if (!reason) fail(400, 'Give a reason');
  return tx(() => {
    const o = loadOrder(orderId);
    if (!['open', 'billed'].includes(o.status)) fail(409, 'Order is closed');
    if (o.payments.length) fail(409, 'Payments already taken. Refund them first.');
    for (const l of o.lines.filter(x => x.status === 'sent' || x.status === 'ready' || x.status === 'served')) {
      consume(l, +1, 'void-return', staff.id);
      if (wasted) consume(l, -1, 'waste', staff.id);
    }
    run("UPDATE order_lines SET status = 'void', void_reason = ?, voided_by = ? WHERE order_id = ? AND status != 'void'", reason, staff.id, o.id);
    run("UPDATE invoices SET cancelled = 1, cancel_reason = ?, cancelled_at = ? WHERE order_id = ? AND cancelled = 0", `Order cancelled: ${reason}`, now(), o.id);
    run("UPDATE orders SET status = 'void', void_reason = ?, closed_at = ? WHERE id = ?", reason, now(), o.id);
    audit(staff.id, 'cancel_order', { order: o.id, reason, value: o.bill.total });
    return loadOrder(orderId);
  });
}
