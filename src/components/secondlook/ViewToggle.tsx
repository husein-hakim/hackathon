"use client";

import React from "react";
import { ViewMode } from "@/types/ui";
import { Layers, ListOrdered } from "lucide-react";

export interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export function ViewToggle({
  currentView,
  onViewChange,
  className = "",
}: ViewToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Queue Presentation Mode"
      className={`inline-flex items-center p-1 bg-[#EAF0EE] rounded-md border border-[#DCE5E2] ${className}`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={currentView === "traditional"}
        onClick={() => onViewChange("traditional")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-all duration-150 ${
          currentView === "traditional"
            ? "bg-white text-[#132824] shadow-xs border border-[#DCE5E2]"
            : "text-[#60706C] hover:text-[#132824]"
        }`}
      >
        <ListOrdered className="w-3.5 h-3.5" />
        <span>Traditional View</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={currentView === "secondlook"}
        onClick={() => onViewChange("secondlook")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-all duration-150 ${
          currentView === "secondlook"
            ? "bg-[#147D6F] text-white shadow-xs font-semibold"
            : "text-[#60706C] hover:text-[#132824]"
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>SecondLook View</span>
      </button>
    </div>
  );
}
