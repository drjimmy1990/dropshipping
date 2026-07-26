"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, Button, Icon, ThemeToggle } from "@/components/shared";
import { signIn, signUp } from "@/app/auth/actions";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = isLogin
        ? await signIn(formData)
        : await signUp(formData);

      if (result?.error) {
        setError(result.error);
      }
      // On success, the server action redirects automatically
    });
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-accent items-center justify-center p-12">
        <div className="max-w-md text-accent-on">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <Image src="/tmtech-logo.png" alt="TMTECH" width={180} height={54} className="h-12 w-auto object-contain bg-white/90 p-1.5 rounded-lg shadow-sm" priority />
            <span className="text-2xl font-bold">TMTECH</span>
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
            <Link href="/" className="lg:hidden flex items-center gap-3">
              <Image src="/tmtech-logo.png" alt="TMTECH" width={140} height={44} className="h-10 w-auto object-contain" priority />
              <span className="text-xl font-bold text-text">TMTECH</span>
            </Link>
            <ThemeToggle />
          </div>

          {/* Toggle */}
          <div className="flex bg-surface-sunken rounded-lg p-1 mb-8">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                isLogin
                  ? "bg-accent text-accent-on"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
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

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-md bg-error/10 border border-error/30 text-error text-sm flex items-center gap-2">
              <Icon name="error" className="text-base shrink-0" />
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Store Name
                </label>
                <input
                  name="businessName"
                  type="text"
                  required
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
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-md border border-border bg-surface text-text placeholder:text-text-muted text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
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
            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Icon name="progress_activity" className="text-base animate-spin" />
                  {isLogin ? "Signing in…" : "Creating account…"}
                </span>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          {/* OAuth placeholder */}
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
              <Button variant="secondary" className="w-full" disabled>
                <Icon name="storefront" className="text-base" />
                Salla
              </Button>
              <Button variant="secondary" className="w-full" disabled>
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
