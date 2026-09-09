"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PatientQueueViewModel, OverridePlacementInput } from "@/types/ui";
import { ShieldCheck, AlertCircle } from "lucide-react";

export interface OverrideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientQueueViewModel;
  totalPatients: number;
  onOverride: (input: OverridePlacementInput) => void;
}

export function OverrideDialog({
  isOpen,
  onClose,
  patient,
  totalPatients,
  onOverride,
}: OverrideDialogProps) {
  const [newPosition, setNewPosition] = useState<number>(patient.provisionalRank);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError("A documented reason is mandatory for clinical override audit.");
      return;
    }

    onOverride({
      patientId: patient.patientId,
      newPosition,
      reason: reason.trim(),
    });

    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Override Provisional Position — Case ${patient.displayId}`}
      description="Manual clinician prioritization. Provider retains final operational authority."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Clinician Authority Banner */}
        <div className="p-3 bg-[#EAF5F1] border border-[#BCE1D5] rounded-md text-xs text-[#1D5E4D] flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-[#147D6F] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>The provider retains final authority.</strong> The provisional
            organisation will be overridden and the rationale permanently recorded in
            the audit timeline.
          </p>
        </div>

        {/* Position Select */}
        <div>
          <label
            htmlFor="override-position"
            className="text-xs font-semibold text-[#132824] block mb-1"
          >
            New Provisional Queue Position
          </label>
          <div className="flex items-center gap-3">
            <select
              id="override-position"
              value={newPosition}
              onChange={(e) => setNewPosition(Number(e.target.value))}
              className="text-sm font-mono font-bold px-3 py-2 border border-[#DCE5E2] rounded-md bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147D6F]"
            >
              {Array.from({ length: totalPatients }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Position #{i + 1} {i + 1 === patient.provisionalRank ? "(Current)" : ""}
                </option>
              ))}
            </select>
            <span className="text-xs text-[#60706C]">
              Currently position #{patient.provisionalRank}
            </span>
          </div>
        </div>

        {/* Required Rationale */}
        <div>
          <label
            htmlFor="override-reason"
            className="text-xs font-semibold text-[#132824] block mb-1"
          >
            Clinical Rationale for Override <span className="text-[#C95C4A]">*</span>
          </label>
          <textarea
            id="override-reason"
            rows={3}
            required
            placeholder="e.g., Clinical concern regarding speech effort despite stable oxygenation; moving ahead of P-083 for urgent room assessment."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            className="w-full text-xs p-2.5 border border-[#DCE5E2] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147D6F] resize-none"
          />
          {error && (
            <p className="flex items-center gap-1 text-[11px] text-[#C95C4A] mt-1 font-medium">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE5E2]">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="action"
            size="md"
            disabled={!reason.trim()}
          >
            Confirm Override
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
