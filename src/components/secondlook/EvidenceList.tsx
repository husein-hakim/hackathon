import React from "react";
import { EvidenceViewModel } from "@/types/ui";
import {
  getEvidenceSourceLabel,
  getEvidenceStatusInfo,
} from "@/lib/formatters";
import { FileText, Clock, Radio } from "lucide-react";

export interface EvidenceListProps {
  evidence: EvidenceViewModel[];
}

export function EvidenceList({ evidence }: EvidenceListProps) {
  return (
    <div className="rounded-md border border-[#DCE5E2] bg-white overflow-hidden">
      <div className="px-4 py-2.5 bg-[#F4F7F6]/60 border-b border-[#DCE5E2] flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#60706C]">
          Captured Operational Evidence ({evidence.length})
        </h4>
        <span className="text-[11px] text-[#60706C]">
          Audited Clinical Inputs
        </span>
      </div>

      <div className="divide-y divide-[#F4F7F6]">
        {evidence.map((item) => {
          const statusInfo = getEvidenceStatusInfo(item.status);
          const sourceLabel = getEvidenceSourceLabel(item.source);

          return (
            <div
              key={item.id}
              className="p-3.5 hover:bg-[#FAFBFB] transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#147D6F] shrink-0" />
                  <span className="text-xs font-semibold text-[#132824]">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-xs border ${statusInfo.className}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              {/* Observed Value */}
              <div className="mt-1.5 text-xs font-medium text-[#132824] bg-[#F4F7F6]/50 p-2 rounded-xs border border-[#DCE5E2]/50 font-mono">
                {item.value}
              </div>

              {/* Metadata row: source, timestamp, signal quality */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-[#60706C]">
                <span>
                  Source: <strong className="text-[#132824]">{sourceLabel}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#A8B6B2]" />
                  <span>
                    {item.recordedAt} ({item.relativeTime})
                  </span>
                </span>

                {item.signalQuality !== undefined && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-[#C78B25]">
                      <Radio className="w-3 h-3" />
                      <span>Signal: {item.signalQuality}%</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
