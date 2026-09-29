# Paper Rent

A scroll-driven presentation for MGT 402 Peer Case 1 (Yale SOM). It asks whether Medical Properties Trust (MPW) was paying its own rent, lending to its tenants and booking the money back as rent, and whether the financial statements would have shown it. MPW is compared with Omega Healthcare (OHI) and Sabra Health Care (SBRA) over FY2021–FY2024.

Live: https://shanehaynes.github.io/Paper-Rent/

Authors: Annie Wang, Rachel Rosenberg, Shane Haynes.

## Presenting

The page replaces a slide deck. Each chapter has one or more beats, and the deck snaps to a resting state per beat.

| Key | Action |
| --- | --- |
| → ↓ Space PageDown | Next beat |
| ← ↑ PageUp | Previous beat |
| Home | Back to start |
| A | Toggle the appendix (arrow keys step through its tabs) |
| T | Toggle the countdown timer |
| Esc | Close the appendix and timer |

Clickers that send PageUp/PageDown work without setup. With `prefers-reduced-motion`, beats cross-fade and nothing animates. Below 700px wide the page becomes a plain stacked document.

`dist/paper-rent.html` is a single self-contained file that opens from `file://` with no network, as a backup if the venue Wi-Fi fails.

## Development

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

`build` writes `dist/paper-rent.html`, copies it to `docs/index.html` (served by GitHub Pages), then runs the number check. Commit `docs/` to deploy.

## The number rule

Every figure on the page comes from `paper_rent_data.json`. Nothing is typed into copy.

- `paper_rent_data.json`: filing data per company and year, plus supplementary figures, precomputed ratios, notes and sourced `story_facts`.
- `src/derive.js`: accessors and derived values, pure functions of the JSON.
- `src/format.js`: the only formatters ($787M below $1B, $1.56B above; percentages; multiples).
- `src/content.js`: all copy, built from the two files above.

`scripts/verify-numbers.mjs` renders the built page and fails the build if any `$`, `%` or `×` token (including tooltips, chart labels and screen-reader tables) is not a JSON or derived value with the correct sign, or if a figure in a known position (DuPont grid, accruals chart, warning tiles, appendix tables) does not equal the value computed from the JSON.

To change a number, change the JSON. To change a claim, change `src/content.js` and rebuild.

## Checks

| Command | What it does |
| --- | --- |
| `npm run verify` | Number check against the current build |
| `npm run copy` | Prints all copy as plain text with numbers resolved (`copy-review.txt` is a saved run) |
| `npm run screenshots` | Screenshots every resting state at 1920×1080, 1440×900 and 1280×720; fails on overflow |
| `npm run rehearse` | Drives the deck by keyboard with motion on and counts key presses; `npm run rehearse -- file` runs it against the built file with network blocked |
| `node scripts/reduced-motion.mjs` | Steps the built file with reduced motion and checks every state is visible |
| `node scripts/contact-sheet.mjs` | Tiles the screenshots into one sheet per viewport |

Screenshots land in `screenshots/`, which is git-ignored.

## Layout

```
src/
  main.js      entry: scenes, footer, appendix overlay, timer, key bindings
  scenes.js    one builder per scene; beats gate elements via data-show
  charts.js    inline SVG charts (d3-scale, d3-shape)
  motion.js    GSAP ScrollTrigger timelines layered on the resting layouts
  nav.js       beat registry, scroll-to-beat mapping, keyboard navigation
  content.js   all copy
  derive.js    data accessors and derived values
  format.js    number formatters
  dom.js       h() / s() element builders
  styles.css
scripts/       verification and rehearsal tooling (Playwright)
docs/          GitHub Pages build output
dist/          standalone single-file build
```
