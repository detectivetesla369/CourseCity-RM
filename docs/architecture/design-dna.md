# CourseCity 1.0 — Design DNA & Visual Language

## 1. Visual Identity & Brand Philosophy

CourseCity is designed to feel **editorial, warm, technical, and human-crafted**. It decisively departs from generic AI-generated landing pages and neon gradients.

### Core Visual Attributes

- **Spacious Editorial Composition**: Generous whitespace, asymmetric card layouts, and strong typographic hierarchy.
- **Warm Organic Atmosphere**: Built upon an ivory/cream base with deep espresso neutrals and a vibrant, authoritative signature orange.
- **Tangible Depth**: Subtle elevation, crisp hairline borders (`1px solid #EDE3DA`), and restrained shadows.
- **Academic Gravitas**: Clean typography that prioritizes readability, comprehension, and trust.

### Prohibited Design Anti-Patterns

- ❌ Neon rainbow gradients or multi-colored glow blobs.
- ❌ Generic SaaS emoji lists or checkmark forests.
- ❌ Fake social proof, synthetic customer counts, or artificial reviews.
- ❌ Over-animated bouncing elements or spinning 3D cubes.
- ❌ Centered-everything corporate template syndrome.

---

## 2. Color System & Design Tokens

### 2.1 The CourseCity Orange Palette

```css
:root {
  --cc-orange-50: #fff7ed; /* Pale tint / subtle card background */
  --cc-orange-100: #ffedd5; /* Badge background */
  --cc-orange-200: #fed7aa; /* Border highlight */
  --cc-orange-300: #fdba74; /* Accent detail */
  --cc-orange-400: #fb923c; /* Interactive hover */
  --cc-orange-500: #f97316; /* BRAND SIGNATURE PRIMARY */
  --cc-orange-600: #ea580c; /* Active button state */
  --cc-orange-700: #c2410c; /* Deep link / text on pale bg */
  --cc-orange-800: #9a3412; /* High-contrast badge text */
  --cc-orange-bright: #ff7a00; /* Energetic accent variant */
}
```

### 2.2 Warm Neutrals (Espresso & Cream)

```css
:root {
  --cc-bg-pure: #ffffff; /* Modal / pure white card surfaces */
  --cc-bg-canvas: #fffcf8; /* Primary application body background */
  --cc-bg-ivory: #fff9f4; /* Secondary section background */
  --cc-border-warm: #ede3da; /* Primary divider & card hairline border */
  --cc-text-muted: #766b61; /* Secondary captions & helper text */
  --cc-text-body: #453b33; /* High-readability body text */
  --cc-text-primary: #17130f; /* Headings, titles, deep contrast */
}
```

### 2.3 Semantic Pastels (Purposeful Accents)

```css
:root {
  --cc-pastel-success: #ddf3e7; /* Verified receipts, completed lessons */
  --cc-pastel-warning: #fff0b8; /* Pending payments, in-review badges */
  --cc-pastel-accent: #eee7ff; /* Certificates, academic distinctions */
  --cc-pastel-warm: #ffe2cc; /* Highlighted callouts */
}
```

---

## 3. Typography & Hierarchy

CourseCity pairs an editorial display sans-serif with a crisp, high-legibility body sans:

- **Display / Headings**: **Plus Jakarta Sans** (weights 600, 700, 800) or **Manrope**.
- **Body / UI Controls**: **Inter** (weights 400, 500, 600).
- **Code / Mathematical Notation**: **JetBrains Mono** or **Fira Code**.

### Scale & Proportion

- `Display Large`: `3.5rem (56px)`, line-height `1.1`, tracking `-0.025em`, font-weight `700`.
- `Heading 1`: `2.25rem (36px)`, line-height `1.2`, tracking `-0.02em`, font-weight `700`.
- `Heading 2`: `1.75rem (28px)`, line-height `1.3`, tracking `-0.015em`, font-weight `600`.
- `Heading 3`: `1.25rem (20px)`, line-height `1.4`, tracking `-0.01em`, font-weight `600`.
- `Body Regular`: `1rem (16px)`, line-height `1.6`, font-weight `400`.
- `Small / Caption`: `0.875rem (14px)`, line-height `1.5`, font-weight `500`.

---

## 4. Lucide Iconography System

All interface icons are sourced strictly from **Lucide React** to ensure mathematical stroke harmony:

- `fill`: `none`
- `stroke`: `currentColor`
- `strokeWidth`: `2px` (default) or `1.75px` on dense displays.
- `strokeLinecap`: `round`
- `strokeLinejoin`: `round`

### Standard Sizing Standards

- **16px (`h-4 w-4`)**: Dense metadata tags, table row icons, breadcrumb separators.
- **18px (`h-[18px] w-[18px]`)**: Compact buttons, inline input field icons.
- **20px (`h-5 w-5`)**: Standard navigation links, toolbar actions, card badges.
- **24px (`h-6 w-6`)**: Primary action headers, feature highlights, modal triggers.

### Accessibility Rules

- **Decorative Icons**: Accompanied by `aria-hidden="true"`.
- **Actionable Icon Buttons**: Explicit `aria-label` supplied on the parent `<button>` (e.g. `<button aria-label="Toggle curriculum navigation"><Menu className="h-5 w-5" aria-hidden="true" /></button>`).
- **Touch Boundaries**: The interactive bounding box is always padded to minimum **44x44 CSS pixels**.

---

## 5. Visual Storytelling Modes

CourseCity employs 5 purposeful **visual modes** for architectural and pedagogical explanations:

1. **Exploded View**: Dissects course anatomy into floating, sequential cards separated by restrained isometric offsets.
2. **X-Ray Mode**: Renders system infrastructure and security layers using delicate hairline linework and frosted glass.
3. **Blueprint Mode**: Displays API request flows and database relations on an ivory engineering grid.
4. **Sticky Notes**: Contextual yellow/peach annotations providing study hints and instructor tips.
5. **Handwritten Accents**: Subtle script markers (`"Start here"`, `"Key insight"`, `"Crucial"`) used sparingly for human editorial warmth.
