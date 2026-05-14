"use client";

import React, { useState } from "react";
import { Card, Button, Icon } from "@/components/shared";

const STEPS = ["Select Product", "Edit Content", "Set Pricing", "Confirm & Import"];

export default function ImportWizardPage() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text">Import Wizard</h1>
        <p className="text-sm text-text-secondary">Edit and import products to your store</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((step, i) => (
          <React.Fragment key={step}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                  i <= activeStep
                    ? "bg-accent text-accent-on"
                    : "bg-surface-sunken text-text-muted border border-border"
                }`}
              >
                {i < activeStep ? <Icon name="check" className="text-sm" /> : i + 1}
              </div>
              <span className={`text-sm hidden md:inline ${i <= activeStep ? "text-text font-medium" : "text-text-muted"}`}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i < activeStep ? "bg-accent" : "bg-border"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-text mb-5">Edit Product Content</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Product Title</label>
              <input
                type="text"
                defaultValue="Wireless Noise Cancelling Earbuds Pro"
                className="w-full bg-surface rounded-md px-3 py-2.5 text-text text-sm border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Description</label>
              <textarea
                rows={5}
                defaultValue="Premium wireless earbuds with active noise cancellation, 30-hour battery life, and IPX5 water resistance."
                className="w-full bg-surface rounded-md px-3 py-2.5 text-text text-sm border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors resize-none"
              />
              <div className="flex items-center gap-2 mt-2">
                <Button variant="ghost" size="sm">
                  <Icon name="auto_awesome" className="text-sm" />
                  AI Enhance
                </Button>
                <Button variant="ghost" size="sm">
                  <Icon name="translate" className="text-sm" />
                  Translate AR
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Your Price (SAR)</label>
                <input
                  type="text"
                  defaultValue="89.00"
                  className="w-full bg-surface rounded-md px-3 py-2.5 text-text text-sm border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Supplier Cost</label>
                <input
                  type="text"
                  defaultValue="45.00"
                  disabled
                  className="w-full bg-surface-sunken rounded-md px-3 py-2.5 text-text-muted text-sm border border-border-subtle"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Category</label>
              <select className="w-full bg-surface rounded-md px-3 py-2.5 text-text text-sm border border-border focus:border-accent outline-none transition-colors">
                <option>Electronics</option>
                <option>Beauty</option>
                <option>Fashion</option>
                <option>Home</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Preview */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-text mb-5">Live Preview</h3>
          <div className="rounded-md border border-border overflow-hidden">
            <div className="aspect-square bg-surface-sunken flex items-center justify-center">
              <Icon name="image" className="text-text-muted text-3xl" />
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-text mb-2">Wireless Noise Cancelling Earbuds Pro</h4>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[1, 2, 3, 4].map((s) => (
                    <Icon key={s} name="star" className="text-warning text-sm" />
                  ))}
                  <Icon name="star_half" className="text-warning text-sm" />
                </div>
                <span className="text-xs text-text-secondary">(124 reviews)</span>
              </div>
              <div className="text-xl font-bold text-text mb-1">SAR 89.00</div>
              <div className="text-xs text-text-secondary mb-3">
                <span className="text-success font-medium">Profit: SAR 44.00</span> (49.4% margin)
              </div>
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Icon name="local_shipping" className="text-sm" />
                Ships in 7-15 days
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="secondary" className="flex-1" onClick={() => setActiveStep(Math.max(0, activeStep - 1))}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => setActiveStep(Math.min(3, activeStep + 1))}>
              {activeStep === 3 ? "Import to Store" : "Next Step"}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
