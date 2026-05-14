import React from "react";
import Link from "next/link";
import { GlassCard, GradientButton, Icon } from "@/components/shared";

const FEATURES = [
  { icon: "explore", title: "Product Discovery", desc: "AI-powered search across AliExpress and CJDropshipping. Filter by category, price, shipping, rating.", highlights: ["Search millions of products", "Smart filters", "Cost transparency", "Review data"] },
  { icon: "download", title: "One-Click Import", desc: "Import products directly to Salla or Zid. Auto-sync titles, images, variants with margin calculator.", highlights: ["Auto-sync to store", "Variant mapping", "Margin calculator", "AI descriptions"] },
  { icon: "auto_mode", title: "Auto-Fulfillment", desc: "Customer orders trigger automatic supplier ordering, wallet deduction, and tracking — zero manual work.", highlights: ["Webhook automation", "Instant ordering", "Auto-deduction", "Fallback logic"] },
  { icon: "account_balance_wallet", title: "Smart Wallet", desc: "Centralized funding via Mada, Visa, Stripe, or bank transfer. Auto top-up thresholds keep orders flowing.", highlights: ["Multiple methods", "Auto top-up", "Transaction ledger", "Low-balance alerts"] },
  { icon: "local_shipping", title: "Real-Time Tracking", desc: "Tracking numbers auto-sync from suppliers to your store. Customers see live updates without manual entry.", highlights: ["Auto-sync tracking", "Customer notifications", "Multi-carrier", "Delivery confirmation"] },
  { icon: "hub", title: "Multi-Store Support", desc: "Connect multiple Salla and Zid stores. Manage products, orders, and wallets in one unified workspace.", highlights: ["Unlimited stores", "Cross-store analytics", "Centralized management", "Per-store settings"] },
  { icon: "auto_awesome", title: "AI Product Content", desc: "Generate SEO-optimized titles and descriptions in Arabic and English using GPT-4o. One click to translate.", highlights: ["Bilingual generation", "SEO optimization", "Tone customization", "Bulk processing"] },
  { icon: "monitoring", title: "Analytics & Insights", desc: "Revenue charts, order trends, profit margins, and supplier performance in real-time.", highlights: ["Revenue breakdown", "Order pipeline", "Margin analysis", "Supplier comparison"] },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass-card border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold primary-gradient-text">DropLinker</Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-sm font-medium text-primary">Features</Link>
            <Link href="/pricing" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">Pricing</Link>
            <Link href="/auth/login" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">Login</Link>
            <Link href="/auth/login"><GradientButton size="sm">Get Started</GradientButton></Link>
          </div>
        </div>
      </nav>

      <section className="py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-secondary/30 text-secondary mb-6">Platform Capabilities</span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Everything you need to <span className="primary-gradient-text">automate dropshipping</span></h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">From product discovery to order fulfillment, DropLinker handles the entire lifecycle.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          {FEATURES.map((f) => (
            <GlassCard key={f.title} hover className="p-8 rounded-2xl group">
              <div className="w-12 h-12 rounded-xl primary-gradient flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon name={f.icon} className="text-white" size="md" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{f.desc}</p>
              <ul className="grid grid-cols-2 gap-2">
                {f.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <Icon name="check_circle" size="sm" className="text-tertiary" filled />{h}
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center primary-gradient rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Start automating today</h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">Join thousands of Saudi merchants who eliminated manual fulfillment.</p>
          <Link href="/auth/login"><button className="px-8 py-3 bg-white text-primary-container font-semibold rounded-xl hover:bg-white/90 transition-colors">Start Free Trial</button></Link>
        </div>
      </section>
      <footer className="border-t border-white/5 py-8 px-6 text-center text-xs text-on-surface-variant">© 2024 DropLinker. All rights reserved.</footer>
    </div>
  );
}
