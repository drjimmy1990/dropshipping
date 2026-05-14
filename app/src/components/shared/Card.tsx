import React from "react";

interface CardProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly variant?: "default" | "raised" | "interactive";
  readonly as?: "div" | "section" | "article";
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  variant = "default",
  as: Tag = "div",
}) => {
  const base = "rounded-lg border border-border";

  const variants: Record<string, string> = {
    default: "bg-surface",
    raised: "bg-surface-raised shadow-[var(--shadow-sm)]",
    interactive:
      "bg-surface hover:bg-surface-raised hover:shadow-[var(--shadow-sm)] transition-all duration-150 cursor-pointer",
  };

  return (
    <Tag className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Tag>
  );
};

export default Card;
