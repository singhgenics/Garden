// Back-office screens.
import {
  S, esc, money, money0, qty, $, $$, can, GET, POST, PUT, DEL, act, page, go, topbar, toast, modal, formModal, confirmBox,
  table, csv, handlePrint, printBlocks, fmtDate, fmtTime, today, rangePicker, rangeFor,
} from './ui.js';

const reload = async () => { S.boot = await GET('/bootstrap'); };

// ---------- dashboard ----------
page('dashboard', 'dashboard', async (main) => {
  const d = await GET('/dashboard');
  const t = d.today;
  const max = Math.max(1, ...d.last7.map(x => x.total));
  const hmax = Math.max(1, ...d.hourly.map(x => x.total));
  const hours = Array.from({ length: 18 }, (_, i) => (i + 11) % 24);
  main.innerHTML = topbar(`Today · ${fmtDate(d.bdate)}`, `<button class="btn" onclick="location.hash='#/reports'">All reports</button>`) + `
    <div class="cards">
      <div class="card kpi"><div class="l">Net sales today</div><div class="v">${money0(t.total)}</div><div class="small muted">Gross ${money0(t.subtotal)} · tax ${money0(t.cgst + t.sgst + t.vat)}</div></div>
      <div class="card kpi"><div class="l">Bills · guests</div><div class="v">${t.orders} · ${t.covers}</div><div class="small muted">Avg bill ${money0(t.avgBill)}</div></div>
      <div class="card kpi"><div class="l">Collected</div><div class="v">${money0(t.collected)}</div><div class="small muted">${t.payments.map(p => `${p.mode} ${money0(p.amount)}`).join(' · ') || 'No payments yet'}</div></div>
      <div class="card kpi"><div class="l">Open now</div><div class="v">${d.live.n}</div><div class="small muted">${d.live.c} guests seated${t.unpaid ? ` · ${money0(t.unpaid)} billed, unpaid` : ''}</div></div>
      <div class="card kpi"><div class="l">Month to date</div><div class="v">${money0(d.month.total)}</div><div class="small muted">${d.month.bills} bills</div></div>
      <div class="card kpi"><div class="l">Owed to vendors</div><div class="v">${money0(d.vendorDues)}</div><div class="small muted"><a href="#/vendors">See vendors</a></div></div>
    </div>
    <div class="split">
      <div class="card"><h2>Last 14 days</h2><div class="bars-wrap"><div class="bars">${d.last7.map(x => `<div class="b" style="height:${x.total / max * 100}%" title="${fmtDate(x.bdate)}: ${money0(x.total)}"><span>${x.bdate.slice(8)}</span></div>`).join('') || '<p class="muted">No sales yet.</p>'}</div></div></div>
      <div class="card"><h2>Low stock</h2>${d.low.length ? `<ul class="list-plain">${d.low.slice(0, 10).map(s => `<li><span>${esc(s.name)}</span><b class="${s.qty <= 0 ? 'bad' : 'warn'}">${qty(s.qty)} ${esc(s.unit)}</b></li>`).join('')}</ul><a href="#/inventory">Inventory →</a>` : '<p class="muted">All stock above reorder level.</p>'}</div>
    </div>
    <div class="split" style="margin-top:12px">
      <div class="card"><h2>Today by hour</h2><div class="bars-wrap"><div class="bars">${hours.map(h => { const v = d.hourly.find(x => x.h === h)?.total || 0; return `<div class="b" style="height:${v / hmax * 100}%" title="${h}:00 ${money0(v)}"><span>${h}</span></div>`; }).join('')}</div></div></div>
      <div class="card"><h2>Top items today</h2>${t.top.length ? `<ul class="list-plain">${t.top.map(x => `<li><span>${qty(x.qty)} × ${esc(x.name)}</span><span>${money0(x.amount)}</span></li>`).join('')}</ul>` : '<p class="muted">Nothing sold yet.</p>'}
        <h2 style="margin-top:14px">On shift</h2>${d.onShift.length ? `<ul class="list-plain">${d.onShift.map(s => `<li><span>${esc(s.name)} <span class="muted small">${s.role}</span></span><span>since ${fmtTime(s.clock_in)}</span></li>`).join('')}</ul>` : '<p class="muted small">Nobody clocked in.</p>'}</div>
    </div>`;
}, { label: 'Dashboard' });

