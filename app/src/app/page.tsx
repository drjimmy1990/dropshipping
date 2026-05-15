"use client";

import React from "react";
import Link from "next/link";
import { Card, Button, Icon, ThemeToggle } from "@/components/shared";
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

function Navbar() {
  return (
    <nav className="sticky top-0 w-full z-50 bg-surface/90 backdrop-blur-sm border-b border-border-subtle">
      <div className="flex justify-between items-center px-6 md:px-12 py-3 max-w-7xl mx-auto">
        <Link href="/" className="text-xl font-bold text-text">
          DropLinker
        </Link>
        <div className="hidden md:flex gap-1">
          {LANDING_NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-text-secondary hover:text-text transition-colors text-sm px-3 py-2 rounded-md hover:bg-surface-sunken"
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/auth/login"
            className="hidden sm:block text-text-secondary hover:text-text text-sm px-3 py-2 transition-colors"
          >
            Login
          </Link>
          <Button size="sm">
            <Link href="/auth/login">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <header className="relative pt-20 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="inline-block px-3 py-1 rounded-md bg-accent-subtle text-accent font-medium text-xs mb-6 uppercase tracking-wide">
            {HERO.badge}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight tracking-tight text-text">
            {HERO.title} <br />
            <span className="text-accent">{HERO.titleHighlight}</span>{" "}
            {HERO.titleEnd}
          </h1>
          <p className="text-lg text-text-secondary mb-10 max-w-lg leading-relaxed">
            {HERO.subtitle}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg">{HERO.ctaPrimary}</Button>
            <Button size="lg" variant="secondary">
              <span className="flex items-center gap-2">
                <Icon name="play_circle" className="text-lg" />
                {HERO.ctaSecondary}
              </span>
            </Button>
          </div>
        </div>
        <div className="relative">
          <Card variant="raised" className="p-1 overflow-hidden">
            <div className="bg-surface-sunken rounded-md w-full aspect-video flex items-center justify-center">
              <Icon name="dashboard" className="text-text-muted text-4xl" />
            </div>
          </Card>
          {/* Floating notification */}
          <div className="absolute -top-4 -right-4 hidden md:flex">
            <Card variant="raised" className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-success-subtle flex items-center justify-center">
                <Icon name="check_circle" className="text-success text-lg" />
              </div>
              <div>
                <div className="font-medium text-xs text-text">Order #8842</div>
                <div className="text-xs text-text-secondary">Auto-Fulfilled</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </header>
  );
}

function TrustedBy() {
  return (
    <section className="py-14 border-y border-border-subtle bg-surface-sunken">
      <div className="px-6 md:px-12 max-w-7xl mx-auto">
        <p className="text-center font-medium text-xs text-text-muted mb-8 uppercase tracking-widest">
          Powering Merchants Across Ecosystems
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 hover:opacity-80 transition-opacity duration-300">
          {PARTNERS.map((p) => (
            <div key={p.name} className="flex items-center gap-2">
              <Icon name={p.icon} className="text-2xl text-text-secondary" />
              <span className="text-xl font-semibold tracking-tight text-text-secondary">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <h2 className="text-2xl font-semibold mb-2 text-text">
          Effortless 3-Step Setup
        </h2>
        <p className="text-base text-text-secondary">
          Go from zero to automated in under 5 minutes.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {HOW_IT_WORKS_STEPS.map((step, i) => (
          <Card key={step.title} className="p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-accent-subtle text-accent flex items-center justify-center mx-auto mb-4 text-sm font-bold">
              {i + 1}
            </div>
            <h3 className="text-lg font-semibold mb-2 text-text">{step.title}</h3>
            <p className="text-sm text-text-secondary">{step.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function FeaturesGrid() {
  return (
    <section id="features" className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-14 gap-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2 text-text">
            Master Your Logistics
          </h2>
          <p className="text-base text-text-secondary">
            Tools designed for scale, precision, and speed.
          </p>
        </div>
        <Button variant="secondary" size="sm">
          View All Features
        </Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((f) => (
          <Card key={f.title} variant="interactive" className="p-6">
            <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center mb-4">
              <Icon name={f.icon} className="text-accent text-lg" />
            </div>
            <h4 className="text-base font-semibold mb-2 text-text">{f.title}</h4>
            <p className="text-sm text-text-secondary">{f.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <h2 className="text-2xl font-semibold mb-2 text-text">
          Transparent Pricing
        </h2>
        <p className="text-base text-text-secondary">
          Scales with your business, no hidden fees.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        {PRICING_TIERS.map((tier) => (
          <Card
            key={tier.name}
            className={`p-8 flex flex-col relative ${
              tier.featured
                ? "ring-2 ring-accent shadow-[var(--shadow-md)]"
                : ""
            }`}
          >
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-on px-3 py-1 rounded-md text-xs font-medium">
                {tier.badge}
              </div>
            )}
            <div className="text-lg font-semibold mb-1 text-text">
              {tier.name}
            </div>
            <div className="text-3xl font-bold mb-6 text-text">
              {tier.price}
              <span className="text-sm font-normal text-text-secondary">
                {tier.period}
              </span>
            </div>
            <ul className="space-y-3 mb-8 flex-grow">
              {tier.features.map((feat) => (
                <li key={feat} className="flex items-center gap-2 text-sm text-text">
                  <Icon
                    name="check"
                    className="text-success text-base"
                  />
                  {feat}
                </li>
              ))}
            </ul>
            <Button
              variant={tier.featured ? "primary" : "secondary"}
              className="w-full"
            >
              {tier.cta}
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}

function CTABanner() {
  return (
    <section className="py-20 px-6 md:px-12">
      <div className="max-w-7xl mx-auto bg-accent rounded-2xl p-16 text-center">
        <h2 className="text-3xl font-bold text-accent-on mb-4">
          Ready to automate?
        </h2>
        <p className="text-base text-accent-on/80 mb-8 max-w-2xl mx-auto">
          Join 5,000+ Saudi merchants who have reclaimed their time with
          DropLinker automation.
        </p>
        <Link href="/auth/login" className="inline-block bg-white text-accent px-8 py-3 rounded-md text-base font-semibold hover:bg-white/90 transition-colors">
          Get Started Now
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="w-full bg-surface border-t border-border mt-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 md:px-12 py-10 max-w-7xl mx-auto gap-6">
        <div className="flex flex-col gap-2 max-w-sm">
          <div className="text-lg font-bold text-text">DropLinker</div>
          <p className="text-sm text-text-secondary">
            Precision automation for the modern Saudi merchant. Streamlining
            e-commerce from sourcing to fulfillment.
          </p>
          <p className="text-xs text-text-muted">
            © 2026 DropLinker. All rights reserved.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category} className="flex flex-col gap-1.5">
              <span className="text-text font-semibold text-sm mb-1 capitalize">
                {category}
              </span>
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-text-secondary hover:text-accent transition-colors text-sm"
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
