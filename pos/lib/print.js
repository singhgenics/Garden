// Receipts, KOTs and reports as printer-neutral "blocks", plus an ESC/POS encoder.
//
// Each doc is a list of blocks: {t:text, a:'l'|'c'|'r', b:bold, s:2 (double size)}, {hr:'-'}, {feed:n},
// {cut:true}, {drawer:true}. The same blocks either go to a thermal printer as ESC/POS bytes
// (LAN printer on port 9100, or a USB printer shared as a system queue) or are rendered by the
// browser in a monospace receipt page and printed through the normal print dialog.
import net from 'node:net';
import { spawn } from 'node:child_process';
import { settings } from './core.js';

const money = n => (Math.round(n * 100) / 100).toFixed(2);
// Thermal printers' code pages have no ₹ or accents, so fold text to ASCII.
export const ascii = s => String(s ?? '')
  .replace(/₹/g, 'Rs.').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/×/g, 'x').replace(/·/g, '-')
  .normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '');

function wrap(text, w) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      if (!line) line = word;
      else if ((line + ' ' + word).length <= w) line += ' ' + word;
      else { out.push(line); line = word; }
      while (line.length > w) { out.push(line.slice(0, w)); line = line.slice(w); }
    }
    out.push(line);
  }
  return out;
}
const lr = (l, r, w) => { l = String(l); r = String(r); const sp = w - l.length - r.length; return sp >= 1 ? l + ' '.repeat(sp) + r : l.slice(0, w - r.length - 1) + ' ' + r; };

class Doc {
  constructor(width) { this.w = width; this.blocks = []; }
  text(t, o = {}) { const w = o.s === 2 ? Math.floor(this.w / 2) : this.w; for (const l of wrap(ascii(t), w)) this.blocks.push({ t: l, ...o }); return this; }
  c(t, o = {}) { return this.text(t, { ...o, a: 'c' }); }
  lr(l, r, o = {}) { const w = o.s === 2 ? Math.floor(this.w / 2) : this.w; this.blocks.push({ t: lr(ascii(l), ascii(r), w), ...o }); return this; }
  hr(ch = '-') { this.blocks.push({ hr: ch }); return this; }
  feed(n = 1) { this.blocks.push({ feed: n }); return this; }
  cut() { this.blocks.push({ cut: true }); return this; }
  drawer() { this.blocks.push({ drawer: true }); return this; }
  /** Item table: name wraps in the first column, qty / rate / amount right-aligned. */
  itemRow(name, qty, rate, amt) {
    const W = this.w, cq = 5, cr = 9, ca = 10, cn = W - cq - cr - ca;
    const names = wrap(ascii(name), cn);
    const tail = String(qty).padStart(cq) + String(rate).padStart(cr) + String(amt).padStart(ca);
    this.blocks.push({ t: names[0].padEnd(cn) + tail });
    for (const n of names.slice(1)) this.blocks.push({ t: '  ' + n });
    return this;
  }
}

function header(d, s) {
  d.c(s.business_name, { b: 1, s: 2 });
  if (s.legal_name && s.legal_name !== s.business_name) d.c(s.legal_name);
  if (s.address) d.c(s.address);
  if (s.phone) d.c(`Ph: ${s.phone}`);
}

