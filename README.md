# JB Sports recruit pages

One template, one JSON file per recruit, one private link each. Hosted on Vercel.

```
template.html          the page (design + behavior); edit once, every recruit gets it
recruits/<slug>.json   everything specific to one recruit, including the link token and on/off
api/page.js            renders /r/<slug>/<token>
api/track.js           emails Jack on open + a summary on leave (Resend)
api/media.js           signed, expiring URLs for private film and photos (Cloudflare R2)
scripts/               new-recruit, toggle on/off, upload-media
```

## Links
`https://<domain>/r/eli-finley/<token>`  
The slug alone 404s. The token is random per recruit. Parents tab deep link: add `#parents`.

## Daily use
- New recruit: `npm run new -- "First Last" --from eli-finley` (or `--from college-example` / `--from hs-example`; the mode comes with the file), fill the JSON, deploy.
- Turn a link off: `npm run off -- eli-finley`, deploy. On again: `npm run on -- eli-finley`.
- Instant kill without touching files: set `DISABLED_LINKS=eli-finley` in Vercel env vars and redeploy.
- Film/photos: `npm run upload -- eli-finley ./reel.mp4` prints the id to paste into the JSON. One reel of your favorite plays goes in `"reel": {"clip": "<id>", "len": "0:48"}`; the three notes then show as a list under it. Or put a clip id on each play in `plays[]` for three separate players. Photos: `"src": "<id>"` (add `"cutout": true` for a background-removed PNG/WebP). Keys live under `<slug>/` in a private bucket; the page gets a 10-minute signed URL only when the link checks out.
- Deploy: `vercel --prod`.

## What Jack receives
1. `Eli Finley just opened the page (parents tab)` — the moment it opens, with device and time.
2. `Eli Finley · 4m 12s on the page · watched 2 videos` — when they leave, with the sections reached and the videos played.
No cookies, no analytics vendors, nothing shared with third parties.

## Three versions, one template (`"mode"` in the JSON)
- `draft` — about to leave college, no agent yet (Eli). Draft-slot calculator, Combine/Draft timeline. Start from `eli-finley.json`.
- `college` — freshly in college. "The plan" sliders, three-year timeline, NIL/brand. Transfer is never the frame; it appears once, in the parents' Q&A, as a protocol if needed. Start from `college-example.json`.
- `hs` — high school. "The decision" sliders, recruiting timeline (camps, offers, visits, signing), parents-heavy. Start from `hs-example.json`. HS NIL rules vary by state; Ryan confirms before any send.

Per-player knobs in every JSON: `contact` (Jack or Ryan: name, phone, email; drives the button, the contact block and the pre-filled text), `cta`, `ask` (the closing headline and line), `alertTo` (who gets the open/summary emails), `unlocked` (add `elevate`, `handle`, `money`, `brand`, `plan` after the meeting to open the held-back parts), and `copy` (`[[selector, html], …]` to override any heading or lede).

## Before the first send
- Jack's three film notes and clips; hero video; photos.
- Ryan: fee language in the parents tab; college-mode compliance lines; film-use question.
- `ALERT_FROM` must be a verified Resend domain (reppr.io, nflagentplaybook.com or playcallpartners.com are verified today; nfladvisor.com is not).
- Replace `CHANGE_ME` in `recruits/eli-finley.json` with a real token: `node -e "console.log(require('crypto').randomBytes(9).toString('base64url'))"`.

## Env (Vercel → Settings → Environment Variables)
See `.env.example`.
