"use client";

import { ArrowRight, Lightbulb } from "lucide-react";
import type { NextBestInformationViewModel } from "@/types/ui";

export interface NextBestInformationCardProps {
  nbi: NextBestInformationViewModel;
}

export function NextBestInformationCard({ nbi }: NextBestInformationCardProps) {
  return (
    <section className="rounded-xl border border-[#9BCFC0] bg-[#F0FAF6] p-4" aria-label="Best next information">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#147D6F] text-white"><Lightbulb className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#307365]">Most useful missing information</div>
          <h3 className="mt-1 text-sm font-bold text-[#132824]">{nbi.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-[#53645F]">{nbi.explanation}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg border border-[#CBE4DC] bg-white px-3 py-2.5">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wide text-[#71807C]">Now</div>
          <div className="font-mono text-lg font-bold text-[#A33A2A]">#{nbi.currentRange[0]}–#{nbi.currentRange[1]}</div>
        </div>
        <ArrowRight className="h-4 w-4 text-[#6B7D78]" />
        <div className="text-right">
          <div className="text-[9px] font-bold uppercase tracking-wide text-[#71807C]">With this information</div>
          <div className="font-mono text-lg font-bold text-[#1D6A56]">#{nbi.expectedRange[0]}–#{nbi.expectedRange[1]}</div>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-[#60706C]">Estimated {nbi.uncertaintyReductionPercent}% reduction in placement uncertainty.</p>
    </section>
  );
}
