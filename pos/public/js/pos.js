// Service screens: login / clock-in, floor, order taking, payment, kitchen display, order history.
import {
  S, esc, money, money0, qty, $, $$, can, api, GET, POST, PUT, act, page, go, onLeave, topbar, toast, modal, formModal,
  confirmBox, table, handlePrint, beep, fmtTime, fmtDate, minsSince, today, rangePicker,
} from './ui.js';
import { computeBill } from '../calc.js';

// ---------- login ----------
page('login', null, async (main) => {
  if (S.token && S.me) return go('#/floor');
  let pin = '';
  main.innerHTML = `<div class="login"><div class="box">
    <h1 style="font-size:1.6rem">Dumplings &amp; Draught</h1><p class="muted">Enter your PIN</p>
    <div class="pinview" id="pv"></div>
    <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-n="${n}">${n}</button>`).join('')}<button data-n="c">⌫</button><button data-n="0">0</button><button data-n="ok" style="background:var(--accent);color:var(--accent-ink)">→</button></div>
    <div class="row" style="margin-top:16px;justify-content:center"><button class="btn ghost" id="clock">Clock in / out</button></div>
  </div></div>`;
  const pv = $('#pv');
  const show = () => { pv.textContent = '•'.repeat(pin.length); };
  const login = async () => {
    if (!pin) return;
    const r = await act(() => api('POST', '/login', { pin }));
    pin = ''; show();
    if (!r) return;
    S.token = r.token; S.me = r.staff; S.boot = null;
    localStorage.setItem('pos_token', r.token);
    go(r.staff.perms.includes('pos') || r.staff.perms.includes('*') ? '#/floor' : '#/kds');
  };
  const press = k => { if (k === 'c') pin = pin.slice(0, -1); else if (k === 'ok') return login(); else if (pin.length < 6) pin += k; show(); };
  $$('[data-n]', main).forEach(b => b.onclick = () => press(b.dataset.n));
  const onKey = e => { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('c'); else if (e.key === 'Enter') press('ok'); };
  document.addEventListener('keydown', onKey);
  onLeave(() => document.removeEventListener('keydown', onKey));
  $('#clock').onclick = async () => {
    if (!pin) return toast('Type your PIN first, then press Clock in / out');
    const r = await act(() => api('POST', '/clock', { pin }));
    pin = ''; show();
    if (r) toast(`${r.name}: clocked ${r.action}${r.action === 'out' ? ` (since ${fmtTime(r.since)})` : ''}`, 'ok');
  };
});

// ---------- floor ----------
page('floor', 'pos', async (main) => {
  const draw = async () => {
    const { orders } = await GET('/floor');
    const byTable = Object.fromEntries(orders.filter(o => o.table_id).map(o => [o.table_id, o]));
    const others = orders.filter(o => !o.table_id);
    const areas = {};
    for (const t of S.boot.tables) (areas[t.area] ||= []).push(t);
    main.innerHTML = topbar('Tables', `
        <span class="muted small">${orders.length} open · ${orders.reduce((a, o) => a + (o.covers || 0), 0)} guests</span>
        <button class="btn" id="ta">+ Takeaway</button><button class="btn" id="dl">+ Delivery</button>`) +
      Object.entries(areas).map(([a, ts]) => `<div class="area"><h3>${esc(a)}</h3><div class="tables">${ts.map(t => {
        const o = byTable[t.id];
        return `<div class="tbl ${o ? o.status : ''}" data-t="${t.id}">${o?.ready ? '<span class="dot" title="Food ready"></span>' : ''}
          <span class="n">${esc(t.name)}</span>
          ${o ? `<span class="small">${o.covers || '-'} pax · ${minsSince(o.opened_at)} min</span><b>${money0(o.total)}</b>
                 <span class="small muted">${o.status === 'billed' ? 'Bill printed' : o.unsent ? `${o.unsent} not sent` : esc(o.staff_name || '')}</span>`
              : `<span class="small muted">${t.seats} seat${t.seats === 1 ? '' : 's'}</span>`}
        </div>`;
      }).join('')}</div></div>`).join('') +
      (others.length ? `<div class="area"><h3>Takeaway &amp; delivery</h3><div class="tables">${others.map(o => `
        <div class="tbl ${o.status}" data-o="${o.id}">${o.ready ? '<span class="dot"></span>' : ''}<span class="n">#${o.id}</span>
        <span class="small">${o.type === 'takeaway' ? 'Takeaway' : 'Delivery'} · ${minsSince(o.opened_at)} min</span><b>${money0(o.total)}</b></div>`).join('')}</div></div>` : '');
    $$('[data-t]', main).forEach(el => el.onclick = () => openTable(+el.dataset.t, byTable[el.dataset.t]));
    $$('[data-o]', main).forEach(el => el.onclick = () => go(`#/order/${el.dataset.o}`));
    $('#ta').onclick = () => newOrder({ type: 'takeaway' });
    $('#dl').onclick = () => newOrder({ type: 'delivery' });
  };
  const openTable = async (tid, o) => {
    if (o) return go(`#/order/${o.id}`);
    const t = S.boot.tables.find(x => x.id === tid);
    const covers = await modal({
      title: `Table ${t.name}: how many guests?`,
      body: `<div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<button data-c="${n}">${n}</button>`).join('')}<button data-c="0" style="grid-column:span 2">Skip</button></div>`,
      onOpen: (m, close) => $$('[data-c]', m).forEach(b => b.onclick = () => close(+b.dataset.c)),
    });
    if (covers === undefined) return;
    newOrder({ type: 'dine', table_id: tid, covers });
  };
  const newOrder = async body => { const o = await act(() => POST('/orders', body)); if (o) go(`#/order/${o.id}`); };
  await draw();
  const timer = setInterval(() => draw().catch(() => {}), 10000);
  onLeave(() => clearInterval(timer));
}, { label: 'Tables' });

// ---------- order ----------
const VOID_REASONS = ['Guest changed mind', 'Wrong item punched', 'Kitchen mistake', 'Quality complaint', 'Item not available', 'Long wait'];

