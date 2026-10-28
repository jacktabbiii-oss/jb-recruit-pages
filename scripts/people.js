#!/usr/bin/env node
// Personal links: one per person, so every alert names who opened the page.
//   node scripts/people.js <slug>                     list the links
//   node scripts/people.js <slug> Mom Dad "Coach Lee"  add people (player is added automatically; anyone else is family)
//   node scripts/people.js <slug> --remove Dad        remove someone (their link stops working)
// Links: https://jbsportsinc.com/r/<slug>/<token>/<key>
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const [slug, ...rest] = process.argv.slice(2);
if (!slug) { console.error('usage: people.js <slug> [Name ...] [--remove Name]'); process.exit(1); }
const file = path.join(__dirname, '..', 'recruits', `${slug}.json`);
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
d.people = d.people || [];
const key = () => crypto.randomBytes(9).toString('base64url');
let changed = false;
if (!d.people.some((p) => p.role === 'player')) { d.people.unshift({ key: key(), name: d.first, role: 'player' }); changed = true; }
const ri = rest.indexOf('--remove');
const removes = ri > -1 ? rest.slice(ri + 1) : [];
const adds = ri > -1 ? rest.slice(0, ri) : rest;
for (const n of adds) if (!d.people.some((p) => p.name.toLowerCase() === n.toLowerCase())) { d.people.push({ key: key(), name: n, role: 'family' }); changed = true; }
for (const n of removes) { const before = d.people.length; d.people = d.people.filter((p) => p.name.toLowerCase() !== n.toLowerCase() || p.role === 'player'); changed = changed || d.people.length !== before; }
if (changed) fs.writeFileSync(file, JSON.stringify(d, null, 2) + '\n');
const site = process.env.SITE_URL || 'https://jbsportsinc.com';
console.log(`${d.first} ${d.last}`);
for (const p of d.people) console.log(`  ${(p.role === 'player' ? p.name + ' (player)' : p.name).padEnd(22)} ${site}/r/${slug}/${d.token}/${p.key}`);
