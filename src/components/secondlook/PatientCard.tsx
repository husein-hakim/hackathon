"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  PatientQueueViewModel,
  ViewMode,
} from "@/types/ui";
import { getCategoryInfo, formatMinutes } from "@/lib/formatters";
import { PlacementRange } from "./PlacementRange";
import { ConfidenceBadge } from "./ConfidenceBadge";
import {
  Clock,
  History,
  Activity,
  BellRing,
  AlertCircle,
  WifiOff,
} from "lucide-react";

export interface PatientCardProps {
  patient: PatientQueueViewModel;
  isSelected: boolean;
  viewMode: ViewMode;
  onSelect: (patientId: string) => void;
}

export function PatientCard({
  patient,
  isSelected,
  viewMode,
  onSelect,
}: PatientCardProps) {
  const catInfo = getCategoryInfo(patient.clinicianCategory);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(patient.patientId);
    }
  };

  const isTraditional = viewMode === "traditional";

  return (
    <motion.div
      layout
      transition={{ type: "tween", duration: 0.22, ease: "easeInOut" }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onSelect(patient.patientId)}
      onKeyDown={handleKeyDown}
      className={`relative rounded-md p-3.5 transition-all text-left cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147D6F] ${
        isSelected
          ? "bg-white border-2 border-[#147D6F] shadow-sm"
          : "bg-white border border-[#DCE5E2] hover:border-[#B6C6C1] hover:bg-[#FAFBFB]"
      }`}
    >
      {/* Active Left Indicator Accent */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#147D6F] rounded-l-md" />
      )}

      {/* Card Header: Position Token & Patient Metadata */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Position Token */}
          <div
            className={`w-7 h-7 rounded-sm flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
              isTraditional
                ? "bg-[#123D37] text-white"
                : isSelected
                ? "bg-[#147D6F] text-white"
                : "bg-[#EAF0EE] text-[#132824]"
            }`}
          >
            #{patient.provisionalRank}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-sm text-[#132824]">
                {patient.displayId}
              </span>
              <span className="text-[11px] text-[#60706C]">
                • {patient.ageGroup}
              </span>
            </div>
            <div className="text-xs font-medium text-[#132824] line-clamp-1">
              {patient.complaint}
            </div>
          </div>
        </div>

        {/* Staff Assigned Category Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-xs border text-[11px] font-semibold ${catInfo.bg}`}
            title={`Staff Triage Acuity: ${catInfo.name}`}
          >
            {catInfo.label}
          </span>
        </div>
      </div>

      {/* Operational Timings */}
      <div className="flex items-center gap-3 mt-2.5 text-[11px] text-[#60706C] border-t border-[#F4F7F6] pt-2">
        <span className="flex items-center gap-1 font-mono">
          <Clock className="w-3 h-3 text-[#A8B6B2]" />
          <span>Wait: {formatMinutes(patient.waitingMinutes)}</span>
        </span>
        <span className="text-[#DCE5E2]">•</span>
        <span className="flex items-center gap-1 font-mono">
          <History className="w-3 h-3 text-[#A8B6B2]" />
          <span>Review: {formatMinutes(patient.minutesSinceReview)} ago</span>
        </span>

        {/* Unacknowledged Update Pill */}
        {patient.hasUnacknowledgedUpdate && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-[#87590C] bg-[#FDF6E9] border border-[#F4DCB0] px-1.5 py-0.2 rounded-xs">
            <BellRing className="w-2.5 h-2.5" />
            <span>Update</span>
          </span>
        )}
      </div>

      {/* SecondLook View Specific Section: Placement Range & Confidence */}
      {!isTraditional && (
        <div className="mt-3 pt-2.5 border-t border-[#DCE5E2]/60 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <PlacementRange
              bestRank={patient.bestPossibleRank}
              worstRank={patient.worstPossibleRank}
              provisionalRank={patient.provisionalRank}
              confidence={patient.confidence}
              compact={true}
              className="flex-1 mr-3"
            />
            <ConfidenceBadge confidence={patient.confidence} size="sm" />
          </div>

          {/* Uncertainty Reasons (up to 2) */}
          {patient.reasons.length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              {patient.reasons.slice(0, 2).map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-1.5 text-[11px] text-[#60706C]"
                >
                  <AlertCircle className="w-3 h-3 text-[#C95C4A] shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* Wearable Tag when attached */}
          {patient.wearable && (
            <div className="flex items-center gap-2 mt-1 text-[10px] text-[#60706C] bg-[#F4F7F6] px-2 py-1 rounded-xs">
              {patient.wearable.connected ? (
                <>
                  <Activity className="w-3 h-3 text-[#147D6F]" />
                  <span>
                    Monitor: {patient.wearable.heartRate || 78} bpm • Signal{" "}
                    {patient.wearable.signalQuality}%
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-[#C95C4A]" />
                  <span className="text-[#932C1E] font-medium">
                    Monitor disconnected ({patient.wearable.lastReliableReadingLabel})
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
