"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GlassCard, GradientButton, Icon } from "@/components/shared";

/* ================================================================
   AUTH — Login & Register Pages
   ================================================================ */

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center primary-gradient">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="relative z-10 text-center px-12">
          <Link href="/" className="text-4xl font-bold text-white mb-6 block tracking-tight">
            DropLinker
          </Link>
          <p className="text-xl text-white/90 mb-8 max-w-md">
            Automate your dropshipping business with the most powerful SaaS platform for Saudi merchants.
          </p>
          <div className="flex flex-col gap-4 items-center">
            {[
              { icon: "link", text: "Connect Salla & Zid" },
              { icon: "auto_mode", text: "Auto-fulfill from AliExpress" },
              { icon: "account_balance_wallet", text: "Smart Wallet Management" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-white/80">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Icon name={item.icon} size="sm" className="text-white" />
                </div>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden text-2xl font-bold text-on-surface mb-8 block text-center">
            DropLinker
          </Link>
          
          {/* Tab Toggle */}
          <div className="flex mb-8 glass-card rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all ${
                isLogin ? "primary-gradient text-white" : "text-on-surface-variant"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all ${
                !isLogin ? "primary-gradient text-white" : "text-on-surface-variant"
              }`}
            >
              Register
            </button>
          </div>

          <GlassCard className="p-8 rounded-xl">
            <h2 className="text-2xl font-bold mb-2">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-sm text-on-surface-variant mb-6">
              {isLogin
                ? "Enter your credentials to access your dashboard"
                : "Start automating your dropshipping business today"}
            </p>

            <div className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Ahmed Mohammed"
                    className="w-full bg-surface-container-lowest rounded-lg px-4 py-3 text-on-surface border border-outline-variant/30 focus:border-secondary-container focus:outline-none transition-colors placeholder:text-on-surface-variant/40"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="ahmed@example.com"
                  className="w-full bg-surface-container-lowest rounded-lg px-4 py-3 text-on-surface border border-outline-variant/30 focus:border-secondary-container focus:outline-none transition-colors placeholder:text-on-surface-variant/40"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-surface-container-lowest rounded-lg px-4 py-3 text-on-surface border border-outline-variant/30 focus:border-secondary-container focus:outline-none transition-colors placeholder:text-on-surface-variant/40"
                />
              </div>
              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <input type="checkbox" className="rounded border-outline-variant accent-primary-container" />
                    Remember me
                  </label>
                  <a href="#" className="text-sm text-secondary hover:underline">
                    Forgot password?
                  </a>
                </div>
              )}
              <GradientButton className="w-full" size="lg">
                {isLogin ? "Sign In" : "Create Account"}
              </GradientButton>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/30" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface-container px-3 text-on-surface-variant">or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="glass-card py-3 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                <Icon name="g_mobiledata" size="md" />
                Google
              </button>
              <button className="glass-card py-3 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                <Icon name="apple" size="md" />
                Apple
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
