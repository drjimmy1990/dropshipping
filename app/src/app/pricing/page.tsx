"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, Button, Icon, ThemeToggle } from "@/components/shared";
import { PRICING_TIERS } from "@/data/mockData";

export default function PricingPage() {
  return (
    <main>
      {/* Navbar */}
      <nav className="sticky top-0 w-full z-50 bg-surface/90 backdrop-blur-sm border-b border-border-subtle">
        <div className="flex justify-between items-center px-6 md:px-12 py-3 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/tmtech-logo.png" alt="TMTECH" width={200} height={60} className="h-12 w-auto object-contain" priority />
            <span className="text-2xl font-bold text-text tracking-tight">TMTECH</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/auth/login" className="text-sm text-text-secondary hover:text-text px-3 py-2">
              Login
            </Link>
            <Button size="sm">
              <Link href="/auth/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-text">
          Plans that grow <span className="text-accent">with you</span>
        </h1>
        <p className="text-base text-text-secondary max-w-xl mx-auto">
          Start free, scale as you grow. All plans include core automation features.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-6 md:px-12 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {PRICING_TIERS.map((t) => (
            <Card
              key={t.name}
              className={`p-8 flex flex-col relative ${
                t.featured ? "ring-2 ring-accent shadow-[var(--shadow-md)]" : ""
              }`}
            >
              {t.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md text-xs font-medium bg-accent text-accent-on">
                  {t.badge}
                </span>
              )}
              <div className="text-lg font-semibold mb-1 text-text">{t.name}</div>
              <div className="text-3xl font-bold mb-6 text-text">
                {t.price}
                <span className="text-sm font-normal text-text-secondary">{t.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text">
                    <Icon name="check" className="text-success text-base" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant={t.featured ? "primary" : "secondary"} className="w-full">
                {t.cta}
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
