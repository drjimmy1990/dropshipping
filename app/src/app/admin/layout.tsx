"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/shared";

/* ================================================================
   SUPER ADMIN LAYOUT — Platform Owner Panel
   Separate from merchant dashboard
   ================================================================ */

const ADMIN_NAV = [
  { href: "/admin", icon: "speed", label: "Dashboard" },
  { href: "/admin/merchants", icon: "group", label: "Merchants" },
  { href: "/admin/orders", icon: "receipt_long", label: "Order Monitor" },
  { href: "/admin/revenue", icon: "payments", label: "Revenue Config" },
  { href: "/admin/transfers", icon: "account_balance", label: "Bank Transfers" },
  { href: "/admin/settings", icon: "manufacturing", label: "Platform Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Admin Sidebar */}
      <aside className={`${collapsed ? "w-16" : "w-64"} shrink-0 border-r border-white/5 bg-surface-container-lowest flex flex-col transition-all duration-300`}>
        <div className="h-16 flex items-center gap-3 px-4 border-b border-white/5">
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
            <Icon name="menu" size="md" />
          </button>
          {!collapsed && (
            <Link href="/admin" className="font-bold text-lg">
              <span className="primary-gradient-text">Admin</span>
              <span className="text-on-surface-variant text-xs ml-1">Panel</span>
            </Link>
          )}
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {ADMIN_NAV.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive ? "bg-primary/15 text-primary font-medium" : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                }`}
              >
                <Icon name={item.icon} size="sm" filled={isActive} />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors">
            <Icon name="arrow_back" size="sm" />
            {!collapsed && "Back to Merchant"}
          </Link>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 min-w-0">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-surface-container-lowest/50 backdrop-blur-sm">
          <h1 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">SuperAdmin Control Center</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-error/10 border border-error/20">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
              <span className="text-xs font-medium text-error">ADMIN MODE</span>
            </div>
            <div className="w-8 h-8 rounded-full primary-gradient flex items-center justify-center text-white text-xs font-bold">SA</div>
          </div>
        </header>
        <main className="p-6 overflow-auto" style={{ maxHeight: "calc(100vh - 64px)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
