// Moves an existing POS database onto the current menu, stock list and recipes (lib/menu-data.js).
// Run once with the server stopped:  node scripts/apply-new-menu.js
//  - backs up the database first
//  - old menu items, categories, stock items and recipes are HIDDEN, not deleted, so past orders, invoices and reports stay correct
//  - items and stock items with the same name are kept (their stock quantity and cost are left alone)
// Safe to run twice.
import { all, get, run, tx, backup } from '../lib/db.js';
import { now, bdate } from '../lib/core.js';
import { CATS, MENU, VENDORS, STOCK, RECIPES } from '../lib/menu-data.js';

console.log('Backup:', backup('before-new-menu'));
const taxId = k => get('SELECT id FROM taxes WHERE ' + (k === 'food' ? "kind = 'GST'" : "kind = 'VAT'") + ' AND active = 1 ORDER BY id LIMIT 1').id;

tx(() => {
  // categories
  const cat = {};
  run('UPDATE categories SET active = 0');
  CATS.forEach(([n, st], i) => {
    const ex = get('SELECT id FROM categories WHERE name = ?', n);
    if (ex) { run('UPDATE categories SET active = 1, station = ?, sort = ? WHERE id = ?', st, i, ex.id); cat[n] = ex.id; }
    else cat[n] = run('INSERT INTO categories (name, station, sort) VALUES (?, ?, ?)', n, st, i).id;
  });

  // menu items
  const item = {}; let added = 0;
  run('UPDATE items SET active = 0');
  MENU.forEach(([c, n, p, v, t, hsn], i) => {
    const h = hsn || (t === 'food' ? '996331' : '2208');
    const ex = get('SELECT id FROM items WHERE name = ?', n);
    if (ex) { run('UPDATE items SET active = 1, category_id = ?, price = ?, tax_id = ?, hsn = ?, veg = ?, sort = ?, station = ? WHERE id = ?', cat[c], p, taxId(t), h, v, i, '', ex.id); item[n] = ex.id; }
    else { item[n] = run('INSERT INTO items (category_id, name, price, tax_id, hsn, veg, sort) VALUES (?, ?, ?, ?, ?, ?, ?)', cat[c], n, p, taxId(t), h, v, i).id; added++; }
  });

  // vendors: the breweries now supply bottles; anyone not listed is hidden
  const ven = [];
  run("UPDATE vendors SET active = 0 WHERE name IN ('Maka Di Brewing')");
  for (const [name, address, supplies, notes] of VENDORS) {
    const ex = get('SELECT id FROM vendors WHERE name = ?', name);
    if (ex) { run('UPDATE vendors SET supplies = ?, notes = ?, active = 1 WHERE id = ?', supplies, notes, ex.id); ven.push(ex.id); }
    else ven.push(run('INSERT INTO vendors (name, address, supplies, notes) VALUES (?, ?, ?, ?)', name, address, supplies, notes).id);
  }

  // stock items
  const st = {}; let newStock = 0;
  run('UPDATE stock_items SET active = 0');
  for (const [n, c, u, q, cost, v] of STOCK) {
    const ex = get('SELECT id FROM stock_items WHERE name = ?', n);
    const vid = v == null ? null : ven[v];
    if (ex) { run('UPDATE stock_items SET active = 1, category = ?, unit = ?, reorder_level = ?, par_level = ?, vendor_id = COALESCE(?, vendor_id) WHERE id = ?', c, u, q / 2, q, vid, ex.id); st[n] = ex.id; }
    else {
      st[n] = run('INSERT INTO stock_items (name, category, unit, qty, reorder_level, par_level, cost, vendor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', n, c, u, q, q / 2, q, cost, vid).id;
      run("INSERT INTO stock_moves (stock_id, qty, type, note, cost, at, bdate) VALUES (?, ?, 'opening', 'Opening stock, new menu', ?, ?, ?)", st[n], q, cost, now(), bdate());
      newStock++;
    }
  }

  // recipes for every item on the new menu
  for (const id of Object.values(item)) run('DELETE FROM recipes WHERE item_id = ?', id);
  for (const [i, s, q] of RECIPES) {
    if (!item[i] || !st[s]) throw new Error(`Recipe refers to something missing: ${i} / ${s}`);
    run('INSERT INTO recipes (item_id, stock_id, qty) VALUES (?, ?, ?)', item[i], st[s], q);
  }
  // clear any kitchen-screen settings the old names left behind; lib/kds.js fills them in on the next start
  run("UPDATE items SET prep = NULL WHERE active = 1 AND id IN (" + Object.values(item).join(',') + ')');
  console.log(`Menu: ${MENU.length} items (${added} new). Stock: ${STOCK.length} items (${newStock} new). Recipes: ${RECIPES.length} lines.`);
});
console.log('Done. Start the POS as usual.');
