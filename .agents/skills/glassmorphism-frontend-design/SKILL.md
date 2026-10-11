---
name: glassmorphism-frontend-design
description: >-
  Specialized frontend design skill for engineering high-performance Glassmorphism, Liquidglass,
  and Spatial UI web interfaces. Enforces anti-AI-slop design standards, hardware-accelerated CSS
  for mid-spec hardware, 8-state interactive components, tactile micro-borders, and optical refraction
  layering. Use whenever designing, building, or refactoring UI components, landing pages, or dashboards
  requiring glassmorphism, liquid glass, frosted glass, backdrop blur, or modern tactile aesthetics.
---

# Glassmorphism & Liquidglass Frontend Design Skill

A precision engineering runbook for creating tactile, production-grade **Glassmorphism**, **Liquidglass**, and **Spatial UI** interfaces that feel hand-crafted, physically grounded, and completely free of "AI slop".

---

## 1. Core Visual Principles of Authentic Glassmorphism

Authentic glassmorphism simulates real-world optical properties of translucent frosted materials (refraction, specular reflections, sub-surface scattering, and ambient occlusion). Generic AI-generated glass often defaults to a washed-out white box with an excessive blur radius. 

Follow these five core physical rules:

### 1.1 Multi-Surface Depth & Layering
Never render glass on a flat, solid white or flat black background without texture or depth. Glass requires an underlying depth layer (subtle ambient gradients, deep slate hues, or contextual background elements) to exhibit optical refraction.
- **Base Canvas**: Deep zinc/slate `#070b14` or textured neutral canvas.
- **Primary Glass Surface (Layer 1)**: `backdrop-filter: blur(12px) -webkit-backdrop-filter: blur(12px); background: rgba(13, 21, 38, 0.65);`
- **Floating Interactive Elements (Layer 2)**: `backdrop-filter: blur(16px); background: rgba(17, 27, 48, 0.75);`
- **Modal / Overlay Sheet (Layer 3)**: High-contrast backdrop scrim `rgba(4, 7, 13, 0.85)` with `backdrop-filter: blur(20px)`.

### 1.2 Specular Rim Highlighting & Micro-Borders
Glass has distinct physical edges that catch directional light:
- **Hairline Micro-Border**: Exactly `1px solid rgba(255, 255, 255, 0.1)` (or `0.12` for dark themes). Never use heavy 2px+ borders.
- **Specular Rim Gradient**: Use `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.2)` or top-edge linear gradients to create light reflection at the top perimeter.
- **Ambient Occlusion**: Layer a diffuse, low-opacity drop shadow: `box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.15);`

### 1.3 Anti-AI-Slop Governance for Glass Design
- **No Emoticon Chrome**: Zero emojis (★, 🛡️, ⏰, 🟢, 🍿) in navigation headers, rating pills, or badge chrome. Use crisp SVG vector icons (e.g. Lucide icons).
- **Typography Purity**: Headings must remain upright (`font-style: normal`). Never use italicized emphasis words inside display headings.
- **No Washed-Out Text (WCAG 4.5:1)**: Translucent glass reduces contrast. Ensure text over glass is rendered with high-contrast neutral colors (`#f8fafc` for dark glass, `#0f172a` for light glass) and proper font weights (500–700).

---

## 2. Hardware-Accelerated Performance (Optimized for Mid-Spec Hardware)

Excessive `backdrop-filter` calculations across large viewports can trigger severe frame drops and thermal throttling on mid-spec devices and integrated GPUs. Enforce these strict performance constraints:

1. **Blur Radius Budget**:
   - Standard panels & cards: Maximum `blur(12px)` to `blur(16px)`.
   - Modals & dialog overlays: Maximum `blur(20px)`.
   - Avoid `blur(40px)+` on repeating list items or large scrolling grids.
2. **GPU Compositor Promotion**:
   - Isolate animated glass elements to their own compositor layer using `transform: translateZ(0)` or `will-change: transform`.
   - Animate ONLY GPU-accelerated properties (`transform`, `opacity`). Never animate `backdrop-filter`, `filter`, `width`, `height`, or `padding` during hover or transition states.