/** GST tax invoice + VAT (liquor) invoice for one order. */
export function billDoc({ order, invoices, payments, table, staff, customer, preview, copyLabel }) {
  const s = settings();
  const d = new Doc(s.printers.bill.width || 48);
  const composition = s.gst_scheme === 'composition';
  const paid = payments?.reduce((a, p) => a + p.amount, 0) || 0;
  invoices.forEach((inv, i) => {
    header(d, s);
    if (inv.series === 'GST') {
      if (s.gstin) d.c(`GSTIN: ${s.gstin}`);
    } else {
      if (s.vat_tin) d.c(`VAT TIN: ${s.vat_tin}`);
      if (s.excise_licence) d.c(`Excise licence: ${s.excise_licence}`);
    }
    if (s.fssai) d.c(`FSSAI Lic. No: ${s.fssai}`);
    d.hr('=');
    const title = preview ? 'PRO-FORMA - NOT A TAX INVOICE'
      : inv.series === 'VAT' ? 'VAT INVOICE (LIQUOR)' : composition ? 'BILL OF SUPPLY' : 'TAX INVOICE';
    d.c(title, { b: 1 });
    if (copyLabel) d.c(copyLabel);
    if (inv.cancelled) d.c('*** CANCELLED ***', { b: 1 });
    d.hr();
    if (inv.invoice_no) d.lr(`Inv: ${inv.invoice_no}`, inv.date ? fmtDT(inv.date) : '');
    else d.lr(`Order #${order.id}`, fmtDT(new Date()));
    const where = order.type === 'dine' ? `Table ${table?.name || '-'}${order.covers ? ` / ${order.covers} pax` : ''}`
      : order.type === 'takeaway' ? 'Takeaway' : 'Delivery';
    d.lr(where, `Order #${order.id}`);
    if (staff) d.text(`Served by: ${staff.name}`);
    const cust = inv.customer_name ? { name: inv.customer_name, gstin: inv.customer_gstin, address: inv.customer_address } : customer;
    if (cust && (cust.name || cust.gstin)) {
      d.text(`Customer: ${cust.name || ''}${cust.phone ? ' ' + cust.phone : ''}`);
      if (cust.gstin && inv.series === 'GST') d.text(`Customer GSTIN: ${cust.gstin}`);
      if (cust.address && cust.gstin) d.text(cust.address);
    }
    d.hr();
    const inclusiveView = s.bill_tax_display === 'inclusive' && inv.inclusive;
    d.itemRow('Item', 'Qty', 'Rate', 'Amount');
    d.hr();
    if (inclusiveView) {
      // Prices shown with their tax already in; one footnote carries the breakup the GST/VAT rules require.
      const v = inv.inclusive;
      for (const it of v.items) d.itemRow(it.name, fmtQty(it.qty), money(it.price), money(it.amount));
      d.hr();
      if (v.discount || v.serviceCharge || v.roundOff) d.lr('Sub total', money(v.subtotal));
      if (v.discount) d.lr('Discount', '-' + money(v.discount));
      if (v.serviceCharge) d.lr('Service charge (optional)', money(v.serviceCharge));
      if (v.roundOff) d.lr('Round off', (v.roundOff > 0 ? '+' : '') + money(v.roundOff));
      d.hr();
      d.lr('TOTAL', 'Rs. ' + money(inv.total), { b: 1, s: 2 });
      d.hr();
      if (inv.taxes.length) {
        d.text(`All prices include ${inv.series === 'VAT' ? 'VAT' : 'GST'}. Taxable value ${money(inv.taxableValue)}; ` +
          inv.taxes.map(t => `${t.kind} ${t.rate}% ${money(t.amount)}`).join(', ') + '.');
      }
    } else {
      for (const it of inv.items) d.itemRow(it.name, fmtQty(it.qty), money(it.price), money(it.amount));
      d.hr();
      d.lr(s.prices_include_tax ? 'Sub total (incl. tax)' : 'Sub total', money(inv.subtotal));
      if (inv.discount) d.lr('Discount', '-' + money(inv.discount));
      if (inv.serviceCharge) d.lr('Service charge (optional)', money(inv.serviceCharge));
      if (inv.taxes.length || inv.discount || inv.serviceCharge) d.lr('Taxable value', money(inv.taxableValue));
      for (const t of inv.taxes) d.lr(t.label, money(t.amount));
      if (inv.roundOff) d.lr('Round off', (inv.roundOff > 0 ? '+' : '') + money(inv.roundOff));
      d.hr();
      d.lr('TOTAL', 'Rs. ' + money(inv.total), { b: 1, s: 2 });
      d.hr();
    }
    if (inv.series === 'GST') {
      if (composition) d.text('Composition taxable person, not eligible to collect tax on supplies.');
      d.text(`SAC ${s.restaurant_sac}: restaurant service. Place of supply: ${s.state_name} (${s.state_code}).`);
      if (!inclusiveView && inv.hsn && inv.hsn.length > 1) {
        d.text('HSN/SAC summary:');
        for (const h of inv.hsn) d.lr(`  ${h.hsn || '-'} @${h.rate}%`, money(h.taxable));
      }
    } else {
      d.text('Alcoholic liquor is outside GST; VAT charged under the Goa VAT Act.');
    }
    if (invoices.length > 1 && i < invoices.length - 1) { d.feed(1).cut(); }
  });
  if (invoices.length > 1) {
    d.hr('=');
    d.lr('PAYABLE', 'Rs. ' + money(invoices.reduce((a, x) => a + x.total, 0)), { b: 1, s: 2 });
    d.text(`(${invoices.map(x => `${x.invoice_no || x.series}: ${money(x.total)}`).join(' + ')})`);
  }
  if (payments?.length) {
    d.hr();
    for (const p of payments) d.lr(`Paid by ${p.mode.toUpperCase()}${p.ref ? ' ' + p.ref : ''}`, money(p.amount));
    const change = payments.reduce((a, p) => a + (p.tendered ? p.tendered - p.amount : 0), 0);
    if (change > 0.004) d.lr('Change returned', money(change));
    const due = invoices.reduce((a, x) => a + x.total, 0) - paid;
    if (due > 0.004) d.lr('Balance due', money(due), { b: 1 });
  }
  d.hr();
  if (s.bill_footer) d.c(s.bill_footer);
  if (!preview) d.c('E. & O.E.');
  d.feed(2).cut();
  return d.blocks;
}

