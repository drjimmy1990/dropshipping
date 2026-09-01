// ================================================================
// TMTECH — Mock Data & Static Content
// Source of truth for all UI text, product data, and page content.
// ================================================================

// --- Navigation ---
export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: string;
}

export const LANDING_NAV_ITEMS: readonly NavItem[] = [
  { label: "Features", href: "/features", icon: "auto_awesome" },
  { label: "Solutions", href: "#solutions", icon: "hub" },
  { label: "How It Works", href: "#how-it-works", icon: "route" },
  { label: "Pricing", href: "/pricing", icon: "payments" },
];

export const DASHBOARD_NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Product Discovery", href: "/dashboard/products/discover", icon: "explore" },
  { label: "My Products", href: "/dashboard/products", icon: "inventory_2" },
  { label: "Content Hub", href: "/dashboard/content", icon: "auto_awesome" },
  { label: "Orders", href: "/dashboard/orders", icon: "receipt_long" },
  { label: "Wallet", href: "/dashboard/wallet", icon: "account_balance_wallet" },
  { label: "Integrations", href: "/dashboard/integrations", icon: "hub" },
  { label: "Settings", href: "/dashboard/settings", icon: "settings" },
];

// --- Hero Section ---
export const HERO = {
  badge: "v2.0 Command Center",
  title: "Automate Your",
  titleHighlight: "Dropshipping",
  titleEnd: "Business",
  subtitle:
    "Connect your Salla or Zid store, import trending products from AliExpress and CJDropshipping, and auto-fulfill orders — all hands-free.",
  ctaPrimary: "Start Free Trial",
  ctaSecondary: "Watch Demo",
};

// --- Trusted By Logos ---
export const PARTNERS = [
  { name: "Salla", icon: "shopping_basket" },
  { name: "Zid", icon: "storefront" },
  { name: "AliExpress", icon: "inventory_2" },
  { name: "CJDS", icon: "rocket" },
];

