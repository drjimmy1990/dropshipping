"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, Button, Icon, ThemeToggle } from "@/components/shared";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-accent items-center justify-center p-12">
        <div className="max-w-md text-accent-on">
          <Link href="/" className="text-2xl font-bold mb-8 block">
            DropLinker
          </Link>
          <h2 className="text-3xl font-bold mb-4 leading-tight">
            Automate your dropshipping business
          </h2>
          <p className="text-accent-on/80 text-base leading-relaxed">
            Connect your Salla or Zid store to global suppliers. Import products,
            fulfill orders, and sync inventory — all on autopilot.
          </p>
          <div className="mt-12 space-y-4">
            {[
              { icon: "check_circle", text: "One-click product imports" },
              { icon: "check_circle", text: "Automatic order fulfillment" },
              { icon: "check_circle", text: "Real-time inventory sync" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <Icon name={item.icon} className="text-accent-on/80 text-lg" />
                <span className="text-accent-on/90 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-bg">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="lg:hidden text-xl font-bold text-text">
              DropLinker
            </Link>
            <ThemeToggle />
          </div>

          {/* Toggle */}
          <div className="flex bg-surface-sunken rounded-lg p-1 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                isLogin
                  ? "bg-accent text-accent-on"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                !isLogin
                  ? "bg-accent text-accent-on"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              Sign Up
            </button>
          </div>

          <h1 className="text-2xl font-bold text-text mb-2">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            {isLogin
              ? "Sign in to manage your store."
              : "Start automating in minutes."}
          </p>

          <form className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Store Name
                </label>
                <input
                  type="text"
                  placeholder="My Salla Store"
                  className="w-full px-3 py-2.5 rounded-md border border-border bg-surface text-text placeholder:text-text-muted text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-md border border-border bg-surface text-text placeholder:text-text-muted text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-md border border-border bg-surface text-text placeholder:text-text-muted text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
            {isLogin && (
              <div className="flex justify-end">
                <a href="#" className="text-sm text-accent hover:underline">
                  Forgot password?
                </a>
              </div>
            )}
            <Button type="submit" className="w-full" size="lg">
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {/* OAuth */}
          <div className="mt-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-subtle" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-bg px-3 text-xs text-text-muted">or continue with</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" className="w-full">
                <Icon name="storefront" className="text-base" />
                Salla
              </Button>
              <Button variant="secondary" className="w-full">
                <Icon name="store" className="text-base" />
                Zid
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
