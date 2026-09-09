import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "teal" | "amber" | "coral" | "blue" | "neutral";
  size?: "sm" | "md";
  className?: string;
  icon?: React.ReactNode;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
  icon,
}: BadgeProps) {
  const variantStyles = {
    default: "bg-[#EAF0EE] text-[#132824] border-[#DCE5E2]",
    teal: "bg-[#EAF5F1] text-[#1D5E4D] border-[#BCE1D5]",
    amber: "bg-[#FDF6E9] text-[#87590C] border-[#F4DCB0]",
    coral: "bg-[#FCEEEC] text-[#932C1E] border-[#F5C2BA]",
    blue: "bg-[#EFF5F9] text-[#1E547D] border-[#BFD9EC]",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const sizeStyles = {
    sm: "text-[11px] px-1.5 py-0.5 font-medium tracking-tight",
    md: "text-xs px-2 py-0.5 font-medium",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
