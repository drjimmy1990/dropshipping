# DropLinker — Design Screens Walkthrough

## Stitch Project
**Project:** `DropLinker — Dropshipping Automation SaaS`
**Project ID:** `2699193768354039664`
**Design System:** "Ethereal Velocity" — Glassmorphism + Corporate Modernism

> [!TIP]
> **Open the project in Stitch to view all designs:** Navigate to [Google Stitch](https://stitch.withgoogle.com/) and open project `2699193768354039664`

---

## Design System: "Ethereal Velocity"

| Token | Value |
|---|---|
| **Primary** | Electric Purple `#6C5CE7` |
| **Secondary** | Cyan Flare `#00D2FF` |
| **Tertiary** | Emerald `#00B894` |
| **Background** | Midnight Obsidian `#13121B` |
| **Font** | Inter (all weights) |
| **Mode** | Dark |
| **Style** | Glassmorphism + backdrop blur + tonal borders |
| **Corner Radius** | 8px (buttons) / 16px (cards) |

---

## Screens Generated (8 total)

### 1. 🏠 Landing Page
**Screen ID:** `34c7263e64ad4874864c90ee191f2a6a`

Full marketing landing page with:
- Hero section: "Automate Your Dropshipping Business"
- Trusted by logos (Salla, Zid, AliExpress, CJ)
- How it works (3 steps)
- Features grid (6 cards)
- Pricing tiers (Starter, Growth, Pro)
- CTA banner + Footer

---

### 2. 📊 Dashboard Overview
Merchant command center with:
- Wallet balance, orders today, active products, revenue stats
- Revenue line chart (30 days)
- Recent orders table
- Quick actions + alerts panel
- Sidebar navigation

---

### 3. 🔍 Product Discovery
Product search engine:
- Search bar with filters (supplier, category, price, shipping, rating)
- Product grid (4 columns) with cards showing image, price, rating, supplier badge
- "Import to Store" button per product
- Pagination

---

### 4. 📥 Import Wizard
Multi-step product import flow:
- 5-step progress stepper
- Product image gallery (left)
- Content editing form with bilingual fields (EN/AR)
- AI rewrite buttons (calls n8n → GPT-4o)
- Profit margin calculator
- Store selection

---

### 5. 📦 My Products
Inventory management table:
- Stats row (total, active, out of stock, draft)
- Filterable/searchable product table
- Stock status badges (green/yellow/red)
- Bulk actions (sync, pause, delete)

---

### 6. 🛒 Orders
Fulfillment operations center:
- Status filter tabs (New, Processing, Ordered, Shipped, Delivered, Failed)
- Order status pipeline visualization
- Detailed orders table with profit column
- Bulk retry/fulfill actions

---

### 7. 💳 Wallet
Financial center:
- Large balance card with reserved amount
- Top-up methods (Moyasar, Stripe, Bank Transfer)
- Balance chart (30 days)
- Transaction history table (deposits, deductions, commissions, refunds)
- Auto top-up settings

---

### 8. 🔗 Integrations
Store & supplier connections:
- Salla connection card (with webhook status)
- Zid connection card
- AliExpress connection card
- CJDropshipping connection card
- Default supplier selector

---

### 9. 🛡️ Admin Panel
Platform owner dashboard:
- Merchant stats, revenue, deposits overview
- Revenue breakdown (subscriptions vs commissions)
- Recent merchants table
- Pending bank transfer approvals
- System health indicators

---

### 10. 🔐 Auth (Login/Register)
Split-view auth page:
- Login form (left): email, password, Google OAuth
- Register form (right): business name, email, phone, platform preference, language
- Glassmorphic cards on gradient mesh background

---

## Remaining Pages (to generate later)

| # | Page | Status |
|---|---|---|
| 11 | Settings | ⏳ Not yet designed |
| 12 | Admin Merchants | ⏳ Not yet designed |
| 13 | Admin Revenue Config | ⏳ Not yet designed |
| 14 | Admin Bank Transfers | ⏳ Not yet designed |
| 15 | Admin Order Monitor | ⏳ Not yet designed |
| 16 | Admin Platform Settings | ⏳ Not yet designed |
| 17 | Features Page (public) | ⏳ Not yet designed |
| 18 | Pricing Page (public) | ⏳ Not yet designed |
| 19 | Forgot Password | ⏳ Not yet designed |

> [!NOTE]
> The 10 screens above cover the **core user flows**. The remaining 9 are secondary pages that can be designed during development or as follow-up iterations.

---

## Next Steps

1. **Review designs in Stitch** — check if the visual style works for you
2. **Request changes** — I can edit any screen or generate variants
3. **Approve & Start Building** — once designs are approved, we begin Next.js implementation
