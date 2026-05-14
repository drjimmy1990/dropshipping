import React from "react";

interface IconProps {
  readonly name: string;
  readonly className?: string;
  readonly filled?: boolean;
  readonly size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_MAP = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

export const Icon: React.FC<IconProps> = ({
  name,
  className = "",
  filled = false,
  size = "md",
}) => {
  return (
    <span
      className={`material-symbols-outlined ${SIZE_MAP[size]} ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
};

export default Icon;
