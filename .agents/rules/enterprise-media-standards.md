---
trigger: always_on
---

# Enterprise Digital Media Standards & Security Governance

## 1. Video Player Embed Security (Zero-Breakage Guarantee)
- NEVER apply the `sandbox` attribute to the `<iframe id="animeIframe">` element. Upstream streaming networks (AniEmbed, VidSrc, MultiEmbed) execute sandbox detectors (`sbx.js`) that redirect to `/sandbox.php`.
- Enforce AdShield security exclusively at the top-level browsing context:
  1. Tamper-proof non-configurable `window.open` descriptor on `window` and `Window.prototype`.
  2. Document-root click-hijack interceptor checking protocol and domain allowlists.
  3. Active MutationObserver sanitizing rogue popunder nodes.
  4. Feature Policy via `allow="autoplay; fullscreen; picture-in-picture; encrypted-media"`.

## 2. Anti-AI-Slop Front-End Mandates
- ZERO emojis (★, 🛡️, ⏰, 🟢, 🍿) in navigation chrome, score badges, status pills, or button labels. Always use Lucide SVG vector icons.
- ZERO italic display headers. All headings must be upright (`font-style: normal`).
- Commit to domain-specific palettes (Dark Frosted Slate / Liquid Glass) and eliminate generic AI purple/indigo gradients.
- Structural variety: do not default to standard 3-card feature columns.

## 3. Hardware-Accelerated Mid-Spec Performance
- Limit `backdrop-filter: blur(...)` to 12px–16px for cards and 20px for modals.
- Promote animated glass elements using `transform: translateZ(0)`.
- Restrict interactive transitions strictly to `transform` and `opacity`. Never animate layout properties (`width`, `height`, `padding`).
- All media images must carry `loading="lazy"` and `decoding="async"`.

## 4. Media Lifecycle & Batch Gating
- Batch download controls must remain strictly locked/hidden for ongoing broadcasts (`RELEASING`).
- Batch download controls are unlocked only for completed broadcasts (`FINISHED`), providing standard BEP 0009 / BEP 0053 40-char hex infohashes and JSON manifests.
