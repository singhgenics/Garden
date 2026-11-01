#!/usr/bin/env node
// Usage:
//   node check-menu.mjs           hook mode: reads hook JSON on stdin; if the menu data differs from the last
//                                 built Menu site, prints a PostToolUse reminder as JSON (silent otherwise)
//   node check-menu.mjs --update  store the current menu hash (run after rebuilding everything)
//   node check-menu.mjs --print   print the current hash
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { loadMenu } from './menu-data.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const HASH_FILE = path.join(HERE, 'menu.hash');
let cur;
try { cur = crypto.createHash('sha256').update(JSON.stringify(loadMenu())).digest('hex'); }
catch (e) { process.exit(0); }   // menu files mid-edit or unreadable: stay silent
const arg = process.argv[2];
if (arg === '--print') { console.log(cur); process.exit(0); }
if (arg === '--update') { fs.writeFileSync(HASH_FILE, cur + '\n'); console.log('menu.hash updated'); process.exit(0); }
const last = fs.existsSync(HASH_FILE) ? fs.readFileSync(HASH_FILE, 'utf8').trim() : '';
if (last === cur) process.exit(0);
const msg = 'MENU CHANGED: the food or drinks menu data (food.html / drinks.html) differs from what the Menu site, crockery checklist and plating cards were built from. ' +
  'The standing instruction from the user is that any change to the menu or its items must update everything. ' +
  'Follow ~/Documents/Code/Dream/Menu-repo/UPDATE.md: (1) update crockery data and the claude.ai crockery checklist artifact, (2) update plating cards and generate new images for new or changed dishes with gflow (free; never use paid generators without asking), (3) rebuild and push singhgenics/Menu, (4) run `node ~/Documents/Code/Dream/Menu-repo/src/check-menu.mjs --update`. ' +
  'Do the update now unless the user is mid-way through editing the menu, in which case finish their edit first and then do it.';
console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: msg } }));