/** Kitchen / bar order ticket. */
export function kotDoc({ order, lines, kotNo, station, table, staff, voided }) {
  const s = settings();
  const d = new Doc((s.printers[station] || s.printers.kitchen).width || 48);
  d.c(voided ? '*** VOID / CANCEL ***' : station === 'bar' ? 'BAR ORDER (BOT)' : 'KITCHEN ORDER (KOT)', { b: 1 });
  d.lr(`KOT #${kotNo}`, fmtDT(new Date()), { b: 1 });
  const where = order.type === 'dine' ? `TABLE ${table?.name || '-'}` : order.type === 'takeaway' ? 'TAKEAWAY' : 'DELIVERY';
  d.lr(where, `Order #${order.id}`, { b: 1, s: 2 });
  if (staff) d.text(`By: ${staff.name}${order.covers ? `   Pax: ${order.covers}` : ''}`);
  d.hr();
  for (const l of lines) {
    d.text(`${fmtQty(l.qty)} x ${l.name}`, { b: 1, s: 2 });
    if (l.note) d.text(`   >> ${l.note}`, { b: 1 });
    if (voided && l.void_reason) d.text(`   reason: ${l.void_reason}`);
  }
  if (order.note) { d.hr(); d.text(`Note: ${order.note}`); }
  d.feed(3).cut();
  return d.blocks;
}

/** End-of-day (Z) report. */
export function zDoc(z) {
  const s = settings();
  const d = new Doc(s.printers.bill.width || 48);
  header(d, s);
  d.hr('=');
  d.c(`DAY CLOSE (Z) REPORT`, { b: 1 });
  d.c(`Trading day ${z.bdate}`);
  d.c(`Printed ${fmtDT(new Date())}${z.by ? ' by ' + z.by : ''}`);
  d.hr();
  d.lr('Orders', z.orders); d.lr('Covers', z.covers); d.lr('Average bill', money(z.avgBill));
  d.hr();
  d.lr('Gross sales', money(z.subtotal));
  d.lr('Discounts', '-' + money(z.discount));
  d.lr('Service charge', money(z.serviceCharge));
  d.lr('Taxable value', money(z.taxable));
  d.lr('CGST', money(z.cgst)); d.lr('SGST', money(z.sgst)); d.lr('VAT (liquor)', money(z.vat));
  d.lr('Round off', money(z.roundOff));
  d.lr('NET SALES', money(z.total), { b: 1 });
  d.hr();
  d.text('Food / soft drinks (GST)', { b: 1 });
  d.lr('  Invoices', z.gst.range || '-'); d.lr('  Total', money(z.gst.total));
  d.text('Liquor (VAT)', { b: 1 });
  d.lr('  Invoices', z.vat_.range || '-'); d.lr('  Total', money(z.vat_.total));
  if (z.cancelled.count) d.lr('Cancelled invoices', `${z.cancelled.count} (${money(z.cancelled.total)})`);
  d.hr();
  d.text('Collections', { b: 1 });
  for (const p of z.payments) d.lr(`  ${p.mode.toUpperCase()}`, money(p.amount));
  d.lr('  Total collected', money(z.collected));
  if (z.unpaid) d.lr('  Billed but unpaid', money(z.unpaid));
  d.hr();
  d.text('Cash drawer', { b: 1 });
  d.lr('  Opening cash', money(z.cash.opening));
  d.lr('  + Cash sales', money(z.cash.sales));
  d.lr('  - Cash expenses', money(z.cash.expenses));
  d.lr('  - Cash paid to vendors', money(z.cash.vendors));
  d.lr('  Expected in drawer', money(z.cash.expected), { b: 1 });
  if (z.cash.counted != null) {
    d.lr('  Counted', money(z.cash.counted));
    d.lr('  Over / (short)', money(z.cash.counted - z.cash.expected), { b: 1 });
  }
  d.hr();
  d.lr('Voided items', `${z.voids.count} (${money(z.voids.value)})`);
  if (z.top?.length) {
    d.text('Top items', { b: 1 });
    for (const t of z.top.slice(0, 10)) d.lr(`  ${t.name}`, `${fmtQty(t.qty)}  ${money(t.amount)}`);
  }
  d.feed(2).cut();
  return d.blocks;
}

