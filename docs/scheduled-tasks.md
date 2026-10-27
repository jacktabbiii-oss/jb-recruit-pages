# Scheduled tasks for the recruit pages

Two standing tasks keep the pages right. Both run in the Claude app as scheduled tasks (Settings → Scheduled tasks → New). Paste the prompt block as the task's prompt. Both need the Vercel and Google Sheets connectors and GitHub access to `jacktabbiii-oss/jb-recruit-pages`.

| Task | When | What it does |
|---|---|---|
| Refresh recruit pages after games | Mondays 8:56 am ET (exists: update its prompt to the text below) | Stats, ranks, honors, comp rows; audit; push; confirm deploy; Changelog |
| Rules watch: NCAA, Congress, states, NFLPA | Tuesdays 8:37 am ET (new) | Rule and law changes that touch clients or recruits; fixes page lines contradicted by an official source; logs the rest and proposes wording |

---

## 1. Refresh recruit pages after games (Mondays)

```
Weekly refresh of the JB Sports recruit pages after the weekend's games. Keep every page's numbers, ranks and honors current, verified, and deployed. Only use facts you can confirm from an official source (school athletics site, conference site, CBS/ESPN box scores; for conference or national ranks, cfbstats.com conference leader pages, which compile the NCAA's official stats, cited as "cfbstats (NCAA stats)"). Never invent or estimate a number.

SETUP
1. git clone https://github.com/jacktabbiii-oss/jb-recruit-pages.git /home/claude/jb-recruit-pages (if it already exists, git pull). Work there.
2. Pages live in recruits/<slug>.json. Skip any JSON whose slug contains "example" or with "active": false (carlos-hernandez is off; leave him alone). Check the folder for new players and handle them by "mode" (draft / college / hs). Pages with "intro": true show only a few sections, but their "numbers" still render in "Where you stand today", so keep them current too. Active as of Oct 27, 2026:
   - eli-finley (TE, Louisiana Tech, draft). Through Oct. 24: 39 rec, 462 yds, 5 TD in 7 games; No. 1 among Sun Belt TEs in catches, yards and TD; 3rd among FBS TEs in yards; career-high 10 catches vs ODU Oct. 24.
   - jeremiah-hasley (TE, Duke #85, draft). Through Oct. 23: 21 rec, 250 yds, 0 TD in 7 games; 88 yds vs Stanford Sept. 19 (career high); 6 catches at Georgia Tech Oct. 10. No conference rank shown (8th among ACC TEs in yards); add one only if he climbs into the top 5.
   - cole-keller (TE, James Madison #0, draft, intro). Through Oct. 22: 20 rec, 350 yds, 5 TD, long 57 in 8 games; No. 2 among Sun Belt TEs in yards, tied 1st in TD; T-3rd among FBS TEs in TD. Comp table row "Production" shows the current-season line; update it. Never name Eli Finley on Cole's page (the audit fails on another recruit's name).
   - zach-lohavichan (DL, Wake Forest #94, draft, intro). Through Oct. 17 (bye Oct. 24): 26 tackles, 7.5 TFL, 2.5 sacks, 4 QBH, 1 blocked FG in 7 games; top 10 in the ACC in TFL. Remaining: Virginia 10/31, Merrimack 11/7, at SMU 11/14, at Georgia Tech 11/21, Duke 11/28.
   - amareon-blue (RB, Eastern Michigan #15, college). Through Oct. 24: 79 carries, 405 yds, 3 TD in 9 games, long 50; leads EMU in carries and yards; 8th in the MAC in rushing yards. Keep the 6,985-yard high school tile.
   - marshall-pritchett (TE, Alabama #9, college). Through Oct. 24: 18 rec, 237 yds, 2 TD in 8 games (official bio through Tennessee plus the official Texas A&M recap, 3-18-1); 5th among SEC TEs in catches and yards; 6 catches vs Tennessee (team high); long 38 vs South Carolina. Comp table "Production" row shows the current season; update it. Alabama: bye Oct. 31, then at LSU Nov. 7.
   - maurice-veney (TE, Vanderbilt #19, college, intro). Through Oct. 24: 2 rec, 65 yds, 0 TD in 8 games, long 45 vs Arkansas Oct. 17. No rank tile. Vanderbilt: bye Oct. 31, then at Mississippi State Nov. 7.
   - jeremiah-jones (OL, Michigan City HS, Indiana commit, hs). His "numbers" are profile facts, not game stats: do NOT change them weekly. Only update for a verified new honor, ranking, offer or signing news (early signing period Dec. 2-4, 2026).

FOR EACH ACTIVE PLAYER
3. Look up the latest game and current season totals on the school's athletics site (the cumulative stats PDF under /sports/football/stats is usually the most reliable) and a box score. Bye week: note it, change nothing except a rank tile if the leaderboard moved.
4. "numbers": 4 entries of [big number, short label]. Keep the style: season totals through a date; a standout from the latest game (career high, team high); a conference or FBS position rank with its date; a long or a per-carry figure. Update "numbersSrc" to "Through <Mon. D> · <school> Athletics, cfbstats (NCAA stats)" (drop cfbstats when there is no rank tile). A rank is only stated when read off a leaderboard dated through the latest games; note games-played differences in the summary, not on the page.
5. Honors: a new official watch list, midseason All-America, conference or national weekly award gets a short chip in "honors" (official sources only). Don't remove existing honors.
6. "comp.rows": update any row that shows current-season production. Leave prior-season rows alone.
7. If a JB client on the wall or in the "record" block changed teams, signed or was released, don't change it; mention it in the summary. Hooker's $48.6M (Sept 2025), Kraft's $75M (Sept 2026) and Kittle's $76.4M (Apr 2025) are the record block in template.html.

CHECK AND SHIP
8. Audit: npm i --no-save playwright@1 (do NOT run playwright install; Chromium is at /opt/pw-browsers/chromium), start the preview with node scripts/serve.js & (restart it after any template.html edit; it caches the template), then node scripts/audit.js with a long timeout (a dozen pages take several minutes). 0 failures required. Never put a player's name into template.html.
9. Commit with git -c user.name="Jack Tabb" -c user.email="jacktabb@nfladvisor.com" commit -m "<what changed>" and push to origin main.
10. The push deploys automatically. Confirm with the Vercel tool list_deployments (teamId team_hKIogWWcC4U1KUEkuzvcFboD, projectId prj_S7zhYNEayEJkqUOAXLjap6b0U49o, sha = the new commit) until state is READY. Do not call create_deployment.
11. Log in the tracker Google Sheet (id 1jSe-sKLgJyIJ0YibACBGwm7MpqHhMqnYpOTya13aeTM): append a row per player to the "Changelog" tab: [today's date, player name, what changed].

When a player's season is over (final regular-season or bowl game played), say so and stop updating that player.

FINISH with a short summary: each player, latest game line, what changed on the page (or "no change, bye week"), and anything that needs Jack's call. If nothing changed for anyone, one line.
```

