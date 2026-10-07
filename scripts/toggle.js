#!/usr/bin/env node
// Turn a link off or on:  node scripts/toggle.js off eli-finley   |   node scripts/toggle.js on eli-finley
// Then deploy (vercel --prod). For an instant kill without deploying, set the DISABLED_LINKS env var
// in Vercel to a comma-separated list of slugs and redeploy from the dashboard.
const fs = require('fs'); const path = require('path');
const [state, slug] = process.argv.slice(2);
if (!['on', 'off'].includes(state) || !slug) { console.error('usage: toggle.js on|off <slug>'); process.exit(1); }
const f = path.join('recruits', `${slug}.json`);
const r = JSON.parse(fs.readFileSync(f, 'utf8')); r.active = state === 'on';
fs.writeFileSync(f, JSON.stringify(r, null, 2));
console.log(`${slug}: ${state.toUpperCase()}  (deploy to apply)`);
