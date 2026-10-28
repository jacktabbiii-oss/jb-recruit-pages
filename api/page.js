// GET /r/<slug>/<token>  (rewritten here by vercel.json)
// Renders template.html with the recruit's config injected. Never cached, never indexed.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { check } = require('../lib/recruits');
const gate = require('../lib/gate');
const people = require('../lib/people');
const { sendAlert } = require('../lib/alerts');

let TEMPLATE;
function template() {
  if (!TEMPLATE) {
    const gz = path.join(process.cwd(), 'template.html.gz');
    TEMPLATE = fs.existsSync(gz) ? zlib.gunzipSync(fs.readFileSync(gz)).toString('utf8') : fs.readFileSync(path.join(process.cwd(), 'template.html'), 'utf8');
  }
  return TEMPLATE;
}

const OFF_PAGE = (name) => `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>JB Sports</title><style>body{margin:0;background:#0A1120;color:#EAF0F8;font:16px/1.5 Archivo,Helvetica,Arial,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px}p{max-width:30em;text-align:center;color:#8E9DB8}</style>
<p>This page is no longer live.${name ? ' If you need anything, text Jack.' : ''}</p>`;

module.exports = async (req, res) => {
  const { slug, token } = req.query;
  const result = check(slug, token);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!result.ok) {
    if (result.reason === 'off') return res.status(410).end(OFF_PAGE(true));
    return res.status(404).end(OFF_PAGE(false));
  }

  // Gate: the page only renders for a valid player / family / admin cookie.
  // Ways in: the person's own link (/r/<slug>/<token>/<key>), or a code on the shared link.
  let who = null;
  if (gate.enabled(result.recruit)) {
    const rec = result.recruit;
    const alertsOn = process.env.ALERTS_ENABLED !== '0';
    const base = `/r/${slug}/${token}`;
    const person = people.findPerson(rec, req.query.key);
    if (req.method === 'POST') {
      const f = await gate.readForm(req);
      const got = gate.roleFor(rec, f.code);
      const fwd = people.findPerson(rec, f.key);
      if (!got) {
        if (gate.norm(f.code) && alertsOn) {
          try { await sendAlert({ to: rec.alertTo, subject: `Wrong code on ${rec.first} ${rec.last}'s page`, text: `Someone ${fwd ? `opened ${people.label(rec, fwd)}'s link on a new phone and` : `opened ${rec.first} ${rec.last}'s link and`} entered "${String(f.code).slice(0, 40)}", which isn't one of the codes. The link may have been passed on.` }); } catch (e) {}
        }
        return res.status(401).end(gate.gatePage(rec, { wrong: true, forwarded: !!fwd }).replace('<input type="hidden" name="back" id="back">', `<input type="hidden" name="back" id="back">${fwd ? `<input type="hidden" name="key" value="${fwd.key}">` : ''}`));
      }
      if (fwd && got !== 'admin' && alertsOn) {
        try { await sendAlert({ to: rec.alertTo, subject: `${people.label(rec, fwd)}'s link opened on a second phone`, text: `${people.label(rec, fwd)}'s link for ${rec.first} ${rec.last} was opened on a phone it wasn't first opened on. They got in with the ${got} code, so alerts from that phone will say "${got}".` }); } catch (e) {}
      }
      res.setHeader('Set-Cookie', gate.cookieFor(rec, got));
      let back = typeof f.back === 'string' && /^[?#][\w=&#.-]*$/.test(f.back) ? f.back : '';
      if (got === 'family' && !rec.intro && !/#parents/.test(back)) back = '?v=p#parents';
      res.setHeader('Location', `${base}${back}`);
      return res.status(303).end();
    }
    if (person) {
      const dev = gate.deviceId(req);
      const c = await people.claim(rec, person, dev.id);
      if (!c.ok) {
        if (alertsOn && !gate.whoFromReq(req, rec)) {
          try { await sendAlert({ to: rec.alertTo, subject: `${people.label(rec, person)}'s link was forwarded`, text: `${people.label(rec, person)}'s personal link for ${rec.first} ${rec.last} was just opened on a different phone than the one that first opened it. They were asked for a code.` }); } catch (e) {}
        }
        if (dev.isNew) res.setHeader('Set-Cookie', gate.deviceCookie(dev.id));
        return res.status(200).end(gate.gatePage(rec, { forwarded: true }).replace('<input type="hidden" name="back" id="back">', `<input type="hidden" name="back" id="back"><input type="hidden" name="key" value="${person.key}">`));
      }
      res.setHeader('Set-Cookie', [gate.cookieFor(rec, person.role, person.role === 'admin' ? '' : person.key), gate.deviceCookie(dev.id)]);
      const back = person.role === 'family' && !rec.intro ? '?v=p#parents' : '';
      res.setHeader('Location', `${base}${back}`);
      return res.status(303).end();
    }
    who = gate.whoFromReq(req, rec);
    if (!who) return res.status(200).end(gate.gatePage(rec));
  }
  const role = who ? who.role : null;

  const r = { ...result.recruit };
  delete r.token;                      // never ship the token inside the HTML
  delete r.gateCodes;
  delete r.people;                     // link keys never ship in the HTML
  const track = { enabled: process.env.ALERTS_ENABLED !== '0' && role !== 'admin', slug, token, role };

  // JSON into a <script>: escape </script> and U+2028/2029
  const js = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, (c) => '\\u' + c.charCodeAt(0).toString(16));

  let html = template()
    .replace('__RECRUIT_JSON__', js(r))
    .replace('__TRACK_JSON__', js(track));

  // Link preview (iMessage, email, Slack, socials): branded card per recruit
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const host = req.headers && (req.headers['x-forwarded-host'] || req.headers.host);
  const origin = host ? `https://${host}` : 'https://jbsportsinc.com';
  const shareTitle = `${r.first} ${r.last} × JB Sports`;
  const shareDesc = r.shareText || `Made for ${r.first} and the ${r.last} family. Private link.`;
  const shareImg = origin + (r.shareImage || '/share-default.jpg');
  const og = `<meta property="og:type" content="website"><meta property="og:site_name" content="JB Sports"><meta property="og:title" content="${esc(shareTitle)}"><meta property="og:description" content="${esc(shareDesc)}"><meta property="og:image" content="${esc(shareImg)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(shareTitle)}"><meta name="twitter:image" content="${esc(shareImg)}"><link rel="icon" href="/jb-logo.png">`;
  html = '<!doctype html><html lang="en"><head>' + html.replace('<meta charset="utf-8">', '<meta charset="utf-8">' + og);
  html = html.replace('<title>JB Sports</title>', `<title>${esc(shareTitle)}</title>`);
  // template starts with metas + <title> + <link> + <style>, then <div class="wrap">
  html = html.replace('<div class="wrap">', '</head><body><div class="wrap">') + '</body></html>';
  res.status(200).end(html);
};