---

## 2. Rules watch: NCAA, Congress, states, NFLPA (Tuesdays)

```
Weekly rules watch for JB Sports (Jack Tabb III, NFLPA-certified agent). Find every rule, law, court ruling, policy change or date announcement from the past 7 days that affects Jack's clients or the recruits on his pages, and keep the recruit pages' rule statements and dates correct. Only official or primary sources count for a change (governing-body releases, bill text, court orders, by-laws, league calendars); trade press is a lead to verify, never the source. Never invent a number, date or rule.

SETUP
1. git clone https://github.com/jacktabbiii-oss/jb-recruit-pages.git /home/claude/jb-recruit-pages (git pull if it exists). Work there.
2. Read every recruits/<slug>.json with "active" not false and slug not containing "example". For each, note: mode (hs / college / draft), school and state, draft class or enrollment year, and every rule statement and date on the page: the "nil" cards and "nil.src" as-of date, "parentQA", "reads", "yr1", "timeline" entries, and any "record" or "numbers" label that cites a rule. Also read template.html for shared rule copy: the status block (P = {...} near the top of the script), the draft-slot calculator (ANCH table, year-one minimum, the JBLINE notes), the "What's included" list and the parents' "reads". Build a claims list: each statement, which page(s) carry it, and the source it rests on.
3. Pages as of Oct 27, 2026 (check the folder; it changes): jeremiah-jones (HS OL, Michigan City IN, Indiana commit, fall 2027 enrollee), amareon-blue (RB, Eastern Michigan, sophomore), marshall-pritchett (TE, Alabama, sophomore), maurice-veney (TE, Vanderbilt, junior), cole-keller (TE, James Madison, 2027 draft), zach-lohavichan (DL, Wake Forest, 2027 draft), jeremiah-hasley (TE, Duke, 2027 draft), eli-finley (TE, Louisiana Tech, 2027 draft). Jack's NFL clients are on the wall in every JSON (Kittle, Kraft, Hooker, LaPorta, Ferguson, Helm, Bellinger, Gray, Tonyan, Nelson, Welch, Higgins, Colby, Heck, Wohler, Castro, Wetjen, and the rest).

WHAT TO WATCH (every run; WebSearch mode "extended" plus WebFetch; primary sources first)
A. NCAA Division I: ncaa.org/news and the DI Cabinet, Council and Board releases; eligibility (the age-based model, who it applies to, transfer rules, waivers), agents for prospects and athletes, recruiting calendars and signing periods, transfer portal windows, roster limits, NIL and revenue-share bylaws, the NCAA House settlement Q&A.
B. House settlement administration: College Sports Commission (collegesportscommission.org): the revenue-share cap for the current and next year, NIL Go thresholds and deadlines, enforcement actions and appeals, any court filings in House v. NCAA.
C. Congress and federal: congress.gov for bills on college athletics (SCORE Act and successors, NIL, athlete employment, antitrust exemptions), committee hearings and markups, any executive order implementation, Department of Education or Labor actions on athlete employment, and federal court rulings (Johnson v. NCAA, state attorney general suits, Title IX challenges to revenue sharing).
D. States: Indiana (IHSAA Rule 5-7 personal branding, the Indiana General Assembly, Ind. Code 25-5.2 athlete-agent law) for the HS page; the college NIL and athlete-agent laws of every state where a page's school sits (currently Alabama, Tennessee, Virginia, North Carolina, Louisiana, Michigan, Indiana); and any state that newly allows or restricts high school NIL, since Jack recruits nationally.
E. NFL and NFLPA: NFLPA agent regulations and certification rules, the salary cap announcement and the rookie wage scale (which reset the draft-slot calculator), the Combine, Pro Day and draft dates, the Senior Bowl and Shrine Bowl invite windows, CBA negotiations, and any contract-rule change that touches the record section (the Kittle, Kraft and Hooker deals).
F. Conferences: ACC, SEC, Big Ten, Sun Belt, MAC policies on revenue share, agents, eligibility or scheduling that moves a date on a page.
G. Dates that drive the pages: early and regular signing periods, transfer portal windows, the Combine and draft dates, the cap announcement. If a date on any page is wrong or has passed without the page catching up, that is a fix.

DECIDE AND ACT
4. For each change found: does it contradict a statement on a page (a number, a date, a threshold, a rule that no longer holds)? If yes and the correction is verifiable from an official source, fix the page line(s): edit the JSON (or the shared copy in template.html if the line lives there; never put a player's name into template.html), update the nil.src as-of date, and keep the page's plain tone. Run the audit: npm i --no-save playwright@1 (do NOT run playwright install; Chromium is at /opt/pw-browsers/chromium), node scripts/serve.js & (restart it after a template.html edit) then node scripts/audit.js with a long timeout; it must show 0 failures. Commit with git -c user.name="Jack Tabb" -c user.email="jacktabb@nfladvisor.com" commit -m "<what changed and why>" and push to origin main. The push deploys automatically; confirm with the Vercel tool list_deployments (teamId team_hKIogWWcC4U1KUEkuzvcFboD, projectId prj_S7zhYNEayEJkqUOAXLjap6b0U49o, sha = the new commit) until state is READY. Do not call create_deployment.
5. If a change is material to a client or prospect but does not contradict a page line (a bill advancing, a hearing, a proposed rule, a court date, a new state law elsewhere), do not edit the pages. Record it and propose the wording Jack could add, with the source.
6. Log everything in the tracker Google Sheet (id 1jSe-sKLgJyIJ0YibACBGwm7MpqHhMqnYpOTya13aeTM). Use get_spreadsheet with fields ["sheets.properties"] to list tabs. If there is no "Rules watch" tab, create it with update_spreadsheet addSheet and write the header at Rules watch!A1:I1: Date | Body | What changed | Effective | Who it affects | Page lines affected | Action taken | Proposed wording | Source URL. Read the existing rows first so the same change is never logged twice (match on Source URL, or on Body plus What changed). Append one row per change with append_values at Rules watch!A1. Any page edit also gets a row in the "Changelog" tab: [today's date, player name or "Template", what changed].

FINISH
7. Send one notification with the PushNotification tool only if something changed or something needs Jack's decision; stay silent if the week was quiet. In the notification and the final summary: each change in one line (body, what, effective date, who it touches), what was fixed on which page, what is proposed and waiting on Jack, and one line on any source that could not be reached. If nothing changed, the summary is one line.
```