// ---------- menu ----------
page('menu', 'menu', async (main) => {
  let cat = null;
  const draw = async () => {
    await reload();
    const B = S.boot;
    cat ??= B.categories[0]?.id;
    const taxName = id => B.taxes.find(t => t.id === id)?.name || '-';
    const items = B.items.filter(i => i.category_id === cat);
    main.innerHTML = topbar('Menu', `<button class="btn" id="newCat">+ Category</button><button class="btn primary" id="newItem">+ Item</button>`) + `
      <div class="row" style="margin-bottom:12px">${B.categories.map(c => `<button class="btn sm ${c.id === cat ? 'primary' : ''}" data-c="${c.id}">${esc(c.name)} <span class="muted">${B.items.filter(i => i.category_id === c.id).length}</span></button>`).join('')}</div>
      <div class="row" style="margin-bottom:10px"><span class="muted small">Prints at: <b>${esc(B.categories.find(c => c.id === cat)?.station || '')}</b></span><button class="btn sm" id="editCat">Edit category</button></div>` +
      table([
        { k: 'name', label: 'Item', fmt: (v, r) => `<span class="vg ${r.veg ? '' : 'nv'}"></span> ${esc(v)}${r.code ? ` <span class="muted small">${esc(r.code)}</span>` : ''}` },
        { k: 'price', label: 'Price', t: 'money' },
        { k: 'tax_id', label: 'Tax', fmt: v => esc(taxName(v)) },
        { k: 'hsn', label: 'HSN/SAC' },
        { k: 'available', label: 'On menu', fmt: (v, r) => `<input type="checkbox" data-av="${r.id}" ${v ? 'checked' : ''}>` },
        { k: 'id', label: '', fmt: (v) => `<button class="btn sm" data-rec="${v}">Recipe</button>` },
      ], items, { onRow: r => editItem(r), empty: 'No items in this category.' });
    $$('[data-c]', main).forEach(b => b.onclick = () => { cat = +b.dataset.c; draw(); });
    $$('[data-av]', main).forEach(c => c.onchange = () => act(() => PUT(`/items/${c.dataset.av}/available`, { available: c.checked })));
    $$('[data-rec]', main).forEach(b => b.onclick = () => recipe(B.items.find(i => i.id === +b.dataset.rec)));
    $('#newItem').onclick = () => editItem({ category_id: cat, veg: 1, available: 1, tax_id: B.taxes[0]?.id });
    $('#newCat').onclick = () => editCat({ station: 'kitchen' });
    $('#editCat').onclick = () => editCat(B.categories.find(c => c.id === cat));
  };
  const editItem = async it => {
    const B = S.boot;
    const v = await formModal(it.id ? 'Edit item' : 'New item', [
      { k: 'name', label: 'Name', required: true, full: true },
      { k: 'category_id', label: 'Category', type: 'select', options: B.categories.map(c => [c.id, c.name]) },
      { k: 'price', label: 'Price ₹', type: 'number', step: 'any', required: true },
      { k: 'tax_id', label: 'Tax', type: 'select', options: B.taxes.map(t => [t.id, `${t.name} (${t.kind} ${t.rate}%)`]) },
      { k: 'hsn', label: 'HSN / SAC', help: '996331 for restaurant service; 2203 beer, 2208 spirits' },
      { k: 'code', label: 'Short code (optional)' },
      { k: 'station', label: 'Print at', type: 'select', options: [['', 'Same as category'], ['kitchen', 'Kitchen'], ['bar', 'Bar']] },
      { k: 'prep', label: 'Cooked at (kitchen screen)', type: 'select', options: [['wok', 'Wok'], ['stock', 'Stock pots'], ['fry', 'Fryer'], ['steam', 'Steamer'], ['cold', 'Cold & plate'], ['pass', 'Pass (sets)'], ['bar', 'Bar']], help: 'Which station sees this dish on the screen' },
      { k: 'prep_min', label: 'Usual cook time (minutes)', type: 'number', step: 'any', help: 'Used to start slow dishes first so a table\'s plates finish together' },
      { k: 'course', label: 'Course', type: 'select', options: [[0, 'Drinks (never held)'], [1, 'Starters'], [2, 'Mains'], [3, 'Dessert']], help: 'Later courses wait for the earlier ones on dine-in tables' },
      { k: 'sort', label: 'Sort order', type: 'number' },
      { k: 'veg', label: 'Vegetarian', type: 'checkbox' },
      { k: 'available', label: 'Available', type: 'checkbox' },
    ], it, { extraFoot: it.id ? '<button class="btn danger" data-extra="del" style="margin-right:auto">Delete</button>' : '' });
    if (!v) return;
    if (v.__extra === 'del') { if (await confirmBox('Delete item', `Remove ${it.name} from the menu? Past sales keep their records.`, 'Delete', true)) await act(() => DEL(`/items/${it.id}`)); return draw(); }
    v.prep_min = +v.prep_min || 6; v.course = +v.course; v.veg = v.veg ? 1 : 0; v.available = v.available ? 1 : 0; v.category_id = +v.category_id; v.tax_id = +v.tax_id; v.sort = +v.sort || 0;
    if (await act(() => it.id ? PUT(`/items/${it.id}`, v) : POST('/items', v), 'Saved')) { if (v.category_id) cat = v.category_id; draw(); }
  };
  const editCat = async c => {
    const v = await formModal(c.id ? 'Edit category' : 'New category', [
      { k: 'name', label: 'Name', required: true },
      { k: 'station', label: 'KOT prints at', type: 'select', options: [['kitchen', 'Kitchen'], ['bar', 'Bar']] },
      { k: 'sort', label: 'Sort order', type: 'number' },
    ], c, { extraFoot: c.id ? '<button class="btn danger" data-extra="del" style="margin-right:auto">Delete</button>' : '' });
    if (!v) return;
    if (v.__extra === 'del') { if (await confirmBox('Delete category', `Hide ${c.name}? Its items stay but won't show.`, 'Delete', true)) await act(() => DEL(`/categories/${c.id}`)); cat = null; return draw(); }
    const r = await act(() => c.id ? PUT(`/categories/${c.id}`, v) : POST('/categories', v), 'Saved');
    if (r) { cat = r.id; draw(); }
  };
  const recipe = async it => {
    const [lines, stock] = await Promise.all([GET(`/recipes/${it.id}`), GET('/stock')]);
    let rows = lines.map(l => ({ stock_id: l.stock_id, qty: l.qty }));
    const r = await modal({
      title: `Recipe · ${it.name}`, wide: true,
      body: `<p class="small muted">What one portion uses from stock. Sending the KOT deducts these amounts, and the menu-costing report uses them.</p>
             <div id="rl"></div><button class="btn sm" id="ra">+ Ingredient</button><div class="card" id="rc"></div>`,
      foot: '<button class="btn ghost" data-c>Cancel</button><button class="btn primary" data-ok>Save recipe</button>',
      onOpen: (m, close) => {
        const draw2 = () => {
          $('#rl', m).innerHTML = rows.map((r, i) => `<div class="row" style="flex-wrap:nowrap;margin-bottom:6px">
            <select data-i="${i}" data-k="stock_id"><option value="">Pick stock item</option>${stock.map(s => `<option value="${s.id}" ${s.id === +r.stock_id ? 'selected' : ''}>${esc(s.name)} (${esc(s.unit)})</option>`).join('')}</select>
            <input type="number" step="any" data-i="${i}" data-k="qty" value="${r.qty}" style="width:120px" placeholder="Qty">
            <span class="muted small" style="width:60px">${esc(stock.find(s => s.id === +r.stock_id)?.unit || '')}</span>
            <button class="btn ghost sm" data-d="${i}">✕</button></div>`).join('');
          $$('[data-k]', m).forEach(el => el.oninput = () => { rows[+el.dataset.i][el.dataset.k] = el.value; cost(); if (el.tagName === 'SELECT') draw2(); });
          $$('[data-d]', m).forEach(b => b.onclick = () => { rows.splice(+b.dataset.d, 1); draw2(); });
          cost();
        };
        const cost = () => {
          const c = rows.reduce((a, r) => a + (+r.qty || 0) * (stock.find(s => s.id === +r.stock_id)?.cost || 0), 0);
          $('#rc', m).innerHTML = `Ingredient cost <b>${money(c)}</b> · price ${money(it.price)} · cost <b class="${c / it.price > 0.35 ? 'bad' : 'ok'}">${it.price ? (c / it.price * 100).toFixed(1) : 0}%</b> (prices before tax)`;
        };
        $('#ra', m).onclick = () => { rows.push({ stock_id: '', qty: '' }); draw2(); };
        $('[data-c]', m).onclick = () => close();
        $('[data-ok]', m).onclick = () => close(rows);
        draw2();
      },
    });
    if (r) await act(() => PUT(`/recipes/${it.id}`, { lines: r }), 'Recipe saved');
  };
  await draw();
}, { label: 'Menu' });

