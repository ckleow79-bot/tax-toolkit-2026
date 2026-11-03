# Tax Compliance Toolkit 2026

KSLeow - In-House Training

Interactive tools for the KS Leow Tax Consultant Sdn Bhd in-house training, 7 Nov 2026 (B & K Academy PLT). Position as at 7 Nov 2026 · training tool, not tax advice.

**Live site:** https://ckleow79-bot.github.io/tax-toolkit-2026/ · **Presenter:** `/presenter.html`

| # | Tool | Session |
|---|---|---|
| 1 | Which regime? — income tax, RPGT, RPC, CGT | 1.0 |
| 2 | RPGT calculator + RPC 75% test | 1.1–1.2 |
| 3 | CGT on unlisted shares — 10% vs 2% | 1.3 |
| 4 | Stamp duty — property, shares, loans, late penalty | 1.4 |
| 5 | e-Invoice start date and who issues | 2.1–2.3 |
| 6 | SVDP filing helper — field sheets, exposure, gap register | 2.4 |
| 7 | Budget 2027 — MSME test, company and individual tax, payroll (proposed) | 3 |
| 8 | Deadline calendar | all |
| — | Live: polls, room checks, question wall (Firebase) | all |

- Static site, no build step. Design: B & K Academy Design System (`ds/`, copied from the source repo unmodified).
- Calculations live in `js/calc.js`; `node test/calc.test.js` checks them against the training deck's worked figures.
- Live features: see `SETUP.md`. Without a Firebase config the tools still work and the Live tab says "Live session not available".
- Offline: `sw.js` caches the site after the first visit, and `manifest.webmanifest` lets phones add it to the home screen. Pages, scripts and styles load network-first, so fixes reach phones on the next load. **When you change any file, bump `CACHE` in `sw.js`** (e.g. `tct26-v1.4`) **and the version label in `js/app.js`** to match.
- Libraries bundled in `js/vendor/` (Lucide icons, qrcode-generator) — no CDN needed except Firebase for live features. The design system's `fonts.css` also loads one Chinese webfont from Google Fonts (see SETUP.md, Data and PDPA).
