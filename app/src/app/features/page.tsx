"use client";

import React from "react";
import Link from "next/link";
import { Card, Button, Icon, ThemeToggle } from "@/components/shared";
import { FEATURES } from "@/data/mockData";

export default function FeaturesPage() {
  return (
    <main>
      {/* Navbar */}
      <nav className="sticky top-0 w-full z-50 bg-surface/90 backdrop-blur-sm border-b border-border-subtle">
        <div className="flex justify-between items-center px-6 md:px-12 py-3 max-w-7xl mx-auto">
          <Link href="/" className="text-xl font-bold text-text">DropLinker</Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm">
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-text">
          Everything you need to{" "}
          <span className="text-accent">automate dropshipping</span>
        </h1>
        <p className="text-base text-text-secondary max-w-2xl mx-auto">
          Powerful tools for product discovery, order fulfillment, and inventory
          management — all in one platform.
        </p>
      </section>

      {/* Features Grid */}
      <section className="pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Card key={f.title} variant="interactive" className="p-6">
              <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center mb-4">
                <Icon name={f.icon} className="text-accent text-lg" />
              </div>
              <h3 className="text-base font-semibold mb-2 text-text">{f.title}</h3>
              <p className="text-sm text-text-secondary">{f.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center bg-accent rounded-2xl p-12">
          <h2 className="text-2xl font-bold text-accent-on mb-3">
            Start automating today
          </h2>
          <p className="text-base text-accent-on/80 mb-6">
            14-day free trial. No credit card required.
          </p>
          <button className="bg-white text-accent px-6 py-3 rounded-md font-semibold hover:bg-white/90 transition-colors">
            Get Started Free
          </button>
        </div>
      </section>
    </main>
  );
}
