"use client";

import { AlertTriangle, BellRing, Clock, ShieldCheck } from "lucide-react";
import type { PatientQueueViewModel } from "@/types/ui";
import { formatMinutes, formatPlacementRange, getCategoryInfo } from "@/lib/formatters";

export interface PatientCardProps {
  patient: PatientQueueViewModel;
  isSelected: boolean;
  onSelect: (patientId: string) => void;
}

export function PatientCard({ patient, isSelected, onSelect }: PatientCardProps) {
  const category = getCategoryInfo(patient.clinicianCategory);
  const unstable = patient.confidence === "low";
  const medium = patient.confidence === "medium";
  const surface = unstable
    ? "border-[#E58F7F] bg-[#FFF5F2]"
    : medium ? "border-[#E8C786] bg-[#FFFAF0]" : "border-[#D8E1DE] bg-white";

  return (
    <button
      type="button"
      onClick={() => onSelect(patient.patientId)}
      aria-pressed={isSelected}
      aria-label={`${patient.displayId}, age ${patient.age ?? "unknown"}, ${patient.complaint}, range ${patient.bestPossibleRank} to ${patient.worstPossibleRank}`}
      className={`relative w-full rounded-xl border p-3 text-left transition-[transform,border-color,box-shadow] duration-150 ease-out active:scale-[0.99] ${surface} ${isSelected ? "ring-2 ring-[#147D6F] ring-offset-1 shadow-sm" : "hover:border-[#9EB6AF]"}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold text-white ${unstable ? "bg-[#B94735]" : medium ? "bg-[#B27A18]" : "bg-[#234A43]"}`}>#{patient.provisionalRank}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-sm font-bold text-[#132824]">{patient.displayId}</span>
            <span className="text-xs font-semibold text-[#53645F]">Age {patient.age ?? "—"}</span>
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${category.bg}`}>{category.label}</span>
          </div>
          <p className="mt-0.5 truncate text-xs font-medium text-[#203A35]">{patient.complaint}</p>
        </div>
        <div className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-right ${unstable ? "border-[#E58F7F] bg-white" : medium ? "border-[#E8C786] bg-white" : "border-[#C8E5DB] bg-[#F4FBF8]"}`}>
          <div className="text-[9px] font-bold uppercase tracking-wide text-[#71807C]">Possible position</div>
          <div className={`font-mono text-base font-bold ${unstable ? "text-[#A33A2A]" : medium ? "text-[#8A5B09]" : "text-[#1D5E4D]"}`}>{formatPlacementRange(patient.bestPossibleRank, patient.worstPossibleRank)}</div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-black/5 pt-2 text-[11px] text-[#60706C]">
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Waiting {formatMinutes(patient.waitingMinutes)}</span>
        {unstable ? (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#F8D8D1] px-2 py-1 font-bold text-[#8D2F22]"><AlertTriangle className="h-3 w-3" /> Needs a second look</span>
        ) : (
          <span className="ml-auto inline-flex items-center gap-1 text-[#2E745F]"><ShieldCheck className="h-3 w-3" /> {patient.confidence === "high" ? "Stable placement" : "Watch placement"}</span>
        )}
        {patient.hasUnacknowledgedUpdate && <span className="inline-flex items-center gap-1 rounded-full bg-[#F8E9C8] px-2 py-1 font-semibold text-[#7B550D]"><BellRing className="h-3 w-3" /> New data</span>}
      </div>
    </button>
  );
}
