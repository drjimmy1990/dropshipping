import React from "react";
import { Icon } from "./Icon";

interface BadgeProps {
  readonly children: React.ReactNode;
  readonly variant?: "success" | "warning" | "error" | "info" | "neutral" | "accent";
  readonly icon?: string;
  readonly className?: string;
}

const variantStyles: Record<string, string> = {
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  error: "bg-error-subtle text-error",
  info: "bg-info-subtle text-info",
  neutral: "bg-surface-sunken text-text-secondary",
  accent: "bg-accent-subtle text-accent",
};

const variantIcons: Record<string, string> = {
  success: "check_circle",
  warning: "schedule",
  error: "error",
  info: "info",
  neutral: "",
  accent: "",
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  icon,
  className = "",
}) => {
  const resolvedIcon = icon ?? variantIcons[variant];

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5
        rounded-md text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {resolvedIcon && (
        <Icon name={resolvedIcon} className="!text-[14px]" />
      )}
      {children}
    </span>
  );
};

export default Badge;
