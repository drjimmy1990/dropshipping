import React from "react";

interface GlassCardProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly variant?: "default" | "active" | "overlay";
  readonly hover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  variant = "default",
  hover = false,
}) => {
  const variantClass =
    variant === "active"
      ? "glass-card-active"
      : variant === "overlay"
        ? "glass-card-overlay"
        : "glass-card";

  const hoverClass = hover ? "glass-card-hover" : "";

  return (
    <div className={`${variantClass} ${hoverClass} rounded-lg ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;
