import React from "react";
import { Icon } from "./Icon";
import { Button } from "./Button";

interface EmptyStateProps {
  readonly icon?: string;
  readonly title: string;
  readonly description?: string;
  readonly action?: {
    label: string;
    onClick: () => void;
  };
  readonly className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "inbox",
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-surface-sunken flex items-center justify-center mb-4">
        <Icon name={icon} className="text-text-muted text-2xl" />
      </div>
      <h3 className="text-base font-medium text-text mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
