import React from "react";
import { PatientQueueViewModel } from "@/types/ui";
import { Info } from "lucide-react";

export interface UncertaintyProfileProps {
  patient: PatientQueueViewModel;
}

type MetricLevel = "High" | "Medium" | "Low";

interface QualityDimension {
  label: string;
  level: MetricLevel;
  detail: string;
}

export function UncertaintyProfile({ patient }: UncertaintyProfileProps) {
  // Derive operational quality dimensions deterministically
  const getCompleteness = (): QualityDimension => {
    const evCount = patient.evidence.length;
    if (evCount >= 3)
      return {
        label: "Information Completeness",
        level: "High",
        detail: "Standard core observations captured",
      };
    if (evCount === 2)
      return {
        label: "Information Completeness",
        level: "Medium",
        detail: "Partial observations captured",
      };
    return {
      label: "Information Completeness",
      level: "Low",
      detail: "Sparse observational baseline",
    };
  };

  const getFreshness = (): QualityDimension => {
    const hasStale = patient.evidence.some((e) => e.status === "stale");
    if (hasStale || patient.minutesSinceReview > 30) {
      return {
        label: "Information Freshness",
        level: "Low",
        detail: `Observations recorded >30m ago`,
      };
    }
    if (patient.minutesSinceReview > 15) {
      return {
        label: "Information Freshness",
        level: "Medium",
        detail: `Recorded ${patient.minutesSinceReview}m ago`,
      };
    }
    return {
      label: "Information Freshness",
      level: "High",
      detail: "Recent observations (<15m)",
    };
  };

  const getAgreement = (): QualityDimension => {
    const hasConflict = patient.evidence.some((e) => e.status === "conflicting");
    if (hasConflict) {
      return {
        label: "Source Agreement",
        level: "Low",
        detail: "Contradictory timestamps or notes present",
      };
    }
    return {
      label: "Source Agreement",
      level: "High",
      detail: "All observational sources concordant",
    };
  };

  const getVerification = (): QualityDimension => {
    const unverified = patient.evidence.some(
      (e) => e.status === "unverified" || e.status === "stale"
    );
    if (unverified) {
      return {
        label: "Verification Status",
        level: "Medium",
        detail: "Some entries awaiting clinician confirmation",
      };
    }
    return {
      label: "Verification Status",
      level: "High",
      detail: "All evidence verified by attending staff",
    };
  };

  const getSensorReliability = (): QualityDimension => {
    if (!patient.wearable) {
      return {
        label: "Sensor Reliability",
        level: "High",
        detail: "Manual clinical observations only",
      };
    }
    if (!patient.wearable.connected) {
      return {
        label: "Sensor Reliability",
        level: "Low",
        detail: "Telemetry disconnected",
      };
    }
    if (patient.wearable.mode === "motion-artifact") {
      return {
        label: "Sensor Reliability",
        level: "Medium",
        detail: "Motion artefact degraded signal to 42%",
      };
    }
    return {
      label: "Sensor Reliability",
      level: "High",
      detail: `Telemetry stream active (${patient.wearable.signalQuality}%)`,
    };
  };

  const dimensions: QualityDimension[] = [
    getCompleteness(),
    getFreshness(),
    getAgreement(),
    getVerification(),
    getSensorReliability(),
  ];

  const getBadgeStyle = (lvl: MetricLevel) => {
    switch (lvl) {
      case "High":
        return "bg-[#EAF5F1] text-[#1D5E4D] border-[#BCE1D5]";
      case "Medium":
        return "bg-[#FDF6E9] text-[#87590C] border-[#F4DCB0]";
      case "Low":
        return "bg-[#FCEEEC] text-[#932C1E] border-[#F5C2BA]";
    }
  };

  return (
    <div className="rounded-md border border-[#DCE5E2] bg-white overflow-hidden">
      <div className="px-4 py-2.5 bg-[#F4F7F6]/60 border-b border-[#DCE5E2] flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#60706C]">
          Information Quality Profile
        </h4>
        <div
          className="flex items-center gap-1 text-[10px] text-[#60706C]"
          title="Operational data metrics, not medical diagnostic risk"
        >
          <Info className="w-3 h-3 text-[#A8B6B2]" />
          <span>Operational quality</span>
        </div>
      </div>

      <div className="divide-y divide-[#F4F7F6] text-xs">
        {dimensions.map((dim, idx) => (
          <div
            key={idx}
            className="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-[#FAFBFB]"
          >
            <div>
              <div className="font-medium text-[#132824]">{dim.label}</div>
              <div className="text-[11px] text-[#60706C] mt-0.5">
                {dim.detail}
              </div>
            </div>

            <span
              className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-xs border ${getBadgeStyle(
                dim.level
              )}`}
            >
              {dim.level}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
