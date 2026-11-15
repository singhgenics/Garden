// Smart kitchen and bar display (KDS): which station cooks what, how long it should take, when each course
// fires, which dishes to start first so a table's plates finish together, and when to fall back to paper.
import { all, get, run, db } from './db.js';
import { now, settings } from './core.js';

// Columns added after the first release. Safe to run on every start.
for (const [t, c, d] of [
  ['items', 'prep', "TEXT DEFAULT ''"], ['items', 'prep_min', 'REAL DEFAULT 0'], ['items', 'course', 'INTEGER DEFAULT -1'],
  ['order_lines', 'prep', "TEXT DEFAULT ''"], ['order_lines', 'prep_min', 'REAL DEFAULT 0'], ['order_lines', 'course', 'INTEGER DEFAULT 0'],
  ['order_lines', 'hold', 'INTEGER DEFAULT 0'], ['order_lines', 'fired_at', 'TEXT'], ['order_lines', 'served_at', 'TEXT'], ['order_lines', 'voided_at', 'TEXT'],
]) { try { db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${d}`); } catch { /* column already exists */ } }

/** Where each dish is cooked, matching the equipment plan. */
export const STATIONS = {
  wok: 'Wok', stock: 'Stock pots', fry: 'Fryer', steam: 'Steamer', cold: 'Cold & plate', pass: 'Pass (sets)', bar: 'Bar',
};
/** What each physical screen shows. The pass screen shows everything. */
export const SCREENS = {
  hot: ['wok', 'stock', 'fry', 'steam', 'cold'],
  bar: ['bar'],
};
export const COURSE_NAME = { 0: 'Drinks', 1: 'Starters', 2: 'Mains', 3: 'Dessert' };

/** The current menu, dish by dish (station, usual minutes, course). Anything not listed falls through to the rules below. */
const KNOWN = {
  'wonton kenobi': ['stock', 6, 1], 'hot & bothered': ['stock', 6, 1], 'coconut cuddle': ['stock', 6, 1],
  'konso fever': ['wok', 8, 1], 'honey trap': ['fry', 7, 1], 'salt & pepa': ['fry', 7, 1], 'wonton more': ['fry', 7, 1],
  'crystal clear': ['steam', 8, 1], 'fire starters': ['stock', 6, 1], 'siu mai goodness': ['steam', 8, 1], 'prawn to be wild': ['steam', 8, 1],
  'bao down': ['steam', 7, 1], 'fever pitch': ['steam', 7, 1], 'seoul mate': ['steam', 7, 1],
  'k-pop wings': ['fry', 10, 1], 'fry hard': ['fry', 7, 1], 'slap happy': ['cold', 4, 1], 'smash hit': ['cold', 3, 1],
  'noodle around': ['wok', 8, 2], 'rice rice baby': ['wok', 8, 2], 'holy basil, batman!': ['wok', 8, 2], 'plain jane': ['cold', 3, 2],
  'gravy train': ['stock', 10, 2], 'sweet talk': ['stock', 10, 2], 'green with envy': ['stock', 10, 2], 'suey generis': ['stock', 10, 2],
  'honey, i shrunk the noodles': ['fry', 6, 3], 'sticky situation': ['cold', 3, 3], 'scoop there it is': ['cold', 3, 3],
  'steamer for two': ['pass', 15, 1], 'konso feast for four': ['pass', 25, 2], 'bowl game': ['pass', 12, 2],
};

/** Station, target minutes and course for a menu item, from its name, category and print station. The owner can override any of them on the item. */
export function prepFor(name = '', cat = '', catStation = '') {
  const known = KNOWN[name.toLowerCase().split(' · ')[0].trim()];
  if (known) return { prep: known[0], prep_min: known[1], course: known[2] };
  const n = name.toLowerCase(), c = cat.toLowerCase();
  if (catStation === 'bar' || /^(on tap|whisky|vodka|cocktail|zero proof|coffee|hot coffee|happy hour|beer|spirits)/.test(c)) {
    const min = /cocktail|martini|margarita|sour|g&t|mary|highball|soju|somaek/.test(n) || /cocktail/.test(c) ? 5
      : /coffee|tea/.test(n) || /coffee/.test(c) ? 4 : /flight|paddle|pitcher/.test(n) ? 4 : 2;
    return { prep: 'bar', prep_min: min, course: 0 };
  }
  if (/steamer for two|feast|combo|set\b/.test(n) || /for the table/.test(c)) return { prep: 'pass', prep_min: 20, course: 2 };
  if (/plain rice|jasmine rice|steamed rice/.test(n)) return { prep: 'cold', prep_min: 3, course: 2 };
  if (/darsaan|ice cream|scoop|sticky/.test(n) || /^sweet/.test(c)) return { prep: /darsaan/.test(n) ? 'fry' : 'cold', prep_min: /darsaan/.test(n) ? 6 : 3, course: 3 };
  if (/soup|chimney/.test(n) || /^soup/.test(c)) return { prep: 'stock', prep_min: 6, course: 1 };
  if (/dim sum|siu mai|dumpling|har gow|xiao long|wonton in|fire starter/.test(n) || /dim sum/.test(c)) return { prep: 'steam', prep_min: 8, course: 1 };
  if (/bao/.test(n) || /^bao/.test(c)) return { prep: 'steam', prep_min: 7, course: 1 };
  if (/salad|papaya|cucumber/.test(n)) return { prep: 'cold', prep_min: 4, course: 1 };
  if (/gravy|curry|khao|suey/.test(n)) return { prep: 'stock', prep_min: 10, course: 2 };
  if (/chowmein|noodle|rice|hakka|basil/.test(n) || /konso mains/.test(c)) return { prep: 'wok', prep_min: 8, course: 2 };
  if (/wings/.test(n)) return { prep: 'fry', prep_min: 10, course: 1 };
  if (/fries|prawn|fish|chonak|potato|wonton|crispy|golden/.test(n)) return { prep: 'fry', prep_min: 7, course: 1 };
  if (/korean/.test(c)) return { prep: 'fry', prep_min: 8, course: 1 };
  return { prep: 'wok', prep_min: 8, course: /starter/.test(c) ? 1 : 2 };
}

/** Give every menu item that has no station yet a sensible one. Items the owner has set by hand are left alone. */
export function backfillPrep() {
  const rows = all(`SELECT i.id, i.name, i.station, c.name cat, c.station cat_station FROM items i LEFT JOIN categories c ON c.id = i.category_id
                    WHERE i.prep IS NULL OR i.prep = ''`);
  for (const r of rows) {
    const k = prepFor(r.name, r.cat || '', r.station || r.cat_station || '');
    run('UPDATE items SET prep = ?, prep_min = ?, course = ? WHERE id = ?', k.prep, k.prep_min, k.course, r.id);
  }
  return rows.length;
}

const ts = s => (s ? new Date(String(s).replace(' ', 'T')).getTime() : 0);
const mins = v => v * 60e3;

// ---------- which screens are switched on (for the paper fallback) ----------
const seen = {};
export const beat = screen => { seen[screen] = Date.now(); };
export const alive = (screens, within = 90e3) => screens.some(s => Date.now() - (seen[s] || 0) < within);
export const aliveMap = () => Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, Date.now() - v < 90e3]));
/** True when a screen that shows this print station (kitchen or bar) has checked in recently. */
export const screenFor = station => (station === 'bar' ? alive(['bar', 'all']) : alive(['hot', 'all']));

// ---------- course firing ----------
/**
 * A held course (mains after starters, dessert after mains) fires once every earlier course is ready or served
 * and the gap has passed since the last one finished, or after the safety limit so nothing is forgotten.
 */
export function fireDue() {
  const st = settings();
  const gap = mins(+st.kds_course_gap_min || 8), limit = mins(+st.kds_hold_max_min || 35);
  const held = all(`SELECT l.order_id, l.course, MIN(l.sent_at) sent FROM order_lines l JOIN orders o ON o.id = l.order_id
                    WHERE l.hold = 1 AND l.status = 'sent' AND o.status IN ('open','billed') GROUP BY l.order_id, l.course ORDER BY l.order_id, l.course`);
  let fired = 0;
  const blocked = new Set();
  for (const h of held) {
    if (blocked.has(h.order_id)) continue;
    const earlier = all("SELECT status, ready_at, served_at, sent_at FROM order_lines WHERE order_id = ? AND course >= 1 AND course < ? AND status != 'void'", h.order_id, h.course);
    const open = earlier.some(l => l.status === 'new' || l.status === 'sent');
    const last = Math.max(0, ...earlier.map(l => ts(l.served_at || l.ready_at || l.sent_at)));
    const due = (!open && (earlier.length === 0 || Date.now() - last >= gap)) || Date.now() - ts(h.sent) >= limit;
    if (due) { run("UPDATE order_lines SET hold = 0, fired_at = ? WHERE order_id = ? AND course = ? AND hold = 1 AND status = 'sent'", now(), h.order_id, h.course); fired++; }
    else blocked.add(h.order_id);
  }
  return fired;
}

/** Fire every held course on an order right now (the chef or waiter says "fire the mains"). */
export function fireNow(orderId) {
  return run("UPDATE order_lines SET hold = 0, fired_at = ? WHERE order_id = ? AND hold = 1 AND status = 'sent'", now(), orderId).changes;
}

/** Decide, for lines being sent now, which are held until an earlier course is done. */
export function holdFor(order, line, fresh) {
  if (order.type !== 'dine' || line.course <= 1) return 0;
  const earlier = [...order.lines, ...fresh].some(x => x.course >= 1 && x.course < line.course && x.status !== 'void' && x.status !== 'served' && x.id !== line.id);
  return earlier ? 1 : 0;
}

// ---------- the board ----------
function liveLines() {
  return all(`SELECT l.*, o.type, o.covers, o.note order_note, t.name table_name, s.name staff_name, i.veg
    FROM order_lines l JOIN orders o ON o.id = l.order_id LEFT JOIN tables t ON t.id = o.table_id
    LEFT JOIN staff s ON s.id = o.staff_id LEFT JOIN items i ON i.id = l.item_id
    WHERE l.status IN ('sent','ready') AND o.status IN ('open','billed','paid') ORDER BY l.sent_at, l.id`);
}

/** Lines of one course on one order that fire together are timed together: the slowest starts first, the others wait. */
function addTiming(rows) {
  const groups = {};
  for (const r of rows) if (r.status === 'sent' && !r.hold && r.prep !== 'bar') {
    const g = `${r.order_id}|${r.course}|${r.fired_at || r.sent_at}`;
    groups[g] = Math.max(groups[g] || 0, r.prep_min || 0);
  }
  const t = Date.now();
  for (const r of rows) {
    const g = `${r.order_id}|${r.course}|${r.fired_at || r.sent_at}`;
    const target = groups[g] || r.prep_min || 0;
    r.target_min = target;
    r.start_in_s = r.status === 'sent' && !r.hold && r.prep !== 'bar'
      ? Math.max(0, Math.round((ts(r.fired_at || r.sent_at) + mins(target - (r.prep_min || 0)) - t) / 1000)) : 0;
  }
}

const slim = r => ({
  id: r.id, order_id: r.order_id, kot_no: r.kot_no, name: r.name, qty: r.qty, note: r.note, status: r.status, prep: r.prep,
  prep_min: r.prep_min || 0, target_min: r.target_min || 0, course: r.course, hold: r.hold, fired_at: r.fired_at, sent_at: r.sent_at,
  ready_at: r.ready_at, start_in_s: r.start_in_s, veg: r.veg,
  ready_s: r.ready_at ? Math.max(0, Math.round((Date.now() - ts(r.ready_at)) / 1000)) : 0,
});

/** screen: 'hot' | 'bar' (cooking screens, grouped by KOT) or 'pass' | 'all' (whole table view). */
export function board(screen = 'pass', station = '') {
  fireDue();
  const rows = liveLines();
  for (const r of rows) {
    if (!r.prep) { const k = prepFor(r.name, '', r.station); r.prep = k.prep; r.prep_min = k.prep_min; r.course = k.course; }
  }
  addTiming(rows);
  const pad = n => String(n).padStart(2, '0'), cd = new Date(Date.now() - 10 * 60e3);
  const cut = `${cd.getFullYear()}-${pad(cd.getMonth() + 1)}-${pad(cd.getDate())} ${pad(cd.getHours())}:${pad(cd.getMinutes())}:00`;
  const voids = all(`SELECT l.id, l.name, l.qty, l.prep, l.station, l.order_id, l.kot_no, l.void_reason, l.voided_at, t.name table_name, o.type
      FROM order_lines l JOIN orders o ON o.id = l.order_id LEFT JOIN tables t ON t.id = o.table_id
      WHERE l.status = 'void' AND l.kot_no IS NOT NULL AND l.voided_at >= ? ORDER BY l.voided_at`, cut)
    .filter(v => screen === 'pass' || screen === 'all' || (SCREENS[screen] || SCREENS.hot).includes(v.prep || (v.station === 'bar' ? 'bar' : 'wok')));
  const base = { screen, now: Date.now(), voids };
  if (screen === 'pass' || screen === 'all') {
    const orders = new Map();
    for (const r of rows) {
      if (!orders.has(r.order_id)) orders.set(r.order_id, { order_id: r.order_id, table: r.table_name, type: r.type, covers: r.covers, note: r.order_note, staff: r.staff_name, first_sent: r.sent_at, lines: [] });
      const o = orders.get(r.order_id);
      if (ts(r.sent_at) < ts(o.first_sent)) o.first_sent = r.sent_at;
      o.lines.push(slim(r));
    }
    for (const o of orders.values()) o.age_s = Math.max(0, Math.round((Date.now() - ts(o.first_sent)) / 1000));
    return { ...base, orders: [...orders.values()] };
  }
  const allow = station ? [station] : SCREENS[screen] || SCREENS.hot;
  const tickets = new Map();
  for (const r of rows) {
    if (r.status !== 'sent' || r.hold || !allow.includes(r.prep)) continue;
    const k = `${r.order_id}-${r.kot_no}`;
    if (!tickets.has(k)) tickets.set(k, { key: k, order_id: r.order_id, kot_no: r.kot_no, table: r.table_name, type: r.type, covers: r.covers, staff: r.staff_name, note: r.order_note, lines: [] });
    tickets.get(k).lines.push(slim(r));
  }
  for (const t of tickets.values()) {
    t.lines.sort((a, b) => a.start_in_s - b.start_in_s || b.prep_min - a.prep_min || a.id - b.id);
    t.fired_at = t.lines.map(l => l.fired_at || l.sent_at).sort()[0];
    t.target_min = Math.max(...t.lines.map(l => l.target_min));
    t.age_s = Math.max(0, Math.round((Date.now() - ts(t.fired_at)) / 1000));
  }
  const list = [...tickets.values()].sort((a, b) => (a.fired_at < b.fired_at ? -1 : 1));
  return { ...base, tickets: list };
}

/** Average cook time per station today, and what is open right now. */
export function stats() {
  const start = `${now().slice(0, 10)} 00:00:00`;
  const per = all(`SELECT prep, COUNT(*) n, AVG((julianday(ready_at) - julianday(COALESCE(fired_at, sent_at))) * 1440) avg_min
                   FROM order_lines WHERE ready_at IS NOT NULL AND sent_at >= ? AND status IN ('ready','served') GROUP BY prep`, start);
  const open = get("SELECT COUNT(*) n, MIN(COALESCE(fired_at, sent_at)) oldest FROM order_lines WHERE status = 'sent' AND hold = 0");
  const held = get("SELECT COUNT(*) n FROM order_lines WHERE status = 'sent' AND hold = 1");
  return {
    open: open.n, held: held.n, oldest_min: open.oldest ? Math.floor((Date.now() - ts(open.oldest)) / 60000) : 0,
    stations: per.filter(p => p.prep).map(p => ({ prep: p.prep, n: p.n, avg_min: Math.round(p.avg_min * 10) / 10 })),
  };
}

/** Bumped tickets from the last 45 minutes, so a mistake can be undone. */
export function recent() {
  const since = new Date(Date.now() - 45 * 60e3);
  const pad = n => String(n).padStart(2, '0');
  const cut = `${since.getFullYear()}-${pad(since.getMonth() + 1)}-${pad(since.getDate())} ${pad(since.getHours())}:${pad(since.getMinutes())}:00`;
  return all(`SELECT l.order_id, l.kot_no, t.name table_name, o.type, MAX(l.served_at) at, COUNT(*) n, GROUP_CONCAT(l.name, ', ') names
              FROM order_lines l JOIN orders o ON o.id = l.order_id LEFT JOIN tables t ON t.id = o.table_id
              WHERE l.status = 'served' AND l.served_at >= ? GROUP BY l.order_id, l.kot_no ORDER BY at DESC LIMIT 12`, cut);
}
