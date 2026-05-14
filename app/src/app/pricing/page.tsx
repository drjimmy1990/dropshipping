"use client";
import React, { useState } from "react";
import Link from "next/link";
import { GlassCard, GradientButton, Icon } from "@/components/shared";

const TIERS = [
  { name: "Starter", monthly: 49, yearly: 39, products: "500", stores: "1", commission: "5%", features: ["Product Discovery", "Manual Fulfillment", "Basic Analytics", "Email Support", "1 Store Connection"] },
  { name: "Growth", monthly: 149, yearly: 119, products: "2,000", stores: "3", commission: "3%", popular: true, features: ["Auto-Fulfillment", "AI Product Content", "Priority Support", "Advanced Analytics", "3 Store Connections", "Stock Sync"] },
  { name: "Pro", monthly: 349, yearly: 279, products: "Unlimited", stores: "Unlimited", commission: "1%", features: ["Everything in Growth", "White-label Reports", "Team Members", "API Access", "Dedicated Account Manager", "Custom Integrations", "24/7 VIP Support"] },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass-card border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold primary-gradient-text">DropLinker</Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm font-medium text-primary">Pricing</Link>
            <Link href="/auth/login" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">Login</Link>
            <Link href="/auth/login"><GradientButton size="sm">Get Started</GradientButton></Link>
          </div>
        </div>
      </nav>

      <section className="py-20 px-6 text-center">
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-secondary/30 text-secondary mb-6">Transparent Pricing</span>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Plans that grow <span className="primary-gradient-text">with you</span></h1>
        <p className="text-lg text-on-surface-variant max-w-xl mx-auto mb-8">Start free, upgrade when ready. No hidden fees.</p>
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm ${!yearly ? "text-on-surface font-medium" : "text-on-surface-variant"}`}>Monthly</span>
          <button onClick={() => setYearly(!yearly)} className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? "bg-primary" : "bg-surface-container-high"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${yearly ? "translate-x-6" : ""}`} />
          </button>
          <span className={`text-sm ${yearly ? "text-on-surface font-medium" : "text-on-surface-variant"}`}>Yearly <span className="text-tertiary text-xs font-semibold">-20%</span></span>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((t) => (
            <GlassCard key={t.name} hover className={`p-8 rounded-2xl relative ${t.popular ? "ring-2 ring-primary" : ""}`}>
              {t.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold primary-gradient text-white">Most Popular</span>}
              <h3 className="text-xl font-bold mb-2">{t.name}</h3>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold">SAR {yearly ? t.yearly : t.monthly}</span>
                <span className="text-on-surface-variant text-sm mb-1">/mo</span>
              </div>
              <p className="text-xs text-on-surface-variant mb-6">{t.products} Products · {t.stores} Store{t.stores !== "1" ? "s" : ""} · {t.commission} commission</p>
              <GradientButton className="w-full mb-6" variant={t.popular ? "primary" : "outline"}>{t.popular ? "Start Free Trial" : "Get Started"}</GradientButton>
              <ul className="space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <Icon name="check_circle" size="sm" className="text-tertiary" filled />{f}
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-20">
        <GlassCard className="p-8 rounded-2xl text-center">
          <h2 className="text-2xl font-bold mb-3">Enterprise</h2>
          <p className="text-on-surface-variant mb-6 max-w-lg mx-auto">Need custom limits, dedicated infrastructure, or white-label solutions? Let&apos;s talk.</p>
          <GradientButton>Contact Sales</GradientButton>
        </GlassCard>
      </section>
      <footer className="border-t border-white/5 py-8 px-6 text-center text-xs text-on-surface-variant">© 2024 DropLinker. All rights reserved.</footer>
    </div>
  );
}
