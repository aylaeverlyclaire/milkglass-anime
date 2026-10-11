# 8-State Interactive Glass Component Checklist

Every interactive element built with glassmorphism must support all 8 states to guarantee accessibility, predictable feedback, and enterprise quality.

---

## 1. Glass Action Button Specification

```html
<button class="glass-btn">
  <svg class="icon" viewBox="0 0 24 24"><!-- lucide icon --></svg>
  <span>Execute Stream</span>
</button>
```

```css
.glass-btn {
  /* 1. Default State */
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  background: rgba(37, 99, 235, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.20);
  border-radius: 0.5rem;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.30);
  cursor: pointer;
  transform: translateZ(0);
  transition: transform 150ms ease, background 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
}

/* 2. Hover State */
.glass-btn:hover {
  transform: translateY(-1.5px);
  background: rgba(37, 99, 235, 0.90);
  border-color: rgba(255, 255, 255, 0.35);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

/* 3. Focus-Visible State */
.glass-btn:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
}

/* 4. Active (Pressed) State */
.glass-btn:active {
  transform: translateY(0.5px) scale(0.98);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.30), inset 0 1px 0 rgba(0, 0, 0, 0.20);
}

/* 5. Disabled State */
.glass-btn:disabled,
.glass-btn[aria-disabled="true"] {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
  background: rgba(100, 116, 139, 0.25);
  border-color: rgba(255, 255, 255, 0.05);
  box-shadow: none;
}

/* 6. Loading State */
.glass-btn.is-loading {
  pointer-events: none;
  position: relative;
  color: transparent !important;
}
.glass-btn.is-loading::after {
  content: "";
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: glass-spin 0.6s linear infinite;
}

@keyframes glass-spin {
  to { transform: rotate(360deg); }
}

/* 7. Error State */
.glass-btn.is-error {
  background: rgba(220, 38, 38, 0.75);
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);
}

/* 8. Success State */
.glass-btn.is-success {
  background: rgba(16, 185, 129, 0.75);
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
}
```

---

## 2. Glass Input Field Specification

```css
.glass-input {
  /* 1. Default */
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 0.5rem;
  color: #f8fafc;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: all 150ms ease;
}

/* 2. Hover */
.glass-input:hover {
  border-color: rgba(255, 255, 255, 0.20);
}

/* 3. Focus-Visible */
.glass-input:focus-visible {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25), inset 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 5. Disabled */
.glass-input:disabled {
  opacity: 0.40;
  cursor: not-allowed;
  background: rgba(15, 23, 42, 0.30);
}

/* 7. Error */
.glass-input.has-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.20);
}
```
