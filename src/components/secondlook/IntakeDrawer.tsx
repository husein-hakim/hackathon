"use client";

import React, { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { AddPatientInput } from "@/types/ui";
import { UserPlus, Activity } from "lucide-react";

export interface IntakeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: (input: AddPatientInput) => void;
  simulatedTime: string;
}

export function IntakeDrawer({
  isOpen,
  onClose,
  onAddPatient,
  simulatedTime,
}: IntakeDrawerProps) {
  const [displayId, setDisplayId] = useState("P-501");
  const [age, setAge] = useState(40);
  const [complaint, setComplaint] = useState("");
  const [clinicianCategory, setClinicianCategory] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [manualConcern, setManualConcern] = useState(false);
  const [note, setNote] = useState("");
  const [connectWearable, setConnectWearable] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint.trim()) return;

    onAddPatient({
      displayId: displayId.trim() || `P-${Math.floor(500 + Math.random() * 400)}`,
      age,
      complaint: complaint.trim(),
      clinicianCategory,
      arrivalTime: simulatedTime,
      manualConcern,
      note: note.trim() || undefined,
      connectWearable,
    });

    // Reset and close
    setComplaint("");
    setNote("");
    setDisplayId("P-502");
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Register & Triage Patient"
      subtitle="Fictional intake entry. Staff-assigned category is an input; SecondLook evaluates placement stability."
      width="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Anonymous ID & Age */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="intake-id"
              className="text-xs font-semibold text-[#132824] block mb-1"
            >
              Anonymous ID
            </label>
            <input
              id="intake-id"
              type="text"
              value={displayId}
              onChange={(e) => setDisplayId(e.target.value)}
              className="w-full text-xs font-mono font-bold px-3 py-2 border border-[#DCE5E2] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147D6F]"
            />
          </div>

          <div>
            <label
              htmlFor="intake-age"
              className="text-xs font-semibold text-[#132824] block mb-1"
            >
              Age
            </label>
            <input
              id="intake-age"
              type="number"
              min={0}
              max={120}
              required
              value={age}
              onChange={(e) => setAge(Math.max(0, Math.min(120, Number(e.target.value))))}
              className="w-full text-xs px-3 py-2 border border-[#DCE5E2] rounded-md bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147D6F]"
            />
          </div>
        </div>

        {/* Chief Complaint */}
        <div>
          <label
            htmlFor="intake-complaint"
            className="text-xs font-semibold text-[#132824] block mb-1"
          >
            Presenting Complaint <span className="text-[#C95C4A]">*</span>
          </label>
          <input
            id="intake-complaint"
            type="text"
            required
            placeholder="e.g. Sharp chest tightness, localized right quadrant pain..."
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-[#DCE5E2] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147D6F]"
          />
        </div>

        {/* Staff Assigned Triage Category */}
        <div>
          <label className="text-xs font-semibold text-[#132824] block mb-1">
            Staff-Assigned Triage Acuity (MTS / ESI)
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {([1, 2, 3, 4, 5] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setClinicianCategory(cat)}
                className={`py-2 rounded-md border text-center text-xs font-mono font-bold transition-all ${
                  clinicianCategory === cat
                    ? "bg-[#123D37] text-white border-[#123D37] shadow-xs"
                    : "bg-white border-[#DCE5E2] text-[#60706C] hover:bg-[#F4F7F6]"
                }`}
              >
                Cat {cat}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-[#60706C] mt-1 block">
            SecondLook does NOT assign or replace staff triage categories.
          </span>
        </div>

        {/* Manual Provider Concern Toggle */}
        <div className="flex items-start gap-2 p-3 bg-[#FAFBFB] rounded-md border border-[#DCE5E2]">
          <input
            id="intake-manual-concern"
            type="checkbox"
            checked={manualConcern}
            onChange={(e) => setManualConcern(e.target.checked)}
            className="mt-0.5 rounded-xs border-[#DCE5E2] text-[#147D6F] focus:ring-[#147D6F]"
          />
          <label
            htmlFor="intake-manual-concern"
            className="text-xs text-[#132824] cursor-pointer"
          >
            <span className="font-semibold block">
              Flag Manual Clinical Concern
            </span>
            <span className="text-[11px] text-[#60706C]">
              Triage nurse or triage team noted intuition or subtle deterioration risk.
            </span>
          </label>
        </div>

        {/* Connect Wearable Monitor */}
        <div className="flex items-start gap-2 p-3 bg-[#FAFBFB] rounded-md border border-[#DCE5E2]">
          <input
            id="intake-wearable"
            type="checkbox"
            checked={connectWearable}
            onChange={(e) => setConnectWearable(e.target.checked)}
            className="mt-0.5 rounded-xs border-[#DCE5E2] text-[#147D6F] focus:ring-[#147D6F]"
          />
          <label
            htmlFor="intake-wearable"
            className="text-xs text-[#132824] cursor-pointer"
          >
            <span className="font-semibold block flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#147D6F]" />
              <span>Attach Continuous Monitor Telemetry</span>
            </span>
            <span className="text-[11px] text-[#60706C]">
              Simulate continuous pulse and photoplethysmography sensor stream.
            </span>
          </label>
        </div>

        {/* Triage Note */}
        <div>
          <label
            htmlFor="intake-note"
            className="text-xs font-semibold text-[#132824] block mb-1"
          >
            Triage Initial Observation
          </label>
          <textarea
            id="intake-note"
            rows={2}
            placeholder="Baseline vitals or notes recorded at reception..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full text-xs p-2.5 border border-[#DCE5E2] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147D6F] resize-none"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-[#DCE5E2] flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={<UserPlus className="w-3.5 h-3.5" />}
            disabled={!complaint.trim()}
          >
            Add to Queue
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
