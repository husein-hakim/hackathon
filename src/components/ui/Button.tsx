"use client";

import React, { forwardRef } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "action" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "secondary",
      size = "md",
      icon,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147D6F] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";

    const variantStyles = {
      primary:
        "bg-[#123D37] text-white hover:bg-[#0C2A26] active:bg-[#081F1C] border border-[#0C2A26]",
      action:
        "bg-[#147D6F] text-white hover:bg-[#0E6559] active:bg-[#0A4E45] shadow-xs",
      secondary:
        "bg-white text-[#132824] hover:bg-[#F4F7F6] active:bg-[#EAF0EE] border border-[#DCE5E2]",
      outline:
        "bg-transparent text-[#147D6F] border border-[#147D6F] hover:bg-[#EAF5F1] active:bg-[#D4ECE3]",
      ghost:
        "bg-transparent text-[#60706C] hover:text-[#132824] hover:bg-[#EAF0EE]",
      danger:
        "bg-[#C95C4A] text-white hover:bg-[#B34E3E] active:bg-[#9B4032]",
    };

    const sizeStyles = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5 min-h-[30px]",
      md: "text-sm px-3.5 py-2 gap-2 min-h-[36px]",
      lg: "text-base px-4 py-2.5 gap-2.5 min-h-[44px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
