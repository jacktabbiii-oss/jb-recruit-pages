// POST /api/track   { slug, k, sid, ev: 'open' | 'summary', view, seen[], played[], secs }
// Sends Jack an email the moment a link is opened, and a short summary when the viewer leaves.
// Only accepts events that carry a valid slug + token, so random hits do nothing.
const { check } = require('../lib/recruits');
const { sendAlert } = require('../lib/alerts');

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 20000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
  });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  const b = await readBody(req);
  const result = check(b.slug, b.k);
  if (!result.ok) return res.status(204).end();   // silently ignore
  const r = result.recruit;
  const who = `${r.first} ${r.last}`;
  const tab = b.view === 'parents' ? (r.familyLabel || 'parents tab') : `${r.first}'s tab`;
  const device = /iPhone|iPad/.test(b.ua || '') ? 'iPhone' : /Android/.test(b.ua || '') ? 'Android' : 'desktop';
  const when = new Date().toLocaleString('en-US', { timeZone: process.env.ALERT_TZ || 'America/New_York', hour: 'numeric', minute: '2-digit', weekday: 'short' });

  try {
    const shared = b.via === 'share';
    if (b.ev === 'share') {
      await sendAlert({
        to: r.alertTo,
        subject: `${who} just shared his page`,
        text: `${who} tapped Share on ${device}, ${when}. When someone opens the forwarded link you'll get a separate alert marked "shared link".`
      });
    } else if (b.ev === 'open' && shared) {
      await sendAlert({
        to: r.alertTo,
        subject: `Someone opened ${who}'s page from a shared link (${tab})`,
        text: `A forwarded copy of ${who}'s page was opened ${when} on ${device}, starting on ${tab}. Likely a parent, coach or someone close to him.`
      });
    } else if (b.ev === 'open') {
      await sendAlert({
        to: r.alertTo,
        subject: `${who} just opened the page (${tab})`,
        text: `${who}'s page was opened ${when} on ${device}, starting on ${tab}.\n\nYou'll get a summary when they leave.\n\nLink: ${process.env.SITE_URL || ''}/r/${r.slug}/${r.token}`
      });
    } else if (b.ev === 'summary') {
      const seen = (Array.isArray(b.seen) ? b.seen : []).filter(s => typeof s === 'string').slice(0, 30);
      const played = (Array.isArray(b.played) ? b.played : []).filter(s => typeof s === 'string').slice(0, 30);
      const secs = Math.max(0, Math.min(36000, Number(b.secs) || 0));
      const mins = secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`;
      if (secs < 5 && !played.length) return res.status(204).end(); // bounce; don't email
      await sendAlert({
        to: r.alertTo,
        subject: `${shared ? 'Shared link · ' : ''}${who} · ${mins} on the page${played.length ? ` · watched ${played.length} video${played.length > 1 ? 's' : ''}` : ''}`,
        text: [
          `${who} spent ${mins} on the page (${tab}, ${device}), ${when}.`,
          '',
          seen.length ? `Sections they reached:\n  • ${seen.join('\n  • ')}` : 'They left before the first section.',
          '',
          played.length ? `Videos played:\n  • ${played.join('\n  • ')}` : 'No videos played.',
        ].join('\n')
      });
    }
  } catch (e) {
    console.error('alert failed', e && e.message);
  }
  res.status(204).end();
};
