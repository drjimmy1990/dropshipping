# Design System: DropLinker — Dropshipping Automation SaaS
**Project ID:** `2699193768354039664`
**Design System Name:** Ethereal Velocity
**Design System Asset:** `assets/e83026805b2548d88ab950c3ac492989`

---

## 1. Visual Theme & Atmosphere

The aesthetic philosophy is a fusion of **Glassmorphism** and **Corporate Modernism** — engineered to evoke the feeling of a **high-precision command center** for tech-savvy e-commerce entrepreneurs. The interface radiates "effortless control," where complex operational data — orders, wallets, supplier connections — feels weightless and approachable through translucent glass layers, luminous accent edges, and a vast, deep-space dark canvas.

**Atmosphere Keywords:** Futuristic · Precision-Engineered · Translucent · Commanding · Premium · Data-Rich yet Breathable

The dark foundation creates infinite depth, allowing vibrant purple and cyan accents to float forward like holographic readouts. Every card, button, and data widget feels like it's suspended in a control room — present but never heavy. The design communicates trust and sophistication to Saudi merchants managing thousands of SAR in automated fulfillment.

---

## 2. Color Palette & Roles

### Core Palette

| Descriptive Name | Hex Code | Functional Role |
|---|---|---|
| **Midnight Obsidian** | `#13121B` | Primary canvas / surface background. The deepest layer of the interface, providing maximum depth for glass effects. |
| **Abyssal Black** | `#0E0D16` | Lowest surface container. Used for sidebar backgrounds and deeply recessed areas that sit behind everything else. |
| **Smoke Glass** | `#201E28` | Default surface container. The base fill for glassmorphic cards and panels before blur is applied. |
| **Ash Veil** | `#2A2933` | High-elevation surface container. Used for interactive card states, table row hovers, and secondary panels. |
| **Pewter Mist** | `#35333E` | Highest surface container. Used for tooltips, dropdown menus, and the most elevated glass layers. |

### Brand & Accent Colors

| Descriptive Name | Hex Code | Functional Role |
|---|---|---|
| **Electric Purple** | `#6C5CE7` | Primary brand container color. Used for gradient origins, primary button fills, active nav indicators, and high-priority interactive elements. |
| **Lavender Glow** | `#C6BFFF` | Primary text-on-dark. Used for highlighted headings, active labels, and primary icon fills that need to "pop" against dark surfaces. |
| **Spectral Violet** | `#E4DFFF` | Fixed primary. Used for subtle purple tints on hover states and light emphasis within cards. |
| **Deep Indigo** | `#5847D2` | Inverse primary. Reserved for primary elements when displayed on light/inverse surfaces. |
| **Cyan Flare** | `#00D2FF` | Secondary container / gradient terminus. The "destination" color in brand gradients (purple → cyan). Used for secondary actions, focus rings, and data accent highlights. |
| **Arctic Mist** | `#A5E7FF` | Secondary text accent. Used for secondary labels, link text, and informational badges on dark backgrounds. |
| **Emerald Flux** | `#4BDDB7` | Tertiary / success color. Dedicated exclusively to positive metrics — revenue growth, active connections, "shipped" status, successful deposits. |
| **Forest Depth** | `#008167` | Tertiary container. Used as the background fill for success badges and status chips at 10% opacity. |

### Utility Colors

| Descriptive Name | Hex Code | Functional Role |
|---|---|---|
| **Soft Cloud** | `#E5E0EE` | On-surface text. The primary readable text color across all dark surfaces. |
| **Silver Haze** | `#C8C4D7` | On-surface-variant. Used for secondary text, descriptions, placeholders, and muted labels. |
| **Muted Slate** | `#928EA0` | Outline / border. Used for dividers, inactive borders, and non-interactive element edges. |
| **Charcoal Edge** | `#474554` | Subtle borders / outline variant. The glass-card border color — thin 1px lines that act as "light-traps" catching ambient glow. |
| **Ember Coral** | `#FFB4AB` | Error text. Used for failed order labels, insufficient balance warnings, and destructive action text. |
| **Crimson Well** | `#93000A` | Error container. Background fill for critical alert badges and error-state panels. |

### Signature Gradient

```
Direction: 135° diagonal (top-left to bottom-right)
From: Electric Purple (#6C5CE7)
To: Cyan Flare (#00D2FF)
```

Used for: Primary CTA buttons, progress bar tracks, featured card borders, the "brand signature" that represents data flow and automation movement.

---

## 3. Typography Rules

**Typeface:** **Inter** — used exclusively across all weights and sizes to maintain a systematic, utilitarian, and highly legible interface. No decorative or secondary typefaces are employed.

| Style | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| **Display Large** | 48px | Bold (700) | 1.1 | -0.02em (tight) | Hero headings, landing page titles, wallet balance figures |
| **Headline Large** | 32px | Semibold (600) | 1.2 | -0.01em (snug) | Page section headings, modal titles |
| **Headline Medium** | 24px | Semibold (600) | 1.3 | Normal | Card titles, sidebar section labels |
| **Body Large** | 18px | Regular (400) | 1.6 | Normal | Primary body text, descriptions, feature explanations |
| **Body Medium** | 16px | Regular (400) | 1.6 | Normal | Default paragraph text, table cell content, form labels |
| **Label Small** | 13px | Semibold (600) | 1.0 | 0.05em (wide) | Status badges, filter chips, uppercase micro-labels, metadata tags |

**Hierarchy Philosophy:** Weight and tracking differentiation — not decorative flourishes — establish the information hierarchy. Display styles use negative letter-spacing for a compressed, editorial-premium feel. Small labels use increased tracking with uppercase transforms to ensure readability against blurred, dark backgrounds. All body text maintains a generous 1.6 line height to prevent visual fatigue in data-heavy dashboard views.

