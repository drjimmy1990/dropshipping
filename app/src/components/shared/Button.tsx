import React from "react";

interface ButtonProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly variant?: "primary" | "secondary" | "ghost" | "destructive";
  readonly size?: "sm" | "md" | "lg";
  readonly onClick?: () => void;
  readonly type?: "button" | "submit";
  readonly disabled?: boolean;
  readonly loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = "",
  variant = "primary",
  size = "md",
  onClick,
  type = "button",
  disabled = false,
  loading = false,
}) => {
  const sizes: Record<string, string> = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variants: Record<string, string> = {
    primary:
      "bg-accent text-accent-on hover:bg-accent-hover",
    secondary:
      "bg-transparent border border-border text-text hover:bg-surface-sunken",
    ghost:
      "bg-transparent text-accent hover:bg-accent-subtle",
    destructive:
      "bg-error text-white hover:opacity-90",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-md font-medium
        transition-colors duration-150
        disabled:opacity-50 disabled:pointer-events-none
        inline-flex items-center justify-center gap-2
        ${className}
      `}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
