// SQLite storage (Node's built-in node:sqlite, so there is nothing to install).
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export const DATA_DIR = process.env.POS_DATA || path.join(import.meta.dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
export const DB_FILE = path.join(DATA_DIR, 'pos.db');

export const db = new DatabaseSync(DB_FILE);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS series (name TEXT, period TEXT, next INTEGER, PRIMARY KEY (name, period));

CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, pin_hash TEXT NOT NULL,
  phone TEXT DEFAULT '', monthly_salary REAL DEFAULT 0, joined TEXT DEFAULT '', active INTEGER DEFAULT 1,
  created_at TEXT);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, staff_id INTEGER, created_at TEXT, expires_at TEXT);
CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY, staff_id INTEGER, clock_in TEXT, clock_out TEXT, note TEXT DEFAULT '');

CREATE TABLE IF NOT EXISTS taxes (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL CHECK (kind IN ('GST','VAT','NONE')),
  rate REAL NOT NULL DEFAULT 0, hsn TEXT DEFAULT '', active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, station TEXT DEFAULT 'kitchen', sort INTEGER DEFAULT 0, color TEXT DEFAULT '', active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY, category_id INTEGER REFERENCES categories(id), name TEXT NOT NULL, code TEXT DEFAULT '',
  price REAL NOT NULL, tax_id INTEGER REFERENCES taxes(id), hsn TEXT DEFAULT '', veg INTEGER DEFAULT 1,
  available INTEGER DEFAULT 1, station TEXT DEFAULT '', sort INTEGER DEFAULT 0, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS recipes (item_id INTEGER, stock_id INTEGER, qty REAL, PRIMARY KEY (item_id, stock_id));

CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, contact TEXT DEFAULT '', phone TEXT DEFAULT '', email TEXT DEFAULT '',
  gstin TEXT DEFAULT '', address TEXT DEFAULT '', supplies TEXT DEFAULT '', terms_days INTEGER DEFAULT 0,
  notes TEXT DEFAULT '', active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS stock_items (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT DEFAULT '', unit TEXT NOT NULL DEFAULT 'kg',
  qty REAL DEFAULT 0, reorder_level REAL DEFAULT 0, par_level REAL DEFAULT 0, cost REAL DEFAULT 0,
  vendor_id INTEGER, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS stock_moves (
  id INTEGER PRIMARY KEY, stock_id INTEGER, qty REAL, type TEXT, ref TEXT DEFAULT '', note TEXT DEFAULT '',
  cost REAL DEFAULT 0, staff_id INTEGER, at TEXT, bdate TEXT);
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY, vendor_id INTEGER, bill_no TEXT DEFAULT '', bill_date TEXT, taxable REAL DEFAULT 0,
  tax REAL DEFAULT 0, total REAL DEFAULT 0, notes TEXT DEFAULT '', staff_id INTEGER, created_at TEXT, cancelled INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS purchase_lines (
  id INTEGER PRIMARY KEY, purchase_id INTEGER, stock_id INTEGER, qty REAL, rate REAL, tax_rate REAL DEFAULT 0,
  taxable REAL, tax REAL);
CREATE TABLE IF NOT EXISTS vendor_payments (
  id INTEGER PRIMARY KEY, vendor_id INTEGER, purchase_id INTEGER, amount REAL, mode TEXT, ref TEXT DEFAULT '',
  date TEXT, staff_id INTEGER, at TEXT);

CREATE TABLE IF NOT EXISTS tables (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, area TEXT DEFAULT 'Inside', seats INTEGER DEFAULT 4, sort INTEGER DEFAULT 0, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY, name TEXT DEFAULT '', phone TEXT DEFAULT '', email TEXT DEFAULT '', gstin TEXT DEFAULT '',
  address TEXT DEFAULT '', notes TEXT DEFAULT '', visits INTEGER DEFAULT 0, spend REAL DEFAULT 0, last_visit TEXT, created_at TEXT);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY, type TEXT DEFAULT 'dine', table_id INTEGER, covers INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open', customer_id INTEGER, staff_id INTEGER, opened_at TEXT, billed_at TEXT, closed_at TEXT,
  bdate TEXT, discount_type TEXT DEFAULT '', discount_value REAL DEFAULT 0, discount_reason TEXT DEFAULT '',
  service_charge_pct REAL DEFAULT 0, note TEXT DEFAULT '', void_reason TEXT DEFAULT '', total REAL DEFAULT 0);
CREATE TABLE IF NOT EXISTS order_lines (
  id INTEGER PRIMARY KEY, order_id INTEGER, item_id INTEGER, name TEXT, qty REAL, price REAL,
  tax_kind TEXT, tax_rate REAL, hsn TEXT, station TEXT, note TEXT DEFAULT '', status TEXT DEFAULT 'new',
  kot_no INTEGER, added_by INTEGER, added_at TEXT, sent_at TEXT, ready_at TEXT,
  void_reason TEXT DEFAULT '', voided_by INTEGER, wasted INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY, order_id INTEGER, series TEXT, number INTEGER, fy TEXT, invoice_no TEXT UNIQUE,
  date TEXT, bdate TEXT, customer_name TEXT DEFAULT '', customer_gstin TEXT DEFAULT '', customer_address TEXT DEFAULT '',
  subtotal REAL, discount REAL, service_charge REAL, taxable REAL, cgst REAL, sgst REAL, vat REAL,
  round_off REAL, total REAL, data TEXT, cancelled INTEGER DEFAULT 0, cancel_reason TEXT DEFAULT '', cancelled_at TEXT);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY, order_id INTEGER, mode TEXT, amount REAL, tendered REAL, ref TEXT DEFAULT '',
  at TEXT, bdate TEXT, staff_id INTEGER);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY, date TEXT, category TEXT, amount REAL, mode TEXT DEFAULT 'cash', paid_to TEXT DEFAULT '',
  note TEXT DEFAULT '', staff_id INTEGER, at TEXT);
