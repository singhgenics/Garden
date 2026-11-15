// Time, settings, auth and audit helpers.
import crypto from 'node:crypto';
import { all, get, run } from './db.js';

// ---------- time (local clock of the counter PC, which should be set to IST) ----------
const pad = n => String(n).padStart(2, '0');
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const now = () => { const d = new Date(); return `${ymd(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
/** Trading day: sales after midnight but before day_start_hour count to the previous day. */
export const bdate = (d = new Date()) => ymd(new Date(d.getTime() - (+getSetting('day_start_hour') || 0) * 3600e3));
/** Indian financial year (April–March) of a YYYY-MM-DD date, as "26-27". */
export function fy(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  const start = m >= 4 ? y : y - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
}

// ---------- settings ----------
export const DEFAULT_SETTINGS = {
  business_name: 'Cabin East',
  legal_name: '',
  address: 'Shop No. 4, Tulip Residency, Gandaulim, Salcete, Goa',
  phone: '',
  email: '',
  gstin: '',
  fssai: '',
  vat_tin: '',
  excise_licence: '',
  state_name: 'Goa',
  state_code: '30',
  gst_scheme: 'regular',          // 'regular' | 'composition'
  prices_include_tax: false,      // menu says "taxes extra"
  bill_tax_display: 'inclusive',  // 'inclusive': items printed with tax in, one tax footnote · 'itemised': CGST/SGST/VAT lines
  service_charge_pct: 0,          // must be optional for the guest (CCPA guidelines)
  gst_prefix: 'DD',
  vat_prefix: 'DDL',
  restaurant_sac: '996331',
  day_start_hour: 5,
  discount_limit_pct: 10,         // cashiers can discount up to this without a manager PIN
  opening_cash: 2000,
  bill_footer: 'Thank you! Come back soon.',
  printers: {
    bill: { mode: 'browser', host: '', port: 9100, queue: '', width: 48 },
    kitchen: { mode: 'browser', host: '', port: 9100, queue: '', width: 48 },
    bar: { mode: 'browser', host: '', port: 9100, queue: '', width: 48 },
  },
  print_kot: false,               // the kitchen and bar screens replace paper tickets; paper returns only as a fallback (below)
  kds_fallback_print: true,       // print the KOT anyway if a kitchen or bar screen has gone quiet
  kds_course_gap_min: 8,          // minutes after a course is ready before the next one is fired
  kds_hold_max_min: 35,           // a held course always fires after this long
  open_drawer_on_cash: true,
  bill_copies: 1,
};
let cache = null;
export function settings() {
  if (!cache) {
    cache = { ...DEFAULT_SETTINGS };
    for (const r of all('SELECT key, value FROM settings')) {
      try { cache[r.key] = JSON.parse(r.value); } catch { cache[r.key] = r.value; }
    }
  }
  return cache;
}
export const getSetting = k => settings()[k];
export function saveSettings(patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (!(k in DEFAULT_SETTINGS)) continue;
    run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', k, JSON.stringify(v));
  }
  cache = null;
  return settings();
}
export const billOpts = (order) => {
  const s = settings();
  return {
    pricesIncludeTax: !!s.prices_include_tax,
    composition: s.gst_scheme === 'composition',
    discountType: order.discount_type,
    discountValue: order.discount_value,
    serviceChargePct: order.service_charge_pct,
  };
};

// ---------- staff auth ----------
export const ROLES = ['owner', 'manager', 'cashier', 'waiter', 'kitchen'];
export const PERMS = {
  owner: ['*'],
  manager: ['pos', 'bill', 'settle', 'void', 'discount', 'reopen', 'orders', 'kds', 'menu', 'inventory', 'purchases',
    'vendors', 'staff', 'customers', 'expenses', 'reports', 'dayclose', 'settings', 'invoice_cancel', 'dashboard'],
  cashier: ['pos', 'bill', 'settle', 'orders', 'kds', 'customers', 'expenses', 'dayclose', 'dashboard'],
  waiter: ['pos', 'bill', 'kds'],
  kitchen: ['kds'],
};
export const can = (staff, perm) => !!staff && (PERMS[staff.role] || []).some(p => p === '*' || p === perm);

export function hashPin(pin) {
  const salt = crypto.randomBytes(8).toString('hex');
  return `${salt}:${crypto.scryptSync(String(pin), salt, 32, { N: 4096 }).toString('hex')}`;
}
export function checkPin(pin, hash) {
  const [salt, h] = String(hash).split(':');
  const test = crypto.scryptSync(String(pin), salt, 32, { N: 4096 });
  return crypto.timingSafeEqual(test, Buffer.from(h, 'hex'));
}
export function staffByPin(pin, roles) {
  for (const s of all('SELECT * FROM staff WHERE active = 1')) {
    if ((!roles || roles.includes(s.role)) && checkPin(pin, s.pin_hash)) return s;
  }
  return null;
}
export function pinTaken(pin, exceptId = 0) {
  return all('SELECT id, pin_hash FROM staff WHERE active = 1 AND id != ?', exceptId).some(s => checkPin(pin, s.pin_hash));
}
export function newSession(staffId) {
  const token = crypto.randomBytes(24).toString('hex');
  const exp = new Date(Date.now() + 18 * 3600e3);
  run('INSERT INTO sessions (token, staff_id, created_at, expires_at) VALUES (?, ?, ?, ?)', token, staffId, now(), exp.toISOString());
  return token;
}
export function sessionStaff(token) {
  if (!token) return null;
  const s = get(`SELECT st.id, st.name, st.role, se.expires_at FROM sessions se JOIN staff st ON st.id = se.staff_id
                 WHERE se.token = ? AND st.active = 1`, token);
  if (!s || new Date(s.expires_at) < new Date()) return null;
  return { id: s.id, name: s.name, role: s.role };
}
export const publicStaff = s => s && ({ id: s.id, name: s.name, role: s.role, perms: PERMS[s.role] });

export function audit(staffId, action, detail) {
  run('INSERT INTO audit (at, staff_id, action, detail) VALUES (?, ?, ?, ?)', now(), staffId || null,
    action, typeof detail === 'string' ? detail : JSON.stringify(detail));
}

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const fail = (status, msg) => { throw new HttpError(status, msg); };
