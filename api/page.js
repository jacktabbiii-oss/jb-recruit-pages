// GET /r/<slug>/<token>  (rewritten here by vercel.json)
// Renders template.html with the recruit's config injected. Never cached, never indexed.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { check } = require('../lib/recruits');

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

  const r = { ...result.recruit };
  delete r.token;                      // never ship the token inside the HTML
  const track = { enabled: process.env.ALERTS_ENABLED !== '0', slug, token };

  // JSON into a <script>: escape </script> and U+2028/2029
  const js = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, (c) => '\\u' + c.charCodeAt(0).toString(16));

  let html = template()
    .replace('__RECRUIT_JSON__', js(r))
    .replace('__TRACK_JSON__', js(track));

  html = '<!doctype html><html lang="en"><head>' + html.replace('<meta charset="utf-8">', '<meta charset="utf-8">');
  // template starts with metas + <title> + <link> + <style>, then <div class="wrap">
  html = html.replace('<div class="wrap">', '</head><body><div class="wrap">') + '</body></html>';
  res.status(200).end(html);
};
