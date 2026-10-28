// Code gate in front of every recruit page, so each open is tied to a person.
//   player: his first name        (e.g. JEREMIAH)
//   family: the family last name  (e.g. JONES)
//   admin:  ADMIN_CODE env var    (Jack; opens never alert)
// Codes are case-insensitive; spaces, dots and apostrophes are ignored.
// Env: GATE_SECRET (signs the cookie; gate is off when unset), ADMIN_CODE.
// Per page: "gate": false turns it off; "gateCodes": {"player": [...], "family": [...]} adds alternates.
const crypto = require('crypto');

const norm = (s) => String(s || '').toUpperCase().normalize('NFKD').replace(/[^A-Z0-9-]/g, '');
const enabled = (r) => !!process.env.GATE_SECRET && r && r.gate !== false;

function roleFor(r, code) {
  const c = norm(code);
  if (!c) return null;
  const admin = norm(process.env.ADMIN_CODE);
  if (admin && c === admin) return 'admin';
  const extra = r.gateCodes || {};
  const player = [r.first, `${r.first}${r.last}`, ...(extra.player || [])].map(norm);
  const family = [r.last, ...(extra.family || [])].map(norm);
  if (player.includes(c)) return 'player';
  if (family.includes(c)) return 'family';
  return null;
}

const cookieName = (slug) => `jb_${slug.replace(/-/g, '_')}`;
// pid = the person's link key when they came in on their own link ('' for a code login)
const mac = (r, role, pid = '') => crypto.createHmac('sha256', process.env.GATE_SECRET).update(pid ? `${r.slug}|${r.token}|${role}|${pid}` : `${r.slug}|${r.token}|${role}`).digest('base64url').slice(0, 32);

function cookieFor(r, role, pid = '') {
  return `${cookieName(r.slug)}=${role}${pid ? '~' + pid : ''}.${mac(r, role, pid)}; Path=/; Max-Age=${60 * 60 * 24 * 60}; HttpOnly; Secure; SameSite=Lax`;
}

// a long-lived random id for this browser, so a person's link can be held by one device
function deviceId(req) {
  const v = parseCookies(req).jb_dev;
  return v && /^[A-Za-z0-9_-]{16,40}$/.test(v) ? { id: v, isNew: false } : { id: crypto.randomBytes(16).toString('base64url'), isNew: true };
}
const deviceCookie = (id) => `jb_dev=${id}; Path=/; Max-Age=${60 * 60 * 24 * 730}; HttpOnly; Secure; SameSite=Lax`;

function parseCookies(req) {
  const out = {};
  String((req.headers && req.headers.cookie) || '').split(';').forEach((p) => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
  return out;
}

// { role, pid } from a valid cookie, or null
function whoFromReq(req, r) {
  const v = parseCookies(req)[cookieName(r.slug)];
  if (!v) return null;
  const [head, sig] = v.split('.');
  const [role, pid = ''] = String(head).split('~');
  if (!['player', 'family', 'admin'].includes(role) || !sig) return null;
  const A = Buffer.from(sig), B = Buffer.from(mac(r, role, pid));
  return A.length === B.length && crypto.timingSafeEqual(A, B) ? { role, pid } : null;
}
const roleFromReq = (req, r) => { const w = whoFromReq(req, r); return w ? w.role : null; };

function readForm(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    if (typeof req.body === 'string') return resolve(Object.fromEntries(new URLSearchParams(req.body)));
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 4000) req.destroy(); });
    req.on('end', () => resolve(Object.fromEntries(new URLSearchParams(data))));
    req.on('error', () => resolve({}));
  });
}

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function gatePage(r, { wrong = false, forwarded = false } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>JB Sports</title><link rel="icon" href="/jb-logo.png">
<style>
:root{--ground:#0A1120;--panel:#101A2E;--line:#1E2A44;--paper:#EAF0F8;--muted:#8E9DB8;--blue:#2B9BFF;--red:#FF5A5F}
*{box-sizing:border-box}html,body{margin:0;background:var(--ground);color:var(--paper);font:16px/1.5 Inter,Helvetica,Arial,sans-serif}
main{min-height:100vh;display:grid;place-items:center;padding:24px 16px}
.box{width:100%;max-width:380px}
img{height:24px;width:auto;display:block;margin-bottom:28px}
h1{font:800 2.2rem/1 Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.01em;margin:0 0 10px}
p{color:var(--muted);margin:0 0 22px}
label{display:block;font:600 .74rem ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--blue);margin-bottom:8px}
input{width:100%;font:600 1.15rem ui-monospace,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;padding:14px;background:var(--panel);color:var(--paper);border:1px solid var(--line);border-radius:0;outline:none}
input:focus{border-color:var(--blue)}
button{width:100%;margin-top:12px;padding:14px;font:700 .9rem Helvetica,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;background:var(--blue);color:#06121F;border:0;cursor:pointer}
.err{color:var(--red);font-size:.92rem;margin:10px 0 0}
.foot{margin-top:28px;font-size:.86rem}
</style></head><body><main><div class="box">
<img src="/jb-logo.png" alt="JB Sports">
<h1>Private page</h1>
<p>${forwarded ? `This link is already open on another phone. If it's yours, enter the code ${esc((r.contact&&r.contact.name)||'Jack')} gave you.` : `Made for ${esc(r.first)} and his family. Enter the code ${esc((r.contact&&r.contact.name)||'Jack')} gave you.`}</p>
<form method="post" autocomplete="off">
<label for="code">Code</label>
<input id="code" name="code" autocapitalize="characters" autocorrect="off" spellcheck="false" required autofocus>
<input type="hidden" name="back" id="back">
<button type="submit">Open</button>
${wrong ? `<p class="err">That code isn't right. Check with ${esc((r.contact&&r.contact.name)||'Jack')}.</p>` : ''}
</form>
<p class="foot">Don't have it? Text ${esc((r.contact&&r.contact.name)||'Jack')} at ${esc((r.contact&&r.contact.phone)||'(732) 675-0705')}.</p>
</div></main>
<script>try{document.getElementById('back').value=(location.search+location.hash).slice(0,40)}catch(e){}</script>
</body></html>`;
}

module.exports = { enabled, roleFor, cookieFor, roleFromReq, whoFromReq, deviceId, deviceCookie, readForm, gatePage, norm };
