# Cricket R/W Calculator

A mobile-friendly web app for tracking the runs-per-wicket (R/W) differential
for up to 4 teams, each of which can log up to 4 matches. Matches are logged
per team against a free-text opponent — the 4 teams don't need to have
played each other.

## What it calculates

For each match, R/W is `runs / wickets lost` for each side. The
differential for a match is the team's own R/W minus the opponent's R/W —
e.g. Wildcats score 100/1 and the opponent scores 90/10:

```
Wildcats R/W = 100 / 1  = 100.00
Opponent R/W =  90 / 10 =   9.00
Differential = 100.00 - 9.00 = +91.00
```

If a side lost 0 wickets, the divisor is treated as 1 (rather than being
undefined), so `100/0` is scored the same as `100/1`.

The aggregate table's **R/W** column is the *aggregate* rate across all of
a team's matches: total runs scored ÷ total wickets lost, minus the
opponents' total runs ÷ total wickets lost across those same matches. This
is not an average of the per-match differentials — it's computed from the
combined totals, e.g. across 3 matches with runs/wickets of 100/1, 50/2 and
80/0 (Wildcats) vs 90/10, 40/5 and 70/10 (opponents):
`(230/3) - (200/25) = 76.67 - 8.00 = +68.67`.

## Running it

This is a static site with no build step or dependencies. Serve the folder
with any static file server, e.g.:

```
python3 -m http.server 8080
```

Then open `http://localhost:8080` in a browser.

## Installing on your phone (no app store needed)

1. Host these files somewhere reachable from your phone (e.g. GitHub Pages,
   Netlify, Vercel, or any static host), or serve them from a computer on
   the same Wi-Fi network.
2. Open the URL in your phone's browser (Safari on iOS, Chrome on Android).
3. **iOS (Safari):** tap the Share icon → "Add to Home Screen".
   **Android (Chrome):** tap the ⋮ menu → "Add to Home screen" / "Install app".
4. The app launches full-screen from your home screen icon, just like a
   native app, and works offline after the first load (via its service
   worker) and remembers your teams/matches between sessions (via
   localStorage on your device).

## Notes / limits

- Up to 4 teams, each with up to 4 matches logged against free-text
  opponents.
- Wickets lost per innings is 0–10.
- All data is stored locally in the browser only — nothing is sent to a
  server.
