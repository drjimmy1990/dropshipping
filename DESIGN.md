# DESIGN.md — Quiet Commerce

DropLinker's visual language. Calm, trustworthy, professional. Light-first with dark mode support.

## Color System (OKLCH)

### Strategy: Restrained
Tinted warm neutrals + one accent color used ≤10% of any surface. Color earns its place through meaning, not decoration.

### Light Theme (default)

| Token | OKLCH | Hex (approx) | Usage |
|---|---|---|---|
| `--color-bg` | `oklch(0.985 0.002 90)` | `#faf9f7` | Page background |
| `--color-surface` | `oklch(1.0 0 0)` | `#ffffff` | Card/panel backgrounds |
| `--color-surface-raised` | `oklch(1.0 0 0)` | `#ffffff` | Elevated cards (shadow distinguishes) |
| `--color-surface-sunken` | `oklch(0.965 0.003 90)` | `#f3f1ee` | Inset areas, table stripes |
| `--color-border` | `oklch(0.88 0.005 90)` | `#ddd9d3` | Card borders, dividers |
| `--color-border-subtle` | `oklch(0.93 0.003 90)` | `#ece9e4` | Light dividers |
| `--color-text` | `oklch(0.20 0.005 90)` | `#1a1917` | Primary text |
| `--color-text-secondary` | `oklch(0.45 0.01 90)` | `#6b6560` | Secondary labels, descriptions |
| `--color-text-muted` | `oklch(0.60 0.01 90)` | `#958e87` | Placeholders, timestamps |
| `--color-accent` | `oklch(0.55 0.12 175)` | `#1a8a6e` | Primary actions, links, active states |
| `--color-accent-hover` | `oklch(0.48 0.12 175)` | `#14735b` | Accent hover |
| `--color-accent-subtle` | `oklch(0.95 0.03 175)` | `#e6f5f0` | Accent backgrounds (badges, highlights) |
| `--color-accent-on` | `oklch(1.0 0 0)` | `#ffffff` | Text on accent |
| `--color-success` | `oklch(0.55 0.12 145)` | `#2d8a4e` | Fulfilled, connected, positive |
| `--color-warning` | `oklch(0.65 0.15 80)` | `#b8860b` | Processing, attention needed |
| `--color-error` | `oklch(0.55 0.15 25)` | `#c93c3c` | Failed, disconnected, negative |
| `--color-info` | `oklch(0.55 0.10 240)` | `#3b6faf` | Informational |

### Dark Theme

| Token | OKLCH | Usage |
|---|---|---|
| `--color-bg` | `oklch(0.15 0.005 260)` | Page background |
| `--color-surface` | `oklch(0.19 0.007 260)` | Card backgrounds |
| `--color-surface-raised` | `oklch(0.22 0.008 260)` | Elevated cards |
| `--color-surface-sunken` | `oklch(0.13 0.005 260)` | Inset areas |
| `--color-border` | `oklch(0.30 0.01 260)` | Card borders |
| `--color-border-subtle` | `oklch(0.25 0.008 260)` | Light dividers |
| `--color-text` | `oklch(0.93 0.005 90)` | Primary text |
| `--color-text-secondary` | `oklch(0.70 0.01 90)` | Secondary labels |
| `--color-text-muted` | `oklch(0.50 0.01 260)` | Placeholders |
| `--color-accent` | `oklch(0.65 0.12 175)` | Primary actions (slightly brighter in dark) |
| `--color-accent-hover` | `oklch(0.70 0.12 175)` | Accent hover |
| `--color-accent-subtle` | `oklch(0.22 0.04 175)` | Accent backgrounds |
| `--color-accent-on` | `oklch(1.0 0 0)` | Text on accent |

## Typography

**Font**: Inter (variable weight). Single family is correct for product UI.

**Scale** (ratio 1.2):

| Token | Size | Weight | Usage |
|---|---|---|---|
| `--text-xs` | 0.75rem / 12px | 400 | Timestamps, badges, metadata |
| `--text-sm` | 0.875rem / 14px | 400–500 | Table cells, secondary labels |
| `--text-base` | 1rem / 16px | 400 | Body text, form inputs |
| `--text-lg` | 1.125rem / 18px | 500 | Section titles, card headings |
| `--text-xl` | 1.25rem / 20px | 600 | Page section headings |
| `--text-2xl` | 1.5rem / 24px | 600 | Page titles |
| `--text-3xl` | 1.875rem / 30px | 700 | Hero headings (landing only) |
| `--text-4xl` | 2.25rem / 36px | 700 | Landing hero title |

**Line height**: 1.5 for body, 1.2 for headings. Max line length: 65ch for prose.

## Surfaces

Three levels, no glass, no blur:

| Surface | Light | Dark | Use |
|---|---|---|---|
| **Default** | White, no shadow | Dark surface, 1px border | Standard cards, panels |
| **Raised** | White, `shadow-sm` | Slightly lighter, 1px border | Elevated cards, dropdowns |
| **Sunken** | Warm gray tint | Darker inset | Table rows, input backgrounds |

**Card rules**:
- 1px solid border (`--color-border`)
- `border-radius: 8px` (not 12px, not 16px, not 24px)
- Padding: 16px (compact) or 24px (standard)
- Never nested. A card inside a card is always wrong.

## Buttons

| Variant | Style | Usage |
|---|---|---|
| **Primary** | Solid `--color-accent`, white text | One per visible section max |
| **Secondary** | 1px border `--color-border`, default text | Alternative actions |
| **Ghost** | No border, no background, accent text | Tertiary actions, links |
| **Destructive** | Solid `--color-error`, white text | Delete, disconnect |

All buttons: `border-radius: 6px`, `font-weight: 500`, `padding: 8px 16px` (sm) / `10px 20px` (md) / `12px 24px` (lg).

No gradients. No shadows on buttons. No `scale()` transforms on hover (use opacity or background shift).

## Status Indicators

Always pair color with icon or text. Color alone is not sufficient.

| Status | Color | Icon | Usage |
|---|---|---|---|
| Fulfilled | `--color-success` | `check_circle` | Completed orders |
| Processing | `--color-warning` | `schedule` | In-progress items |
| Failed | `--color-error` | `error` | Errors, failed syncs |
| Pending | `--color-text-muted` | `hourglass_empty` | Awaiting action |
| Connected | `--color-success` | `link` | Active integrations |
| Disconnected | `--color-text-muted` | `link_off` | Inactive integrations |

## Shadows (light mode only)

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 2px oklch(0 0 0 / 0.05)` | Raised cards |
| `--shadow-md` | `0 4px 12px oklch(0 0 0 / 0.08)` | Dropdowns, popovers |
| `--shadow-lg` | `0 8px 24px oklch(0 0 0 / 0.12)` | Modals |

Dark mode: no shadows. Use 1px borders instead.

## Motion

- 150ms for micro-interactions (hover, focus)
- 200ms for content reveals (skeleton → data)
- No orchestrated sequences. No staggered card entrances. Content appears.
- `ease-out` only. No bounce, no elastic.

## Spacing

8px base grid. Use multiples: 4, 8, 12, 16, 24, 32, 48, 64.

## What This System Explicitly Forbids

- Gradient text (`background-clip: text`)
- Gradient fills on buttons
- Glassmorphism / backdrop-filter blur on cards
- Side-stripe borders (colored left/right borders)
- Hero-metric template (big number + small label + icon in identical cards)
- Identical card grids (same card repeated with only icon/text changing)
- Any color at full saturation on inactive elements
- `#000000` or `#ffffff` without tinting
