// Shared: reads the live menu data arrays out of the Dream repo's food.html and drinks.html.
import fs from 'fs';
import os from 'os';
import path from 'path';
export const DREAM = process.env.DREAM || path.join(os.homedir(), 'Documents/Code/Dream');
function grab(fn) {
  const s = fs.readFileSync(path.join(DREAM, fn), 'utf8');
  const i = s.indexOf('const MENU=[');
  const pre = s.slice(s.lastIndexOf('const V', i), i);
  const k = s.indexOf('// course order', i);
  const body = s.slice(i, k).trim().replace(/;$/, '');
  return (0, eval)('(()=>{' + pre + '\n' + body + '; return MENU})()');
}
export function loadMenu() {
  const food = grab('food.html'), drinks = grab('drinks.html');
  // food.html keeps only the food sections, drinks.html only the drinks sections
  const keepF = ['soups', 'wok', 'dimsum', 'bao', 'korean', 'mains', 'curries', 'table', 'sweet'];
  const keepD = ['tap', 'spirits', 'vodka', 'cocktails', 'zero', 'coffee'];
  const ORDER = ['soups', 'wok', 'dimsum', 'bao', 'korean', 'mains', 'curries', 'table', 'tap', 'spirits', 'vodka', 'cocktails', 'zero', 'coffee', 'sweet'];
  const f = food.filter(x => keepF.includes(x.id)), d = drinks.filter(x => keepD.includes(x.id));
  const sort = (a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id);
  return { food: f.sort(sort), drinks: d.sort(sort) };
}
