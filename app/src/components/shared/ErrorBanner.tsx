import React from "react";
import { Icon } from "./Icon";

interface ErrorBannerProps {
  readonly message: string;
  readonly onRetry?: () => void;
  readonly className?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onRetry,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg bg-error-subtle border border-error/20 ${className}`}
      role="alert"
    >
      <Icon name="error" className="text-error text-lg shrink-0" />
      <span className="text-sm text-error flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-error hover:underline shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
