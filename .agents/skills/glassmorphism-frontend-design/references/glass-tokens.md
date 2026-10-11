# Glassmorphism Design Tokens Reference

This document catalogs exact, mathematically calibrated CSS design tokens for 5 distinct aesthetic genres of glassmorphism and liquidglass UI.

---

## 1. Dark Frosted Slate (Enterprise Digital Media / SaaS)
*Best for: Dashboards, enterprise platforms, media players, developer tools.*

```css
:root {
  --slate-glass-bg: rgba(13, 21, 38, 0.65);
  --slate-glass-border: 1px solid rgba(255, 255, 255, 0.08);
  --slate-glass-rim: inset 0 1px 0 0 rgba(255, 255, 255, 0.16);
  --slate-glass-blur: blur(14px);
  --slate-glass-shadow: 0 8px 32px -4px rgba(0, 0, 0, 0.5);
}
```

**Tailwind equivalents:**
```html
<div class="bg-[#0d1526]/65 backdrop-blur-md border border-white/10 shadow-xl shadow-black/40 shadow-inner-white/15 rounded-2xl">
```

---

## 2. Liquid Glass (Iridescent & Fluid Chromatic)
*Best for: High-end landing pages, product showcases, interactive hero sections.*

```css
:root {
  --liquid-glass-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
  --liquid-glass-border: 1px solid rgba(255, 255, 255, 0.15);
  --liquid-glass-rim: inset 0 1.5px 0 0 rgba(255, 255, 255, 0.35), inset 0 -1px 0 0 rgba(255, 255, 255, 0.08);
  --liquid-glass-blur: blur(16px);
  --liquid-glass-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.45);
}

.liquid-shimmer {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  animation: liquid-shimmer-sweep 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes liquid-shimmer-sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

---

## 3. Spatial VisionOS (Apple Spatial Computing Aesthetic)
*Best for: Floating utility panels, command palettes, modals, overlays.*

```css
:root {
  --vision-glass-bg: rgba(255, 255, 255, 0.12);
  --vision-glass-blur: blur(20px) saturate(180%);
  --vision-glass-border: 1px solid rgba(255, 255, 255, 0.22);
  --vision-glass-rim: inset 0 1px 0 0 rgba(255, 255, 255, 0.40);
  --vision-glass-shadow: 0 20px 60px 0 rgba(0, 0, 0, 0.25);
  --vision-glass-radius: 2rem;
}
```

---

## 4. Midnight Obsidian (Stealth Cyber Depth)
*Best for: Cyber-security dashboards, high-density telemetry, terminal widgets.*

```css
:root {
  --obsidian-glass-bg: rgba(6, 9, 15, 0.85);
  --obsidian-glass-border: 1px solid rgba(30, 41, 59, 0.80);
  --obsidian-glass-rim: inset 0 1px 0 0 rgba(56, 189, 248, 0.25);
  --obsidian-glass-blur: blur(10px);
  --obsidian-glass-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.6);
}
```

---

## 5. Luminous Ice (High-Key Refined Translucency)
*Best for: Light themes, modern fintech, document readers.*

```css
:root {
  --ice-glass-bg: rgba(255, 255, 255, 0.70);
  --ice-glass-border: 1px solid rgba(255, 255, 255, 0.60);
  --ice-glass-rim: inset 0 1px 0 0 rgba(255, 255, 255, 0.90);
  --ice-glass-blur: blur(16px);
  --ice-glass-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04);
  --ice-text-primary: #0f172a;
}
```
