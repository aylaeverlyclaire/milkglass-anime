# Original User Request

## Initial Request — 2026-10-12T08:24:20Z

This is a single self-contained fix; keep it small and focused. Prune redundant header and subnav chrome from Milkglass Pro, introduce explicit manual search confirmation with 5 recommendation suggestions, and transform the hero section into a clean rotating ongoing anime carousel cycling every 6 seconds with smooth low-fade transitions and consolidated metadata.

Working directory: C:\Users\mrido\.gemini\antigravity\scratch\milkglass-anime
Integrity mode: development

## Requirements

### R1. Navigation & Chrome Pruning
- Remove superfluous top header branding blocks: delete Fluent 2 logo, MILKGLASS SLA indicator, Theme toggle, and Employee sign-in pill.
- Remove subnav clutter: delete "AV1 Cinema Architecture", "Ctrl+K", "ID", "EN", and all view switcher pills ("Console", "Radar", "Catalog", "Batch Vault", "CDN NOC").
- Retain strictly: "Milkglass Pro" brand mark, search input with an explicit manual search button, "Explore", and "Watch Now".

### R2. Confirmed Search & 5-Item Recommendation Engine
- Catalog search results must render ONLY when the manual search button is clicked (or Enter key pressed), confirming deliberate query submission. Typing does not auto-render search results prematurely.
- Directly below the search bar, display a strip of up to 5 smart recommendation pills based on trending/simulcast anime. Clicking any recommendation immediately populates the search bar and executes the search.

### R3. Rotating Ongoing Anime Hero Carousel (6-Second Low Fade)
- Completely remove the right-column "Broadcast HUD" block (Live Sync, Ingest Codec, Resolution, Subtitle Engine, Failover Guard, AdShield).
- Convert the Hero Spotlight into an autonomous cyclical carousel that rotates through currently airing/ongoing anime every 6 seconds.
- Implement a smooth "low fade" crossfade transition effect. Title, synopsis, score, episode status, backdrop artwork, and actions must update seamlessly in lockstep.
- Rename primary action button from "Launch Direct Stream (1080p FHD)" to "Watch Now".
- Rename secondary action button from "Technical Dossier" to "Information".

### R4. Typography & Metadata Consolidation
- Clean up raw unparsed HTML formatting: strip `<br>`, `<i>`, `(Source: ...)`, and editorial notes from the synopsis text, ensuring clean, readable paragraph typography.
- Clarify episode availability with concise, unambiguous phrasing (e.g. `Latest: Episode 3 of 12` or `Aired: Ep 1–3 (Total 12 Ep)`).
- Clarify rating context by rendering an SVG star badge followed by the explicit 10-point scale: `7.5 / 10`.
- Eliminate duplicated information blocks (e.g. repeated episode counts, redundant subtitle verified notices, double batch locked banners). Consolidate into a single, clean informational summary.

## Acceptance Criteria

### Navigation & Chrome
- [ ] Top bar header containing Fluent 2, SLA 99.99%, Theme toggle, and Employee sign-in is completely removed from the DOM.
- [ ] Subnav contains only Milkglass Pro, manual search box with search button, Explore, and Watch Now.
- [ ] Navigation layout remains responsive and intact across desktop and mobile viewports.

### Search & Suggestions
- [ ] Typing into search input does not auto-populate results until the search button is explicitly clicked or confirmed.
- [ ] Exactly 5 (or fewer if catalog is constrained) relevant suggestion pills appear under the search area and trigger search on click.

### Hero Rotating Carousel
- [ ] Hero section rotates between ongoing anime every 6 seconds with a smooth low-fade CSS/JS transition.
- [ ] Hero buttons display "Watch Now" and "Information" respectively.
- [ ] Broadcast HUD is completely absent from the DOM.
- [ ] Raw HTML tags (`<br>`, `<i>`) are cleanly stripped from descriptions.
- [ ] Rating explicitly presents `X.X / 10` with an SVG star icon.

### Verification Suite
- [ ] `node verify_chrome.mjs` passes 100% with 0 uncaught exceptions.
- [ ] Video playback stream modal, failover chain, and completed batch download gating continue to function without regressions.
- [ ] `deploy.ps1` runs cleanly, updating preview and pushing to GitHub `origin/main`.
