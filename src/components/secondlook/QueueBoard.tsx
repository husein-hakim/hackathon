"use client";

import { useEffect } from "react";
import { Filter, Radio } from "lucide-react";
import type { PatientQueueViewModel } from "@/types/ui";
import { PatientCard } from "./PatientCard";

export interface QueueBoardProps {
  patients: PatientQueueViewModel[];
  selectedPatientId: string | null;
  unstableOnly: boolean;
  onSelectPatient: (patientId: string) => void;
  onToggleUnstableOnly: (enabled: boolean) => void;
}

export function QueueBoard({ patients, selectedPatientId, unstableOnly, onSelectPatient, onToggleUnstableOnly }: QueueBoardProps) {
  const displayedPatients = unstableOnly ? patients.filter((patient) => patient.confidence === "low") : patients;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!displayedPatients.length || !["ArrowDown", "ArrowUp"].includes(event.key)) return;
      event.preventDefault();
      const current = Math.max(0, displayedPatients.findIndex((patient) => patient.patientId === selectedPatientId));
      const next = event.key === "ArrowDown" ? Math.min(displayedPatients.length - 1, current + 1) : Math.max(0, current - 1);
      onSelectPatient(displayedPatients[next].patientId);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [displayedPatients, onSelectPatient, selectedPatientId]);

  return (
    <section aria-label="Live patient queue" className="flex min-h-0 flex-1 flex-col border-r border-[#D8E1DE] bg-[#F3F6F5]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#D8E1DE] bg-white px-4 py-3">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-[#132824]"><Radio className="h-3.5 w-3.5 text-[#147D6F]" /> Live queue</div>
          <p className="mt-0.5 text-[11px] text-[#60706C]">Placement ranges update automatically as information changes.</p>
        </div>
        <button
          type="button"
          onClick={() => onToggleUnstableOnly(!unstableOnly)}
          aria-pressed={unstableOnly}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-[transform,background-color] duration-150 ease-out active:scale-[0.97] ${unstableOnly ? "border-[#E39B8D] bg-[#FFF1EE] text-[#9C3527]" : "border-[#D8E1DE] bg-white text-[#53645F] hover:bg-[#F4F7F6]"}`}
        >
          <Filter className="h-3.5 w-3.5" /> {unstableOnly ? "Showing needs-review" : "Needs-review only"}
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3 md:p-4">
        {displayedPatients.map((patient) => (
          <PatientCard key={patient.patientId} patient={patient} isSelected={patient.patientId === selectedPatientId} onSelect={onSelectPatient} />
        ))}
        {displayedPatients.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#BFD2CC] bg-white p-8 text-center text-sm text-[#60706C]">No low-confidence placements right now.</div>
        )}
      </div>
    </section>
  );
}
