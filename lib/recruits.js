// Loads a recruit config and checks the link.
// Links look like /r/<slug>/<token>. The slug alone returns 404, so a guessed or
// forwarded slug without its token shows nothing.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIR = path.join(process.cwd(), 'recruits');

function load(slug) {
  if (!/^[a-z0-9-]{2,60}$/.test(slug || '')) return null;
  const file = path.join(DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function safeEqual(a, b) {
  const A = Buffer.from(String(a || '')); const B = Buffer.from(String(b || ''));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

// Returns {ok, recruit, reason}. Kill switch: "active": false in the JSON,
// or the slug listed in the DISABLED_LINKS env var (comma separated) for a no-edit kill.
function check(slug, token) {
  const r = load(slug);
  if (!r) return { ok: false, reason: 'not_found' };
  if (!safeEqual(r.token, token)) return { ok: false, reason: 'bad_token' };
  const disabled = (process.env.DISABLED_LINKS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (r.active === false || disabled.includes(slug)) return { ok: false, reason: 'off', recruit: r };
  return { ok: true, recruit: r };
}

module.exports = { load, check };
