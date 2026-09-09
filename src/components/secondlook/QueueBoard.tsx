"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PatientQueueViewModel,
  ViewMode,
} from "@/types/ui";
import { PatientCard } from "./PatientCard";
import { ViewToggle } from "./ViewToggle";
import { Filter, CheckCircle2, Inbox } from "lucide-react";

export interface QueueBoardProps {
  patients: PatientQueueViewModel[];
  selectedPatientId: string | null;
  viewMode: ViewMode;
  unstableOnly: boolean;
  onSelectPatient: (patientId: string) => void;
  onViewChange: (view: ViewMode) => void;
  onToggleUnstableOnly: (enabled: boolean) => void;
}

export function QueueBoard({
  patients,
  selectedPatientId,
  viewMode,
  unstableOnly,
  onSelectPatient,
  onViewChange,
  onToggleUnstableOnly,
}: QueueBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);

  // Filter patients if unstableOnly is toggled
  const displayedPatients = unstableOnly
    ? patients.filter(
        (p) => p.confidence === "low" || p.confidence === "medium"
      )
    : patients;

  // Keyboard navigation through list (ArrowUp / ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!displayedPatients.length) return;
      const currentIndex = displayedPatients.findIndex(
        (p) => p.patientId === selectedPatientId
      );

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = Math.min(
          displayedPatients.length - 1,
          currentIndex + 1
        );
        onSelectPatient(displayedPatients[nextIndex].patientId);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = Math.max(0, currentIndex - 1);
        onSelectPatient(displayedPatients[prevIndex].patientId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [displayedPatients, selectedPatientId, onSelectPatient]);

  return (
    <section
      ref={boardRef}
      aria-label="Provisional Patient Queue"
      className="flex-1 flex flex-col min-w-0 bg-[#F4F7F6] border-r border-[#DCE5E2] overflow-hidden"
    >
      {/* Queue Toolbar: View Toggles & Filters */}
      <div className="shrink-0 p-4 border-b border-[#DCE5E2] bg-white flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#60706C]">
            Provisional Queue
          </h2>
          <p className="text-[11px] text-[#60706C]">
            Showing {displayedPatients.length} of {patients.length} waiting cases
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Toggle */}
          <ViewToggle
            currentView={viewMode}
            onViewChange={onViewChange}
          />

          {/* Unstable Only Filter Button */}
          <button
            type="button"
            onClick={() => onToggleUnstableOnly(!unstableOnly)}
            aria-pressed={unstableOnly}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors select-none ${
              unstableOnly
                ? "bg-[#FCEEEC] text-[#932C1E] border-[#F5C2BA] font-semibold"
                : "bg-white text-[#60706C] border-[#DCE5E2] hover:bg-[#F4F7F6] hover:text-[#132824]"
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Unstable only</span>
          </button>
        </div>
      </div>

      {/* Queue List Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        <AnimatePresence initial={false} mode="popLayout">
          {displayedPatients.length > 0 ? (
            displayedPatients.map((patient) => (
              <PatientCard
                key={patient.patientId}
                patient={patient}
                isSelected={patient.patientId === selectedPatientId}
                viewMode={viewMode}
                onSelect={onSelectPatient}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="py-16 px-6 text-center bg-white rounded-lg border border-dashed border-[#DCE5E2] flex flex-col items-center justify-center gap-2 text-sm text-[#60706C]"
            >
              {unstableOnly ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-[#EAF5F1] text-[#2E8B72] flex items-center justify-center mb-1">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-[#132824]">
                    All Placements Currently Stable
                  </span>
                  <p className="text-xs text-[#60706C] max-w-sm">
                    No active cases exhibit substantial placement uncertainty across
                    tested scenarios.
                  </p>
                  <button
                    onClick={() => onToggleUnstableOnly(false)}
                    className="mt-2 text-xs font-medium text-[#147D6F] underline underline-offset-2"
                  >
                    View all {patients.length} waiting cases
                  </button>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-[#EAF0EE] text-[#60706C] flex items-center justify-center mb-1">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-[#132824]">
                    No Patients Currently Waiting
                  </span>
                  <p className="text-xs text-[#60706C]">
                    New cases will appear here after staff-confirmed intake.
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
