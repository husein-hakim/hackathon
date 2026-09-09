import React from "react";
import { ShieldAlert, Info } from "lucide-react";

export function SafetyFooter() {
  return (
    <footer
      role="contentinfo"
      className="shrink-0 bg-[#FFFFFF] border-t border-[#DCE5E2] px-6 py-2.5 text-xs text-[#60706C] flex flex-col sm:flex-row items-center justify-between gap-2 z-20"
    >
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-[#147D6F] shrink-0" />
        <p className="font-medium text-[#132824]">
          Operational decision-support layer • Fictional and anonymised patient data.
        </p>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-[#60706C]">
        <div className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-[#4078A6] shrink-0" />
          <span>
            SecondLook does not diagnose, prescribe, or replace professional clinical judgement.
          </span>
        </div>
        <span className="hidden md:inline text-[#DCE5E2]">|</span>
        <span className="hidden md:inline font-mono text-[10px] text-[#A8B6B2]">
          Provider retains final queue authority
        </span>
      </div>
    </footer>
  );
}
