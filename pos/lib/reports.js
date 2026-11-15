// Reports. Each returns {title, columns:[{k, label, t:'money'|'num'|'text'}], rows, note?}.
// Sales are counted on the trading day (bdate) of the invoice; cancelled invoices are excluded except where listed.
import { all, get } from './db.js';
import { settings } from './core.js';
import { r2 } from '../public/calc.js';

const C = (k, label, t = 'text') => ({ k, label, t });
/** Timestamp bounds for trading days from..to (a trading day runs from day_start_hour to day_start_hour). */
function span(from, to) {
  const h = String(+settings().day_start_hour || 0).padStart(2, '0');
  const d = new Date(to + 'T12:00:00'); d.setDate(d.getDate() + 1);
  const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return [`${from} ${h}:00:00`, `${next} ${h}:00:00`];
}
const INV = 'cancelled = 0 AND bdate BETWEEN ? AND ?';

export const REPORTS = {
  daily: ['Daily revenue', (f, t) => ({
    columns: [C('bdate', 'Day'), C('orders', 'Orders', 'num'), C('covers', 'Covers', 'num'), C('subtotal', 'Gross', 'money'),
      C('discount', 'Discount', 'money'), C('taxable', 'Taxable', 'money'), C('cgst', 'CGST', 'money'), C('sgst', 'SGST', 'money'),
      C('vat', 'VAT', 'money'), C('total', 'Net sales', 'money'), C('collected', 'Collected', 'money'), C('expenses', 'Expenses', 'money')],
    rows: all(`SELECT i.bdate, COUNT(DISTINCT i.order_id) orders,
                 (SELECT COALESCE(SUM(covers),0) FROM orders o WHERE o.bdate = i.bdate AND o.status IN ('billed','paid')) covers,
                 SUM(subtotal) subtotal, SUM(discount) discount, SUM(taxable) taxable, SUM(cgst) cgst, SUM(sgst) sgst, SUM(vat) vat, SUM(total) total,
                 (SELECT COALESCE(SUM(amount),0) FROM payments p WHERE p.bdate = i.bdate) collected,
                 (SELECT COALESCE(SUM(amount),0) FROM expenses e WHERE e.date = i.bdate) expenses
               FROM invoices i WHERE ${INV} GROUP BY i.bdate ORDER BY i.bdate`, f, t),
  })],

  items: ['Item sales', (f, t) => ({
    columns: [C('category', 'Category'), C('name', 'Item'), C('qty', 'Qty', 'num'), C('amount', 'Sales (pre-tax, pre-discount)', 'money'), C('share', '% of sales', 'num')],
    rows: share(all(`SELECT c.name category, l.name, SUM(l.qty) qty, SUM(l.qty * l.price) amount
               FROM order_lines l JOIN orders o ON o.id = l.order_id LEFT JOIN items it ON it.id = l.item_id LEFT JOIN categories c ON c.id = it.category_id
               WHERE o.status IN ('billed','paid') AND l.status != 'void' AND o.bdate BETWEEN ? AND ?
               GROUP BY l.item_id, l.name ORDER BY amount DESC`, f, t)),
  })],

  categories: ['Category sales', (f, t) => ({
    columns: [C('category', 'Category'), C('station', 'Station'), C('qty', 'Qty', 'num'), C('amount', 'Sales', 'money'), C('share', '% of sales', 'num')],
    rows: share(all(`SELECT COALESCE(c.name,'(deleted)') category, l.station, SUM(l.qty) qty, SUM(l.qty * l.price) amount
               FROM order_lines l JOIN orders o ON o.id = l.order_id LEFT JOIN items it ON it.id = l.item_id LEFT JOIN categories c ON c.id = it.category_id
               WHERE o.status IN ('billed','paid') AND l.status != 'void' AND o.bdate BETWEEN ? AND ?
               GROUP BY category ORDER BY amount DESC`, f, t)),
  })],

  hourly: ['Sales by hour', (f, t) => ({
    columns: [C('hour', 'Hour'), C('orders', 'Bills', 'num'), C('total', 'Sales', 'money')],
    rows: all(`SELECT substr(date, 12, 2) || ':00' hour, COUNT(DISTINCT order_id) orders, SUM(total) total
               FROM invoices WHERE ${INV} GROUP BY hour ORDER BY hour`, f, t),
  })],

  payments: ['Payments by mode', (f, t) => ({
    columns: [C('bdate', 'Day'), C('mode', 'Mode'), C('count', 'Count', 'num'), C('amount', 'Amount', 'money')],
    rows: all(`SELECT bdate, mode, COUNT(*) count, SUM(amount) amount FROM payments WHERE bdate BETWEEN ? AND ? GROUP BY bdate, mode ORDER BY bdate, mode`, f, t),
  })],

  staff: ['Staff performance', (f, t) => ({
    columns: [C('name', 'Staff'), C('role', 'Role'), C('orders', 'Orders', 'num'), C('covers', 'Covers', 'num'), C('sales', 'Sales', 'money'),
      C('avg', 'Avg bill', 'money'), C('voids', 'Voided items', 'num'), C('hours', 'Hours worked', 'num')],
    rows: all(`SELECT s.name, s.role,
                 (SELECT COUNT(*) FROM orders o WHERE o.staff_id = s.id AND o.status IN ('billed','paid') AND o.bdate BETWEEN ?1 AND ?2) orders,
                 (SELECT COALESCE(SUM(covers),0) FROM orders o WHERE o.staff_id = s.id AND o.status IN ('billed','paid') AND o.bdate BETWEEN ?1 AND ?2) covers,
                 (SELECT COALESCE(SUM(total),0) FROM orders o WHERE o.staff_id = s.id AND o.status IN ('billed','paid') AND o.bdate BETWEEN ?1 AND ?2) sales,
                 (SELECT COUNT(*) FROM order_lines l JOIN orders o ON o.id = l.order_id WHERE l.added_by = s.id AND l.status = 'void' AND o.bdate BETWEEN ?1 AND ?2) voids,
                 (SELECT COALESCE(SUM((julianday(COALESCE(clock_out, datetime('now','localtime'))) - julianday(clock_in)) * 24),0) FROM attendance a
                    WHERE a.staff_id = s.id AND a.clock_in >= ?3 AND a.clock_in < ?4) hours
               FROM staff s WHERE s.active = 1 ORDER BY sales DESC`, f, t, ...span(f, t)).map(r => ({ ...r, avg: r.orders ? r.sales / r.orders : 0, hours: r2(r.hours) })),
  })],

  gst: ['GST summary (GSTR-1 / 3B)', (f, t) => {
    const s = settings();
    const rows = [];
    const b2b = all(`SELECT * FROM invoices WHERE series = 'GST' AND customer_gstin != '' AND ${INV}`, f, t);
    const b2c = all(`SELECT * FROM invoices WHERE series = 'GST' AND customer_gstin = '' AND ${INV}`, f, t);
    for (const [label, list] of [['B2B (customer has GSTIN)', b2b], ['B2C (all other bills)', b2c]]) {
      const byRate = {};
      for (const inv of list) {
        const d = JSON.parse(inv.data);
        for (const g of d.rates || []) {
          const r = byRate[g.rate] ||= { section: label, rate: g.rate, invoices: new Set(), taxable: 0, cgst: 0, sgst: 0 };
          r.invoices.add(inv.id); r.taxable += g.taxable;
          // use the tax exactly as printed on each invoice
          for (const tx of d.taxes || []) if (tx.rate * 2 === g.rate) r[tx.kind.toLowerCase()] += tx.amount;
        }
      }
      for (const r of Object.values(byRate)) rows.push({ ...r, invoices: r.invoices.size, total: r.taxable + r.cgst + r.sgst });
    }
    return {
      columns: [C('section', 'Section'), C('rate', 'GST rate %', 'num'), C('invoices', 'Invoices', 'num'), C('taxable', 'Taxable value', 'money'),
        C('cgst', 'CGST', 'money'), C('sgst', 'SGST', 'money'), C('total', 'Invoice value', 'money')],
      rows,
      note: `Place of supply ${s.state_name} (${s.state_code}), all intra-state. Restaurant service SAC ${s.restaurant_sac} at 5% is without input tax credit. ` +
        (s.gst_scheme === 'composition' ? 'Composition scheme: you pay tax on turnover via CMP-08 and cannot collect GST from guests.' : ''),
    };
  }],

  b2b: ['B2B invoices', (f, t) => ({
    columns: [C('invoice_no', 'Invoice'), C('date', 'Date'), C('customer_gstin', 'Customer GSTIN'), C('customer_name', 'Customer'),
      C('taxable', 'Taxable', 'money'), C('cgst', 'CGST', 'money'), C('sgst', 'SGST', 'money'), C('total', 'Invoice value', 'money')],
    rows: all(`SELECT invoice_no, date, customer_gstin, customer_name, taxable, cgst, sgst, total FROM invoices
               WHERE series = 'GST' AND customer_gstin != '' AND ${INV} ORDER BY id`, f, t),
  })],

  hsn: ['HSN / SAC summary', (f, t) => {
    const m = {};
    for (const inv of all(`SELECT data, series FROM invoices WHERE ${INV}`, f, t)) for (const h of JSON.parse(inv.data).hsn || []) {
      const k = `${inv.series}|${h.hsn}|${h.rate}`;
      const r = m[k] ||= { series: inv.series, hsn: h.hsn || '-', rate: h.rate, qty: 0, taxable: 0, tax: 0 };
      r.qty += h.qty; r.taxable += h.taxable; r.tax = r2(r.tax + h.taxable * h.rate / 100);
    }
    return {
      columns: [C('series', 'Tax'), C('hsn', 'HSN / SAC'), C('rate', 'Rate %', 'num'), C('qty', 'Qty', 'num'), C('taxable', 'Taxable value', 'money'), C('tax', 'Tax', 'money')],
      rows: Object.values(m).sort((a, b) => a.series.localeCompare(b.series) || a.hsn.localeCompare(b.hsn)),
    };
  }],

  documents: ['Documents issued (GSTR-1 table 13)', (f, t) => ({
    columns: [C('series', 'Series'), C('fy', 'FY'), C('from', 'From'), C('to', 'To'), C('issued', 'Issued', 'num'), C('cancelled', 'Cancelled', 'num'), C('net', 'Net issued', 'num')],
    rows: all(`SELECT series, fy, MIN(invoice_no) "from", MAX(invoice_no) "to", COUNT(*) issued, SUM(cancelled) cancelled, COUNT(*) - SUM(cancelled) net
               FROM invoices WHERE bdate BETWEEN ? AND ? GROUP BY series, fy`, f, t),
  })],

  vat: ['VAT register (liquor)', (f, t) => ({
    columns: [C('invoice_no', 'Invoice'), C('date', 'Date'), C('taxable', 'Sale value', 'money'), C('vat', 'VAT', 'money'),
      C('round_off', 'Round off', 'money'), C('total', 'Total', 'money'), C('status', 'Status')],
    rows: all(`SELECT invoice_no, date, taxable, vat, round_off, total, CASE WHEN cancelled THEN 'Cancelled: ' || cancel_reason ELSE '' END status
               FROM invoices WHERE series = 'VAT' AND bdate BETWEEN ? AND ? ORDER BY id`, f, t),
    note: 'Totals in the summary row exclude nothing; filter out cancelled rows before filing.',
  })],

  invoices: ['All invoices', (f, t) => ({
    columns: [C('invoice_no', 'Invoice'), C('date', 'Date'), C('series', 'Tax'), C('order_id', 'Order', 'num'), C('customer_name', 'Customer'),
      C('taxable', 'Taxable', 'money'), C('cgst', 'CGST', 'money'), C('sgst', 'SGST', 'money'), C('vat', 'VAT', 'money'), C('total', 'Total', 'money'), C('status', 'Status')],
    rows: all(`SELECT invoice_no, date, series, order_id, customer_name, taxable, cgst, sgst, vat, total,
                 CASE WHEN cancelled THEN 'Cancelled: ' || cancel_reason ELSE '' END status
               FROM invoices WHERE bdate BETWEEN ? AND ? ORDER BY id`, f, t),
  })],

  purchases: ['Purchases & input tax', (f, t) => ({
    columns: [C('bill_date', 'Bill date'), C('vendor', 'Vendor'), C('gstin', 'Vendor GSTIN'), C('bill_no', 'Bill no'), C('taxable', 'Taxable', 'money'),
      C('tax', 'Tax', 'money'), C('total', 'Total', 'money'), C('paid', 'Paid', 'money'), C('due', 'Due', 'money')],
    rows: all(`SELECT p.bill_date, v.name vendor, v.gstin, p.bill_no, p.taxable, p.tax, p.total,
                 (SELECT COALESCE(SUM(amount),0) FROM vendor_payments vp WHERE vp.purchase_id = p.id) paid
               FROM purchases p LEFT JOIN vendors v ON v.id = p.vendor_id WHERE p.cancelled = 0 AND p.bill_date BETWEEN ? AND ? ORDER BY p.bill_date`, f, t)
      .map(r => ({ ...r, due: r.total - r.paid })),
    note: 'Restaurants on 5% GST cannot claim input tax credit; the tax column is kept for your records and cost.',
  })],

  stock: ['Stock valuation', () => ({
    columns: [C('category', 'Category'), C('name', 'Item'), C('unit', 'Unit'), C('qty', 'On hand', 'num'), C('reorder_level', 'Reorder at', 'num'),
      C('cost', 'Cost / unit', 'money'), C('value', 'Value', 'money'), C('status', 'Status')],
    rows: all('SELECT * FROM stock_items WHERE active = 1 ORDER BY category, name')
      .map(r => ({ ...r, value: Math.max(0, r.qty) * r.cost, status: r.qty <= 0 ? 'OUT' : r.qty <= r.reorder_level ? 'LOW' : '' })),
  })],

  movement: ['Stock movement', (f, t) => ({
    columns: [C('name', 'Item'), C('unit', 'Unit'), C('purchased', 'Purchased', 'num'), C('used', 'Used in sales', 'num'), C('wasted', 'Wasted', 'num'),
      C('adjusted', 'Count / adjust', 'num'), C('used_value', 'Cost of sales', 'money'), C('waste_value', 'Waste cost', 'money'), C('qty', 'On hand now', 'num')],
    rows: all(`SELECT s.name, s.unit, s.qty,
                 SUM(CASE WHEN m.type = 'purchase' THEN m.qty ELSE 0 END) purchased,
                 -SUM(CASE WHEN m.type IN ('sale','void-return') THEN m.qty ELSE 0 END) used,
                 -SUM(CASE WHEN m.type = 'waste' THEN m.qty ELSE 0 END) wasted,
                 SUM(CASE WHEN m.type IN ('adjust','count') THEN m.qty ELSE 0 END) adjusted,
                 -SUM(CASE WHEN m.type IN ('sale','void-return') THEN m.qty * m.cost ELSE 0 END) used_value,
                 -SUM(CASE WHEN m.type = 'waste' THEN m.qty * m.cost ELSE 0 END) waste_value
               FROM stock_items s JOIN stock_moves m ON m.stock_id = s.id
               WHERE COALESCE(m.bdate, substr(m.at,1,10)) BETWEEN ? AND ? GROUP BY s.id ORDER BY used_value DESC`, f, t),
    note: 'A large negative "Count / adjust" means stock went missing between counts (over-pouring, theft or unrecorded waste).',
  })],

  foodcost: ['Menu costing', () => ({
    columns: [C('category', 'Category'), C('name', 'Item'), C('price', 'Price', 'money'), C('cost', 'Recipe cost', 'money'),
      C('pct', 'Cost %', 'num'), C('margin', 'Margin', 'money'), C('flag', '')],
    rows: all(`SELECT c.name category, i.name, i.price, COALESCE((SELECT SUM(r.qty * s.cost) FROM recipes r JOIN stock_items s ON s.id = r.stock_id WHERE r.item_id = i.id), 0) cost
               FROM items i LEFT JOIN categories c ON c.id = i.category_id WHERE i.active = 1 ORDER BY c.sort, i.sort`)
      .map(r => ({ ...r, pct: r.price ? r2(r.cost / r.price * 100) : 0, margin: r.price - r.cost,
        flag: !r.cost ? 'no recipe' : r.cost / r.price > 0.35 ? 'over 35%' : '' })),
    note: 'Cost % uses only the ingredients entered in each recipe, so add the main ingredients to make it meaningful.',
  })],

  voids: ['Voids, cancellations & discounts', (f, t) => ({
    columns: [C('at', 'When'), C('who', 'By'), C('action', 'Action'), C('detail', 'Detail')],
    rows: all(`SELECT a.at, s.name who, a.action, a.detail FROM audit a LEFT JOIN staff s ON s.id = a.staff_id
               WHERE a.action IN ('void_item','cancel_order','reopen','invoice_cancel','discount','price_override','reprint','stock_adjust','refund')
                 AND a.at >= ? AND a.at < ? ORDER BY a.id DESC`, ...span(f, t)),
  })],

  expenses: ['Expenses', (f, t) => ({
    columns: [C('date', 'Date'), C('category', 'Category'), C('paid_to', 'Paid to'), C('mode', 'Mode'), C('amount', 'Amount', 'money'), C('note', 'Note')],
    rows: all('SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date, id', f, t),
  })],

  pnl: ['Profit snapshot', (f, t) => {
    const sales = get(`SELECT COALESCE(SUM(taxable),0) v FROM invoices WHERE ${INV}`, f, t).v;
    const cogs = -get(`SELECT COALESCE(SUM(qty * cost),0) v FROM stock_moves WHERE type IN ('sale','void-return','waste') AND COALESCE(bdate, substr(at,1,10)) BETWEEN ? AND ?`, f, t).v;
    const exp = all('SELECT category, SUM(amount) v FROM expenses WHERE date BETWEEN ? AND ? GROUP BY category', f, t);
    const days = Math.round((new Date(t) - new Date(f)) / 864e5) + 1;
    const salaries = get('SELECT COALESCE(SUM(monthly_salary),0) v FROM staff WHERE active = 1').v * days / 30;
    const rows = [{ line: 'Net sales (ex-tax)', amount: sales }, { line: 'Cost of goods used (from recipes, incl. waste)', amount: -cogs }];
    for (const e of exp) rows.push({ line: `Expense: ${e.category}`, amount: -e.v });
    rows.push({ line: `Salaries (pro-rata, ${days} days)`, amount: -salaries });
    rows.push({ line: 'Operating profit (approx.)', amount: sales - cogs - exp.reduce((a, e) => a + e.v, 0) - salaries });
    for (const r of rows) r.amount = r2(r.amount);
    return { columns: [C('line', 'Line'), C('amount', 'Amount', 'money')], rows, noTotals: true,
      note: 'Rent, utilities and other costs appear only if entered as expenses. Cost of goods relies on recipes being filled in.' };
  }],
};

