import React from "react";
import type { OrderStatus } from "@/data/mockData";
import { STATUS_COLORS } from "@/data/mockData";

interface BadgeProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly variant?: OrderStatus | "info" | "success" | "warning";
}

const EXTRA_COLORS: Record<string, { bg: string; text: string }> = {
  info: { bg: "bg-secondary/10", text: "text-secondary" },
  success: { bg: "bg-tertiary/10", text: "text-tertiary" },
  warning: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = "",
  variant = "info",
}) => {
  const colors =
    STATUS_COLORS[variant as OrderStatus] ?? EXTRA_COLORS[variant] ?? EXTRA_COLORS.info;

  return (
    <span
      className={`
        inline-flex items-center gap-1
        px-2.5 py-1 rounded-full
        text-xs font-semibold uppercase tracking-wider
        ${colors.bg} ${colors.text}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
