#!/usr/bin/env node
// Builds ../index.html from: live menu data (Dream repo), crockery-source.html (crockery arrays),
// plating_data.py (plating specs) and template.html. Images live in ../img/{crockery,plating}.
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { loadMenu } from './menu-data.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
const cs = fs.readFileSync(path.join(HERE, 'crockery-source.html'), 'utf8');
const a = cs.indexOf('const GROUPS='), b = cs.indexOf('const STORE=');
const crock = (0, eval)('(()=>{' + cs.slice(a, b) + '; return {groups:GROUPS,items:ITEMS,fmap:FOOD,dmap:DRINKS}})()');
execFileSync('python3', ['plating_data.py'], { cwd: HERE });
execFileSync('python3', ['furnishings_data.py'], { cwd: HERE });                  // writes furnishings.json
execFileSync('python3', ['furnishing_plans.py'], { cwd: HERE });                  // writes img/furnishings/*-plan.svg
const furn = JSON.parse(fs.readFileSync(path.join(HERE, 'furnishings.json'), 'utf8'));                       // writes data.json
const plating = JSON.parse(fs.readFileSync(path.join(HERE, 'data.json'), 'utf8'))
  .map(x => ({ id: x.id, sec: x.sec, name: x.name, sub: x.sub, refs: x.refs, vessel: x.vessel, build: x.build, garnish: x.garnish, side: x.side, temp: x.temp, note: x.note, vars: x.vars || null }));
const { food, drinks } = loadMenu();
const data = { food, drinks, crock, plating, furn };
const html = fs.readFileSync(path.join(HERE, 'template.html'), 'utf8').replace('/*DATA*/', JSON.stringify(data).replace(/<\/script/g, '<\\/script'));
fs.writeFileSync(path.join(ROOT, 'index.html'), html);
const missing = plating.flatMap(p => [p.id, ...(p.vars || []).map(v => v.img)]).filter(id => !fs.existsSync(path.join(ROOT, 'img/plating', id + '.jpg'))).map(id => 'plating/' + id)
  .concat(crock.items.filter(i => i[2] && !fs.existsSync(path.join(ROOT, 'img/crockery', i[2] + '.jpg'))).map(i => 'crockery/' + i[2]));
console.log(`built index.html: ${food.reduce((n, s) => n + s.items.length, 0)} food lines, ${drinks.reduce((n, s) => n + s.items.length, 0)} drink lines, ${crock.items.length} crockery items, ${plating.length} plating cards`);
const missingF = [...furn.groups.flatMap(g => [g.img, ...g.items.map(i => i.img)]), ...furn.gallery.flatMap(g => g[2].map(x => x[0]).filter(id => !id.endsWith('-plan')))].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).filter(id => !fs.existsSync(path.join(ROOT, 'img/furnishings', id + '.jpg')));
if (missingF.length) missing.push(...missingF.map(id => 'furnishings/' + id));
console.log('missing images:', missing.length ? missing.join(', ') : 'none');
