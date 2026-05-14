import React from "react";

interface SkeletonProps {
  readonly className?: string;
  readonly variant?: "text" | "circular" | "rectangular";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rectangular",
}) => {
  const base =
    "animate-pulse bg-surface-sunken";

  const variants: Record<string, string> = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return <div className={`${base} ${variants[variant]} ${className}`} />;
};

export default Skeleton;
