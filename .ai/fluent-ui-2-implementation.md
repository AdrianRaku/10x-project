# Fluent UI 2 Design System - Implementacja

Dokument opisuje zaimplementowane tokeny Fluent UI 2 w projekcie MyFilms.

## Data implementacji: 2025-11-28

---

## 📦 Zaimplementowane systemy tokenów

### 1. **Border Radius System**
Fluent UI 2 używa większych zaokrągleń niż poprzedni system:

```css
--radius-none: 0
--radius-small: 4px      /* chips, tags */
--radius-medium: 8px     /* buttons, inputs */
--radius-large: 12px     /* cards, panels */
--radius-xlarge: 16px    /* dialogs, sheets */
--radius-circular: 9999px /* avatars, pills */
```

**Użycie w Tailwind:**
- `rounded-sm` → 4px
- `rounded-md` → 8px
- `rounded-lg` → 12px
- `rounded-xl` → 16px

---

### 2. **Neutral Color Palette**
Pełna skala neutralnych odcieni (16 poziomów):

```css
--neutral-1 do --neutral-160
```

Zapewnia:
- Jednolitą percepcję jasności (OKLCH)
- Płynne przejścia między odcieniami
- Spójność w light i dark mode
- WCAG AA compliance (min. 4.5:1 dla tekstu)

---

### 3. **Brand Colors (Fluent Blue)**
Palette zgodna z Microsoft Fluent Design:

```css
--brand-10 do --brand-160
--brand-60  /* Primary brand color */
--brand-70  /* Hover state */
--brand-80  /* Pressed state */
```

**Charakterystyka:**
- Hue: 264° (niebieski)
- Saturacja: 0.19-0.26 (żywe, ale nie krzykliwe)
- Lightness: skalowana dla accessibility

---

### 4. **Semantic Colors**

#### Success (Zielony)
```css
--success-10 do --success-60
--success-60  /* Primary success color */
```

#### Warning (Żółty)
```css
--warning-10 do --warning-60
--warning-50  /* Primary warning color */
```

#### Error (Czerwony)
```css
--error-10 do --error-70
--error-60  /* Primary error color */
```

**Wszystkie kolory semantic zapewniają:**
- Kontrast min. 4.5:1 z tłem
- Odpowiednie wersje dla dark mode
- Kolory foreground dla białego tekstu

---

### 5. **Elevation System (Shadows)**
6 poziomów cieni zgodnych z Fluent UI 2:

```css
--shadow-2   /* Subtle hover states */
--shadow-4   /* Cards at rest */
--shadow-8   /* Raised cards */
--shadow-16  /* Floating elements */
--shadow-28  /* Dialogs, sheets */
--shadow-64  /* Modal overlays */
```

**Użycie:**
```tsx
<div className="elevation-4">Card</div>
<div className="elevation-16">Floating panel</div>
```

**Dark mode:**
- Cienie są intensywniejsze (większa opacity)
- Dostosowane do ciemnego tła

---

### 6. **Typography System**

#### Font Families
```css
--font-family-base: 'Segoe UI', system-ui, -apple-system, sans-serif
--font-family-monospace: 'Cascadia Code', Consolas, monospace
```

#### Font Sizes (10 poziomów)
```css
--font-size-100:  10px  /* Caption 2 */
--font-size-200:  12px  /* Caption 1 */
--font-size-300:  14px  /* Body small */
--font-size-400:  16px  /* Body (default) */
--font-size-500:  18px  /* Subtitle 2 */
--font-size-600:  20px  /* Subtitle 1 */
--font-size-700:  28px  /* Title 3 */
--font-size-800:  32px  /* Title 2 */
--font-size-900:  40px  /* Title 1 */
--font-size-1000: 68px  /* Display */
```