// --- How It Works ---
export interface Step {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

export const HOW_IT_WORKS_STEPS: readonly Step[] = [
  {
    icon: "link",
    title: "Connect Your Store",
    description: "Native integration with Salla and Zid using secure OAuth protocols.",
  },
  {
    icon: "search",
    title: "Import Products",
    description: "Browse millions of trending items and import with a single click.",
  },
  {
    icon: "rocket_launch",
    title: "Auto-Fulfill Orders",
    description: "Orders sync automatically to suppliers. No manual entry needed.",
  },
];

// --- Feature Cards ---
export interface Feature {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

export const FEATURES: readonly Feature[] = [
  {
    icon: "explore",
    title: "Product Discovery",
    description: "AI-powered suggestions based on regional sales trends and market demand.",
  },
  {
    icon: "touch_app",
    title: "One-Click Import",
    description: "Sync titles, descriptions, and high-res images directly to your shop backend.",
  },
  {
    icon: "auto_mode",
    title: "Auto-Fulfillment",
    description: "Orders are instantly pushed to AliExpress or CJ upon customer payment.",
  },
  {
    icon: "account_balance_wallet",
    title: "Smart Wallet",
    description: "Centralized funding for all supplier payments with detailed ledger history.",
  },
  {
    icon: "location_on",
    title: "Real-Time Tracking",
    description: "Automated tracking number updates for both you and your customers.",
  },
  {
    icon: "hub",
    title: "Multi-Store Support",
    description: "Manage multiple Salla and Zid stores from a single unified workspace.",
  },
];

// --- Pricing Tiers ---
export interface PricingTier {
  readonly name: string;
  readonly price: string;
  readonly period: string;
  readonly features: readonly string[];
  readonly cta: string;
  readonly featured: boolean;
  readonly badge?: string;
}

export const PRICING_TIERS: readonly PricingTier[] = [
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    features: ["1 Store Connection", "500 Products", "Standard Support"],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Growth",
    price: "$79",
    period: "/mo",
    features: [
      "3 Store Connections",
      "Unlimited Products",
      "Priority Auto-Fulfill",
      "Advanced Analytics",
    ],
    cta: "Try Growth Free",
    featured: true,
    badge: "Most Popular",
  },
  {
    name: "Pro",
    price: "$199",
    period: "/mo",
    features: [
      "Unlimited Stores",
      "24/7 VIP Support",
      "White-label Reports",
      "Early Beta Access",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

// --- Footer ---
export const FOOTER_LINKS = {
  product: [
    { label: "الميزات (Features)", href: "/features" },
    { label: "الباقات والأسعار (Pricing)", href: "/pricing" },
    { label: "الربط مع سلة (Salla Integration)", href: "/dashboard/integrations" },
  ],
  company: [
    { label: "سياسة الخصوصية (Privacy Policy)", href: "/privacy" },
    { label: "الشروط والأحكام (Terms of Service)", href: "/terms" },
    { label: "الأسئلة الشائعة والدعم (FAQ & Help)", href: "/faq" },
  ],
  social: [
    { label: "Twitter", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "Instagram", href: "#" },
  ],
};

// --- Dashboard Stats ---
export interface StatCard {
  readonly label: string;
  readonly value: string;
  readonly change?: string;
  readonly changeType?: "positive" | "negative" | "neutral";
  readonly icon: string;
  readonly detail?: string;
  readonly action?: string;
}

export const DASHBOARD_STATS: readonly StatCard[] = [
  {
    label: "Wallet Balance",
    value: "SAR 12,450.00",
    change: "+5.2%",
    changeType: "positive",
    icon: "account_balance_wallet",
    action: "Top Up",
  },
  {
    label: "Orders Today",
    value: "24",
    icon: "receipt_long",
    detail: "8 new · 12 processing · 4 shipped",
  },
  {
    label: "Active Products",
    value: "156",
    icon: "inventory_2",
    detail: "12 out of stock",
    changeType: "negative",
  },
  {
    label: "Revenue This Month",
    value: "SAR 48,200",
    change: "+18%",
    changeType: "positive",
    icon: "trending_up",
  },
];

// --- Products Discovery ---
export interface Product {
  readonly id: string;
  readonly name: string;
  readonly price: string;
  readonly rating: number;
  readonly reviews: number;
  readonly supplier: "AliExpress" | "CJ";
  readonly shipping: string;
  readonly image: string;
  readonly category: string;
}

export const PRODUCTS: readonly Product[] = [
  {
    id: "p1",
    name: "Wireless Noise Cancelling Earbuds",
    price: "SAR 45.00",
    rating: 4.5,
    reviews: 124,
    supplier: "AliExpress",
    shipping: "7-15 days",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBu5r1rpB9kAuwK35M3FSTZtXcnN_PXN21mVcCWctpjx8mIJmGIHqH2zzHcuuT9-Y5LVCrOB9HPKzFpXGe4dxrT3EALw1bDm0NmHCLxhYTh-kzyhq26dQUYT1X_z6qRk0",
    category: "Electronics",
  },
  {
    id: "p2",
    name: "Premium Matte Phone Case",
    price: "SAR 25.00",
    rating: 4.3,
    reviews: 89,
    supplier: "CJ",
    shipping: "5-10 days",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBu5r1rpB9kAuwK35M3FSTZtXcnN_PXN21mVcCWctpjx8mIJmGIHqH2zzHcuuT9-Y5LVCrOB9HPKzFpXGe4dxrT3EALw1bDm0NmHCLxhYTh-kzyhq26dQUYT1X_z6qRk0",
    category: "Accessories",
  },
  {
    id: "p3",
    name: "Hyaluronic Acid Serum",
    price: "SAR 35.00",
    rating: 4.8,
    reviews: 312,
    supplier: "AliExpress",
    shipping: "10-20 days",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBu5r1rpB9kAuwK35M3FSTZtXcnN_PXN21mVcCWctpjx8mIJmGIHqH2zzHcuuT9-Y5LVCrOB9HPKzFpXGe4dxrT3EALw1bDm0NmHCLxhYTh-kzyhq26dQUYT1X_z6qRk0",
    category: "Beauty",
  },
  {
    id: "p4",
    name: "RGB LED Strip Lights 5m",
    price: "SAR 55.00",
    rating: 4.2,
    reviews: 67,
    supplier: "CJ",
    shipping: "5-10 days",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBu5r1rpB9kAuwK35M3FSTZtXcnN_PXN21mVcCWctpjx8mIJmGIHqH2zzHcuuT9-Y5LVCrOB9HPKzFpXGe4dxrT3EALw1bDm0NmHCLxhYTh-kzyhq26dQUYT1X_z6qRk0",
    category: "Home",
  },
  {
    id: "p5",
    name: "Organic Hair Oil Set",
    price: "SAR 42.00",
    rating: 4.6,
    reviews: 198,
    supplier: "AliExpress",
    shipping: "7-15 days",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBu5r1rpB9kAuwK35M3FSTZtXcnN_PXN21mVcCWctpjx8mIJmGIHqH2zzHcuuT9-Y5LVCrOB9HPKzFpXGe4dxrT3EALw1bDm0NmHCLxhYTh-kzyhq26dQUYT1X_z6qRk0",
    category: "Beauty",
  },
  {
    id: "p6",
    name: "Series 9 Smart Watch",
    price: "SAR 320.00",
    rating: 4.7,
    reviews: 451,
    supplier: "AliExpress",
    shipping: "10-20 days",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBu5r1rpB9kAuwK35M3FSTZtXcnN_PXN21mVcCWctpjx8mIJmGIHqH2zzHcuuT9-Y5LVCrOB9HPKzFpXGe4dxrT3EALw1bDm0NmHCLxhYTh-kzyhq26dQUYT1X_z6qRk0",
    category: "Electronics",
  },
  {
    id: "p7",
    name: "Pro Fitness Band",
    price: "SAR 85.00",
    rating: 4.4,
    reviews: 156,
    supplier: "CJ",
    shipping: "5-10 days",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBu5r1rpB9kAuwK35M3FSTZtXcnN_PXN21mVcCWctpjx8mIJmGIHqH2zzHcuuT9-Y5LVCrOB9HPKzFpXGe4dxrT3EALw1bDm0NmHCLxhYTh-kzyhq26dQUYT1X_z6qRk0",
    category: "Fitness",
  },
  {
    id: "p8",
    name: "Makeup Brush Set (12pcs)",
    price: "SAR 28.00",
    rating: 4.5,
    reviews: 230,
    supplier: "AliExpress",
    shipping: "7-15 days",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBu5r1rpB9kAuwK35M3FSTZtXcnN_PXN21mVcCWctpjx8mIJmGIHqH2zzHcuuT9-Y5LVCrOB9HPKzFpXGe4dxrT3EALw1bDm0NmHCLxhYTh-kzyhq26dQUYT1X_z6qRk0",
    category: "Beauty",
  },
];

// --- Orders ---
export type OrderStatus = "shipped" | "processing" | "new" | "failed" | "delivered" | "ordered";

export interface Order {
  readonly id: string;
  readonly date: string;
  readonly customer: string;
  readonly products: string;
  readonly total: number;
  readonly cost: number;
  readonly profit: number;
  readonly supplier: "AliExpress" | "CJ";
  readonly status: OrderStatus;
}

export const ORDERS: readonly Order[] = [
  { id: "#DL-1847", date: "May 14", customer: "Ahmed K.", products: "Wireless Earbuds x2", total: 180, cost: 90, profit: 82, supplier: "AliExpress", status: "shipped" },
  { id: "#DL-1846", date: "May 14", customer: "Sara M.", products: "Hair Oil Set", total: 95, cost: 35, profit: 55, supplier: "CJ", status: "processing" },
  { id: "#DL-1845", date: "May 13", customer: "Omar A.", products: "Smart Watch", total: 320, cost: 145, profit: 165, supplier: "AliExpress", status: "new" },
  { id: "#DL-1844", date: "May 13", customer: "Fatima H.", products: "LED Strip x3", total: 165, cost: 78, profit: 79, supplier: "CJ", status: "ordered" },
  { id: "#DL-1843", date: "May 12", customer: "Khalid R.", products: "Phone Case x5", total: 125, cost: 50, profit: 70, supplier: "AliExpress", status: "delivered" },
  { id: "#DL-1842", date: "May 12", customer: "Noor S.", products: "Fitness Band", total: 85, cost: 40, profit: 40, supplier: "CJ", status: "failed" },
  { id: "#DL-1841", date: "May 11", customer: "Yusuf B.", products: "Serum x2", total: 70, cost: 30, profit: 35, supplier: "AliExpress", status: "shipped" },
  { id: "#DL-1840", date: "May 11", customer: "Layla T.", products: "Brush Set x4", total: 112, cost: 48, profit: 56, supplier: "AliExpress", status: "processing" },
];

// --- Wallet Transactions ---
export interface WalletTransaction {
  readonly id: string;
  readonly date: string;
  readonly type: "top_up" | "deduction" | "refund";
  readonly description: string;
  readonly amount: number;
  readonly balance: number;
}

export const WALLET_TRANSACTIONS: readonly WalletTransaction[] = [
  { id: "W001", date: "May 14", type: "deduction", description: "Order #DL-1847 — AliExpress", amount: -90, balance: 12450 },
  { id: "W002", date: "May 14", type: "deduction", description: "Order #DL-1846 — CJ", amount: -35, balance: 12540 },
  { id: "W003", date: "May 13", type: "top_up", description: "Wallet Top-Up via Moyasar", amount: 5000, balance: 12575 },
  { id: "W004", date: "May 12", type: "refund", description: "Refund — Order #DL-1830", amount: 120, balance: 7575 },
  { id: "W005", date: "May 11", type: "deduction", description: "Order #DL-1841 — AliExpress", amount: -30, balance: 7455 },
];

// --- Integrations ---
export interface Integration {
  readonly id: string;
  readonly name: string;
  readonly type: "store" | "supplier";
  readonly icon: string;
  readonly status: "connected" | "disconnected" | "error";
  readonly lastSync?: string;
  readonly details?: string;
}

export const INTEGRATIONS: readonly Integration[] = [
  { id: "int1", name: "My Salla Store", type: "store", icon: "shopping_basket", status: "connected", lastSync: "2 min ago", details: "salla.sa/ahmed-store" },
  { id: "int2", name: "My Zid Store", type: "store", icon: "storefront", status: "disconnected", details: "Not connected" },
  { id: "int3", name: "AliExpress Business", type: "supplier", icon: "inventory_2", status: "connected", lastSync: "5 min ago", details: "API Key: ****7a2b" },
  { id: "int4", name: "CJDropshipping", type: "supplier", icon: "rocket", status: "error", lastSync: "Failed", details: "API Token expired" },
];

// --- Status Color Map ---
export const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  shipped: { bg: "bg-tertiary/10", text: "text-tertiary" },
  processing: { bg: "bg-secondary-container/10", text: "text-secondary" },
  new: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
  failed: { bg: "bg-error/10", text: "text-error" },
  delivered: { bg: "bg-tertiary/20", text: "text-tertiary" },
  ordered: { bg: "bg-primary/10", text: "text-primary" },
};
