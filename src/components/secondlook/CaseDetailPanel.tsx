"use client";

import { AlertTriangle, ChevronDown, Clock, Radio, X } from "lucide-react";
import type { OverridePlacementInput, PatientQueueViewModel, ResolveUncertaintyInput, TimelineEventViewModel } from "@/types/ui";
import { formatMinutes, formatPlacementRange, getCategoryInfo } from "@/lib/formatters";
import { NextBestInformationCard } from "./NextBestInformationCard";
import { EvidenceList } from "./EvidenceList";
import { WearableStatus } from "./WearableStatus";
import { EventTimeline } from "./EventTimeline";

export interface CaseDetailPanelProps {
  patient: PatientQueueViewModel | null;
  totalPatients: number;
  events: TimelineEventViewModel[];
  onCloseMobile?: () => void;
  onResolveUncertainty: (input: ResolveUncertaintyInput) => void;
  onAcknowledgeUpdate: (patientId: string) => void;
  onRequestReassessment: (patientId: string) => void;
  onOverridePlacement: (input: OverridePlacementInput) => void;
}

export function CaseDetailPanel({ patient, events, onCloseMobile }: CaseDetailPanelProps) {
  if (!patient) return <aside className="flex h-full items-center justify-center bg-white p-8 text-sm text-[#60706C]">Select a case to see why its placement may change.</aside>;
  const category = getCategoryInfo(patient.clinicianCategory);
  const unstable = patient.confidence === "low";

  return (
    <aside aria-label={`Detailed review for case ${patient.displayId}`} className="h-full overflow-y-auto bg-white">
      <div className={`border-b px-5 py-4 ${unstable ? "border-[#E8AA9E] bg-[#FFF5F2]" : "border-[#D8E1DE] bg-white"}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-lg font-bold text-[#132824]">{patient.displayId}</span>
              <span className="text-xs font-semibold text-[#53645F]">Age {patient.age ?? "—"}</span>
              <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${category.bg}`}>{category.label} · staff assigned</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-[#203A35]">{patient.complaint}</h2>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#60706C]"><Clock className="h-3 w-3" /> Waiting {formatMinutes(patient.waitingMinutes)}</p>
          </div>
          {onCloseMobile && <button onClick={onCloseMobile} className="rounded-lg p-2 text-[#60706C] hover:bg-black/5" aria-label="Close case"><X className="h-4 w-4" /></button>}
        </div>
      </div>

      <div className="space-y-4 p-4 md:p-5">
        <section className={`rounded-xl border-2 p-4 ${unstable ? "border-[#D96B58] bg-[#FFF8F6]" : "border-[#A8D1C5] bg-[#F4FBF8]"}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#71807C]">Local ML placement analysis</div>
              <div className={`mt-1 font-mono text-3xl font-bold ${unstable ? "text-[#A33A2A]" : "text-[#1D6A56]"}`}>{formatPlacementRange(patient.bestPossibleRank, patient.worstPossibleRank)}</div>
              <p className="mt-1 text-xs text-[#60706C]">Current provisional position #{patient.provisionalRank}</p>
              {patient.modelUncertaintySpread !== undefined && (
                <p className="mt-1 font-mono text-[10px] text-[#71807C]">Learned uncertainty ±{patient.modelUncertaintySpread.toFixed(1)} points</p>
              )}
            </div>
            <div className={`rounded-full px-3 py-1.5 text-xs font-bold ${unstable ? "bg-[#F7D7D0] text-[#8D2F22]" : "bg-[#DDF1EA] text-[#1D604F]"}`}>
              {unstable ? "Needs a second look" : `${patient.confidence} confidence`}
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 border-t border-black/10 pt-3 text-xs text-[#53645F]">
            <Radio className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#147D6F]" />
            <span>The queue recalculates automatically when observations, time, or device data change.</span>
          </div>
        </section>

        {(patient.modelFactors?.length ?? 0) > 0 && (
          <section className="rounded-xl border border-[#D8E1DE] bg-[#F7F9F8] p-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#60706C]">What influenced the model</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-[#425650]">
              {patient.modelFactors?.map((factor) => <li key={factor}>• {factor}</li>)}
            </ul>
          </section>
        )}

        {patient.nextBestInformation && <NextBestInformationCard nbi={patient.nextBestInformation} />}

        {patient.reasons.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#60706C]">Why this case moved</h3>
            <div className="mt-2 space-y-2">
              {patient.reasons.slice(0, 3).map((reason) => (
                <div key={reason} className="flex items-start gap-2 rounded-lg bg-[#F6F8F7] px-3 py-2.5 text-xs leading-relaxed text-[#425650]">
                  <AlertTriangle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${unstable ? "text-[#C65442]" : "text-[#B27A18]"}`} /> {reason}
                </div>
              ))}
            </div>
          </section>
        )}

        <details className="group rounded-xl border border-[#D8E1DE] bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-bold text-[#294740]">
            Evidence and audit trail
            <ChevronDown className="h-4 w-4 transition-transform duration-150 ease-out group-open:rotate-180" />
          </summary>
          <div className="space-y-4 border-t border-[#E5EBE9] p-3">
            {patient.wearable && <WearableStatus wearable={patient.wearable} />}
            <EvidenceList evidence={patient.evidence} />
            <EventTimeline events={events} patientId={patient.patientId} patientDisplayId={patient.displayId} />
          </div>
        </details>
      </div>
    </aside>
  );
}