#### Font Weights
```css
--font-weight-regular: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

#### Użycie w komponentach:
```tsx
<h1 className="text-title-1">Main heading</h1>
<p className="text-body">Regular paragraph</p>
<span className="text-caption-1">Small text</span>
```

---

### 7. **Spacing System**
Oparty na 4px base unit:

```css
--spacing-xxs:    2px
--spacing-xs:     4px
--spacing-s:      8px
--spacing-m:      12px
--spacing-l:      16px
--spacing-xl:     20px
--spacing-xxl:    24px
--spacing-xxxl:   32px
```

**Nudge values** dla precyzyjnego layoutu:
```css
--spacing-sNudge:  10px
--spacing-mNudge:  14px
```

---

### 8. **Motion System**

#### Durations
```css
--duration-ultra-fast: 50ms
--duration-faster:     100ms
--duration-fast:       150ms
--duration-normal:     200ms  /* Default dla większości animacji */
--duration-gentle:     250ms
--duration-slow:       300ms
--duration-slower:     400ms
--duration-ultra-slow: 500ms
```

#### Easing Curves
```css
--curve-easy-ease:   cubic-bezier(0.33, 0, 0.67, 1)  /* Fluent default */
--curve-linear:      linear
--curve-decelerate:  cubic-bezier(0, 0, 0, 1)
--curve-accelerate:  cubic-bezier(1, 0, 1, 1)
```

**Przykład użycia:**
```css
.button {
  transition: background-color var(--duration-normal) var(--curve-easy-ease);
}
```

---

### 9. **Stroke/Border Widths**
```css
--stroke-thin:    1px  /* Default borders */
--stroke-thick:   2px  /* Focus indicators */
--stroke-thicker: 3px  /* Strong emphasis */
```

---

## 🎨 Semantic Token Mappings

### Light Mode
```css
--background:           var(--neutral-1)    /* Najjaśniejszy */
--foreground:           var(--neutral-160)  /* Najciemniejszy */
--primary:              var(--brand-60)     /* Fluent Blue */
--primary-hover:        var(--brand-70)
--primary-pressed:      var(--brand-80)
--card:                 var(--neutral-1)
--border:               var(--neutral-24)
--muted:                var(--neutral-16)
--muted-foreground:     var(--neutral-112)
```

### Dark Mode
```css
--background:           var(--neutral-160)  /* Najciemniejszy */
--foreground:           var(--neutral-8)    /* Najjaśniejszy */
--primary:              var(--brand-60)     /* Ten sam niebieski */
--primary-hover:        var(--brand-50)     /* Jaśniejszy w dark */
--primary-pressed:      var(--brand-40)
--card:                 var(--neutral-152)
--border:               oklch(1 0 0 / 10%)  /* Białe z opacity */
--muted:                var(--neutral-136)
--muted-foreground:     var(--neutral-64)
```

---

## ♿ Accessibility Features

### 1. **Focus Indicators**
```css
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  border-radius: var(--radius-small);
}
```

### 2. **Reduced Motion Support**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 3. **High Contrast Mode Support**
```css
@media (prefers-contrast: high) {
  * {
    --border: var(--border-strong);
    --stroke-thin: var(--stroke-thick);
  }
}
```

### 4. **Color Contrast Compliance**
- **Wszystkie pary tekst/tło: min. 4.5:1** (WCAG AA)
- **Duży tekst (18px+): min. 3:1**
- **Komponenty interaktywne: min. 3:1**
- **Używamy OKLCH** dla jednolitej percepcji jasności

---

## 🔧 Integracja z Tailwind CSS

### Dostępne klasy utility:

#### Elevation:
```tsx
<div className="elevation-4">Card</div>
<div className="elevation-16">Modal</div>
```

#### Typography:
```tsx
<h1 className="text-title-1">Heading</h1>
<p className="text-body">Paragraph</p>
<span className="text-caption-1">Small text</span>
```

#### Standard Tailwind:
Wszystkie tokeny są zmapowane do Tailwind:
```tsx
<div className="bg-background text-foreground">
<button className="bg-primary text-primary-foreground rounded-md">
<div className="border border-border">
```

---

## 📝 Jak używać

### 1. W CSS/SCSS:
```css
.my-component {
  background: var(--background);
  color: var(--foreground);
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-4);
  transition: all var(--duration-normal) var(--curve-easy-ease);
}
```

### 2. W Tailwind:
```tsx
<div className="bg-card text-card-foreground rounded-lg elevation-4">
  <h2 className="text-title-2 mb-4">Title</h2>
  <p className="text-body text-muted-foreground">Content</p>
</div>
```

### 3. W inline styles (React):
```tsx
<div style={{
  backgroundColor: 'var(--background)',
  borderRadius: 'var(--radius-large)',
  boxShadow: 'var(--shadow-8)',
}}>
```

---

## 🎯 Najlepsze praktyki

### 1. **Używaj semantic tokens, nie raw values**
✅ `var(--primary)`
❌ `var(--brand-60)`

### 2. **Elevation dla hierarchii wizualnej**
- Rest state: `elevation-4`
- Hover: `elevation-8`
- Floating: `elevation-16`
- Modals: `elevation-28` lub `elevation-64`

### 3. **Typography scale**
- Używaj predefiniowanych klas `.text-*`
- Nie mieszaj różnych skal w jednym komponencie
- Zachowaj spójność line-height

### 4. **Motion**
- Default duration: `--duration-normal` (200ms)
- Default easing: `--curve-easy-ease`
- Zawsze respektuj `prefers-reduced-motion`

### 5. **Spacing**
- Używaj wielokrotności 4px
- Dla precyzyjnego layoutu: użyj `*Nudge` values
- Zachowaj konsystencję w całej aplikacji

---

## 🔄 Migracja z poprzedniego systemu

### Co się zmieniło:

1. **Radius:**
   - Stare: `--radius: 0.625rem` (10px)
   - Nowe: `--radius-medium: 0.5rem` (8px)
   - Mapowanie: `--radius` → `--radius-medium` (backward compatible)

2. **Kolory:**
   - Dodano pełne palette: neutrals, brand, semantic
   - Wszystkie semantic tokens zachowały nazwy
   - Dark mode ma teraz dedykowane wartości

3. **Nowe systemy:**
   - Elevation (shadows)
   - Typography scale
   - Spacing system
   - Motion tokens

### Backward compatibility:
```css
--radius: var(--radius-medium);  /* Legacy support */
```

Wszystkie istniejące komponenty działają bez zmian, ale mogą być stopniowo migrowane do nowego systemu.

---

## 📚 Referencje

- [Microsoft Fluent UI 2](https://fluent2.microsoft.design/)
- [OKLCH Color Space](https://oklch.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS v4](https://tailwindcss.com/)

---

## ✅ Checklist implementacji

- [x] Border radius system
- [x] Neutral color palette (16 levels)
- [x] Brand colors (Fluent Blue)
- [x] Semantic colors (success, warning, error)
- [x] Elevation system (6 levels)
- [x] Typography system
- [x] Spacing system
- [x] Motion tokens
- [x] Stroke/border widths
- [x] Light mode semantic mappings
- [x] Dark mode semantic mappings
- [x] Focus indicators
- [x] Reduced motion support
- [x] High contrast support
- [x] WCAG AA compliance
- [x] Tailwind integration
- [x] Utility classes
- [x] Backward compatibility

---

**Status:** ✅ Implementacja zakończona i gotowa do użycia
