"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, ThemeToggle } from "@/components/shared";
import { DASHBOARD_NAV_ITEMS } from "@/data/mockData";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-60"
        } shrink-0 bg-surface border-r border-border flex flex-col transition-all duration-200`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-border-subtle">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-accent-on text-sm font-bold shrink-0">
              D
            </div>
            {!collapsed && (
              <span className="text-base font-semibold text-text truncate">
                DropLinker
              </span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {DASHBOARD_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                  isActive
                    ? "bg-accent-subtle text-accent font-medium"
                    : "text-text-secondary hover:bg-surface-sunken hover:text-text"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  name={item.icon}
                  className={`text-lg shrink-0 ${isActive ? "text-accent" : ""}`}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-border-subtle p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-md text-text-muted hover:bg-surface-sunken transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon
              name={collapsed ? "chevron_right" : "chevron_left"}
              className="text-lg"
            />
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 shrink-0 bg-surface border-b border-border flex items-center justify-between px-6">
          <div />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="p-2 rounded-md text-text-secondary hover:bg-surface-sunken transition-colors">
              <Icon name="notifications" className="text-lg" />
            </button>
            <div className="w-8 h-8 rounded-full bg-accent-subtle flex items-center justify-center text-accent text-sm font-medium">
              M
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
