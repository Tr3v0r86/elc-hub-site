# elc-hub-site

Public landing page for **elc-hub.com**. Deploy target only.

- **Live:** https://elc-hub.com (GitHub Pages, custom domain via `CNAME`).
- **Canonical design source:** the REAL repo (`elc-real-school-project`), `06-deliverables/step1-microsite.html`. This repo holds the *published* copy only.
- **Publish:** copy the built microsite to `index.html`, commit, push. Pages rebuilds in ~1 min.

## Confidentiality

This repo is **public** and contains **only** the outward-facing landing page. Nothing from the private REAL repo (sources, ADRs, deck, renders, team photos, `_private/`) is ever copied here. The landing page gives no operational detail away by design.

## Files

- `index.html` — the landing page (currently a detail-free holding page).
- `CNAME` — custom domain (`elc-hub.com`).
- `.nojekyll` — serve files as-is, no Jekyll processing.
