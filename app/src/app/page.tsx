"use client";

import React from "react";
import Link from "next/link";
import { GlassCard, GradientButton, Icon } from "@/components/shared";
import {
  LANDING_NAV_ITEMS,
  HERO,
  PARTNERS,
  HOW_IT_WORKS_STEPS,
  FEATURES,
  PRICING_TIERS,
  FOOTER_LINKS,
} from "@/data/mockData";

/* ================================================================
   LANDING PAGE — DropLinker Public Marketing Page
   ================================================================ */

// --- Navbar ---
function Navbar() {
  return (
    <nav className="sticky top-0 w-full z-50 bg-surface-container-low/40 backdrop-blur-md border-b border-white/10 shadow-xl shadow-primary-container/10">
      <div className="flex justify-between items-center px-6 md:px-12 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-2xl font-bold tracking-tight text-on-surface">
          DropLinker
        </Link>
        <div className="hidden md:flex gap-6">
          {LANDING_NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-on-surface-variant hover:text-on-surface transition-colors duration-300 text-base hover:bg-white/5 rounded-lg px-3 py-1"
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="hidden sm:block text-on-surface-variant hover:text-on-surface text-base px-4 py-2 transition-all"
          >
            Login
          </Link>
          <GradientButton size="md">
            <Link href="/auth/register">Get Started</Link>
          </GradientButton>
        </div>
      </div>
    </nav>
  );
}

// --- Hero Section ---
function HeroSection() {
  return (
    <header className="relative pt-16 pb-24 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-xs mb-6 border border-primary/20 uppercase tracking-widest">
            {HERO.badge}
          </span>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
            {HERO.title} <br />
            <span className="primary-gradient-text">{HERO.titleHighlight}</span>{" "}
            {HERO.titleEnd}
          </h1>
          <p className="text-lg text-on-surface-variant mb-10 max-w-lg leading-relaxed">
            {HERO.subtitle}
          </p>
          <div className="flex flex-wrap gap-4">
            <GradientButton size="lg">{HERO.ctaPrimary}</GradientButton>
            <GradientButton size="lg" variant="outline">
              <span className="flex items-center gap-2">
                <Icon name="play_circle" size="md" />
                {HERO.ctaSecondary}
              </span>
            </GradientButton>
          </div>
        </div>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary-container to-secondary-container opacity-30 blur-2xl group-hover:opacity-50 transition-opacity" />
          <GlassCard className="relative p-1 rounded-xl overflow-hidden">
            <div className="bg-surface-container rounded-lg w-full aspect-video flex items-center justify-center">
              <Icon name="dashboard" size="xl" className="text-primary/30" />
            </div>
          </GlassCard>
          {/* Floating notification */}
          <div className="absolute -top-6 -right-6 hidden md:flex">
            <GlassCard className="p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center">
                <Icon name="check_circle" filled className="text-tertiary" />
              </div>
              <div>
                <div className="font-semibold text-xs">Order #8842</div>
                <div className="text-xs text-on-surface-variant">Auto-Fulfilled</div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </header>
  );
}

// --- Trusted By ---
function TrustedBy() {
  return (
    <section className="py-16 border-y border-white/5 bg-surface-container-lowest/50">
      <div className="px-6 md:px-12 max-w-7xl mx-auto">
        <p className="text-center font-semibold text-xs text-on-surface-variant mb-10 uppercase tracking-[0.2em]">
          Powering Merchants Across Ecosystems
        </p>
        <div className="flex flex-wrap justify-center items-center gap-16 md:gap-32 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          {PARTNERS.map((p) => (
            <div key={p.name} className="flex items-center gap-2">
              <Icon name={p.icon} size="xl" />
              <span className="text-2xl font-semibold tracking-tighter">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- How It Works ---
function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-semibold mb-3 tracking-tight">Effortless 3-Step Setup</h2>
        <p className="text-base text-on-surface-variant">
          Go from zero to automated in under 5 minutes.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {HOW_IT_WORKS_STEPS.map((step) => (
          <GlassCard
            key={step.title}
            hover
            className="p-10 rounded-xl flex flex-col items-center text-center transition-all"
          >
            <div className="w-16 h-16 rounded-xl primary-gradient flex items-center justify-center mb-6 shadow-lg shadow-primary-container/20">
              <Icon name={step.icon} size="lg" className="text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
            <p className="text-base text-on-surface-variant">{step.description}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

// --- Features Grid ---
function FeaturesGrid() {
  return (
    <section
      id="features"
      className="py-16 px-6 md:px-12 max-w-7xl mx-auto bg-surface-container-low/20 rounded-[40px]"
    >
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
        <div>
          <h2 className="text-3xl font-semibold mb-3 tracking-tight">Master Your Logistics</h2>
          <p className="text-base text-on-surface-variant">
            Tools designed for scale, precision, and speed.
          </p>
        </div>
        <GradientButton variant="outline" size="sm">
          View All Features
        </GradientButton>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((f) => (
          <GlassCard
            key={f.title}
            className="p-6 rounded-xl hover:-translate-y-1 transition-transform duration-300"
          >
            <Icon name={f.icon} size="lg" className="text-primary mb-3" />
            <h4 className="text-xl font-semibold mb-3">{f.title}</h4>
            <p className="text-base text-on-surface-variant">{f.description}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

// --- Pricing Section ---
function PricingSection() {
  return (
    <section id="pricing" className="py-16 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-semibold mb-3 tracking-tight">Transparent Pricing</h2>
        <p className="text-base text-on-surface-variant">
          Scales with your business, no hidden fees.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        {PRICING_TIERS.map((tier) => (
          <GlassCard
            key={tier.name}
            variant={tier.featured ? "active" : "default"}
            className={`p-8 rounded-xl flex flex-col relative ${
              tier.featured ? "ring-2 ring-primary/50 shadow-2xl shadow-primary-container/20" : ""
            }`}
          >
            {tier.badge && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 primary-gradient text-white px-4 py-1 rounded-full text-xs font-semibold uppercase">
                {tier.badge}
              </div>
            )}
            <div className="text-xl font-semibold mb-1">{tier.name}</div>
            <div className="text-4xl font-bold mb-6">
              {tier.price}
              <span className="text-base font-normal text-on-surface-variant">{tier.period}</span>
            </div>
            <ul className="space-y-3 mb-10 flex-grow">
              {tier.features.map((feat) => (
                <li key={feat} className="flex items-center gap-2 text-base">
                  <Icon
                    name="check"
                    filled={tier.featured}
                    className="text-tertiary"
                    size="md"
                  />
                  {feat}
                </li>
              ))}
            </ul>
            <GradientButton
              variant={tier.featured ? "primary" : "outline"}
              className="w-full"
            >
              {tier.cta}
            </GradientButton>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

// --- CTA Banner ---
function CTABanner() {
  return (
    <section className="py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto primary-gradient rounded-[32px] p-16 text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="relative z-10">
          <h2 className="text-5xl font-bold text-white mb-6 tracking-tight">Ready to automate?</h2>
          <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
            Join 5,000+ Saudi merchants who have reclaimed their time with DropLinker automation.
          </p>
          <button className="bg-white text-primary-container px-12 py-4 rounded-lg text-xl font-semibold shadow-2xl hover:scale-105 transition-transform">
            Get Started Now
          </button>
        </div>
      </div>
    </section>
  );
}

// --- Footer ---
function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 mt-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 md:px-12 py-12 max-w-7xl mx-auto gap-6">
        <div className="flex flex-col gap-3 max-w-sm">
          <div className="text-xl font-bold text-on-surface">DropLinker</div>
          <p className="text-base text-on-surface-variant">
            Precision automation for the modern Saudi merchant. Streamlining e-commerce from sourcing to fulfillment.
          </p>
          <p className="text-xs text-on-surface-variant/60">
            © 2024 DropLinker. All rights reserved.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category} className="flex flex-col gap-2">
              <span className="text-on-surface font-bold mb-1 capitalize">{category}</span>
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-on-surface-variant hover:text-secondary transition-colors duration-200 text-base"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

// --- Main Page ---
export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <TrustedBy />
      <HowItWorks />
      <FeaturesGrid />
      <PricingSection />
      <CTABanner />
      <Footer />
    </main>
  );
}
