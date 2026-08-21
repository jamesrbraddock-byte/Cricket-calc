# Cricket R/W Calculator

A mobile-friendly web app for tracking the runs-per-wicket (R/W) differential
across up to 4 cricket matches and up to 4 teams.

## What it calculates

For each match, R/W is `runs / wickets lost` for each team. The
differential for a team in that match is its own R/W minus the opponent's
R/W — e.g. Team A scores 100/1 and Team B scores 90/10:

```
Team A R/W = 100 / 1  = 100.00
Team B R/W =  90 / 10 =   9.00
Differential (Team A) = 100.00 - 9.00 = +91.00
Differential (Team B) =   9.00 - 100.00 = -91.00
```

The aggregate table sums each team's differential across every match it
played, along with matches played and average R/W differential per match.

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

- Up to 4 teams and up to 4 matches, matching the original spec.
- Wickets lost must be between 1 and 10 for the R/W calculation to be
  defined (dividing by 0 wickets is mathematically undefined).
- All data is stored locally in the browser only — nothing is sent to a
  server.