export function testDoc(name) {
  const s = settings();
  const d = new Doc(s.printers[name]?.width || 48);
  d.c('PRINTER TEST', { b: 1, s: 2 });
  d.c(`${name} printer - ${fmtDT(new Date())}`);
  d.hr();
  d.text('0123456789'.repeat(5).slice(0, d.w));
  d.lr('Left', 'Right');
  d.text('Bold line', { b: 1 });
  d.feed(2).cut();
  return d.blocks;
}

function fmtDT(x) {
  const d = x instanceof Date ? x : new Date(String(x).replace(' ', 'T'));
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
const fmtQty = q => (Number.isInteger(+q) ? String(+q) : (+q).toFixed(2));

// ---------- ESC/POS ----------
const ESC = 0x1b, GS = 0x1d;
export function escpos(blocks, width = 48) {
  const out = [Buffer.from([ESC, 0x40])]; // initialise
  const push = (...b) => out.push(Buffer.from(b));
  for (const b of blocks) {
    if (b.drawer) { push(ESC, 0x70, 0, 25, 250); continue; }
    if (b.cut) { push(GS, 0x56, 66, 3); continue; }     // feed 3 and partial cut
    if (b.feed) { push(ESC, 0x64, b.feed); continue; }
    if (b.hr) { push(ESC, 0x61, 0); out.push(Buffer.from(b.hr.repeat(width) + '\n', 'ascii')); continue; }
    push(ESC, 0x61, b.a === 'c' ? 1 : b.a === 'r' ? 2 : 0);
    push(ESC, 0x45, b.b ? 1 : 0);
    push(GS, 0x21, b.s === 2 ? 0x11 : 0);
    out.push(Buffer.from(ascii(b.t) + '\n', 'ascii'));
  }
  push(ESC, 0x45, 0, GS, 0x21, 0);
  return Buffer.concat(out);
}

/** Send to a printer. Returns {sent:true} or {browser:true, blocks} when the browser should print it. */
export async function dispatch(printerName, blocks, { drawer = false } = {}) {
  const p = settings().printers[printerName] || settings().printers.bill;
  if (drawer) blocks = [{ drawer: true }, ...blocks];
  if (!p || p.mode === 'browser' || p.mode === 'off') return { browser: p?.mode !== 'off', blocks, width: p?.width || 48 };
  const data = escpos(blocks, p.width || 48);
  if (p.mode === 'network') {
    await new Promise((resolve, reject) => {
      const sock = net.connect({ host: p.host, port: +p.port || 9100 });
      sock.setTimeout(5000);
      sock.on('connect', () => sock.end(data));
      sock.on('close', hadErr => (hadErr ? null : resolve()));
      sock.on('timeout', () => { sock.destroy(); reject(new Error(`Printer ${p.host} timed out`)); });
      sock.on('error', reject);
    });
  } else if (p.mode === 'system') {
    // A USB thermal printer added to macOS/Linux (CUPS) as a raw queue.
    await new Promise((resolve, reject) => {
      const lp = spawn('lp', ['-d', p.queue, '-o', 'raw']);
      lp.on('error', reject);
      lp.on('close', code => (code === 0 ? resolve() : reject(new Error(`lp exited ${code}`))));
      lp.stdin.end(data);
    });
  }
  return { sent: true, printer: printerName };
}
