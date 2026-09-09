import { ConfidenceLevel, WearableMode, EvidenceStatus, EvidenceSource } from "@/types/ui";

export function formatPlacementRange(best: number, worst: number): string {
  if (best === worst) {
    return `#${best}`;
  }
  return `#${best}–#${worst}`;
}

export function formatMinutes(mins: number): string {
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function getCategoryInfo(category: 1 | 2 | 3 | 4 | 5) {
  switch (category) {
    case 1:
      return {
        label: "Cat 1",
        name: "Immediate",
        bg: "bg-red-50 text-red-700 border-red-200",
        badgeColor: "#DC2626",
      };
    case 2:
      return {
        label: "Cat 2",
        name: "Emergent",
        bg: "bg-amber-50 text-amber-800 border-amber-200",
        badgeColor: "#D97706",
      };
    case 3:
      return {
        label: "Cat 3",
        name: "Urgent",
        bg: "bg-yellow-50 text-yellow-800 border-yellow-200",
        badgeColor: "#CA8A04",
      };
    case 4:
      return {
        label: "Cat 4",
        name: "Less Urgent",
        bg: "bg-teal-50 text-teal-800 border-teal-200",
        badgeColor: "#0D9488",
      };
    case 5:
      return {
        label: "Cat 5",
        name: "Non-urgent",
        bg: "bg-slate-50 text-slate-700 border-slate-200",
        badgeColor: "#64748B",
      };
  }
}

export function getConfidenceInfo(level: ConfidenceLevel) {
  switch (level) {
    case "high":
      return {
        label: "High",
        title: "High Placement Confidence",
        description: "Placement is stable across tested operational scenarios.",
        dotClass: "bg-[#2E8B72]",
        bgClass: "bg-[#EAF5F1] text-[#1D5E4D] border-[#BCE1D5]",
        borderClass: "border-[#2E8B72]",
        textClass: "text-[#1D5E4D]",
        hex: "#2E8B72",
      };
    case "medium":
      return {
        label: "Medium",
        title: "Medium Placement Confidence",
        description: "Placement fluctuates moderately across scenarios.",
        dotClass: "bg-[#C78B25]",
        bgClass: "bg-[#FDF6E9] text-[#87590C] border-[#F4DCB0]",
        borderClass: "border-[#C78B25]",
        textClass: "text-[#87590C]",
        hex: "#C78B25",
      };
    case "low":
      return {
        label: "Low",
        title: "Low Placement Confidence",
        description: "Placement is sensitive to missing, stale, or conflicting facts.",
        dotClass: "bg-[#C95C4A]",
        bgClass: "bg-[#FCEEEC] text-[#932C1E] border-[#F5C2BA]",
        borderClass: "border-[#C95C4A]",
        textClass: "text-[#932C1E]",
        hex: "#C95C4A",
      };
  }
}

export function getWearableModeInfo(mode: WearableMode) {
  switch (mode) {
    case "stable":
      return {
        label: "Stable",
        badgeClass: "bg-[#EAF5F1] text-[#1D5E4D] border-[#BCE1D5]",
        description: "Signal quality is high. Trend is consistent.",
        evidenceUsage: "full" as const,
      };
    case "sustained-change":
      return {
        label: "Sustained Change",
        badgeClass: "bg-[#EFF5F9] text-[#1E547D] border-[#BFD9EC]",
        description: "Consistent multi-reading change recorded. Awaiting staff review.",
        evidenceUsage: "full" as const,
      };
    case "motion-artifact":
      return {
        label: "Motion Artefact",
        badgeClass: "bg-[#FDF6E9] text-[#87590C] border-[#F4DCB0]",
        description: "Movement interference detected. Evidence used with reduced confidence.",
        evidenceUsage: "reduced" as const,
      };
    case "intermittent-dropout":
      return {
        label: "Intermittent Dropout",
        badgeClass: "bg-[#FDF6E9] text-[#87590C] border-[#F4DCB0]",
        description: "Occasional packet loss. Signal quality reduced.",
        evidenceUsage: "reduced" as const,
      };
    case "disconnected":
      return {
        label: "Disconnected",
        badgeClass: "bg-[#FCEEEC] text-[#932C1E] border-[#F5C2BA]",
        description: "No reliable readings received for several minutes. Evidence is excluded.",
        evidenceUsage: "excluded" as const,
      };
  }
}

export function getEvidenceSourceLabel(source: EvidenceSource): string {
  switch (source) {
    case "triage-nurse":
      return "Triage Nurse";
    case "provider":
      return "Attending Provider";
    case "patient":
      return "Patient Reported";
    case "wearable":
      return "Continuous Monitor";
    case "ai-draft":
      return "Staff-Assisted Draft";
  }
}

export function getEvidenceStatusInfo(status: EvidenceStatus) {
  switch (status) {
    case "verified":
      return {
        label: "Verified",
        className: "bg-[#EAF5F1] text-[#1D5E4D] border-[#BCE1D5]",
      };
    case "unverified":
      return {
        label: "Unverified",
        className: "bg-[#FDF6E9] text-[#87590C] border-[#F4DCB0]",
      };
    case "stale":
      return {
        label: "Stale",
        className: "bg-[#FCEEEC] text-[#932C1E] border-[#F5C2BA]",
      };
    case "conflicting":
      return {
        label: "Conflicting",
        className: "bg-[#FDF6E9] text-[#87590C] border-[#F4DCB0]",
      };
    case "unavailable":
      return {
        label: "Unavailable",
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
  }
}
