#!/usr/bin/env node
// Create a recruit page from a template config and print the private link.
//   node scripts/new-recruit.js "First Last" --from eli-finley [--mode college] [--school "X"] [--pos TE] [--num 84]
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const args = process.argv.slice(2);
const name = args[0]; if (!name || name.startsWith('--')) { console.error('usage: new-recruit "First Last" --from <slug> [--mode draft|college]'); process.exit(1); }
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
const [first, ...rest] = name.split(' '); const last = rest.join(' ');
const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const fromSlug = opt('from', 'eli-finley');
const base = JSON.parse(fs.readFileSync(path.join('recruits', `${fromSlug}.json`), 'utf8'));
const r = { ...base, slug, token: crypto.randomBytes(9).toString('base64url'), active: true,
  first, last, familyLabel: `For the ${last}s`, mode: opt('mode', base.mode || 'draft'),
  school: opt('school', ''), position: opt('pos', base.position), number: Number(opt('num', base.number)),
  heroVideo: { clip: null, len: '' },
  photos: base.photos.map(p => ({ ...p, src: null, sub: '' })),
  plays: base.plays.map(p => ({ ...p, clip: null, t: '[Game · Qtr · Down]', n: '<b>Jack:</b> [note]' })),
};
const out = path.join('recruits', `${slug}.json`);
if (fs.existsSync(out)) { console.error(`${out} already exists`); process.exit(1); }
fs.writeFileSync(out, JSON.stringify(r, null, 2));
console.log(`created ${out}\nlink: ${process.env.SITE_URL || 'https://<your-domain>'}/r/${slug}/${r.token}\n\nFill in: plays (3 clips + notes), photos, heroVideo, school, measurements. Then: vercel --prod`);
