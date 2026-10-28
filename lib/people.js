// One link per person: /r/<slug>/<token>/<key>
// recruits/<slug>.json → "people": [{ "key": "...", "name": "Jeremiah", "role": "player" },
//                                   { "key": "...", "name": "Mom", "role": "family" }, ...]
// The first device that opens a person's link claims it. Another device gets the code screen
// and Jack gets an alert that the link was forwarded. The claim lock needs a Vercel Blob store
// (BLOB_READ_WRITE_TOKEN); without one the links still work and alerts still name the person.
const crypto = require('crypto');

const h = (s) => crypto.createHmac('sha256', process.env.GATE_SECRET || 'jb').update(s).digest('base64url');

function findPerson(r, key) {
  if (!key || !/^[A-Za-z0-9_-]{6,40}$/.test(key)) return null;
  return (r.people || []).find((p) => p.key === key) || null;
}
const findById = (r, pid) => (pid ? (r.people || []).find((p) => p.key === pid) || null : null);

// "Jeremiah Jones" for the player, "Jeremiah's mom" for family, the name otherwise
function label(r, p) {
  if (!p) return null;
  if (p.label) return p.label;
  if (p.role === 'player') return `${r.first} ${r.last}`;
  return /^(mom|dad|mother|father|stepmom|stepdad|grandma|grandpa|guardian|uncle|aunt|brother|sister)$/i.test(p.name)
    ? `${r.first}'s ${p.name.toLowerCase()}` : `${p.name} (${r.first}'s family)`;
}

const lockOn = () => !!process.env.BLOB_READ_WRITE_TOKEN;

// → { ok: true, first: bool } when this device holds the link, { ok: false } when another device does
async function claim(r, p, devId) {
  if (!lockOn() || p.role === 'admin') return { ok: true, first: false };
  const { head, put } = require('@vercel/blob');
  const path = `claims/${h(`${r.slug}|${p.key}`).slice(0, 40)}.txt`;
  const mine = h(`dev|${devId}`).slice(0, 40);
  try {
    const meta = await head(path);
    const held = (await (await fetch(meta.url, { cache: 'no-store' })).text()).trim();
    return { ok: held === mine, first: false };
  } catch (e) {
    if (e && e.name !== 'BlobNotFoundError' && !/not.?found/i.test(String(e.message))) return { ok: true, first: false }; // storage hiccup: don't lock anyone out
    try { await put(path, mine, { access: 'public', addRandomSuffix: false, contentType: 'text/plain' }); } catch (e2) {}
    return { ok: true, first: true };
  }
}

module.exports = { findPerson, findById, label, claim, lockOn };
