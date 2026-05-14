"use client";

import React, { useState } from "react";
import { GlassCard, GradientButton, Icon } from "@/components/shared";

/* ================================================================
   IMPORT WIZARD — Multi-step product import flow
   ================================================================ */

const STEPS = ["Select Product", "Edit Content", "Set Pricing", "Confirm & Import"];

export default function ImportWizardPage() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-1">Import Wizard</h2>
        <p className="text-sm text-on-surface-variant">Edit and import products to your store</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((step, i) => (
          <React.Fragment key={step}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  i <= activeStep
                    ? "primary-gradient text-white"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {i < activeStep ? (
                  <Icon name="check" size="sm" />
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-sm hidden md:inline ${i <= activeStep ? "text-on-surface font-medium" : "text-on-surface-variant"}`}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 ${i < activeStep ? "primary-gradient" : "bg-outline-variant/30"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content Editor */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <GlassCard className="p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-6">Edit Product Content</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                Product Title
              </label>
              <input
                type="text"
                defaultValue="Wireless Noise Cancelling Earbuds Pro"
                className="w-full bg-surface-container-lowest rounded-lg px-4 py-3 text-on-surface border border-outline-variant/30 focus:border-secondary-container focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                Description
              </label>
              <textarea
                rows={5}
                defaultValue="Premium wireless earbuds with active noise cancellation, 30-hour battery life, and IPX5 water resistance. Crystal clear audio with deep bass for an immersive listening experience."
                className="w-full bg-surface-container-lowest rounded-lg px-4 py-3 text-on-surface border border-outline-variant/30 focus:border-secondary-container focus:outline-none transition-colors resize-none"
              />
              <div className="flex items-center gap-2 mt-2">
                <GradientButton variant="ghost" size="sm">
                  <span className="flex items-center gap-1">
                    <Icon name="auto_awesome" size="sm" />
                    AI Enhance
                  </span>
                </GradientButton>
                <GradientButton variant="ghost" size="sm">
                  <span className="flex items-center gap-1">
                    <Icon name="translate" size="sm" />
                    Translate AR
                  </span>
                </GradientButton>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                  Your Price (SAR)
                </label>
                <input
                  type="text"
                  defaultValue="89.00"
                  className="w-full bg-surface-container-lowest rounded-lg px-4 py-3 text-on-surface border border-outline-variant/30 focus:border-secondary-container focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                  Supplier Cost
                </label>
                <input
                  type="text"
                  defaultValue="45.00"
                  disabled
                  className="w-full bg-surface-container rounded-lg px-4 py-3 text-on-surface-variant border border-outline-variant/20"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                Category
              </label>
              <select className="w-full bg-surface-container-lowest rounded-lg px-4 py-3 text-on-surface border border-outline-variant/30 focus:border-secondary-container focus:outline-none transition-colors">
                <option>Electronics</option>
                <option>Beauty</option>
                <option>Fashion</option>
                <option>Home</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Right: Preview */}
        <GlassCard className="p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-6">Live Preview</h3>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="aspect-square bg-surface-container flex items-center justify-center">
              <Icon name="image" size="xl" className="text-on-surface-variant/20" />
            </div>
            <div className="p-4 bg-surface-container-low">
              <h4 className="font-semibold mb-2">Wireless Noise Cancelling Earbuds Pro</h4>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[1, 2, 3, 4].map((s) => (
                    <Icon key={s} name="star" filled className="text-yellow-400" size="sm" />
                  ))}
                  <Icon name="star_half" filled className="text-yellow-400" size="sm" />
                </div>
                <span className="text-xs text-on-surface-variant">(124 reviews)</span>
              </div>
              <div className="text-2xl font-bold mb-2">SAR 89.00</div>
              <div className="text-xs text-on-surface-variant mb-4">
                <span className="text-tertiary font-medium">Profit: SAR 44.00</span> (49.4% margin)
              </div>
              <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                <Icon name="local_shipping" size="sm" />
                Ships in 7-15 days
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <GradientButton variant="outline" className="flex-1" onClick={() => setActiveStep(Math.max(0, activeStep - 1))}>
              Back
            </GradientButton>
            <GradientButton className="flex-1" onClick={() => setActiveStep(Math.min(3, activeStep + 1))}>
              {activeStep === 3 ? "Import to Store" : "Next Step"}
            </GradientButton>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