**Arabic (RTL) Support:** For bilingual content, Cairo or IBM Plex Arabic should complement Inter with equivalent weight mappings. Layout direction flips via `dir="rtl"` with mirrored spacing.

---

## 4. Component Stylings

### Buttons

* **Primary Action:** Pill-to-rounded shape (8px radius). Filled with the signature 135° gradient (Electric Purple → Cyan Flare). White text. On hover, brightness increases by 10%, creating a luminous "power-up" effect. Used for "Start Free Trial," "Import to Store," "Top Up," "Create Account."
* **Secondary Action:** Transparent fill with a 1px border rendered using the primary gradient. Text inherits the Lavender Glow color. Used for "Watch Demo," "Re-sync," "Export CSV."
* **Tertiary / Ghost:** No background, no border. White text only. On hover, a whisper-thin 10% white opacity background fades in. Used for inline navigation links, "Disconnect," and subtle actions.

### Cards & Containers

* **Corner Roundness:** Generously rounded (16px / 1rem radius) — softening the technical precision of the data within and creating a modern, approachable silhouette.
* **Background:** Never solid. Always a translucent glass layer — 4% white opacity (`rgba(255, 255, 255, 0.04)`) with `backdrop-filter: blur(16px)`.
* **Border:** Every card is edged with a 1px border at 10% white opacity (`rgba(255, 255, 255, 0.1)`) — acting as "light-traps" that define the glass edges against the dark void.
* **Hover State:** Background intensifies to 8% white opacity, blur increases to 32px, border brightens to 20% white opacity.
* **Modal / Overlay State:** 12% white opacity, 40px blur, plus a subtle 64px spread shadow at 40% opacity using Electric Purple (#6C5CE7) — creating a soft "neon glow" under-light.

### Input Fields & Forms

* **Fill:** Darker-than-background fill (#050505) with 8px radius. The field appears as a carved-in recess in the glass surface.
* **Stroke:** None by default. On focus, a 1px solid Cyan Flare (#00D2FF) border appears with a soft outer glow — signaling active input like a laser line.
* **Placeholder Text:** Silver Haze (#C8C4D7) at 60% opacity.

### Chips & Badges

* **Shape:** Pill-shaped (fully rounded, `border-radius: 9999px`).
* **Success Badges:** Emerald Flux (#4BDDB7) text on a 10% opacity Emerald background — creating a "glowing" effect. Used for "Active," "Connected," "Shipped."
* **Warning Badges:** Amber (#FDCB6E) text on 10% amber background. Used for "Low Stock," "Pending."
* **Error Badges:** Ember Coral (#FFB4AB) text on 10% crimson background. Used for "Failed," "Disconnected."
* **Neutral Badges:** Silver Haze text on 10% white background. Used for "Draft," "Paused."

### Progress Indicators & Stepper

* **Track:** 4px thin line. Inactive segments use Charcoal Edge (#474554).
* **Active Track:** Filled with the signature purple-to-cyan gradient, conveying active data processing and forward automation momentum.
* **Step Nodes:** Circular (24px), filled with gradient when completed, outlined when pending.

### Data Tables

* **Container:** Glassmorphic card wrapper with 16px radius.
* **Header Row:** Slightly elevated (Surface Container High, #2A2933) with Label Small typography in uppercase.
* **Data Rows:** Transparent by default. On hover, Ash Veil (#2A2933) background fades in.
* **Row Borders:** 1px Charcoal Edge (#474554) bottom border between rows.
* **Zebra Striping:** Not used — hover state provides sufficient visual differentiation.

### Sidebar Navigation

* **Background:** Abyssal Black (#0E0D16) — the deepest layer in the elevation system.
* **Nav Items:** Body Medium text in Silver Haze. On hover, 10% white background.
* **Active Item:** Lavender Glow (#C6BFFF) text with a 3px left border in Electric Purple (#6C5CE7). Background subtly tinted with 4% purple.
* **Logo Area:** Top of sidebar, padded generously (40px vertical).

---

## 5. Layout Principles

**Spatial Philosophy:** Generous whitespace is the luxury that separates a premium SaaS from a cluttered dashboard. Data density is high, but breathing room prevents cognitive overload.

| Token | Value | Usage |
|---|---|---|
| **Base Unit** | 8px | The atomic spacing unit. All spacing is a multiple of this. |
| **Extra Small** | 4px | Micro-gaps: between badge text and icon, inline chip spacing. |
| **Small** | 12px | Tight grouping: between related form fields, stacked labels. |
| **Medium** | 24px | Default content padding inside cards and containers. |
| **Large** | 40px | Section spacing: vertical gap between major dashboard sections. |
| **Extra Large** | 64px | Page section separation on marketing/landing pages. |
| **Gutter** | 24px | Grid column gaps. |
| **Desktop Margin** | 48px | Horizontal page margin on desktop viewports. |
| **Mobile Margin** | 20px | Horizontal page margin on mobile viewports. |

**Grid:** 12-column fluid grid with 24px gutters. Dashboard uses a sidebar (240px collapsed / 280px expanded) + fluid main content area.

**Elevation Hierarchy:**
1. **Level 0 — Canvas:** Solid Midnight Obsidian (#13121B). The infinite dark void.
2. **Level 1 — Default Cards:** 4% white + 16px blur + 10% border. Standard dashboard widgets.
3. **Level 2 — Interactive:** 8% white + 32px blur + 20% border. Hover states, active panels.
4. **Level 3 — Overlays:** 12% white + 40px blur + purple neon glow shadow. Modals, import wizards, dropdowns.
