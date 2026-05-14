import React from "react";

interface GradientButtonProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly variant?: "primary" | "outline" | "ghost";
  readonly size?: "sm" | "md" | "lg";
  readonly onClick?: () => void;
  readonly type?: "button" | "submit";
  readonly disabled?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  className = "",
  variant = "primary",
  size = "md",
  onClick,
  type = "button",
  disabled = false,
}) => {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const variantClasses = {
    primary:
      "primary-gradient text-white shadow-lg shadow-primary-container/25 hover:brightness-110",
    outline:
      "primary-outline text-white hover:bg-white/5",
    ghost:
      "bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-white/5",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        rounded-lg font-semibold
        transition-all duration-200
        active:scale-95
        disabled:opacity-50 disabled:pointer-events-none
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default GradientButton;
