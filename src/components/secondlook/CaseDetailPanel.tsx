"use client";

import React, { useState } from "react";
import {
  PatientQueueViewModel,
  TimelineEventViewModel,
  ResolveUncertaintyInput,
  OverridePlacementInput,
} from "@/types/ui";
import { getCategoryInfo, formatMinutes } from "@/lib/formatters";
import { PlacementRange } from "./PlacementRange";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { NextBestInformationCard } from "./NextBestInformationCard";
import { UncertaintyProfile } from "./UncertaintyProfile";
import { EvidenceList } from "./EvidenceList";
import { WearableStatus } from "./WearableStatus";
import { WhatChanged } from "./WhatChanged";
import { EventTimeline } from "./EventTimeline";
import { ResolutionDialog } from "./ResolutionDialog";
import { OverrideDialog } from "./OverrideDialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  Clock,
  History,
  AlertTriangle,
  ArrowUpDown,
  BellRing,
  RefreshCw,
  X,
  FileCheck,
} from "lucide-react";

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

export function CaseDetailPanel({
  patient,
  totalPatients,
  events,
  onCloseMobile,
  onResolveUncertainty,
  onAcknowledgeUpdate,
  onRequestReassessment,
  onOverridePlacement,
}: CaseDetailPanelProps) {
  const { showToast } = useToast();
  const [isResolutionOpen, setIsResolutionOpen] = useState(false);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);

  if (!patient) {
    return (
      <aside
        aria-label="Selected Case Detail Panel"
        className="w-full h-full flex flex-col items-center justify-center p-8 bg-white text-center text-xs text-[#60706C]"
      >
        <div className="w-12 h-12 rounded-full bg-[#EAF0EE] flex items-center justify-center text-[#147D6F] mb-3">
          <FileCheck className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[#132824]">No Case Selected</h3>
        <p className="mt-1 max-w-xs leading-relaxed">
          Select any patient from the provisional queue to inspect placement
          uncertainty and Next Best Information.
        </p>
      </aside>
    );
  }

  const catInfo = getCategoryInfo(patient.clinicianCategory);

  const handleResolve = (input: ResolveUncertaintyInput) => {
    onResolveUncertainty(input);
    showToast({
      type: "success",
      title: "Observation Clarified",
      description: `Placement range narrowed for ${patient.displayId}.`,
    });
  };

  const handleAcknowledge = () => {
    onAcknowledgeUpdate(patient.patientId);
    showToast({
      type: "info",
      title: "Update Acknowledged",
      description: `Attending review recorded for ${patient.displayId}.`,
    });
  };

  const handleReassessment = () => {
    onRequestReassessment(patient.patientId);
    showToast({
      type: "info",
      title: "Reassessment Requested",
      description: `Floor alert dispatched for bedside check on ${patient.displayId}.`,
    });
  };

  const handleOverride = (input: OverridePlacementInput) => {
    onOverridePlacement(input);
    showToast({
      type: "warning",
      title: "Queue Position Overridden",
      description: `Case moved to #${input.newPosition}. Audit recorded.`,
    });
  };

  return (
    <aside
      aria-label={`Detailed review for case ${patient.displayId}`}
      className="w-full h-full flex flex-col bg-white overflow-y-auto"
    >
      {/* 1. Patient Summary Header */}
      <div className="shrink-0 p-4 border-b border-[#DCE5E2] bg-[#FAFBFB]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-[#132824]">
                {patient.displayId}
              </span>
              <span className="text-xs text-[#60706C]">
                ({patient.ageGroup})
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-xs border font-semibold ${catInfo.bg}`}
              >
                {catInfo.label} — {catInfo.name}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-[#132824] mt-1">
              {patient.complaint}
            </h3>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-md hover:bg-[#EAF0EE] text-[#60706C]"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Operational Timings */}
        <div className="flex items-center gap-4 mt-2.5 text-xs text-[#60706C]">
          <span className="flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-[#147D6F]" />
            <span>Waiting: {formatMinutes(patient.waitingMinutes)}</span>
          </span>
          <span className="text-[#DCE5E2]">•</span>
          <span className="flex items-center gap-1 font-mono">
            <History className="w-3.5 h-3.5 text-[#147D6F]" />
            <span>Reviewed: {formatMinutes(patient.minutesSinceReview)} ago</span>
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 2. Signature Placement Range */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#60706C]">
              Queue Positioning
            </span>
            <ConfidenceBadge confidence={patient.confidence} size="sm" />
          </div>
          <PlacementRange
            bestRank={patient.bestPossibleRank}
            worstRank={patient.worstPossibleRank}
            provisionalRank={patient.provisionalRank}
            confidence={patient.confidence}
            showTicks={true}
          />
        </div>

        {/* 10. Top Provider Actions Bar */}
        <div className="p-3 bg-[#F4F7F6] rounded-md border border-[#DCE5E2] flex flex-wrap items-center gap-2">
          {patient.nextBestInformation && (
            <Button
              variant="action"
              size="sm"
              onClick={() => setIsResolutionOpen(true)}
              className="font-semibold shadow-xs"
            >
              Resolve Uncertainty
            </Button>
          )}

          {patient.hasUnacknowledgedUpdate && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAcknowledge}
              icon={<BellRing className="w-3.5 h-3.5 text-[#C78B25]" />}
              className="border-[#F4DCB0] bg-[#FDF6E9] text-[#87590C]"
            >
              Acknowledge Update
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleReassessment}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Request Reassessment
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsOverrideOpen(true)}
            icon={<ArrowUpDown className="w-3.5 h-3.5" />}
          >
            Override Position
          </Button>
        </div>

        {/* 4. Next Best Information (High visual emphasis near top) */}
        {patient.nextBestInformation && (
          <NextBestInformationCard
            nbi={patient.nextBestInformation}
            onResolve={() => setIsResolutionOpen(true)}
          />
        )}

        {/* 3. Why the placement is uncertain */}
        {patient.reasons.length > 0 && (
          <div className="rounded-md border border-[#DCE5E2] bg-white p-3.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#C95C4A]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#60706C]">
                Why is This Placement Uncertain?
              </h4>
            </div>

            <ul className="space-y-1.5 text-xs text-[#132824]">
              {patient.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#C95C4A] font-bold mt-0.5">•</span>
                  <span className="leading-relaxed text-[#60706C]">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 5. Information-quality profile */}
        <UncertaintyProfile patient={patient} />

        {/* 7. Wearable status */}
        {patient.wearable && <WearableStatus wearable={patient.wearable} />}

        {/* 6. Captured Evidence */}
        <EvidenceList evidence={patient.evidence} />

        {/* 8. What changed since last review */}
        <WhatChanged patient={patient} />

        {/* 9. Event timeline */}
        <EventTimeline
          events={events}
          patientId={patient.patientId}
          patientDisplayId={patient.displayId}
        />
      </div>

      {/* Resolution Modal */}
      <ResolutionDialog
        isOpen={isResolutionOpen}
        onClose={() => setIsResolutionOpen(false)}
        patient={patient}
        uncertainty={patient.uncertainties[0]}
        onResolve={handleResolve}
        onRequestReassessment={handleReassessment}
      />

      {/* Override Modal */}
      <OverrideDialog
        isOpen={isOverrideOpen}
        onClose={() => setIsOverrideOpen(false)}
        patient={patient}
        totalPatients={totalPatients}
        onOverride={handleOverride}
      />
    </aside>
  );
}
