import React from "react";
import { ShieldCheck, AlertCircle, AlertTriangle } from "lucide-react";
import { ConfidenceLevel } from "@/types/ui";
import { getConfidenceInfo } from "@/lib/formatters";

export interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function ConfidenceBadge({
  confidence,
  size = "md",
  showIcon = true,
  className = "",
}: ConfidenceBadgeProps) {
  const info = getConfidenceInfo(confidence);

  const getIcon = () => {
    switch (confidence) {
      case "high":
        return <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#2E8B72]" />;
      case "medium":
        return <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#C78B25]" />;
      case "low":
        return <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#C95C4A]" />;
    }
  };

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-1.5 py-0.5 gap-1"
      : "text-xs px-2 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-xs border select-none ${info.bgClass} ${sizeClasses} ${className}`}
      title={info.description}
      aria-label={`${info.label} placement confidence: ${info.description}`}
    >
      {showIcon && getIcon()}
      <span className="font-semibold uppercase tracking-wider text-[10px]">
        {info.label}
      </span>
    </span>
  );
}
