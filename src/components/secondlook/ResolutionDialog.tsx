"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import {
  PatientQueueViewModel,
  UncertaintyViewModel,
  ResolveUncertaintyInput,
} from "@/types/ui";
import { CheckCircle2, AlertTriangle, RefreshCw, XCircle } from "lucide-react";

export interface ResolutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientQueueViewModel;
  uncertainty?: UncertaintyViewModel;
  onResolve: (input: ResolveUncertaintyInput) => void;
  onRequestReassessment: (patientId: string) => void;
}

export function ResolutionDialog({
  isOpen,
  onClose,
  patient,
  uncertainty,
  onResolve,
  onRequestReassessment,
}: ResolutionDialogProps) {
  const [resolutionMode, setResolutionMode] = useState<
    "update" | "confirm" | "unavailable"
  >("update");
  const [updatedValue, setUpdatedValue] = useState("");
  const [note, setNote] = useState("");

  const activeUncertainty =
    uncertainty ||
    patient.uncertainties[0] || {
      id: "unc-default",
      type: "stale",
      label: "Operational Information Clarification",
      explanation: "Clarify observational parameters to reduce queue uncertainty.",
      field: "vitals",
      severity: "medium",
      resolutionAction: "Refresh observation",
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onResolve({
      patientId: patient.patientId,
      uncertaintyId: activeUncertainty.id,
      value: resolutionMode === "update" ? updatedValue || "96% (ambient air, RR 18/min)" : undefined,
      markUnavailable: resolutionMode === "unavailable",
      note: note || undefined,
    });

    onClose();
  };

  const handleReassessment = () => {
    onRequestReassessment(patient.patientId);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Clarify Information — Case ${patient.displayId}`}
      description="Update or verify observational inputs to stabilize queue placement bounds."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Highlighted Uncertainty Target */}
        <div className="p-3 bg-[#F4F7F6] border border-[#DCE5E2] rounded-md text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#132824]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#C78B25]" />
            <span>Target: {activeUncertainty.label}</span>
          </div>
          <p className="text-[#60706C] mt-1 leading-relaxed">
            {activeUncertainty.explanation}
          </p>
        </div>

        {/* Resolution Action Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#132824] block">
            Resolution Action
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setResolutionMode("update")}
              className={`p-2.5 rounded-md border text-left text-xs transition-colors ${
                resolutionMode === "update"
                  ? "bg-[#EAF5F1] border-[#147D6F] text-[#132824] font-semibold"
                  : "bg-white border-[#DCE5E2] text-[#60706C] hover:bg-[#F4F7F6]"
              }`}
            >
              <div className="flex items-center gap-1 text-[#147D6F] mb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enter Update</span>
              </div>
              <span className="text-[11px] text-[#60706C] block">
                Refresh reading
              </span>
            </button>

            <button
              type="button"
              onClick={() => setResolutionMode("confirm")}
              className={`p-2.5 rounded-md border text-left text-xs transition-colors ${
                resolutionMode === "confirm"
                  ? "bg-[#EAF5F1] border-[#147D6F] text-[#132824] font-semibold"
                  : "bg-white border-[#DCE5E2] text-[#60706C] hover:bg-[#F4F7F6]"
              }`}
            >
              <div className="flex items-center gap-1 text-[#147D6F] mb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm</span>
              </div>
              <span className="text-[11px] text-[#60706C] block">
                Verify baseline
              </span>
            </button>

            <button
              type="button"
              onClick={() => setResolutionMode("unavailable")}
              className={`p-2.5 rounded-md border text-left text-xs transition-colors ${
                resolutionMode === "unavailable"
                  ? "bg-[#FCEEEC] border-[#C95C4A] text-[#132824] font-semibold"
                  : "bg-white border-[#DCE5E2] text-[#60706C] hover:bg-[#F4F7F6]"
              }`}
            >
              <div className="flex items-center gap-1 text-[#C95C4A] mb-0.5">
                <XCircle className="w-3.5 h-3.5" />
                <span>Unavailable</span>
              </div>
              <span className="text-[11px] text-[#60706C] block">
                Cannot obtain
              </span>
            </button>
          </div>
        </div>

        {/* Updated Value Input if Mode is 'update' */}
        {resolutionMode === "update" && (
          <div>
            <label
              htmlFor="updated-value-input"
              className="text-xs font-semibold text-[#132824] block mb-1"
            >
              Refreshed Observation Value
            </label>
            <input
              id="updated-value-input"
              type="text"
              placeholder="e.g. SpO2 96%, RR 18 / min"
              value={updatedValue}
              onChange={(e) => setUpdatedValue(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-[#DCE5E2] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147D6F]"
            />
            <span className="text-[10px] text-[#60706C] mt-1 block">
              Leave blank to insert verified staff standard re-check.
            </span>
          </div>
        )}

        {/* Clinician Note */}
        <div>
          <label
            htmlFor="resolution-note"
            className="text-xs font-semibold text-[#132824] block mb-1"
          >
            Staff Audit Note (Optional)
          </label>
          <textarea
            id="resolution-note"
            rows={2}
            placeholder="Document rationale or context for this clarification..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full text-xs p-2.5 border border-[#DCE5E2] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147D6F] resize-none"
          />
        </div>

        {/* Secondary Action: Request Reassessment */}
        <div className="p-2.5 bg-[#FAFBFB] rounded-md border border-[#DCE5E2] flex items-center justify-between">
          <div className="text-xs">
            <span className="font-semibold text-[#132824] block">
              Need Bedside Reassessment?
            </span>
            <span className="text-[11px] text-[#60706C]">
              Alert floor staff to conduct a full physical recheck.
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReassessment}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Request
          </Button>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE5E2]">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="action" size="md">
            Save & Narrow Range
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