CREATE TABLE IF NOT EXISTS day_closes (
  bdate TEXT PRIMARY KEY, opening_cash REAL, expected_cash REAL, counted_cash REAL, difference REAL,
  notes TEXT DEFAULT '', data TEXT, staff_id INTEGER, at TEXT);
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, at TEXT, staff_id INTEGER, action TEXT, detail TEXT);

CREATE INDEX IF NOT EXISTS ix_lines_order ON order_lines(order_id);
CREATE INDEX IF NOT EXISTS ix_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS ix_orders_bdate ON orders(bdate);
CREATE INDEX IF NOT EXISTS ix_inv_bdate ON invoices(bdate);
CREATE INDEX IF NOT EXISTS ix_pay_bdate ON payments(bdate);
CREATE INDEX IF NOT EXISTS ix_moves_stock ON stock_moves(stock_id, at);
`;
db.exec(SCHEMA);

export const all = (sql, ...p) => db.prepare(sql).all(...p);
export const get = (sql, ...p) => db.prepare(sql).get(...p);
export const run = (sql, ...p) => {
  const r = db.prepare(sql).run(...p);
  return { changes: Number(r.changes), id: Number(r.lastInsertRowid) };
};

let depth = 0;
export function tx(fn) {
  if (depth) return fn();
  db.exec('BEGIN IMMEDIATE');
  depth++;
  try {
    const r = fn();
    db.exec('COMMIT');
    return r;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  } finally {
    depth--;
  }
}

/** Atomically take the next number in a series (invoice numbers per FY, KOT numbers per day). */
export function nextNumber(name, period) {
  const row = get('SELECT next FROM series WHERE name = ? AND period = ?', name, period);
  const n = row ? row.next : 1;
  if (row) run('UPDATE series SET next = ? WHERE name = ? AND period = ?', n + 1, name, period);
  else run('INSERT INTO series (name, period, next) VALUES (?, ?, ?)', name, period, n + 1);
  return n;
}

export function backup(label = '') {
  const dir = path.join(DATA_DIR, 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const file = path.join(dir, `pos-${stamp}${label ? '-' + label : ''}.db`);
  db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  // keep the latest 60
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.db')).sort();
  for (const f of files.slice(0, Math.max(0, files.length - 60))) fs.unlinkSync(path.join(dir, f));
  return file;
}
