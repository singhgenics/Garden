// First-run data: taxes, the Konso menu, tables for the 28-cover plan,
// starter stock items with recipes, and the two craft-beer suppliers (menu, stock and recipes live in menu-data.js).
// Everything is editable in the app.
import { get, run, tx } from './db.js';
import { hashPin, now, bdate } from './core.js';
import { CATS, MENU, VENDORS, STOCK, RECIPES } from './menu-data.js';

export function seedIfEmpty() {
  if (get('SELECT COUNT(*) n FROM staff').n) return false;
  tx(() => {
    run('INSERT INTO staff (name, role, pin_hash, created_at) VALUES (?, ?, ?, ?)', 'Owner', 'owner', hashPin('1234'), now());

    const tax = {};
    tax.food = run("INSERT INTO taxes (name, kind, rate, hsn) VALUES ('GST 5% restaurant service', 'GST', 5, '996331')").id;
    tax.liquor = run("INSERT INTO taxes (name, kind, rate, hsn) VALUES ('VAT on liquor (confirm rate)', 'VAT', 22, '2208')").id;
    tax.exempt = run("INSERT INTO taxes (name, kind, rate, hsn) VALUES ('Nil / exempt', 'NONE', 0, '')").id;

    const cat = {};
    CATS.forEach(([n, st], i) => { cat[n] = run('INSERT INTO categories (name, station, sort) VALUES (?, ?, ?)', n, st, i).id; });

    const item = {};
    MENU.forEach(([c, n, p, v, t, hsn], i) => {
      item[n] = run('INSERT INTO items (category_id, name, price, tax_id, hsn, veg, sort) VALUES (?, ?, ?, ?, ?, ?, ?)',
        cat[c], n, p, tax[t], hsn || (t === 'food' ? '996331' : '2208'), v, i).id;
    });

    const tables = [
      ['W1', 'Window right', 4], ['W2', 'Window right', 4],
      ['S1', 'Sofa left', 2], ['S2', 'Sofa left', 2], ['S3', 'Sofa left', 2],
      ['B1', 'Bar', 1], ['B2', 'Bar', 1], ['B3', 'Bar', 1], ['B4', 'Bar', 1],
      ['G1', 'Garden', 6], ['G2', 'Garden', 2], ['G3', 'Garden', 2],
    ];
    tables.forEach(([n, a, s], i) => run('INSERT INTO tables (name, area, seats, sort) VALUES (?, ?, ?, ?)', n, a, s, i));

    const ven = VENDORS.map(([name, address, supplies, notes]) =>
      run('INSERT INTO vendors (name, address, supplies, notes) VALUES (?, ?, ?, ?)', name, address, supplies, notes).id);

    const st = {};
    for (const [n, c, u, q, cost, v, open] of STOCK) {
      const o = open ?? q;   // opening stock defaults to par; items with nothing bought yet say 0
      st[n] = run('INSERT INTO stock_items (name, category, unit, qty, reorder_level, par_level, cost, vendor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        n, c, u, o, q / 2, q, cost, v == null ? null : ven[v]).id;
      if (o) run("INSERT INTO stock_moves (stock_id, qty, type, note, cost, at, bdate) VALUES (?, ?, 'opening', 'Opening stock', ?, ?, ?)", st[n], o, cost, now(), bdate());
    }
    for (const [i, s, q] of RECIPES) run('INSERT INTO recipes (item_id, stock_id, qty) VALUES (?, ?, ?)', item[i], st[s], q);
  });
  return true;
}
