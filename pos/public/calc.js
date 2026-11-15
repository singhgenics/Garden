// Bill maths, shared by the server (which is authoritative and numbers the invoices)
// and the browser (live ticket preview). Pure functions, no I/O.
//
// Liquor is outside GST in India and is taxed under state VAT, so a mixed order
// produces up to two invoices: a GST tax invoice for food/soft drinks and a VAT
// invoice for alcohol, each with its own number series and its own round-off.

export const r2 = n => Math.round((+n + Number.EPSILON) * 100) / 100;

/**
 * @param lines  [{name, qty, price, tax_kind:'GST'|'VAT'|'NONE', tax_rate, hsn, status}]
 * @param o      {pricesIncludeTax, discountType:'pct'|'amt'|'', discountValue,
 *                serviceChargePct, composition}
 */
export function computeBill(lines, o = {}) {
  const incl = !!o.pricesIncludeTax;
  const rows = lines
    .filter(l => l.status !== 'void' && +l.qty > 0)
    .map(l => {
      const series = l.tax_kind === 'VAT' ? 'VAT' : 'GST';
      // A composition dealer cannot collect GST, so GST lines carry no tax.
      const rate = l.tax_kind === 'NONE' || (series === 'GST' && o.composition) ? 0 : +l.tax_rate || 0;
      const gross = r2(l.qty * l.price);
      const base = incl ? gross / (1 + rate / 100) : gross;
      return { name: l.name, qty: +l.qty, price: +l.price, hsn: l.hsn || '', rate, gross, base, series };
    });

  // Discounts are applied before tax and spread over every line in proportion to its value.
  const baseTotal = rows.reduce((s, r) => s + r.base, 0);
  let disc = 0;
  if (o.discountType === 'pct') disc = baseTotal * Math.min(100, Math.max(0, +o.discountValue || 0)) / 100;
  else if (o.discountType === 'amt') disc = Math.min(baseTotal, Math.max(0, +o.discountValue || 0));
  const scPct = Math.max(0, +o.serviceChargePct || 0);
  for (const r of rows) {
    r.disc = baseTotal ? disc * r.base / baseTotal : 0;
    r.taxable = r.base - r.disc;
    r.sc = r.taxable * scPct / 100;
  }

  const invoices = [];
  for (const series of ['GST', 'VAT']) {
    const rs = rows.filter(r => r.series === series);
    if (!rs.length) continue;
    const byRate = new Map();
    const hsn = new Map();
    for (const r of rs) {
      const g = byRate.get(r.rate) || { rate: r.rate, taxable: 0 };
      g.taxable += r.taxable + r.sc;
      byRate.set(r.rate, g);
      const hk = `${r.hsn}|${r.rate}`;
      const h = hsn.get(hk) || { hsn: r.hsn, rate: r.rate, qty: 0, taxable: 0 };
      h.qty += r.qty; h.taxable += r.taxable + r.sc;
      hsn.set(hk, h);
    }
    const taxes = [];
    let cgst = 0, sgst = 0, vat = 0;
    for (const g of [...byRate.values()].sort((a, b) => a.rate - b.rate)) {
      g.taxable = r2(g.taxable);
      if (!g.rate) continue;
      if (series === 'GST') {
        const half = r2(g.taxable * g.rate / 200);
        cgst += half; sgst += half;
        taxes.push({ label: `CGST @${g.rate / 2}%`, kind: 'CGST', rate: g.rate / 2, on: g.taxable, amount: half });
        taxes.push({ label: `SGST @${g.rate / 2}%`, kind: 'SGST', rate: g.rate / 2, on: g.taxable, amount: half });
      } else {
        const v = r2(g.taxable * g.rate / 100);
        vat += v;
        taxes.push({ label: `VAT @${g.rate}%`, kind: 'VAT', rate: g.rate, on: g.taxable, amount: v });
      }
    }
    const subtotal = r2(rs.reduce((s, r) => s + r.gross, 0));
    const taxable = r2(rs.reduce((s, r) => s + r.taxable, 0));
    const serviceCharge = r2(rs.reduce((s, r) => s + r.sc, 0));
    const discount = r2(rs.reduce((s, r) => s + r.disc, 0));
    const taxTotal = r2(cgst + sgst + vat);
    const exact = r2(taxable + serviceCharge + taxTotal);
    const total = Math.round(exact);
    // Tax-inclusive view of the same invoice: every price carries its own tax, so the bill can
    // show items, discount and total only. The total is identical; any paisa difference goes to round-off.
    const f = r => 1 + r.rate / 100;
    const inclItems = rs.map(r => {
      const priceIncl = incl ? r.price : r2(r.price * f(r));
      return { name: r.name, qty: r.qty, price: priceIncl, amount: r2(r.qty * priceIncl), hsn: r.hsn, rate: r.rate };
    });
    const inclSub = r2(inclItems.reduce((s, i) => s + i.amount, 0));
    const inclDisc = r2(rs.reduce((s, r) => s + r.disc * f(r), 0));
    const inclSc = r2(rs.reduce((s, r) => s + r.sc * f(r), 0));
    const inclusive = { items: inclItems, subtotal: inclSub, discount: inclDisc, serviceCharge: inclSc, roundOff: r2(total - (inclSub - inclDisc + inclSc)) };
    invoices.push({
      inclusive,
      series,
      items: rs.map(r => ({ name: r.name, qty: r.qty, price: r.price, amount: r.gross, hsn: r.hsn, rate: r.rate })),
      subtotal, discount, taxable, serviceCharge,
      taxableValue: r2(taxable + serviceCharge),
      taxes, rates: [...byRate.values()],
      hsn: [...hsn.values()].map(h => ({ ...h, taxable: r2(h.taxable) })),
      cgst: r2(cgst), sgst: r2(sgst), vat: r2(vat), tax: taxTotal,
      roundOff: r2(total - exact), total,
    });
  }
  return {
    invoices,
    subtotal: r2(invoices.reduce((s, i) => s + i.subtotal, 0)),
    discount: r2(invoices.reduce((s, i) => s + i.discount, 0)),
    tax: r2(invoices.reduce((s, i) => s + i.tax, 0)),
    total: invoices.reduce((s, i) => s + i.total, 0),
  };
}