// ---------- inventory ----------
const UNITS = ['kg', 'g', 'L', 'ml', 'pc', 'pack', 'bottle', 'keg', 'box', 'dozen'];
page('inventory', 'inventory', async (main) => {
  let filter = '', low = false;
  const draw = async () => {
    const [stock, vendors] = await Promise.all([GET('/stock'), GET('/vendors')]);
    const vn = id => vendors.find(v => v.id === id)?.name || '';
    const list = stock.filter(s => (!low || s.qty <= s.reorder_level) && (!filter || s.name.toLowerCase().includes(filter) || (s.category || '').toLowerCase().includes(filter)));
    const value = stock.reduce((a, s) => a + Math.max(0, s.qty) * s.cost, 0);
    main.innerHTML = topbar('Inventory', `<button class="btn" id="take">Stock take</button><button class="btn" onclick="location.hash='#/purchases'">Receive goods</button><button class="btn primary" id="new">+ Stock item</button>`) + `
      <div class="cards"><div class="card kpi"><div class="l">Stock value</div><div class="v">${money0(value)}</div></div>
        <div class="card kpi"><div class="l">Items low / out</div><div class="v">${stock.filter(s => s.qty <= s.reorder_level).length} / ${stock.filter(s => s.qty <= 0).length}</div></div></div>
      <div class="row" style="margin-bottom:10px"><input id="f" placeholder="Filter by name or category" value="${esc(filter)}" style="max-width:320px"><label class="chk"><input type="checkbox" id="low" ${low ? 'checked' : ''}> Low only</label></div>` +
      table([
        { k: 'category', label: 'Category' }, { k: 'name', label: 'Item' },
        { k: 'qty', label: 'On hand', fmt: (v, r) => `<b class="${v <= 0 ? 'bad' : v <= r.reorder_level ? 'warn' : ''}">${qty(Math.round(v * 1000) / 1000)}</b> ${esc(r.unit)}` },
        { k: 'reorder_level', label: 'Reorder at', t: 'num' }, { k: 'par_level', label: 'Order up to', t: 'num' },
        { k: 'cost', label: 'Cost / unit', t: 'money' }, { k: 'vendor_id', label: 'Vendor', fmt: v => esc(vn(v)) },
        { k: 'id', label: '', fmt: v => `<div class="row" style="flex-wrap:nowrap"><button class="btn sm" data-w="${v}">Waste</button><button class="btn sm" data-a="${v}">Adjust</button><button class="btn sm" data-h="${v}">History</button></div>` },
      ], list, { onRow: r => edit(r, vendors) });
    $('#f').oninput = e => { filter = e.target.value.toLowerCase(); clearTimeout(window._ft); window._ft = setTimeout(draw, 250); };
    $('#low').onchange = e => { low = e.target.checked; draw(); };
    $('#new').onclick = () => edit({ unit: 'kg' }, vendors);
    $('#take').onclick = () => stockTake(stock);
    $$('[data-w]', main).forEach(b => b.onclick = () => move(stock.find(s => s.id === +b.dataset.w), 'waste'));
    $$('[data-a]', main).forEach(b => b.onclick = () => move(stock.find(s => s.id === +b.dataset.a), 'count'));
    $$('[data-h]', main).forEach(b => b.onclick = () => history(stock.find(s => s.id === +b.dataset.h)));
  };
  const edit = async (s, vendors) => {
    const v = await formModal(s.id ? 'Edit stock item' : 'New stock item', [
      { k: 'name', label: 'Name', required: true, full: true },
      { k: 'category', label: 'Category', list: ['Meat', 'Seafood', 'Veg', 'Dairy', 'Dry', 'Bakery', 'Beer', 'Spirits', 'Beverages', 'Packaging', 'Cleaning'] },
      { k: 'unit', label: 'Unit', list: UNITS, required: true },
      { k: 'reorder_level', label: 'Reorder when at or below', type: 'number', step: 'any' },
      { k: 'par_level', label: 'Order up to (par)', type: 'number', step: 'any' },
      { k: 'cost', label: 'Cost per unit ₹', type: 'number', step: 'any' },
      { k: 'vendor_id', label: 'Usual vendor', type: 'select', options: [['', '-'], ...vendors.map(x => [x.id, x.name])] },
      ...(s.id ? [] : [{ k: 'opening', label: 'Opening quantity', type: 'number', step: 'any' }]),
    ], s, { extraFoot: s.id ? '<button class="btn danger" data-extra="del" style="margin-right:auto">Delete</button>' : '' });
    if (!v) return;
    if (v.__extra === 'del') { if (await confirmBox('Delete', `Hide ${s.name}? Recipes using it stop deducting.`, 'Delete', true)) await act(() => DEL(`/stock/${s.id}`)); return draw(); }
    const { opening, ...body } = v;
    const r = await act(() => s.id ? PUT(`/stock/${s.id}`, body) : POST('/stock', body), 'Saved');
    if (r && !s.id && +opening) await act(() => POST(`/stock/${r.id}/move`, { type: 'count', qty: +opening, note: 'Opening stock' }));
    draw();
  };
  const move = async (s, type) => {
    const v = await formModal(type === 'waste' ? `Waste · ${s.name}` : `Correct stock · ${s.name}`, [
      { k: 'qty', label: type === 'waste' ? `Quantity wasted (${s.unit})` : `Actual quantity on hand (${s.unit}); now ${qty(s.qty)}`, type: 'number', step: 'any', required: true },
      { k: 'note', label: 'Reason', list: type === 'waste' ? ['Spoiled', 'Expired', 'Dropped', 'Over-prepared', 'Staff meal', 'Spillage / line cleaning'] : ['Stock count', 'Data entry fix'], full: true },
    ]);
    if (!v) return;
    if (await act(() => POST(`/stock/${s.id}/move`, { type, ...v }), 'Recorded')) draw();
  };
  const history = async s => {
    const rows = await GET(`/stock/${s.id}/moves`);
    modal({ title: `History · ${s.name}`, wide: true, body: table([
      { k: 'at', label: 'When', fmt: v => `${fmtDate(v)} ${fmtTime(v)}` }, { k: 'type', label: 'Type' },
      { k: 'qty', label: `Qty (${s.unit})`, fmt: v => `<span class="${v < 0 ? 'bad' : 'ok'}">${v > 0 ? '+' : ''}${qty(Math.round(v * 1000) / 1000)}</span>` },
      { k: 'note', label: 'Detail' }, { k: 'ref', label: 'Ref' }, { k: 'staff_name', label: 'By' },
    ], rows) });
  };
  const stockTake = async stock => {
    const r = await modal({
      title: 'Stock take', wide: true,
      body: `<p class="small muted">Type what you physically count. Leave blank to skip. Differences are recorded as count adjustments and show in the stock-movement report.</p>` +
        table([{ k: 'category', label: 'Category' }, { k: 'name', label: 'Item' }, { k: 'qty', label: 'System', fmt: (v, r) => `${qty(Math.round(v * 1000) / 1000)} ${esc(r.unit)}` },
          { k: 'id', label: 'Counted', fmt: v => `<input type="number" step="any" data-cnt="${v}" style="width:110px">` }], stock),
      foot: '<button class="btn ghost" data-c>Cancel</button><button class="btn primary" data-ok>Save counts</button>',
      onOpen: (m, close) => { $('[data-c]', m).onclick = () => close(); $('[data-ok]', m).onclick = () => close($$('[data-cnt]', m).map(i => ({ id: +i.dataset.cnt, qty: i.value === '' ? null : +i.value }))); },
    });
    if (!r) return;
    const res = await act(() => POST('/stock-count', { counts: r }));
    if (res) { toast(`${res.updated} items updated`, 'ok'); draw(); }
  };
  await draw();
}, { label: 'Inventory' });