3. **Lazy Asset Loading**:
   - Always declare `loading="lazy"` and `decoding="async"` on all images rendered inside or behind glass panels.
4. **CSS Containment**:
   - Use `contain: layout style paint;` or `content-visibility: auto;` on large repeating glass card grids to bypass off-screen paint calculations.

See [`references/hardware-performance.md`](./references/hardware-performance.md) for detailed performance budgets.

---

## 3. The Mandatory 8-State Interactive Checklist

Every interactive glass component (button, input, card link, tab, modal trigger) must define and test code for all eight interactive states:

| State | Visual Treatment on Glass Surface |
| :--- | :--- |
| **1. Default** | Translucent base (`bg-white/[0.06]`), 1px `border-white/10`, hairline inset top highlight. |
| **2. Hover** | GPU scale/lift (`transform: translateY(-2px)`), border glow (`border-brand-500/40`), increased specular brightness. |
| **3. Focus-Visible** | High-contrast 2px ring offset with `outline: 2px solid var(--accent)` and `outline-offset: 2px`. |
| **4. Active (Pressed)**| GPU press down (`transform: translateY(0) scale(0.98)`), reduced highlight opacity. |
| **5. Disabled** | `opacity: 0.45; cursor: not-allowed; pointer-events: none; border-color: rgba(255,255,255,0.04);` |
| **6. Loading** | Subtle glass skeleton shimmer (`@keyframes shimmer`) or centered spinner, preserving container bounds. |
| **7. Error** | Border tint `rgba(239, 68, 68, 0.5)`, subtle error glow, error SVG icon with ARIA alert description. |
| **8. Success** | Border tint `rgba(16, 185, 129, 0.5)`, subtle emerald specular highlight. |

See [`references/component-checklist.md`](./references/component-checklist.md) for implementation snippets.

---

## 4. Production CSS Design Tokens (Tailwind & Vanilla)

```css
:root {
  /* Surface Glass Tokens */
  --glass-surface-base: rgba(13, 21, 38, 0.65);
  --glass-surface-elevated: rgba(17, 27, 48, 0.80);
  --glass-surface-interactive: rgba(25, 38, 66, 0.50);
  --glass-surface-hover: rgba(30, 46, 80, 0.70);

  /* Border & Rim Highlight Tokens */
  --glass-border-hairline: 1px solid rgba(255, 255, 255, 0.10);
  --glass-border-hover: 1px solid rgba(59, 130, 246, 0.45);
  --glass-specular-inset: inset 0 1px 0 0 rgba(255, 255, 255, 0.18);

  /* Blur & Shadow Tokens */
  --glass-blur-panel: blur(14px);
  --glass-shadow-ambient: 0 8px 32px 0 rgba(0, 0, 0, 0.35);
  --glass-shadow-elevated: 0 16px 48px 0 rgba(0, 0, 0, 0.45);
}

/* Glass Panel Utility Class */
.liquid-glass-panel {
  background: var(--glass-surface-base);
  backdrop-filter: var(--glass-blur-panel);
  -webkit-backdrop-filter: var(--glass-blur-panel);
  border: var(--glass-border-hairline);
  box-shadow: var(--glass-shadow-ambient), var(--glass-specular-inset);
  border-radius: 1rem;
}

/* Glass Interactive Utility Class */
.liquid-glass-interactive {
  background: var(--glass-surface-interactive);
  backdrop-filter: var(--glass-blur-panel);
  -webkit-backdrop-filter: var(--glass-blur-panel);
  border: var(--glass-border-hairline);
  box-shadow: var(--glass-shadow-ambient), var(--glass-specular-inset);
  border-radius: 0.75rem;
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1),
              border-color 180ms cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

.liquid-glass-interactive:hover {
  transform: translateY(-2px);
  border-color: rgba(96, 165, 250, 0.45);
  box-shadow: 0 12px 36px 0 rgba(0, 0, 0, 0.40), inset 0 1px 0 0 rgba(255, 255, 255, 0.28);
}
```

See [`references/glass-tokens.md`](./references/glass-tokens.md) for full palette and component variants.
