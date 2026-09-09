import React from "react";
import { PatientQueueViewModel } from "@/types/ui";
import { History } from "lucide-react";
import { formatMinutes } from "@/lib/formatters";

export interface WhatChangedProps {
  patient: PatientQueueViewModel;
}

export function WhatChanged({ patient }: WhatChangedProps) {
  // Deterministic bullets based on patient facts
  const changes: string[] = [];

  if (patient.hasUnacknowledgedUpdate) {
    changes.push("Latest clinical note/observation is awaiting staff acknowledgement");
  }

  if (patient.wearable) {
    if (!patient.wearable.connected) {
      changes.push("Continuous telemetry connection was interrupted");
    } else if (patient.wearable.mode === "motion-artifact") {
      changes.push("Accelerometer detected patient movement simultaneously with pulse variation");
    } else if (patient.wearable.mode === "sustained-change") {
      changes.push("Multi-reading elevation recorded on continuous monitor");
    }
  }

  if (patient.minutesSinceReview > 20) {
    changes.push(
      `Observation age increased (${formatMinutes(patient.minutesSinceReview)} since last clinician review)`
    );
  }

  const unverified = patient.evidence.filter(
    (e) => e.status === "unverified" || e.status === "stale"
  );
  if (unverified.length > 0) {
    changes.push(
      `${unverified.length} observational entry is marked ${unverified[0].status}`
    );
  }

  if (changes.length === 0) {
    changes.push("No significant observational changes since last formal review");
  }

  return (
    <div className="rounded-md border border-[#DCE5E2] bg-white p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <History className="w-3.5 h-3.5 text-[#147D6F]" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#60706C]">
          What Changed Since Last Review
        </h4>
      </div>

      <ul className="space-y-1.5 text-xs text-[#132824]">
        {changes.map((change, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-[#147D6F] font-bold mt-0.5">•</span>
            <span className="leading-snug text-[#60706C]">{change}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
