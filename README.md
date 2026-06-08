# elc-hub-site

Public landing page for **elc-hub.com**. Deploy target only.

- **Live:** https://elc-hub.com (GitHub Pages, custom domain via `CNAME`).
- **Design source:** Claude Design (claude.ai/design) handoff bundle, `landing/site/`. Editorial "coming soon" direction — hero statement, a "what's coming" ad row (sport / science / robotics), the children's-city flight-path banner, and the bottom-filling liquid dial. Self-contained: vanilla JS, Google-CDN fonts, four local images. Fits a laptop screen without scrolling.
- **Publish:** edit `index.html` (+ `assets/`), commit, push. Pages rebuilds in ~1 min.

## Confidentiality

This repo is **public** and contains **only** the outward-facing landing page. Nothing from the private REAL repo (sources, ADRs, deck, internal renders, team photos, `_private/`) is copied here. The page carries the public child-agency message and the brand — no operational detail (no ELC anchor, location, phases, people, dates, or plan).

## Files

- `index.html` — the coming-soon landing page.
- `assets/` — `flightpath.jpg` (banner), `football.jpg` · `experiment.jpg` · `robot.jpg` (ad tiles).
- `CNAME` — custom domain (`elc-hub.com`).
- `.nojekyll` — serve files as-is, no Jekyll processing.
