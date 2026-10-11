# Hardware-Accelerated Performance Guide for Mid-Spec Hardware

Rendering real-time optical filters like `backdrop-filter: blur(...)` requires significant pixel fill-rate and texture sampling bandwidth from the GPU. On mid-spec hardware (integrated Intel UHD/Iris GPUs, AMD Radeon 600M/700M series, mobile browsers, or older laptops), unoptimized glassmorphism can cause noticeable frame rate stutter and battery drain.

Follow these engineering mandates to guarantee steady 60 FPS rendering on mid-spec hardware:

---

## 1. The Blur Radius Budget

Every pixel rendered through a CSS blur filter requires a 2D Gaussian kernel pass. Doubling the blur radius quadruples the fragment shader texture fetches.

| UI Element Type | Max Blur Radius | Safe Max Opacity | Rationale |
| :--- | :--- | :--- | :--- |
| **Global Fixed Navbar** | `blur(12px)` | `0.85` | Remains visible constantly during scrolling; low blur preserves scroll FPS. |
| **Grid Cards (Repeat > 6)** | `blur(10px)` to `blur(14px)` | `0.65` | Stacking multiple blurred cards multiplies overdraw penalty. |
| **Floating Action Button/Pill** | `blur(12px)` | `0.75` | Small surface area has negligible GPU cost. |
| **Modal / Dialog Overlay** | `blur(20px)` | `0.85` | Modal pauses interaction with underlying page; background is static. |
| **Hero Spotlight Card** | `blur(16px)` | `0.70` | Isolated single element, safe at medium blur. |

**BANNED on mid-spec**: Never use `blur(40px)` to `blur(100px)` on large full-viewport panels or repeating list items.

---

## 2. Zero Layout Thrashing (Compositor-Only Transitions)

When adding interactive hover or active effects to glass cards, **only animate GPU compositor-driven properties**:

### Safe (Runs on GPU thread without Layout/Paint recalculation):
- `transform: translateY(-2px)`
- `transform: scale(1.02)`
- `opacity: 0.9`
- `border-color: rgba(...)` (runs paint on separate layer)

### Forbidden (Triggers synchronous layout reflow and jank):
- `height` or `width` expansion on hover.
- `padding` or `margin` shifts.
- Animating `backdrop-filter: blur(...)` dynamically on mouseenter (causes massive re-rasterization on every frame). Instead, use a fixed blur radius and adjust background opacity or specular rim brightness!

---

## 3. DOM & Paint Optimization Rules

1. **Layer Promotion**:
   ```css
   .liquid-glass-interactive {
     transform: translateZ(0);
     will-change: transform;
   }
   ```
2. **CSS Containment**:
   On catalog grids or feed lists containing numerous glass elements:
   ```css
   .glass-grid-item {
     content-visibility: auto;
     contain-intrinsic-size: 280px 380px;
   }
   ```
   This skips off-screen layout and backdrop rasterization completely until scrolled into view.

3. **Asset Decoupling**:
   ```html
   <img src="..." loading="lazy" decoding="async" alt="..." />
   ```
   Never block the main thread while decoding images underlying glass sheets.
