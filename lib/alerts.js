// Email alerts through Resend. Env:
//   RESEND_API_KEY   required
//   ALERT_TO         comma-separated recipients (Jack, Ryan)
//   ALERT_FROM       a verified sender, e.g. "JB Sports <alerts@reppr.io>"
const { Resend } = require('resend');

let client;
async function sendAlert({ subject, text, to: override }) {
  if (!process.env.RESEND_API_KEY) { console.log('[alert skipped]', subject); return; }
  client = client || new Resend(process.env.RESEND_API_KEY);
  const to = (Array.isArray(override) && override.length ? override : (process.env.ALERT_TO || '').split(',')).map(s => String(s).trim()).filter(Boolean);
  if (!to.length) return;
  await client.emails.send({
    from: process.env.ALERT_FROM || 'JB Sports <alerts@reppr.io>',
    to, subject, text,
  });
}

module.exports = { sendAlert };