// ---------- purchases ----------
page('purchases', 'purchases', async (main) => {
  const st = { ...Object.fromEntries([['from', rangeFor('month')[0]], ['to', today()]]) };
  const draw = async () => {
    const rows = await GET(`/purchases?from=${st.from}&to=${st.to}`);
    main.innerHTML = topbar('Purchases', '<button class="btn primary" id="new">+ Receive goods</button>') +
      `<div style="margin-bottom:12px">${rangePicker(st, draw)}</div>` +
      table([
        { k: 'bill_date', label: 'Date', t: 'date' }, { k: 'vendor', label: 'Vendor' }, { k: 'bill_no', label: 'Bill no' },
        { k: 'taxable', label: 'Taxable', t: 'money' }, { k: 'tax', label: 'Tax', t: 'money' }, { k: 'total', label: 'Total', t: 'money' },
        { k: 'paid', label: 'Paid', t: 'money' }, { k: 'due', label: 'Due', fmt: (v, r) => r.cancelled ? '<span class="pill bad">cancelled</span>' : money(r.total - r.paid, false) },
      ], rows.map(r => ({ ...r, due: r.total - r.paid })), { totals: true, onRow: r => view(r.id), empty: 'No purchases in this period.' });
    $('#new').onclick = newPurchase;
  };
  const view = async id => {
    const p = await GET(`/purchases/${id}`);
    const r = await modal({ title: `${p.vendor} · ${p.bill_no || '#' + p.id}`, wide: true,
      body: `<p class="muted">${fmtDate(p.bill_date)} · ${esc(p.notes || '')}</p>` + table([
        { k: 'name', label: 'Item' }, { k: 'qty', label: 'Qty', fmt: (v, r) => `${qty(v)} ${esc(r.unit)}` }, { k: 'rate', label: 'Rate', t: 'money' },
        { k: 'tax_rate', label: 'GST %', t: 'num' }, { k: 'taxable', label: 'Taxable', t: 'money' }, { k: 'tax', label: 'Tax', t: 'money' }], p.lines, { totals: true }) +
        `<p>Total <b>${money(p.total)}</b> · paid <b>${money(p.payments.reduce((a, x) => a + x.amount, 0))}</b></p>`,
      foot: `${p.cancelled ? '<span class="pill bad">Cancelled</span>' : '<button class="btn danger" data-x2>Cancel purchase</button><button class="btn primary" data-pay>Record payment</button>'}`,
      onOpen: (m, close) => { $('[data-x2]', m) && ($('[data-x2]', m).onclick = () => close('cancel')); $('[data-pay]', m) && ($('[data-pay]', m).onclick = () => close('pay')); } });
    if (r === 'cancel' && await confirmBox('Cancel purchase', 'This removes the received quantities from stock.', 'Cancel purchase', true)) { await act(() => POST(`/purchases/${id}/cancel`, {})); draw(); }
    if (r === 'pay') { if (await payVendor(p.vendor_id, p.id, p.total - p.payments.reduce((a, x) => a + x.amount, 0))) draw(); }
  };
  const newPurchase = async () => {
    const [vendors, stock] = await Promise.all([GET('/vendors'), GET('/stock')]);
    if (!vendors.length) return toast('Add a vendor first', 'bad');
    let lines = [{ stock_id: '', qty: '', rate: '', tax_rate: 0 }];
    const r = await modal({
      title: 'Receive goods (purchase bill)', wide: true,
      body: `<div class="grid3">
          <label class="f"><span>Vendor</span><select id="pv">${vendors.map(v => `<option value="${v.id}">${esc(v.name)}</option>`).join('')}</select></label>
          <label class="f"><span>Bill / invoice no</span><input id="pb"></label>
          <label class="f"><span>Bill date</span><input type="date" id="pd" value="${today()}"></label></div>
        <div id="pl"></div><button class="btn sm" id="padd">+ Line</button>
        <div class="grid3"><label class="f"><span>Other charges ₹ (delivery etc.)</span><input type="number" step="any" id="po" value="0"></label>
          <label class="f"><span>Paid now ₹</span><input type="number" step="any" id="pp" value="0"></label>
          <label class="f"><span>Paid by</span><select id="pm"><option>cash</option><option>upi</option><option>bank</option><option>card</option></select></label></div>
        <label class="f"><span>Notes</span><input id="pn"></label>
        <div class="card" id="pt"></div>`,
      foot: '<button class="btn ghost" data-c>Cancel</button><button class="btn primary" data-ok>Save & add to stock</button>',
      onOpen: (m, close) => {
        const drawL = () => {
          $('#pl', m).innerHTML = `<div class="row small muted" style="flex-wrap:nowrap"><span style="flex:1">Item</span><span style="width:100px">Qty</span><span style="width:110px">Rate ₹ (ex-GST)</span><span style="width:90px">GST %</span><span style="width:100px" class="right">Amount</span><span style="width:40px"></span></div>` +
            lines.map((l, i) => `<div class="row" style="flex-wrap:nowrap;margin-bottom:6px">
            <select data-i="${i}" data-k="stock_id" style="flex:1"><option value="">Pick item</option>${stock.map(s => `<option value="${s.id}" ${s.id === +l.stock_id ? 'selected' : ''}>${esc(s.name)} (${esc(s.unit)})</option>`).join('')}</select>
            <input type="number" step="any" data-i="${i}" data-k="qty" value="${l.qty}" style="width:100px">
            <input type="number" step="any" data-i="${i}" data-k="rate" value="${l.rate}" style="width:110px">
            <select data-i="${i}" data-k="tax_rate" style="width:90px">${[0, 5, 12, 18, 28].map(t => `<option ${+l.tax_rate === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
            <span style="width:100px" class="num">${money((+l.qty || 0) * (+l.rate || 0) * (1 + (+l.tax_rate || 0) / 100), false)}</span>
            <button class="btn ghost sm" data-d="${i}">✕</button></div>`).join('');
          $$('[data-k]', m).forEach(el => el.onchange = el.oninput = () => {
            lines[+el.dataset.i][el.dataset.k] = el.value;
            if (el.dataset.k === 'stock_id') { const s = stock.find(x => x.id === +el.value); if (s && !lines[+el.dataset.i].rate) lines[+el.dataset.i].rate = s.cost; drawL(); }
            tot();
          });
          $$('[data-d]', m).forEach(b => b.onclick = () => { lines.splice(+b.dataset.d, 1); drawL(); });
          tot();
        };
        const tot = () => {
          const tx = lines.reduce((a, l) => a + (+l.qty || 0) * (+l.rate || 0), 0);
          const g = lines.reduce((a, l) => a + (+l.qty || 0) * (+l.rate || 0) * (+l.tax_rate || 0) / 100, 0);
          $('#pt', m).innerHTML = `Taxable ${money(tx)} · GST ${money(g)} · other ${money(+$('#po', m).value || 0)} · <b>Total ${money(tx + g + (+$('#po', m).value || 0))}</b>`;
        };
        $('#po', m).oninput = tot;
        $('#padd', m).onclick = () => { lines.push({ stock_id: '', qty: '', rate: '', tax_rate: 0 }); drawL(); };
        $('[data-c]', m).onclick = () => close();
        $('[data-ok]', m).onclick = () => close({ vendor_id: +$('#pv', m).value, bill_no: $('#pb', m).value, bill_date: $('#pd', m).value, lines,
          other_charges: +$('#po', m).value || 0, paid_now: +$('#pp', m).value || 0, pay_mode: $('#pm', m).value, notes: $('#pn', m).value });
        drawL();
      },
    });
    if (r && await act(() => POST('/purchases', r), 'Purchase saved, stock updated')) draw();
  };
  await draw();
}, { label: 'Purchases' });

async function payVendor(vendor_id, purchase_id, suggested = '') {
  const v = await formModal('Pay vendor', [
    { k: 'amount', label: 'Amount ₹', type: 'number', step: 'any', required: true, value: suggested > 0 ? Math.round(suggested * 100) / 100 : '' },
    { k: 'mode', label: 'Paid by', type: 'select', options: [['bank', 'Bank transfer'], ['upi', 'UPI'], ['cash', 'Cash (from the drawer)'], ['cheque', 'Cheque']] },
    { k: 'ref', label: 'Reference (UTR / cheque no)' }, { k: 'date', label: 'Date', type: 'date', value: today() },
  ]);
  if (!v) return false;
  return !!await act(() => POST('/vendor-payments', { ...v, vendor_id, purchase_id }), 'Payment recorded');
}

// ---------- vendors ----------
page('vendors', 'vendors', async (main) => {
  const draw = async () => {
    const rows = await GET('/vendor-balances');
    main.innerHTML = topbar('Vendors', '<button class="btn primary" id="new">+ Vendor</button>') + table([
      { k: 'name', label: 'Vendor' }, { k: 'supplies', label: 'Supplies' }, { k: 'phone', label: 'Phone' }, { k: 'gstin', label: 'GSTIN' },
      { k: 'last_bill', label: 'Last bill', t: 'date' }, { k: 'billed', label: 'Billed', t: 'money' }, { k: 'paid', label: 'Paid', t: 'money' },
      { k: 'due', label: 'Due', fmt: v => `<b class="${v > 0 ? 'warn' : ''}">${money(v, false)}</b>` },
      { k: 'id', label: '', fmt: v => `<div class="row" style="flex-wrap:nowrap"><button class="btn sm" data-l="${v}">Ledger</button><button class="btn sm" data-e="${v}">Edit</button></div>` },
    ], rows, { totals: true });
    $('#new').onclick = () => edit({});
    $$('[data-e]', main).forEach(b => b.onclick = async () => edit((await GET('/vendors')).find(v => v.id === +b.dataset.e)));
    $$('[data-l]', main).forEach(b => b.onclick = () => ledger(+b.dataset.l));
  };
  const edit = async vd => {
    const v = await formModal(vd.id ? 'Edit vendor' : 'New vendor', [
      { k: 'name', label: 'Name', required: true }, { k: 'contact', label: 'Contact person' },
      { k: 'phone', label: 'Phone', inputmode: 'tel' }, { k: 'email', label: 'Email', type: 'email' },
      { k: 'gstin', label: 'GSTIN' }, { k: 'terms_days', label: 'Credit days', type: 'number' },
      { k: 'supplies', label: 'Supplies', full: true }, { k: 'address', label: 'Address', type: 'textarea' }, { k: 'notes', label: 'Notes', type: 'textarea' },
    ], vd, { extraFoot: vd.id ? '<button class="btn danger" data-extra="del" style="margin-right:auto">Delete</button>' : '' });
    if (!v) return;
    if (v.__extra === 'del') { if (await confirmBox('Delete vendor', `Hide ${vd.name}? Their bills stay in the records.`, 'Delete', true)) await act(() => DEL(`/vendors/${vd.id}`)); return draw(); }
    if (await act(() => vd.id ? PUT(`/vendors/${vd.id}`, v) : POST('/vendors', v), 'Saved')) draw();
  };
  const ledger = async id => {
    const l = await GET(`/vendors/${id}/ledger`);
    const r = await modal({ title: `Ledger · ${l.vendor.name}`, wide: true,
      body: table([{ k: 'date', label: 'Date', t: 'date' }, { k: 'detail', label: 'Detail' }, { k: 'debit', label: 'Billed', t: 'money' }, { k: 'credit', label: 'Paid', t: 'money' }, { k: 'balance', label: 'Balance', t: 'money' }], l.rows, { empty: 'No bills or payments yet.' }) +
        `<p>Balance owed: <b>${money(l.balance)}</b></p>`,
      foot: '<button class="btn primary" data-pay>Record payment</button>', onOpen: (m, close) => $('[data-pay]', m).onclick = () => close('pay') });
    if (r === 'pay' && await payVendor(id, null, l.balance)) draw();
  };
  await draw();
}, { label: 'Vendors' });

// ---------- staff ----------
const ROLE_HELP = { owner: 'Everything', manager: 'Everything except owner accounts', cashier: 'Orders, billing, payments, day close, expenses', waiter: 'Take orders, send KOT, print bill', kitchen: 'Kitchen display only' };
page('staff', 'staff', async (main) => {
  const st = { from: rangeFor('month')[0], to: today() };
  const draw = async () => {
    const [staff, att] = await Promise.all([GET('/staff'), GET(`/attendance?from=${st.from}&to=${st.to}`)]);
    const hours = {};
    for (const a of att) hours[a.staff_id] = (hours[a.staff_id] || 0) + (a.hours || 0);
    main.innerHTML = topbar('Staff', '<button class="btn" id="manual">+ Attendance entry</button><button class="btn primary" id="new">+ Staff</button>') +
      table([
        { k: 'name', label: 'Name' }, { k: 'role', label: 'Role', fmt: v => `${esc(v)} <span class="muted small">${esc(ROLE_HELP[v])}</span>` }, { k: 'phone', label: 'Phone' },
        { k: 'monthly_salary', label: 'Salary / month', t: 'money' }, { k: 'id', label: 'Hours (period)', fmt: v => qty(Math.round((hours[v] || 0) * 10) / 10) },
        { k: 'active', label: 'Status', fmt: v => v ? '<span class="pill ok">active</span>' : '<span class="pill">left</span>' },
      ], staff, { onRow: r => edit(r) }) +
      `<h2 style="margin-top:20px">Attendance</h2><div style="margin-bottom:10px">${rangePicker(st, draw)}</div>` +
      table([{ k: 'name', label: 'Staff' }, { k: 'clock_in', label: 'In', fmt: v => `${fmtDate(v)} ${fmtTime(v)}` }, { k: 'clock_out', label: 'Out', fmt: v => v ? `${fmtDate(v)} ${fmtTime(v)}` : '<span class="pill ok">on shift</span>' },
        { k: 'hours', label: 'Hours', t: 'num' }, { k: 'note', label: 'Note' }], att, { empty: 'No attendance in this period. Staff clock in and out from the login screen.' });
    $('#new').onclick = () => edit({ role: 'waiter', active: 1 });
    $('#manual').onclick = async () => {
      const v = await formModal('Manual attendance', [
        { k: 'staff_id', label: 'Staff', type: 'select', options: staff.filter(s => s.active).map(s => [s.id, s.name]) },
        { k: 'clock_in', label: 'In', type: 'datetime-local', required: true }, { k: 'clock_out', label: 'Out', type: 'datetime-local' },
        { k: 'note', label: 'Note', full: true },
      ]);
      if (v && await act(() => POST('/attendance', { ...v, clock_in: v.clock_in.replace('T', ' ') + ':00', clock_out: v.clock_out ? v.clock_out.replace('T', ' ') + ':00' : null }), 'Saved')) draw();
    };
  };
  const edit = async s => {
    const v = await formModal(s.id ? `Edit ${s.name}` : 'New staff member', [
      { k: 'name', label: 'Name', required: true },
      { k: 'role', label: 'Role', type: 'select', options: Object.keys(ROLE_HELP).filter(r => r !== 'owner' || S.me.role === 'owner').map(r => [r, `${r} · ${ROLE_HELP[r]}`]) },
      { k: 'pin', label: s.id ? 'New PIN (leave blank to keep)' : 'PIN (4–6 digits)', type: 'password', inputmode: 'numeric', required: !s.id },
      { k: 'phone', label: 'Phone', inputmode: 'tel' }, { k: 'monthly_salary', label: 'Monthly salary ₹', type: 'number' },
      { k: 'joined', label: 'Joined', type: 'date' }, ...(s.id ? [{ k: 'active', label: 'Active (untick when someone leaves)', type: 'checkbox', full: true }] : []),
    ], { ...s, pin: '' });
    if (!v) return;
    if (!v.pin) delete v.pin;
    if (await act(() => s.id ? PUT(`/staff/${s.id}`, v) : POST('/staff', v), 'Saved')) draw();
  };
  await draw();
}, { label: 'Staff' });

// ---------- customers ----------
page('customers', 'customers', async (main) => {
  let q = '';
  const draw = async () => {
    const rows = (await GET('/customers')).filter(c => !q || `${c.name} ${c.phone} ${c.gstin}`.toLowerCase().includes(q));
    main.innerHTML = topbar('Customers', '<button class="btn primary" id="new">+ Customer</button>') +
      `<input id="q" placeholder="Search" value="${esc(q)}" style="max-width:320px;margin-bottom:10px">` +
      table([{ k: 'name', label: 'Name' }, { k: 'phone', label: 'Phone' }, { k: 'gstin', label: 'GSTIN' }, { k: 'visits', label: 'Visits', t: 'num' },
        { k: 'spend', label: 'Spend', t: 'money' }, { k: 'last_visit', label: 'Last visit', t: 'date' }, { k: 'notes', label: 'Notes' }], rows, { onRow: edit, empty: 'No customers yet. Add them from an order (More → Customer).' });
    $('#q').oninput = e => { q = e.target.value.toLowerCase(); clearTimeout(window._cq); window._cq = setTimeout(draw, 250); };
    $('#new').onclick = () => edit({});
  };
  const edit = async c => {
    const hist = c.id ? await GET(`/customers/${c.id}/orders`) : [];
    const v = await formModal(c.id ? c.name || c.phone : 'New customer', [
      { k: 'name', label: 'Name' }, { k: 'phone', label: 'Phone', inputmode: 'tel' }, { k: 'email', label: 'Email', type: 'email' },
      { k: 'gstin', label: 'GSTIN' }, { k: 'address', label: 'Address', type: 'textarea' }, { k: 'notes', label: 'Notes (allergies, preferences)', type: 'textarea' },
      ...(hist.length ? [{ k: 'h', type: 'html', html: `<h3>Recent orders</h3>${table([{ k: 'id', label: '#' }, { k: 'bdate', label: 'Day', t: 'date' }, { k: 'total', label: 'Total', t: 'money' }, { k: 'status', label: 'Status' }], hist)}` }] : []),
    ], c, { wide: !!hist.length });
    if (v && await act(() => c.id ? PUT(`/customers/${c.id}`, v) : POST('/customers', v), 'Saved')) draw();
  };
  await draw();
}, { label: 'Customers' });

// ---------- expenses ----------
const EXP_CATS = ['Rent', 'Electricity', 'Water', 'Gas / LPG', 'Salaries', 'Salary advance', 'Repairs & maintenance', 'Cleaning & supplies', 'Marketing', 'Licences & fees', 'Internet & phone', 'Transport', 'Petty cash', 'Other'];
page('expenses', 'expenses', async (main) => {
  const st = { from: today(), to: today() };
  const draw = async () => {
    const rows = await GET(`/expenses?from=${st.from}&to=${st.to}`);
    main.innerHTML = topbar('Expenses', '<button class="btn primary" id="new">+ Expense</button>') + `<div style="margin-bottom:12px">${rangePicker(st, draw)}</div>` +
      table([{ k: 'date', label: 'Date', t: 'date' }, { k: 'category', label: 'Category' }, { k: 'paid_to', label: 'Paid to' }, { k: 'mode', label: 'Mode' },
        { k: 'amount', label: 'Amount', t: 'money' }, { k: 'note', label: 'Note' }, { k: 'staff_name', label: 'By' },
        ...(can('reports') ? [{ k: 'id', label: '', fmt: v => `<button class="btn sm danger" data-del="${v}">Delete</button>` }] : [])], rows, { totals: true, empty: 'No expenses in this period.' });
    $('#new').onclick = async () => {
      const v = await formModal('New expense', [
        { k: 'category', label: 'Category', list: EXP_CATS, required: true }, { k: 'amount', label: 'Amount ₹', type: 'number', step: 'any', required: true },
        { k: 'mode', label: 'Paid by', type: 'select', options: [['cash', 'Cash from drawer'], ['upi', 'UPI'], ['bank', 'Bank'], ['card', 'Card'], ['owner', 'Owner paid personally']] },
        { k: 'date', label: 'Date', type: 'date', value: today() }, { k: 'paid_to', label: 'Paid to' }, { k: 'note', label: 'Note' },
      ]);
      if (v && await act(() => POST('/expenses', v), 'Saved')) draw();
    };
    $$('[data-del]', main).forEach(b => b.onclick = async () => { if (await confirmBox('Delete expense', 'Remove this expense?', 'Delete', true)) { await act(() => DEL(`/expenses/${b.dataset.del}`)); draw(); } });
  };
  await draw();
}, { label: 'Expenses' });

// ---------- reports ----------
page('reports', 'reports', async (main) => {
  const list = await GET('/reports');
  const st = { from: today(), to: today(), kind: sessionStorage.getItem('rep') || 'daily' };
  const draw = async () => {
    sessionStorage.setItem('rep', st.kind);
    const r = await GET(`/reports/${st.kind}?from=${st.from}&to=${st.to}`);
    main.innerHTML = topbar('Reports', '<button class="btn" id="csv">Export CSV</button><button class="btn" onclick="window.print()">Print</button>') +
      `<div class="row noprint" style="margin-bottom:10px"><select id="k" style="width:auto">${list.map(x => `<option value="${x.k}" ${x.k === st.kind ? 'selected' : ''}>${esc(x.title)}</option>`).join('')}</select>${rangePicker(st, draw)}</div>
       <h2>${esc(r.title)} <span class="muted small">${fmtDate(r.from)} – ${fmtDate(r.to)}</span></h2>
       ${r.note ? `<p class="small muted">${esc(r.note)}</p>` : ''}` +
      table(r.columns.map(c => ({ ...c, sum: c.t === 'num' && /qty|orders|covers|invoices|issued|cancelled|net|count|bills|voids|purchased|used|wasted/i.test(c.k) })), r.rows, { totals: !r.noTotals && r.columns.some(c => c.t === 'money'), empty: 'No data for this period.' });
    $('#k').onchange = e => { st.kind = e.target.value; draw(); };
    $('#csv').onclick = () => csv(r.columns, r.rows, `${r.kind}_${r.from}_${r.to}`);
  };
  await draw();
}, { label: 'Reports' });

// ---------- day close ----------
const NOTES = [500, 200, 100, 50, 20, 10, 5, 2, 1];
page('dayclose', 'dayclose', async (main) => {
  let date = today();
  const draw = async () => {
    const z = await GET(`/dayclose?date=${date}`);
    main.innerHTML = topbar('Day close', `<input type="date" id="d" value="${date}" style="width:auto"><button class="btn" id="zp">Print Z report</button>`) + `
      ${z.closed ? `<div class="card" style="margin-bottom:12px">Closed at ${fmtTime(z.closed.at)}: counted ${money(z.closed.counted_cash)}, ${z.closed.difference >= 0 ? 'over' : 'short'} <b class="${z.closed.difference ? 'bad' : 'ok'}">${money(Math.abs(z.closed.difference))}</b>. You can close again to correct it.</div>` : ''}
      ${z.openOrders ? `<div class="card warn" style="margin-bottom:12px">${z.openOrders} order(s) still open. Settle or cancel them before closing.</div>` : ''}
      <div class="cards">
        <div class="card kpi"><div class="l">Net sales</div><div class="v">${money0(z.total)}</div><div class="small muted">${z.orders} bills · ${z.covers} guests</div></div>
        <div class="card kpi"><div class="l">GST collected</div><div class="v">${money0(z.cgst + z.sgst)}</div><div class="small muted">CGST ${money(z.cgst)} · SGST ${money(z.sgst)}</div></div>
        <div class="card kpi"><div class="l">VAT on liquor</div><div class="v">${money0(z.vat)}</div></div>
        <div class="card kpi"><div class="l">Discounts · voids</div><div class="v">${money0(z.discount)}</div><div class="small muted">${z.voids.count} void items (${money0(z.voids.value)})</div></div>
      </div>
      <div class="split">
        <div class="card"><h2>Count the cash drawer</h2>
          <div class="grid3">${NOTES.map(n => `<label class="f"><span>₹${n} ×</span><input type="number" min="0" data-n="${n}" inputmode="numeric"></label>`).join('')}</div>
          <div class="grid2" style="margin-top:12px">
            <label class="f"><span>Opening cash (float)</span><input type="number" step="any" id="open" value="${z.cash.opening}"></label>
            <label class="f"><span>Counted cash</span><input type="number" step="any" id="counted" value="${z.closed?.counted_cash ?? ''}"></label></div>
          <label class="f" style="margin-top:10px"><span>Notes</span><input id="notes" value="${esc(z.closed?.notes || '')}"></label>
          <div class="card" style="margin-top:12px" id="diff"></div>
          <button class="btn primary big block" id="close" style="margin-top:12px">Close day, print Z report & back up</button></div>
        <div class="card"><h2>Cash</h2><ul class="list-plain">
          <li><span>Opening float</span><span>${money(z.cash.opening)}</span></li>
          <li><span>+ Cash sales</span><span>${money(z.cash.sales)}</span></li>
          <li><span>− Cash expenses</span><span>${money(z.cash.expenses)}</span></li>
          <li><span>− Cash paid to vendors</span><span>${money(z.cash.vendors)}</span></li>
          <li><b>Expected in drawer</b><b id="exp">${money(z.cash.expected)}</b></li></ul>
          <h2 style="margin-top:14px">Collections</h2><ul class="list-plain">${z.payments.map(p => `<li><span>${p.mode.toUpperCase()}</span><span>${money(p.amount)}</span></li>`).join('') || '<li class="muted">None</li>'}
          <li><b>Total</b><b>${money(z.collected)}</b></li></ul>
          <h2 style="margin-top:14px">Invoices</h2><p class="small">GST: ${esc(z.gst.range || 'none')}<br>VAT: ${esc(z.vat_.range || 'none')}${z.cancelled.count ? `<br><span class="bad">${z.cancelled.count} cancelled (${money(z.cancelled.total)})</span>` : ''}</p></div>
      </div>`;
    const recalc = () => {
      const counted = $$('[data-n]', main).reduce((a, i) => a + (+i.value || 0) * +i.dataset.n, 0);
      if ($$('[data-n]', main).some(i => i.value !== '')) $('#counted').value = counted;
      const expected = (+$('#open').value || 0) + z.cash.sales - z.cash.expenses - z.cash.vendors;
      $('#exp').textContent = money(expected);
      const c = $('#counted').value === '' ? null : +$('#counted').value;
      $('#diff').innerHTML = c === null ? 'Enter the counted cash.' : `Expected ${money(expected)} · counted ${money(c)} · <b class="${Math.abs(c - expected) < 1 ? 'ok' : 'bad'}">${c - expected >= 0 ? 'Over' : 'Short'} ${money(Math.abs(c - expected))}</b>`;
    };
    $$('[data-n]', main).forEach(i => i.oninput = recalc);
    $('#open').oninput = recalc; $('#counted').oninput = recalc;
    recalc();
    $('#d').onchange = e => { date = e.target.value; draw(); };
    $('#zp').onclick = async () => { const r = await act(() => GET(`/dayclose/${date}/print`)); handlePrint(r); };
    $('#close').onclick = async () => {
      if ($('#counted').value === '') return toast('Enter the counted cash first', 'bad');
      let body = { date, opening_cash: +$('#open').value, counted_cash: +$('#counted').value, notes: $('#notes').value };
      let r = await act(() => POST('/dayclose', body));
      if (!r && z.openOrders && await confirmBox('Orders still open', 'Close the day anyway? Open orders will count on the day they are billed.', 'Close anyway')) r = await act(() => POST('/dayclose', { ...body, force: true }));
      if (!r) return;
      handlePrint(r.print);
      toast(`Day closed${r.backup ? ', backup saved' : ''}`, 'ok');
      draw();
    };
  };
  await draw();
}, { label: 'Day close' });

// ---------- settings ----------
page('settings', 'settings', async (main) => {
  let tab = sessionStorage.getItem('set_tab') || 'business';
  const draw = async () => {
    sessionStorage.setItem('set_tab', tab);
    const { settings: s } = await GET('/settings');
    const tabs = [['business', 'Business & tax'], ['printers', 'Printers'], ['tables', 'Tables'], ['taxes', 'Tax rates'], ['data', 'Backup & audit']];
    main.innerHTML = topbar('Settings') + `<div class="seg" style="margin-bottom:14px">${tabs.map(([k, l]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div><div id="tab"></div>`;
    $$('[data-t]', main).forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
    const box = $('#tab');
    if (tab === 'business') {
      const F = [
        ['business_name', 'Trading name (printed on bills)'], ['legal_name', 'Legal name, if different (as on GST certificate)'], ['address', 'Address', 'textarea'],
        ['phone', 'Phone'], ['email', 'Email'], ['gstin', 'GSTIN'], ['fssai', 'FSSAI licence no (must print on bills)'],
        ['vat_tin', 'Goa VAT TIN (for liquor invoices)'], ['excise_licence', 'Excise licence no'], ['state_name', 'State'], ['state_code', 'State code'],
      ];
      box.innerHTML = `<div class="card"><form id="bf" class="grid2">${F.map(([k, l, t]) => `<label class="f" style="${t ? 'grid-column:1/-1' : ''}"><span>${l}</span>${t ? `<textarea name="${k}">${esc(s[k])}</textarea>` : `<input name="${k}" value="${esc(s[k])}">`}</label>`).join('')}
        <label class="f"><span>GST scheme</span><select name="gst_scheme"><option value="regular" ${s.gst_scheme === 'regular' ? 'selected' : ''}>Regular: charge 5% GST (CGST 2.5 + SGST 2.5)</option><option value="composition" ${s.gst_scheme === 'composition' ? 'selected' : ''}>Composition: no GST on bill ("Bill of Supply")</option></select>
          <small>A restaurant that sells liquor can't use composition (liquor is a non-GST supply), so keep Regular once the bar licence is active.</small></label>
        <label class="f"><span>Menu prices</span><select name="prices_include_tax"><option value="false" ${!s.prices_include_tax ? 'selected' : ''}>Exclude tax ("taxes extra")</option><option value="true" ${s.prices_include_tax ? 'selected' : ''}>Include tax</option></select></label>
        <label class="f"><span>How taxes show on the bill</span><select name="bill_tax_display"><option value="inclusive" ${s.bill_tax_display !== 'itemised' ? 'selected' : ''}>Inside each item's price (one small tax note at the bottom)</option><option value="itemised" ${s.bill_tax_display === 'itemised' ? 'selected' : ''}>Separate CGST / SGST / VAT lines</option></select>
          <small>The guest pays the same total either way. The law requires the tax rate and amount on every invoice, so the inclusive bill keeps them as one line.</small></label>
        <label class="f"><span>GST invoice prefix</span><input name="gst_prefix" value="${esc(s.gst_prefix)}"><small>Numbers look like ${esc(s.gst_prefix)}/26-27/00001 and restart each April.</small></label>
        <label class="f"><span>Liquor (VAT) invoice prefix</span><input name="vat_prefix" value="${esc(s.vat_prefix)}"></label>
        <label class="f"><span>Default service charge %</span><input type="number" step="any" name="service_charge_pct" value="${s.service_charge_pct}"><small>Optional for guests (CCPA guidelines). Leave 0 unless guests are told it's voluntary.</small></label>
        <label class="f"><span>Cashier discount limit % (above needs a manager)</span><input type="number" name="discount_limit_pct" value="${s.discount_limit_pct}"></label>
        <label class="f"><span>Trading day starts at (hour)</span><input type="number" min="0" max="11" name="day_start_hour" value="${s.day_start_hour}"><small>Sales before this hour count to the previous day.</small></label>
        <label class="f"><span>Default opening cash float ₹</span><input type="number" name="opening_cash" value="${s.opening_cash}"></label>
        <label class="f" style="grid-column:1/-1"><span>Bill footer</span><input name="bill_footer" value="${esc(s.bill_footer)}"></label>
        </form><div class="row" style="margin-top:12px"><button class="btn primary" id="save">Save</button></div></div>`;
      $('#save').onclick = async () => {
        const fd = Object.fromEntries(new FormData($('#bf')));
        fd.prices_include_tax = fd.prices_include_tax === 'true';
        for (const k of ['service_charge_pct', 'discount_limit_pct', 'day_start_hour', 'opening_cash']) fd[k] = +fd[k] || 0;
        if (await act(() => PUT('/settings', fd), 'Saved')) { await reload(); draw(); }
      };
    }
    if (tab === 'printers') {
      const P = [['bill', 'Bills & Z report (counter)'], ['kitchen', 'Kitchen KOT'], ['bar', 'Bar BOT']];
      box.innerHTML = `<div class="card small" style="margin-bottom:12px">
          <b>How to connect a thermal bill printer</b> (any ESC/POS model, e.g. Epson TM-T82, TVS RP3160, Posiflex, Rugtek, 80 mm or 58 mm):<br>
          • <b>LAN / Wi-Fi printer</b>: give it a fixed IP on your router, choose <i>Network</i>, enter the IP and port 9100. Prints silently, cuts paper and opens the cash drawer.<br>
          • <b>USB printer on this Mac / Linux PC</b>: add it in System Settings → Printers as a <i>Generic / Raw</i> printer, then choose <i>System queue</i> and type its queue name (run <code>lpstat -p</code> to list them).<br>
          • <b>Anything else</b> (Windows USB, Bluetooth, tablets): choose <i>Browser</i>. The bill opens the print dialog; set the printer's paper to 80 mm (or 58 mm) once and tick "remember".</div>` +
        P.map(([k, l]) => { const p = s.printers[k] || {}; return `<div class="card" style="margin-bottom:12px"><h3>${l}</h3><div class="grid3" data-p="${k}">
          <label class="f"><span>Mode</span><select name="mode">${[['browser', 'Browser print dialog'], ['network', 'Network (IP:9100)'], ['system', 'System queue (USB, raw)'], ['off', 'Off (no print)']].map(([v, t]) => `<option value="${v}" ${p.mode === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
          <label class="f"><span>IP address</span><input name="host" value="${esc(p.host)}" placeholder="192.168.1.50"></label>
          <label class="f"><span>Port</span><input name="port" type="number" value="${p.port || 9100}"></label>
          <label class="f"><span>System queue name</span><input name="queue" value="${esc(p.queue)}"></label>
          <label class="f"><span>Paper</span><select name="width"><option value="48" ${+p.width !== 32 ? 'selected' : ''}>80 mm (48 chars)</option><option value="32" ${+p.width === 32 ? 'selected' : ''}>58 mm (32 chars)</option></select></label>
          <div class="row" style="align-items:flex-end"><button class="btn" data-test="${k}">Test print</button></div></div></div>`; }).join('') +
        `<div class="card"><label class="chk"><input type="checkbox" id="kp" ${s.print_kot ? 'checked' : ''}> Always print paper KOT and BOT slips (leave unticked: the kitchen and bar screens replace paper)</label>
         <label class="chk" style="margin-top:8px"><input type="checkbox" id="kf" ${s.kds_fallback_print !== false ? 'checked' : ''}> If a screen goes offline, print that ticket on the kitchen or bar printer (needs a Network or System printer above)</label>
         <div class="grid3" style="margin-top:8px"><label class="f"><span>Gap before the next course fires (minutes)</span><input id="kg" type="number" step="any" value="${s.kds_course_gap_min ?? 8}"></label>
         <label class="f"><span>A held course always fires after (minutes)</span><input id="kh" type="number" step="any" value="${s.kds_hold_max_min ?? 35}"></label></div>
         <label class="chk" style="margin-top:8px"><input type="checkbox" id="dr" ${s.open_drawer_on_cash ? 'checked' : ''}> Open cash drawer on cash payments (drawer plugged into the bill printer)</label>
         <div class="row" style="margin-top:12px"><button class="btn primary" id="savep">Save printers</button></div></div>`;
      const collect = () => Object.fromEntries(P.map(([k]) => { const g = $(`[data-p="${k}"]`); return [k, { mode: $('[name=mode]', g).value, host: $('[name=host]', g).value.trim(), port: +$('[name=port]', g).value || 9100, queue: $('[name=queue]', g).value.trim(), width: +$('[name=width]', g).value }]; }));
      $('#savep').onclick = async () => { if (await act(() => PUT('/settings', { printers: collect(), print_kot: $('#kp').checked, kds_fallback_print: $('#kf').checked, kds_course_gap_min: +$('#kg').value || 8, kds_hold_max_min: +$('#kh').value || 35, open_drawer_on_cash: $('#dr').checked }), 'Saved')) await reload(); };
      $$('[data-test]').forEach(b => b.onclick = async () => {
        await act(() => PUT('/settings', { printers: collect() }));
        const r = await act(() => POST('/print/test', { printer: b.dataset.test }));
        handlePrint(r);
      });
    }
    if (tab === 'tables') {
      box.innerHTML = '<div class="row" style="margin-bottom:10px"><button class="btn primary" id="nt">+ Table</button></div>' +
        table([{ k: 'name', label: 'Table' }, { k: 'area', label: 'Area' }, { k: 'seats', label: 'Seats', t: 'num' }, { k: 'sort', label: 'Order', t: 'num' }], S.boot.tables, { onRow: t => editT(t) });
      const editT = async t => {
        const v = await formModal(t.id ? `Table ${t.name}` : 'New table', [{ k: 'name', label: 'Name', required: true }, { k: 'area', label: 'Area', list: [...new Set(S.boot.tables.map(x => x.area))] }, { k: 'seats', label: 'Seats', type: 'number' }, { k: 'sort', label: 'Order', type: 'number' }],
          t, { extraFoot: t.id ? '<button class="btn danger" data-extra="del" style="margin-right:auto">Remove</button>' : '' });
        if (!v) return;
        if (v.__extra === 'del') await act(() => DEL(`/tables/${t.id}`));
        else await act(() => t.id ? PUT(`/tables/${t.id}`, v) : POST('/tables', v), 'Saved');
        await reload(); draw();
      };
      $('#nt').onclick = () => editT({ area: 'Inside', seats: 4 });
    }
    if (tab === 'taxes') {
      box.innerHTML = `<div class="card small" style="margin-bottom:12px">Food and soft drinks in a standalone restaurant: <b>GST 5%</b> (SAC 996331, no input credit).
        Alcohol is outside GST and carries <b>Goa VAT</b>. The 22% VAT rate set here is a placeholder: <b>confirm the current rate on liquor sold in bars and restaurants with your CA</b> before you open.</div>
        <div class="row" style="margin-bottom:10px"><button class="btn primary" id="ntx">+ Tax rate</button></div>` +
        table([{ k: 'name', label: 'Name' }, { k: 'kind', label: 'Type' }, { k: 'rate', label: 'Rate %', t: 'num' }, { k: 'hsn', label: 'Default HSN/SAC' }], S.boot.taxes, { onRow: t => editTx(t) });
      const editTx = async t => {
        const v = await formModal(t.id ? t.name : 'New tax rate', [{ k: 'name', label: 'Name', required: true, full: true }, { k: 'kind', label: 'Type', type: 'select', options: [['GST', 'GST (split CGST + SGST)'], ['VAT', 'State VAT (liquor)'], ['NONE', 'No tax']] }, { k: 'rate', label: 'Total rate %', type: 'number', step: 'any' }, { k: 'hsn', label: 'HSN / SAC' }], t);
        if (!v) return;
        await act(() => t.id ? PUT(`/taxes/${t.id}`, v) : POST('/taxes', v), 'Saved. Applies to new orders.');
        await reload(); draw();
      };
      $('#ntx').onclick = () => editTx({ kind: 'GST', rate: 5 });
    }
    if (tab === 'data') {
      const audit = await GET('/audit?limit=200');
      box.innerHTML = `<div class="card" style="margin-bottom:12px"><p>The database is one file on this computer (<code>pos/data/pos.db</code>). The server saves a copy in <code>pos/data/backups</code> every day and at every day close, keeping the latest 60.
        Copy that folder to Google Drive or a pen drive every week.</p><a class="btn primary" id="bk" href="#">Download a backup now</a></div><h2>Audit trail</h2>` +
        table([{ k: 'at', label: 'When', fmt: v => `${fmtDate(v)} ${fmtTime(v)}` }, { k: 'name', label: 'Who' }, { k: 'action', label: 'Action' }, { k: 'detail', label: 'Detail', fmt: v => `<span class="small">${esc(v)}</span>` }], audit);
      $('#bk').onclick = async e => {
        e.preventDefault();
        const res = await fetch('/api/backup', { headers: { authorization: 'Bearer ' + S.token } });
        if (!res.ok) return toast('Backup failed', 'bad');
        const a = document.createElement('a'); a.href = URL.createObjectURL(await res.blob()); a.download = `pos-backup-${today()}.db`; a.click();
      };
    }
  };
  await draw();
}, { label: 'Settings' });
