"use client";

import { Activity, Clock, Plus, SlidersHorizontal } from "lucide-react";
import type { QueueSummaryViewModel } from "@/types/ui";

export interface QueueHeaderProps {
  summary: QueueSummaryViewModel;
  onOpenDemoControls: () => void;
  onOpenIntake: () => void;
}

export function QueueHeader({ summary, onOpenDemoControls, onOpenIntake }: QueueHeaderProps) {
  return (
    <header className="shrink-0 border-b border-[#D8E1DE] bg-white px-4 py-3 md:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3">
        <div className="mr-auto flex min-w-[250px] items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#123D37] text-sm font-bold text-white">SL</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-[#132824]">SecondLook</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF5F1] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1D5E4D]">
                <Activity className="h-3 w-3" /> Local ML
              </span>
            </div>
            <p className="text-xs text-[#60706C]">Learned queue movement · no external API</p>
          </div>
        </div>

        <div className="flex items-center gap-2" aria-label="Live queue summary">
          {summary.modelMode === "local-ml" && <div className="hidden rounded-lg border border-[#C8E5DB] bg-[#EFF8F4] px-3 py-1.5 lg:block" title={`${summary.modelVersion} · held-out synthetic R² ${summary.modelValidationR2}`}>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[#56726A]">Model online</div>
            <div className="font-mono text-xs font-bold text-[#1D5E4D]">RF · R² {summary.modelValidationR2}</div>
          </div>}
          <div className="rounded-lg border border-[#D8E1DE] bg-[#F7F9F8] px-3 py-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[#71807C]">Queue stability</div>
            <div className="font-mono text-sm font-bold text-[#132824]">{summary.queueConfidence}%</div>
          </div>
          <div className={`rounded-lg border px-3 py-1.5 ${summary.unstableCount > 0 ? "border-[#F0B8AE] bg-[#FFF1EE]" : "border-[#C8E5DB] bg-[#EFF8F4]"}`}>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[#71807C]">Needs a second look</div>
            <div className={`font-mono text-sm font-bold ${summary.unstableCount > 0 ? "text-[#A33A2A]" : "text-[#1D5E4D]"}`}>{summary.unstableCount} cases</div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-lg border border-[#D8E1DE] bg-[#F7F9F8] px-3 py-2 font-mono text-xs text-[#132824] sm:flex">
            <Clock className="h-3.5 w-3.5 text-[#147D6F]" /> {summary.simulatedTime}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onOpenIntake} className="inline-flex items-center gap-1.5 rounded-lg border border-[#B9CAC5] bg-white px-3 py-2 text-xs font-semibold text-[#294740] transition-[transform,background-color] duration-150 ease-out active:scale-[0.97] hover:bg-[#F4F7F6]">
            <Plus className="h-3.5 w-3.5" /> Add case
          </button>
          <button onClick={onOpenDemoControls} className="inline-flex items-center gap-1.5 rounded-lg bg-[#147D6F] px-3 py-2 text-xs font-semibold text-white transition-[transform,background-color] duration-150 ease-out active:scale-[0.97] hover:bg-[#0E6559]">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Simulation
          </button>
        </div>
      </div>
    </header>
  );
}