page('order/:id', 'pos', async (main, { id }) => {
  let o = await GET(`/orders/${id}`);
  const B = S.boot;
  const cats = B.categories;
  let cat = sessionStorage.getItem('pos_cat') ? +sessionStorage.getItem('pos_cat') : cats[0]?.id;
  let search = '';
  const set = B.settings;
  const opts = () => ({ pricesIncludeTax: !!set.prices_include_tax, composition: set.gst_scheme === 'composition',
    discountType: o.discount_type, discountValue: o.discount_value, serviceChargePct: o.service_charge_pct });

  const inclView = set.bill_tax_display === 'inclusive';
  const taxRateOf = x => x.tax_kind === 'NONE' || (x.tax_kind !== 'VAT' && set.gst_scheme === 'composition') ? 0 : +x.tax_rate || 0;
  const showPrice = x => inclView && !set.prices_include_tax ? Math.round(x.price * (1 + taxRateOf(x) / 100) * 100) / 100 : x.price;

  main.innerHTML = `<div class="order">
    <div class="cats" id="cats"></div>
    <div class="items"><div class="search"><button class="btn" id="back">← Tables</button><input id="q" placeholder="Search menu (name or code)" autocomplete="off"></div><div class="igrid" id="grid"></div></div>
    <div class="ticket" id="ticket"></div></div>`;

  const drawCats = () => {
    $('#cats').innerHTML = cats.map(c => `<button data-c="${c.id}" class="${c.id === cat && !search ? 'on' : ''}">${esc(c.name)}</button>`).join('');
    $$('#cats [data-c]').forEach(b => b.onclick = () => { cat = +b.dataset.c; sessionStorage.setItem('pos_cat', cat); search = ''; $('#q').value = ''; drawCats(); drawItems(); });
  };
  const drawItems = () => {
    const s = search.toLowerCase();
    const list = B.items.filter(i => s ? (i.name.toLowerCase().includes(s) || (i.code || '').toLowerCase() === s) : i.category_id === cat);
    $('#grid').innerHTML = list.map(i => `<div class="it ${i.available ? '' : 'off'}" data-i="${i.id}">
        <span class="nm">${esc(i.name)}</span><span class="pr"><span class="vg ${i.veg ? '' : 'nv'}"></span>${money(showPrice(i))}</span></div>`).join('')
      || '<p class="muted">No items.</p>';
    $$('#grid [data-i]').forEach(el => {
      let t;
      el.onpointerdown = () => { t = setTimeout(() => { t = null; itemMenu(+el.dataset.i); }, 550); };
      el.onpointerup = () => { if (t) { clearTimeout(t); add(+el.dataset.i); } };
      el.onpointerleave = () => clearTimeout(t);
      el.oncontextmenu = e => e.preventDefault();
    });
  };
  const add = async (itemId, extra = {}) => {
    const it = B.items.find(i => i.id === itemId);
    if (!it.available) return toast(`${it.name} is off the menu right now (long-press to turn it back on)`, 'bad');
    if (o.status !== 'open') return toast('Bill printed. Reopen the order to add items.', 'bad');
    const r = await act(() => POST(`/orders/${o.id}/lines`, { item_id: itemId, qty: 1, ...extra }));
    if (r) { o = r; drawTicket(); }
  };
  const itemMenu = async itemId => {
    const it = B.items.find(i => i.id === itemId);
    const v = await formModal(it.name, [
      { k: 'qty', label: 'Quantity', type: 'number', value: 1, step: 'any', required: true },
      { k: 'note', label: 'Kitchen note', list: ['Less spicy', 'Extra spicy', 'No onion', 'No garlic', 'Jain', 'Pack separately', 'Serve first', 'Allergy: see server'] },
      ...(can('pos') ? [{ k: 'available', label: 'Available (untick to 86 this item)', type: 'checkbox', value: !!it.available, full: true }] : []),
    ], {}, { okLabel: 'Add / save' });
    if (!v) return;
    if (!!v.available !== !!it.available) {
      await act(() => PUT(`/items/${itemId}/available`, { available: v.available }));
      it.available = v.available ? 1 : 0; drawItems();
      if (!v.available) return;
    }
    if (+v.qty > 0) add(itemId, { qty: +v.qty, note: v.note || '' });
  };

  const drawTicket = () => {
    const bill = computeBill(o.lines, opts());
    const t = o.table ? `Table ${esc(o.table.name)}` : o.type === 'takeaway' ? 'Takeaway' : 'Delivery';
    const paid = o.payments.reduce((a, p) => a + p.amount, 0);
    const unsent = o.lines.filter(l => l.status === 'new').length;
    const open = o.status === 'open';
    $('#ticket').innerHTML = `
      <div class="hd"><div class="row"><b style="font-size:1.15rem">${t}</b><span class="muted">#${o.id}</span>
        <span class="pill ${o.status === 'billed' ? 'info' : o.status === 'paid' ? 'ok' : o.status === 'void' ? 'bad' : ''}">${esc(o.status)}</span>
        <span style="flex:1"></span><button class="btn sm" id="more">More ▾</button></div>
        <div class="small muted">${o.covers || 0} pax · ${esc(o.staff?.name || '')} · ${fmtTime(o.opened_at)}${o.customer ? ` · ${esc(o.customer.name || o.customer.phone)}` : ''}</div>
        ${o.note ? `<div class="small warn">Note: ${esc(o.note)}</div>` : ''}</div>
      <div class="lines">${o.lines.map(l => `<div class="ln ${l.status === 'void' ? 'void' : l.status !== 'new' ? 'sent' : ''}" data-l="${l.id}">
          <div class="q">${l.status === 'new' && open ? `<button data-m="${l.id}">−</button><b>${qty(l.qty)}</b><button data-p="${l.id}">+</button>` : `<b>${qty(l.qty)}×</b>`}</div>
          <div><div class="nm">${esc(l.name)}</div>${l.note ? `<div class="nt">${esc(l.note)}</div>` : ''}${l.status === 'ready' ? '<div class="small ok">Ready</div>' : ''}${l.status === 'void' ? `<div class="small bad">${esc(l.void_reason)}</div>` : ''}</div>
          <div class="amt">${money(l.qty * showPrice(l), false)}</div></div>`).join('') || '<p class="muted" style="padding:14px">Tap items to add them.</p>'}</div>
      <div class="totals">
        ${inclView ? (() => {
          const v = bill.invoices.map(i => i.inclusive);
          const sum = k => v.reduce((a, x) => a + x[k], 0);
          return `<div class="r"><span>Sub total (incl. taxes)</span><span>${money(sum('subtotal'))}</span></div>
            ${sum('discount') ? `<div class="r"><span>Discount ${o.discount_type === 'pct' ? `(${o.discount_value}%)` : ''}</span><span>−${money(sum('discount'))}</span></div>` : ''}
            ${sum('serviceCharge') ? `<div class="r"><span>Service charge (optional)</span><span>${money(sum('serviceCharge'))}</span></div>` : ''}
            ${sum('roundOff') ? `<div class="r"><span>Round off</span><span>${money(sum('roundOff'))}</span></div>` : ''}`;
        })() : `
        <div class="r"><span>Sub total</span><span>${money(bill.subtotal)}</span></div>
        ${bill.discount ? `<div class="r"><span>Discount ${o.discount_type === 'pct' ? `(${o.discount_value}%)` : ''}</span><span>−${money(bill.discount)}</span></div>` : ''}
        ${bill.invoices.map(i => i.taxes.map(x => `<div class="r"><span>${x.label}${i.series === 'VAT' ? ' (liquor)' : ''}</span><span>${money(x.amount)}</span></div>`).join('')).join('')}
        ${bill.invoices.some(i => i.serviceCharge) ? `<div class="r"><span>Service charge (optional)</span><span>${money(bill.invoices.reduce((a, i) => a + i.serviceCharge, 0))}</span></div>` : ''}`}
        <div class="r g"><span>Total</span><span>${money(bill.total)}</span></div>
        ${inclView && bill.tax ? `<div class="r small"><span>Includes taxes</span><span>${money(bill.tax)}</span></div>` : ''}
        ${paid ? `<div class="r"><span>Paid</span><span>${money(paid)}</span></div><div class="r"><b>Balance</b><b>${money(o.due)}</b></div>` : ''}
      </div>
      <div class="actions">
        ${open ? `<button class="btn big ${unsent ? 'primary' : ''}" id="kot" ${unsent ? '' : 'disabled'}>Send to kitchen${unsent ? ` (${unsent})` : ''}</button>
                  ${unsent && o.type === 'dine' ? '<button class="btn" id="kotf" title="Send every course to the kitchen now, nothing held">Send &amp; fire all</button>' : ''}
                  <button class="btn big" id="bill" ${o.lines.length && can('bill') ? '' : 'disabled'}>Print bill</button>` : ''}
        ${o.status === 'billed' ? `<button class="btn big" id="reprint">Reprint bill</button><button class="btn big" id="reopen">Reopen</button>` : ''}
        ${['open', 'billed'].includes(o.status) && can('settle') ? `<button class="btn big ok wide" id="pay" ${o.lines.length ? '' : 'disabled'}>Pay ${money(o.status === 'open' ? bill.total - paid : o.due)}</button>` : ''}
        ${o.status === 'paid' ? `<button class="btn big" id="reprint">Reprint bill</button><button class="btn big primary" id="done">Done</button>` : ''}
      </div>`;
    $$('[data-p]').forEach(b => b.onclick = () => changeQty(+b.dataset.p, +1));
    $$('[data-m]').forEach(b => b.onclick = () => changeQty(+b.dataset.m, -1));
    $$('.ln[data-l]').forEach(el => el.onclick = e => { if (!e.target.closest('button')) lineMenu(+el.dataset.l); });
    $('#kot') && ($('#kot').onclick = () => sendKot());
    $('#kotf') && ($('#kotf').onclick = () => sendKot(true));
    $('#bill') && ($('#bill').onclick = printBill);
    $('#pay') && ($('#pay').onclick = () => payModal());
    $('#reprint') && ($('#reprint').onclick = async () => { const r = await act(() => POST(`/orders/${o.id}/print`, { reprint: true })); if (r) handlePrint(r.print); });
    $('#reopen') && ($('#reopen').onclick = reopen);
    $('#done') && ($('#done').onclick = () => go('#/floor'));
    $('#more').onclick = moreMenu;
  };
  const changeQty = async (lid, d) => {
    const l = o.lines.find(x => x.id === lid);
    const r = await act(() => PUT(`/orders/${o.id}/lines/${lid}`, { qty: l.qty + d }));
    if (r) { o = r; drawTicket(); }
  };
  const lineMenu = async lid => {
    const l = o.lines.find(x => x.id === lid);
    if (l.status === 'void' || o.status !== 'open') return;
    if (l.status === 'new') {
      const v = await formModal(l.name, [
        { k: 'qty', label: 'Quantity', type: 'number', step: 'any', value: l.qty },
        { k: 'note', label: 'Kitchen note', value: l.note, list: ['Less spicy', 'Extra spicy', 'No onion', 'No garlic', 'Jain', 'Pack separately', 'Serve first'] },
        ...(can('discount') ? [{ k: 'price', label: 'Price (manager)', type: 'number', step: 'any', value: l.price }] : []),
      ], {}, { extraFoot: '<button class="btn danger" data-extra="rm" style="margin-right:auto">Remove</button>' });
      if (v === undefined) return;
      const r = await act(() => PUT(`/orders/${o.id}/lines/${lid}`, v.__extra === 'rm' ? { qty: 0 } : v));
      if (r) { o = r; drawTicket(); }
      return;
    }
    const v = await formModal(`Void ${qty(l.qty)} × ${l.name}`, [
      { k: 'reason', label: 'Reason', type: 'select', options: VOID_REASONS.map(x => [x, x]) },
      { k: 'wasted', label: 'Food was made and thrown away (record as waste)', type: 'checkbox', value: false, full: true },
      { k: 'html', type: 'html', html: '<p class="small muted">Already sent to the kitchen, so a void slip will print there. Needs a manager.</p>' },
    ], {}, { okLabel: 'Void item' });
    if (!v) return;
    const r = await act(() => POST(`/orders/${o.id}/lines/${lid}/void`, v));
    if (r) { o = r.order; handlePrint(r.prints); drawTicket(); }
  };
  const sendKot = async (fire) => {
    const r = await act(() => POST(`/orders/${o.id}/kot`, fire === true ? { fire: true } : {}));
    if (!r) return;
    o = r.order; handlePrint(r.prints);
    const held = o.lines.filter(l => l.hold && l.status === 'sent').length;
    if (r.prints.some(p => p.fallback)) toast('The kitchen screen is offline, so the KOT was printed', 'bad');
    else toast(held ? `Sent. ${held} later-course item${held > 1 ? 's' : ''} held until the starters are ready` : 'Sent to the screens', 'ok');
    drawTicket();
  };
  const printBill = async () => {
    const r = await act(() => POST(`/orders/${o.id}/bill`));
    if (!r) return;
    o = r.order; handlePrint(r.print); drawTicket();
  };
  const reopen = async () => {
    const v = await formModal('Reopen bill', [{ k: 'reason', label: 'Why? (the printed invoice numbers are cancelled and new ones issued)', required: true, full: true }]);
    if (!v) return;
    const r = await act(() => POST(`/orders/${o.id}/reopen`, v));
    if (r) { o = r; drawTicket(); }
  };

  const payModal = async () => {
    const bill = computeBill(o.lines, opts());
    const due = o.status === 'open' ? bill.total - o.payments.reduce((a, p) => a + p.amount, 0) : o.due;
    let rows = [{ mode: 'cash', amount: due, ref: '' }];
    const r = await modal({
      title: `Payment · ${money(due)}`,
      body: `<div class="row" id="quick">
          <button class="btn big" data-q="cash">Cash ${money0(due)}</button><button class="btn big" data-q="upi">UPI</button><button class="btn big" data-q="card">Card</button></div>
        <div id="rows"></div><button class="btn sm" id="addrow">+ Split payment</button>
        <div class="row" id="notes">${[100, 200, 500, 1000, 2000].filter(n => n >= due / 4).map(n => `<button class="btn sm" data-n="${n}">₹${n}</button>`).join('')}</div>
        <div class="card"><div class="row"><span>Paying</span><b id="sum" style="margin-left:auto"></b></div><div class="row"><span id="chgL">Change</span><b id="chg" style="margin-left:auto;font-size:1.3rem"></b></div></div>
        <label class="chk"><input type="checkbox" id="printit" checked> Print bill</label>`,
      foot: '<button class="btn ghost" data-c>Cancel</button><button class="btn ok big" data-ok>Complete payment</button>',
      onOpen: (m, close) => {
        const draw = () => {
          $('#rows', m).innerHTML = rows.map((p, i) => `<div class="row" style="flex-wrap:nowrap">
            <select data-k="mode" data-i="${i}" style="width:120px">${['cash', 'upi', 'card', 'other'].map(x => `<option ${p.mode === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
            <input type="number" step="any" data-k="amount" data-i="${i}" value="${p.amount}" style="width:130px">
            <input data-k="ref" data-i="${i}" value="${esc(p.ref)}" placeholder="${p.mode === 'cash' ? 'Tendered' : 'Ref / last 4'}">
            ${rows.length > 1 ? `<button class="btn ghost sm" data-del="${i}">✕</button>` : ''}</div>`).join('');
          $$('[data-k]', m).forEach(el => el.oninput = () => { rows[+el.dataset.i][el.dataset.k] = el.dataset.k === 'amount' ? +el.value : el.value; if (el.dataset.k === 'mode') draw(); else sums(); });
          $$('[data-del]', m).forEach(b => b.onclick = () => { rows.splice(+b.dataset.del, 1); draw(); });
          sums();
        };
        const sums = () => {
          const s = rows.reduce((a, p) => a + (+p.amount || 0), 0);
          $('#sum', m).textContent = money(s);
          $('#chgL', m).textContent = s >= due ? 'Change to give' : 'Still due';
          $('#chg', m).textContent = money(Math.abs(s - due));
          $('#chg', m).className = s >= due ? 'ok' : 'bad';
        };
        $$('[data-q]', m).forEach(b => b.onclick = () => { rows = [{ mode: b.dataset.q, amount: due, ref: '' }]; draw(); });
        $$('[data-n]', m).forEach(b => b.onclick = () => { const c = rows.find(p => p.mode === 'cash') || rows[0]; c.mode = 'cash'; c.amount = +b.dataset.n; draw(); });
        $('#addrow', m).onclick = () => { const s = rows.reduce((a, p) => a + (+p.amount || 0), 0); rows.push({ mode: 'upi', amount: Math.max(0, Math.round((due - s) * 100) / 100), ref: '' }); draw(); };
        $('[data-c]', m).onclick = () => close();
        $('[data-ok]', m).onclick = () => close({ payments: rows, print: $('#printit', m).checked });
        draw();
      },
    });
    if (!r) return;
    const res = await act(() => POST(`/orders/${o.id}/pay`, r));
    if (!res) return;
    o = res.order;
    if (res.print) handlePrint(res.print);
    const change = o.payments.reduce((a, p) => a + (p.tendered ? p.tendered - p.amount : 0), 0);
    if (o.status === 'paid') {
      toast(change > 0 ? `Paid. Give change ${money(change)}` : 'Paid', 'ok');
      if (change > 0) await modal({ title: 'Give change', body: `<p style="font-size:2.4rem;font-weight:800;text-align:center">${money(change)}</p>`, foot: '<button class="btn primary big" data-c>OK</button>', onOpen: (m, c) => $('[data-c]', m).onclick = () => c() });
      go('#/floor');
    } else drawTicket();
  };

  const moreMenu = async () => {
    const live = ['open', 'billed'].includes(o.status);
    const choice = await modal({
      title: 'Order options',
      body: `<div class="grid2">
        ${live ? `<button class="btn big" data-a="covers">Guests (${o.covers || 0})</button>
        <button class="btn big" data-a="customer">${o.customer ? 'Change customer' : 'Customer / GSTIN'}</button>
        <button class="btn big" data-a="note">Order note</button>
        <button class="btn big" data-a="move">Move table</button>` : ''}
        ${o.status === 'open' ? `<button class="btn big" data-a="discount">Discount</button>
        <button class="btn big" data-a="service">Service charge</button>
        <button class="btn big" data-a="merge">Merge into…</button>
        <button class="btn big" data-a="preview">Print pro-forma</button>` : ''}
        ${can('settle') ? '<button class="btn big" data-a="drawer">Open cash drawer</button>' : ''}
        ${live ? '<button class="btn big danger" data-a="cancel">Cancel order</button>' : ''}
        ${o.payments.length && can('settle') ? '<button class="btn big danger" data-a="refund">Refund a payment</button>' : ''}
        ${o.invoices.filter(i => !i.cancelled).length && o.status === 'paid' ? '<button class="btn big danger" data-a="cancelinv">Cancel an invoice</button>' : ''}
      </div>`,
      onOpen: (m, close) => $$('[data-a]', m).forEach(b => b.onclick = () => close(b.dataset.a)),
    });
    const upd = async body => { const r = await act(() => PUT(`/orders/${o.id}`, body)); if (r) { o = r; drawTicket(); } };
    switch (choice) {
      case 'covers': { const v = await formModal('Guests', [{ k: 'covers', label: 'Number of guests', type: 'number', value: o.covers }]); if (v) upd(v); break; }
      case 'note': { const v = await formModal('Order note', [{ k: 'note', label: 'Prints on every KOT', value: o.note, full: true }]); if (v) upd(v); break; }
      case 'discount': {
        const v = await formModal('Discount (before tax)', [
          { k: 'discount_type', label: 'Type', type: 'select', options: [['pct', 'Percent %'], ['amt', 'Amount ₹'], ['', 'No discount']], value: o.discount_type || 'pct' },
          { k: 'discount_value', label: 'Value', type: 'number', step: 'any', value: o.discount_value || '' },
          { k: 'discount_reason', label: 'Reason', value: o.discount_reason, list: ['Regular guest', 'Staff meal', 'Owner guest', 'Complaint', 'Happy hour', 'Promotion'], full: true },
          { k: 'html', type: 'html', html: `<p class="small muted">Above ${S.boot.settings.discount_limit_pct}% needs a manager PIN.</p>` },
        ]);
        if (v) upd({ ...v, discount_value: v.discount_type ? +v.discount_value || 0 : 0 });
        break;
      }
      case 'service': {
        const v = await formModal('Service charge', [{ k: 'service_charge_pct', label: 'Percent (guests may ask to remove it; it cannot be compulsory)', type: 'number', step: 'any', value: o.service_charge_pct, full: true }]);
        if (v) upd({ service_charge_pct: +v.service_charge_pct || 0 });
        break;
      }
      case 'customer': return customerPicker();
      case 'move': {
        const { orders } = await GET('/floor');
        const busy = new Set(orders.map(x => x.table_id));
        const v = await formModal('Move to table', [{ k: 'table_id', label: 'Free tables', type: 'select', options: S.boot.tables.filter(t => !busy.has(t.id)).map(t => [t.id, `${t.name} · ${t.area}`]) }]);
        if (v) upd({ table_id: +v.table_id });
        break;
      }
      case 'merge': {
        const { orders } = await GET('/floor');
        const others = orders.filter(x => x.id !== o.id && x.status === 'open');
        if (!others.length) return toast('No other open orders');
        const v = await formModal('Merge this order into…', [{ k: 'into', label: 'Order', type: 'select', options: others.map(x => [x.id, `${x.table_name ? 'Table ' + x.table_name : x.type} · #${x.id} · ${money0(x.total)}`]) }]);
        if (!v) return;
        const r = await act(() => POST(`/orders/${o.id}/merge`, { into_id: +v.into }));
        if (r) go(`#/order/${r.id}`);
        break;
      }
      case 'preview': { const r = await act(() => POST(`/orders/${o.id}/print`, {})); if (r) handlePrint(r.print); break; }
      case 'drawer': { const r = await act(() => POST('/print/drawer')); if (r?.browser) toast('Drawer opens only with a thermal printer set to network/USB'); break; }
      case 'cancel': {
        const v = await formModal('Cancel whole order', [
          { k: 'reason', label: 'Reason', required: true, list: ['Guest left', 'Duplicate order', 'Test order', 'Wrong table'], full: true },
          { k: 'wasted', label: 'Food already made (record as waste)', type: 'checkbox', full: true },
        ], {}, { okLabel: 'Cancel order' });
        if (!v) return;
        const r = await act(() => POST(`/orders/${o.id}/cancel`, v));
        if (r) { toast('Order cancelled'); go('#/floor'); }
        break;
      }
      case 'refund': {
        const v = await formModal('Refund a payment', [
          { k: 'pid', label: 'Payment', type: 'select', options: o.payments.map(p => [p.id, `${p.mode.toUpperCase()} ${money(p.amount)} at ${fmtTime(p.at)}`]) },
          { k: 'reason', label: 'Reason', required: true, full: true },
        ], {}, { okLabel: 'Refund' });
        if (!v) return;
        const r = await act(() => POST(`/payments/${v.pid}/refund`, { reason: v.reason }));
        if (r) { o = r; drawTicket(); toast('Payment removed. Hand back the money and re-take payment.'); }
        break;
      }
      case 'cancelinv': {
        const v = await formModal('Cancel an issued invoice', [
          { k: 'iid', label: 'Invoice', type: 'select', options: o.invoices.filter(i => !i.cancelled).map(i => [i.id, `${i.invoice_no} · ${money(i.total)}`]) },
          { k: 'reason', label: 'Reason (kept in the audit trail and GST document summary)', required: true, full: true },
        ], {}, { okLabel: 'Cancel invoice' });
        if (!v) return;
        const r = await act(() => POST(`/invoices/${v.iid}/cancel`, { reason: v.reason }));
        if (r) { o = r; drawTicket(); }
        break;
      }
    }
  };

  const customerPicker = async () => {
    const res = await modal({
      title: 'Customer',
      body: `<input id="cq" placeholder="Search phone or name" autocomplete="off"><div id="cl"></div>
             <p class="small muted">For a business guest who wants GST credit, add their GSTIN; it prints on the tax invoice.</p>`,
      foot: '<button class="btn ghost" data-none>Remove customer</button><button class="btn primary" data-new>+ New customer</button>',
      onOpen: (m, close) => {
        const q = $('#cq', m); q.focus();
        let t;
        q.oninput = () => { clearTimeout(t); t = setTimeout(async () => {
          const list = q.value.length >= 2 ? await GET(`/customers/search?q=${encodeURIComponent(q.value)}`) : [];
          $('#cl', m).innerHTML = list.map(c => `<button class="btn block" style="justify-content:space-between;margin-top:6px" data-id="${c.id}"><span>${esc(c.name || '-')} ${c.gstin ? `<span class="pill">GSTIN</span>` : ''}</span><span class="muted">${esc(c.phone)} · ${c.visits} visits</span></button>`).join('');
          $$('[data-id]', m).forEach(b => b.onclick = () => close({ id: +b.dataset.id }));
        }, 200); };
        $('[data-none]', m).onclick = () => close({ id: null });
        $('[data-new]', m).onclick = () => close({ create: q.value });
      },
    });
    if (!res) return;
    let cid = res.id;
    if (res.create !== undefined) {
      const v = await formModal('New customer', [
        { k: 'name', label: 'Name' }, { k: 'phone', label: 'Phone', value: /^\d+$/.test(res.create) ? res.create : '', inputmode: 'tel' },
        { k: 'gstin', label: 'GSTIN (business guests)' }, { k: 'email', label: 'Email', type: 'email' },
        { k: 'address', label: 'Billing address (needed with a GSTIN)', type: 'textarea' },
      ], { name: /^\d+$/.test(res.create) ? '' : res.create });
      if (!v) return;
      const c = await act(() => POST('/customers', v));
      if (!c) return;
      cid = c.id;
    }
    const r = await act(() => PUT(`/orders/${o.id}`, { customer_id: cid }));
    if (r) { o = r; drawTicket(); }
  };

  $('#back').onclick = () => go('#/floor');
  $('#q').oninput = e => { search = e.target.value.trim(); drawCats(); drawItems(); };
  $('#q').onkeydown = e => { if (e.key === 'Enter') { const first = $('#grid [data-i]'); if (first) add(+first.dataset.i); } };
  drawCats(); drawItems(); drawTicket();
});

// ---------- kitchen display (smart KDS) ----------
// Three screens: the hot line (wok, stock pots, fryer, steamer, cold), the bar, and the pass (every table, what is ready to run).
const KDS_NAME = { wok: 'Wok', stock: 'Stock pots', fry: 'Fryer', steam: 'Steamer', cold: 'Cold & plate', pass: 'Pass', bar: 'Bar' };
const KDS_SCREENS = [['hot', 'Hot line'], ['pass', 'Pass'], ['bar', 'Bar']];
const KDS_COURSE = { 0: 'Drinks', 1: 'Starters', 2: 'Mains', 3: 'Dessert' };
const kdsAlert = n => /allerg|nut|gluten|jain|vegan|shellfish|dairy|no (onion|garlic|egg|meat|chicken|pork|prawn|fish)/i.test(n || '');
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const vdot = v => (v == null ? '' : `<i class="vt ${v ? 'v' : 'n'}" title="${v ? 'Veg' : 'Non-veg'}"></i>`);
let kdsAudio = false;
const kdsUnlock = () => { kdsAudio = true; document.querySelector('.kdssound')?.remove(); };

async function kdsPage(main, params) {
  const kiosk = !!params.screen;
  let screen = params.screen || localStorage.getItem('kds_screen') || 'hot';
  if (!['hot', 'bar', 'pass'].includes(screen)) screen = 'hot';
  let voidSeen = null;
  let station = '', sig = '', seen = null, ready = null, fetched = Date.now(), sound = localStorage.getItem('kds_sound') !== '0';
  let info = { stats: { stations: [] }, recent: [], alive: {} };
  document.addEventListener('pointerdown', kdsUnlock, { once: true });
  try { navigator.wakeLock?.request('screen').catch(() => {}); } catch { /* not supported */ }
  const chime = n => { if (sound && kdsAudio) { beep(); if (n > 1) setTimeout(beep, 260); } };

  const ticketHtml = t => `<div class="kot ${screen === 'bar' ? 'k-bar' : 'k-hot'}" data-key="${t.key}" data-age="${t.age_s}" data-target="${t.target_min}">
      <div class="h"><b>${t.table ? esc(t.table) : t.type === 'takeaway' ? 'TAKEAWAY' : 'DELIVERY'}</b><span><span class="age">0:00</span> / ${t.target_min} min</span></div>
      <div class="prog"><i></i></div>
      <ul>${t.lines.map(l => `<li data-l="${l.id}" data-go="${l.start_in_s}" class="${l.start_in_s > 0 ? 'wait' : ''}">
        <span class="q">${qty(l.qty)}×</span><span class="dn">${esc(l.name)}</span> ${vdot(l.veg)}
        <span class="chip c-${l.prep}">${KDS_NAME[l.prep] || l.prep}</span><span class="cd"></span>
        ${l.note ? `<span class="nt ${kdsAlert(l.note) ? 'alert' : ''}">${esc(l.note)}</span>` : ''}</li>`).join('')}</ul>
      ${t.note ? `<div class="small warn" style="padding:6px 12px">${esc(t.note)}</div>` : ''}
      <div class="row f"><span class="small muted">KOT ${t.kot_no}${t.covers ? ` · ${t.covers} pax` : ''} · ${esc(t.staff || '')}</span><span style="flex:1"></span>
        <button class="btn sm primary" data-all="${t.order_id}:${t.kot_no}">All ready</button></div></div>`;

  const orderHtml = o => {
    const courses = [...new Set(o.lines.map(l => l.course))].sort();
    const rtr = courses.some(c => { const ls = o.lines.filter(l => l.course === c && !l.hold); return ls.length && ls.every(l => l.status === 'ready'); });
    const held = o.lines.some(l => l.hold);
    return `<div class="ord ${rtr ? 'rtr' : ''}" data-age="${o.age_s}">
      <div class="h"><b>${o.table ? esc(o.table) : o.type === 'takeaway' ? 'TAKEAWAY' : 'DELIVERY'}</b><span>${o.covers ? o.covers + ' pax · ' : ''}<span class="age">0:00</span></span></div>
      ${rtr ? '<div class="rtrb">READY TO RUN</div>' : ''}
      ${courses.map(c => {
        const ls = o.lines.filter(l => l.course === c), live = ls.filter(l => !l.hold), done = live.length && live.every(l => l.status === 'ready');
        return `<div class="crs"><h4>${KDS_COURSE[c] ?? 'Course ' + c}${ls.every(l => l.hold) ? ' <span class="hb">HELD</span>' : ''}${done ? `<button class="btn sm ok" data-serve="${o.order_id}:${c}">Served ✓</button>` : ''}</h4>
          ${ls.map(l => `<div class="pl s-${l.hold ? 'hold' : l.status}">${qty(l.qty)}× ${esc(l.name)} ${vdot(l.veg)}<span class="chip c-${l.prep}">${KDS_NAME[l.prep] || l.prep}</span>
            <span class="ps">${l.hold ? 'held' : l.status === 'ready' ? `ready ${Math.floor(l.ready_s / 60)} min` : 'cooking'}</span>${l.note ? `<span class="nt ${kdsAlert(l.note) ? 'alert' : ''}">${esc(l.note)}</span>` : ''}</div>`).join('')}</div>`;
      }).join('')}
      ${held ? `<div class="row f"><button class="btn sm" data-fire="${o.order_id}">Fire next course now</button></div>` : ''}</div>`;
  };

  const shell = () => {
    const chips = screen === 'hot' ? [['', 'All hot'], ['wok', 'Wok'], ['stock', 'Stock'], ['fry', 'Fryer'], ['steam', 'Steam'], ['cold', 'Cold']] : [];
    const st = info.stats || {};
    return `<div class="kdsroot ${kiosk ? 'kiosk' : ''}"><div class="kdsbar">
        ${kiosk ? (can('pos') ? '<a class="btn ghost sm" href="#/floor">☰ POS</a>' : '') : '<button class="btn ghost" id="menuBtn" onclick="document.getElementById(\'side\').classList.toggle(\'open\')">☰</button>'}
        <h1>${KDS_SCREENS.find(x => x[0] === screen)[1]}</h1>
        <div class="seg">${KDS_SCREENS.map(([k, l]) => `<button data-scr="${k}" class="${screen === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        ${chips.length ? `<div class="seg">${chips.map(([k, l]) => `<button data-st="${k}" class="${station === k ? 'on' : ''}">${l}</button>`).join('')}</div>` : ''}
        <span class="kstat small muted">${st.open ?? 0} cooking · ${st.held ?? 0} held · oldest ${st.oldest_min ?? 0} min${(st.stations || []).slice(0, 4).map(x => ` · ${KDS_NAME[x.prep]} avg ${x.avg_min}m`).join('')}</span>
        <button class="btn sm" id="ksnd">${sound ? '🔔' : '🔕'}</button><button class="btn sm" id="krec">Recent</button><button class="btn sm" id="kfs">⛶</button></div>
      ${!kdsAudio && sound ? '<div class="kdssound">Tap the screen once to turn on the new-order sound</div>' : ''}
      <div class="kbody" id="kbody"></div></div>`;
  };

  const voidHtml = v => `<div class="voidcard" data-vid="${v.id}"><b>CANCELLED</b> ${esc(v.table_name || v.type)}: ${qty(v.qty)}× ${esc(v.name)}<span class="small"> · ${esc(v.void_reason || '')}</span><button class="btn sm" data-ack="${v.id}">OK</button></div>`;
  const acked = () => { try { return new Set(JSON.parse(localStorage.getItem('kds_ack') || '[]')); } catch { return new Set(); } };

  const timing = () => {
    const dt = (Date.now() - fetched) / 1000;
    $$('.kot,.ord', main).forEach(el => {
      const age = (+el.dataset.age || 0) + dt, tgt = (+el.dataset.target || 0) * 60;
      $('.age', el).textContent = mmss(age);
      if (el.classList.contains('kot')) {
        el.classList.toggle('late', age > tgt && age <= tgt + 180); el.classList.toggle('very', age > tgt + 180);
        const p = $('.prog i', el); if (p) p.style.width = `${Math.min(100, tgt ? age / tgt * 100 : 0)}%`;
      } else el.classList.toggle('late', age > 25 * 60);
    });
    let went = 0;
    $$('li[data-go]', main).forEach(li => {
      const left = (+li.dataset.go) - dt, cd = $('.cd', li);
      if (left > 0) { li.classList.add('wait'); cd.textContent = `start in ${mmss(left)}`; }
      else { if (li.classList.contains('wait')) { li.classList.remove('wait'); li.classList.add('go'); went++; setTimeout(() => li.classList.remove('go'), 9000); } cd.textContent = ''; }
    });
    if (went) chime(1);
  };

  const bind = () => {
    $$('[data-scr]', main).forEach(b => b.onclick = () => { screen = b.dataset.scr; station = ''; localStorage.setItem('kds_screen', screen); if (kiosk) location.hash = `#/kds/${screen}`; else { sig = ''; seen = ready = null; paintAll(); } });
    $$('[data-st]', main).forEach(b => b.onclick = () => { station = b.dataset.st; sig = ''; paintAll(); });
    $('#ksnd', main).onclick = () => { sound = !sound; localStorage.setItem('kds_sound', sound ? '1' : '0'); kdsUnlock(); $('#ksnd', main).textContent = sound ? '🔔' : '🔕'; };
    $('#kfs', main).onclick = () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); };
    $('#krec', main).onclick = async () => {
      info = await GET('/kds/info');
      const v = await modal({ title: 'Recently served', body: info.recent.length ? info.recent.map(r => `<div class="row" style="justify-content:space-between;gap:12px"><div><b>${esc(r.table_name || r.type)}</b> · KOT ${r.kot_no}<div class="small muted">${esc(r.names)}</div></div><button class="btn sm" data-rc="${r.order_id}:${r.kot_no}">Recall</button></div>`).join('<hr>') : '<p class="muted">Nothing served in the last 45 minutes.</p>', foot: '<button class="btn ghost" data-c>Close</button>' });
      return v;
    };
  };
  const onRecall = async e => {
    const rc = e.target.closest?.('[data-rc]'); if (!rc) return;
    const [order_id, kot_no] = rc.dataset.rc.split(':'); await act(() => POST('/kds/recall', { order_id, kot_no }), 'Recalled to the pass'); rc.closest('.row')?.remove(); sig = '';
  };
  document.addEventListener('click', onRecall);

  const paintAll = () => { main.innerHTML = shell(); bind(); load(true); };
  let busy = false;
  const load = async force => {
    if (busy) return; busy = true;
    try {
      const d = await GET(`/kds?screen=${screen}${station ? `&station=${station}` : ''}`);
      fetched = Date.now();
      const body = $('#kbody', main); if (!body) return;
      const items = d.tickets || d.orders;
      const ak = acked(), vs = (d.voids || []).filter(v => !ak.has(v.id));
      const s = JSON.stringify([items.map(x => [x.key || x.order_id, x.lines.map(l => [l.id, l.status, l.hold, l.qty, l.note])]), vs.map(v => v.id)]);
      if (force || s !== sig) {
        sig = s;
        body.innerHTML = (vs.length ? `<div class="voids">${vs.map(voidHtml).join('')}</div>` : '') + (items.length
          ? `<div class="${d.tickets ? 'kds' : 'kds pass'}">${d.tickets ? d.tickets.map(ticketHtml).join('') : d.orders.map(orderHtml).join('')}</div>`
          : '<div class="card muted center" style="padding:40px;margin:16px">Nothing to cook right now.</div>');
        $$('[data-ack]', body).forEach(b => b.onclick = () => { const k = acked(); k.add(+b.dataset.ack); localStorage.setItem('kds_ack', JSON.stringify([...k].slice(-200))); sig = ''; load(); });
        $$('[data-all]', body).forEach(b => b.onclick = async () => { const [order_id, kot_no] = b.dataset.all.split(':'); await act(() => POST('/kds/tickets', { order_id, kot_no, status: 'ready' })); sig = ''; load(); });
        $$('li[data-l]', body).forEach(li => li.onclick = async () => { await act(() => POST(`/kds/lines/${li.dataset.l}`, { status: 'ready' })); sig = ''; load(); });
        $$('[data-serve]', body).forEach(b => b.onclick = async () => { const [order_id, course] = b.dataset.serve.split(':'); await act(() => POST('/kds/served', { order_id, course })); sig = ''; load(); });
        $$('[data-fire]', body).forEach(b => b.onclick = async () => { await act(() => POST('/kds/fire', { order_id: b.dataset.fire }), 'Fired'); sig = ''; load(); });
      } else {
        items.forEach(x => { const el = $(`[data-key="${x.key}"]`, body) || $(`.ord[data-age]`, body); if (x.key && el) { el.dataset.age = x.age_s; el.dataset.target = x.target_min; x.lines.forEach(l => { const li = $(`li[data-l="${l.id}"]`, el); if (li) li.dataset.go = l.start_in_s; }); } });
        if (d.orders) $$('.ord', body).forEach((el, i) => { if (d.orders[i]) el.dataset.age = d.orders[i].age_s; });
      }
      // new-order and ready-to-run sounds
      const keys = new Set(items.map(x => x.key || x.order_id));
      if (seen && [...keys].some(k => !seen.has(k)) && d.tickets) chime(1);
      seen = keys;
      const vk = new Set(vs.map(v => v.id)); if (voidSeen && [...vk].some(k => !voidSeen.has(k))) chime(2); voidSeen = vk;
      if (d.orders) { const r = new Set(d.orders.filter(o => o.lines.some(l => !l.hold && l.status === 'ready')).map(o => `${o.order_id}-${o.lines.filter(l => l.status === 'ready').length}`)); if (ready && [...r].some(k => !ready.has(k))) chime(2); ready = r; }
      timing();
    } finally { busy = false; }
  };
  const refreshInfo = async () => { try { info = await GET('/kds/info'); const k = $('.kstat', main); if (k) { const st = info.stats; k.textContent = `${st.open} cooking · ${st.held} held · oldest ${st.oldest_min} min${st.stations.slice(0, 4).map(x => ` · ${KDS_NAME[x.prep]} avg ${x.avg_min}m`).join('')}`; } } catch { /* offline */ } };
  paintAll(); refreshInfo();
  const t1 = setInterval(() => load().catch(() => {}), 2000), t2 = setInterval(timing, 1000), t3 = setInterval(refreshInfo, 30000);
  onLeave(() => { clearInterval(t1); clearInterval(t2); clearInterval(t3); document.removeEventListener('click', onRecall); document.removeEventListener('pointerdown', kdsUnlock); });
}
page('kds', 'kds', (m, p) => kdsPage(m, {}), { label: 'Kitchen display' });
page('kds/:screen', 'kds', (m, p) => kdsPage(m, p));

// ---------- orders history ----------
page('orders', 'orders', async (main) => {
  const st = { from: today(), to: today(), status: '' };
  const draw = async () => {
    const rows = await GET(`/orders?from=${st.from}&to=${st.to}${st.status ? `&status=${st.status}` : ''}`);
    main.innerHTML = topbar('Orders & bills') +
      `<div class="row" style="margin-bottom:12px">${rangePicker(st, draw)}
        <select id="fs" style="width:auto">${[['', 'All statuses'], ['open', 'Open'], ['billed', 'Billed, unpaid'], ['paid', 'Paid'], ['void', 'Cancelled']].map(([v, l]) => `<option value="${v}" ${st.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>` +
      table([
        { k: 'id', label: '#', t: 'num' }, { k: 'opened_at', label: 'Opened', fmt: v => `${fmtDate(v)} ${fmtTime(v)}` },
        { k: 'table_name', label: 'Where', fmt: (v, r) => esc(v || r.type) }, { k: 'covers', label: 'Pax', t: 'num' },
        { k: 'staff_name', label: 'Staff' }, { k: 'customer_name', label: 'Customer' }, { k: 'invoice_nos', label: 'Invoices' },
        { k: 'status', label: 'Status', fmt: v => `<span class="pill ${v === 'paid' ? 'ok' : v === 'void' ? 'bad' : v === 'billed' ? 'info' : 'warn'}">${v}</span>` },
        { k: 'total', label: 'Total', t: 'money' }, { k: 'paid', label: 'Paid', t: 'money' },
      ], rows, { totals: true, onRow: r => go(`#/order/${r.id}`), empty: 'No orders in this period.' });
    $('#fs').onchange = e => { st.status = e.target.value; draw(); };
  };
  await draw();
}, { label: 'Orders & bills' });