function share(rows) {
  const tot = rows.reduce((a, r) => a + r.amount, 0) || 1;
  return rows.map(r => ({ ...r, share: r2(r.amount / tot * 100) }));
}

export function runReport(kind, from, to) {
  const r = REPORTS[kind];
  if (!r) return null;
  return { kind, title: r[0], from, to, ...r[1](from, to) };
}
export const reportList = () => Object.entries(REPORTS).map(([k, [title]]) => ({ k, title }));

/** Everything the day-close screen and Z report need for one trading day. */
export function dayFigures(bd) {
  const inv = all('SELECT * FROM invoices WHERE bdate = ?', bd);
  const live = inv.filter(i => !i.cancelled);
  const sum = (k, list = live) => r2(list.reduce((a, i) => a + (i[k] || 0), 0));
  const range = series => {
    const l = inv.filter(i => i.series === series).sort((a, b) => a.number - b.number);
    return { range: l.length ? `${l[0].invoice_no} to ${l[l.length - 1].invoice_no}` : '', total: sum('total', live.filter(i => i.series === series)) };
  };
  const orders = get("SELECT COUNT(*) n, COALESCE(SUM(covers),0) c, COALESCE(SUM(total),0) t FROM orders WHERE bdate = ? AND status IN ('billed','paid')", bd);
  const payments = all('SELECT mode, SUM(amount) amount FROM payments WHERE bdate = ? GROUP BY mode ORDER BY mode', bd);
  const collected = r2(payments.reduce((a, p) => a + p.amount, 0));
  const cashSales = payments.find(p => p.mode === 'cash')?.amount || 0;
  const cashExp = get("SELECT COALESCE(SUM(amount),0) v FROM expenses WHERE date = ? AND mode = 'cash'", bd).v;
  const cashVend = get("SELECT COALESCE(SUM(amount),0) v FROM vendor_payments WHERE date = ? AND mode = 'cash'", bd).v;
  const close = get('SELECT * FROM day_closes WHERE bdate = ?', bd);
  const opening = close ? close.opening_cash : +settings().opening_cash || 0;
  const voids = get("SELECT COUNT(*) n, COALESCE(SUM(l.qty * l.price),0) v FROM order_lines l JOIN orders o ON o.id = l.order_id WHERE l.status = 'void' AND o.bdate = ?", bd);
  const top = all(`SELECT l.name, SUM(l.qty) qty, SUM(l.qty * l.price) amount FROM order_lines l JOIN orders o ON o.id = l.order_id
                   WHERE o.bdate = ? AND o.status IN ('billed','paid') AND l.status != 'void' GROUP BY l.name ORDER BY amount DESC LIMIT 10`, bd);
  const unpaid = get("SELECT COALESCE(SUM(total),0) v FROM orders WHERE bdate = ? AND status = 'billed'", bd).v;
  const openOrders = get("SELECT COUNT(*) n FROM orders WHERE status = 'open'").n;
  return {
    bdate: bd, orders: orders.n, covers: orders.c, avgBill: orders.n ? orders.t / orders.n : 0,
    subtotal: sum('subtotal'), discount: sum('discount'), serviceCharge: sum('service_charge'), taxable: sum('taxable'),
    cgst: sum('cgst'), sgst: sum('sgst'), vat: sum('vat'), roundOff: sum('round_off'), total: sum('total'),
    gst: range('GST'), vat_: range('VAT'),
    cancelled: { count: inv.length - live.length, total: sum('total', inv.filter(i => i.cancelled)) },
    payments, collected, unpaid, openOrders,
    cash: { opening, sales: cashSales, expenses: cashExp, vendors: cashVend, expected: r2(opening + cashSales - cashExp - cashVend), counted: close?.counted_cash ?? null },
    voids: { count: voids.n, value: voids.v }, top, closed: close || null,
  };
}
