"use client";

import React from "react";
import { Sparkles, ArrowRight, Clock, Percent } from "lucide-react";
import { NextBestInformationViewModel } from "@/types/ui";
import { Button } from "@/components/ui/Button";

export interface NextBestInformationCardProps {
  nbi: NextBestInformationViewModel;
  onResolve: () => void;
}

export function NextBestInformationCard({
  nbi,
  onResolve,
}: NextBestInformationCardProps) {
  return (
    <div className="relative rounded-lg p-4 bg-gradient-to-br from-[#123D37]/5 to-[#147D6F]/10 border-2 border-[#147D6F] shadow-xs">
      {/* Header Tag */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#147D6F] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#147D6F]" />
          <span>Next Best Information</span>
        </div>
        <span className="text-[10px] font-mono bg-[#EAF5F1] text-[#1D5E4D] border border-[#BCE1D5] px-1.5 py-0.5 rounded-xs font-semibold">
          High Leverage
        </span>
      </div>

      {/* Main Clarification Title */}
      <h3 className="text-sm font-bold text-[#132824] leading-snug">
        {nbi.title}
      </h3>

      {/* Explanation */}
      <p className="text-xs text-[#60706C] mt-1 leading-relaxed">
        {nbi.explanation}
      </p>

      {/* Comparison Grid: Current vs Expected Range */}
      <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 bg-white/90 rounded-md border border-[#DCE5E2]">
        <div>
          <div className="text-[10px] uppercase font-semibold text-[#60706C]">
            Current placement range
          </div>
          <div className="text-sm font-mono font-bold text-[#C95C4A] mt-0.5">
            #{nbi.currentRange[0]}–#{nbi.currentRange[1]}
          </div>
        </div>

        <div className="border-l border-[#DCE5E2] pl-2.5">
          <div className="text-[10px] uppercase font-semibold text-[#60706C]">
            Expected after clarification
          </div>
          <div className="flex items-center gap-1 text-sm font-mono font-bold text-[#2E8B72] mt-0.5">
            <ArrowRight className="w-3.5 h-3.5 text-[#2E8B72]" />
            <span>
              #{nbi.expectedRange[0]}–#{nbi.expectedRange[1]}
            </span>
          </div>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="flex items-center justify-between mt-3 text-[11px] text-[#60706C]">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#147D6F]" />
          <span>Estimated effort: ~{nbi.estimatedSeconds}s</span>
        </span>
        <span className="flex items-center gap-1 font-mono text-[#147D6F] font-semibold">
          <Percent className="w-3 h-3" />
          <span>~{nbi.uncertaintyReductionPercent}% uncertainty reduction</span>
        </span>
      </div>

      {/* Resolve CTA */}
      <div className="mt-3 pt-2.5 border-t border-[#DCE5E2]/80 flex justify-end">
        <Button
          variant="action"
          size="sm"
          onClick={onResolve}
          className="w-full sm:w-auto font-semibold"
        >
          Resolve Uncertainty
        </Button>
      </div>
    </div>
  );
}
