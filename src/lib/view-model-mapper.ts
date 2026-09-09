import { processWearableWindow } from "@/engine/wearable-processor";
import type { SecondLookEngineResult } from "@/engine/secondlook-engine";
import type { EvidenceItem, PatientCase, PlacementResult, TimelineEvent, Uncertainty } from "@/engine/types";
import type { WearableMode as DomainWearableMode, WearableReading } from "@/lib/wearable-simulator";
import type {
  EvidenceStatus,
  EvidenceViewModel,
  NextBestInformationViewModel,
  PatientQueueViewModel,
  QueueSummaryViewModel,
  SecondLookViewModel,
  TimelineEventViewModel,
  UncertaintyViewModel,
  WearableMode,
  WearableViewModel,
} from "@/types/ui";

export type MapperInput = {
  patients: PatientCase[];
  events: TimelineEvent[];
  selectedPatientId: string | null;
  viewMode: "traditional" | "secondlook";
  unstableOnly: boolean;
  simulatedNow: string;
  wearableModes: Record<string, DomainWearableMode>;
  engineResult: SecondLookEngineResult;
};

export const toUiPatientId = (id: string) => id.replace(/^patient-/, "pat-");
export const toDomainPatientId = (id: string) => id.replace(/^pat-/, "patient-");

function relativeTime(iso: string, nowIso: string): string {
  const minutes = Math.max(0, Math.floor((Date.parse(nowIso) - Date.parse(iso)) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h${minutes % 60 ? ` ${minutes % 60}m` : ""} ago`;
}

function displayTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
}

function signalPercent(item: EvidenceItem): number | undefined {
  if (!item.signalQuality) return undefined;
  return { high: 95, medium: 65, low: 30, unavailable: 0 }[item.signalQuality];
}

function evidenceStatus(item: EvidenceItem, uncertainties: Uncertainty[]): EvidenceStatus {
  if (item.metadata?.unavailable || item.signalQuality === "unavailable") return "unavailable";
  const related = uncertainties.filter((uncertainty) => uncertainty.evidenceId === item.id || uncertainty.field === item.type);
  if (related.some((uncertainty) => uncertainty.type === "conflicting")) return "conflicting";
  if (related.some((uncertainty) => uncertainty.type === "stale")) return "stale";
  if (!item.verified) return "unverified";
  return "verified";
}

function mapEvidence(item: EvidenceItem, uncertainties: Uncertainty[], nowIso: string): EvidenceViewModel {
  return {
    id: item.id,
    label: item.label,
    value: item.metadata?.unavailable
      ? "Unavailable"
      : item.value === null ? "No current value" : `${item.value}${item.unit ? ` ${item.unit}` : ""}`,
    source: item.source,
    status: evidenceStatus(item, uncertainties),
    recordedAt: displayTime(item.recordedAt),
    relativeTime: relativeTime(item.recordedAt, nowIso),
    signalQuality: signalPercent(item),
  };
}

function mapUncertainty(item: Uncertainty): UncertaintyViewModel {
  return {
    id: item.id,
    type: item.type,
    label: item.label,
    explanation: item.explanation,
    field: item.field,
    severity: item.severity,
    resolutionAction: item.resolutionAction,
  };
}

function mapWearable(patient: PatientCase, mode: DomainWearableMode | undefined, nowIso: string): WearableViewModel | undefined {
  const evidence = patient.evidence
    .filter((item) => item.source === "wearable")
    .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt));
  if (evidence.length === 0) return undefined;

  const qualityNumber = (item: EvidenceItem) => signalPercent(item) ?? 0;
  const readings: WearableReading[] = evidence.map((item) => ({
    id: item.id,
    patientId: patient.id,
    timestamp: item.recordedAt,
    heartRate: item.type === "heart-rate" && typeof item.value === "number" ? item.value : null,
    respiratoryRate: item.type === "respiratory-rate" && typeof item.value === "number" ? item.value : 18,
    oxygenSaturation: item.type === "oxygen-saturation" && typeof item.value === "number" ? item.value : 97,
    motionLevel: item.metadata?.motionDetected ? 90 : 5,
    signalQuality: qualityNumber(item),
    connected: item.metadata?.connected !== false,
  }));
  const window = processWearableWindow(readings);
  const latest = evidence.at(-1)!;
  const reliable = [...evidence].reverse().find((item) =>
    item.value !== null && item.metadata?.connected !== false && qualityNumber(item) >= 70,
  );
  const effectiveMode = (mode ?? (latest.metadata?.connected === false ? "disconnected" : "stable")) as WearableMode;
  const numericPoints = evidence
    .filter((item) => item.type === "heart-rate" && typeof item.value === "number")
    .map((item) => ({ timestamp: item.recordedAt, value: item.value as number }));
  const latestHeartRate = [...evidence].reverse().find((item) => item.type === "heart-rate" && typeof item.value === "number")?.value;

  return {
    connected: latest.metadata?.connected !== false,
    mode: effectiveMode,
    signalQuality: qualityNumber(latest),
    completenessPercent: window.validReadingPercent,
    motionDetected: evidence.some((item) => item.metadata?.motionDetected),
    lastReliableReadingAt: reliable?.recordedAt ?? "",
    lastReliableReadingLabel: reliable ? relativeTime(reliable.recordedAt, nowIso) : "No recent reliable reading",
    trend: effectiveMode === "sustained-change" ? "rising" : window.trend,
    evidenceUsage: window.evidenceUsage,
    heartRate: typeof latestHeartRate === "number" ? latestHeartRate : undefined,
    points: numericPoints,
  };
}

function mapPatient(patient: PatientCase, input: MapperInput): PatientQueueViewModel {
  const now = Date.parse(input.simulatedNow);
  const quality = input.engineResult.qualityResults.find((item) => item.patientId === patient.id);
  const placement = input.engineResult.placements.find((item) => item.patientId === patient.id);
  const recommendation = input.engineResult.recommendations.find((item) => item.patientId === patient.id);
  const uncertainties = quality?.uncertainties ?? [];
  const safePlacement: PlacementResult = placement ?? {
    patientId: patient.id,
    provisionalRank: 0,
    bestPossibleRank: 0,
    worstPossibleRank: 0,
    stabilityPercent: 100,
    confidence: "high" as const,
    reasons: [],
  };
  const nextBestInformation: NextBestInformationViewModel | undefined = recommendation ? {
    uncertaintyId: recommendation.uncertaintyId,
    title: recommendation.title,
    explanation: recommendation.explanation,
    currentRange: recommendation.currentRange,
    expectedRange: recommendation.expectedRange,
    estimatedSeconds: recommendation.estimatedSeconds,
    uncertaintyReductionPercent: recommendation.uncertaintyReductionPercent,
  } : undefined;

  return {
    patientId: toUiPatientId(patient.id),
    displayId: patient.displayId,
    age: patient.age,
    ageGroup: patient.ageGroup,
    complaint: patient.complaint,
    clinicianCategory: patient.clinicianCategory,
    waitingMinutes: Math.max(0, Math.floor((now - Date.parse(patient.arrivalTime)) / 60_000)),
    minutesSinceReview: Math.max(0, Math.floor((now - Date.parse(patient.lastReviewedAt)) / 60_000)),
    provisionalRank: patient.placementOverride?.newPosition ?? safePlacement.provisionalRank,
    bestPossibleRank: safePlacement.bestPossibleRank,
    worstPossibleRank: safePlacement.worstPossibleRank,
    stabilityPercent: safePlacement.stabilityPercent,
    confidence: safePlacement.confidence,
    reasons: safePlacement.reasons,
    modelFactors: safePlacement.modelFactors ?? [],
    learnedAdjustment: safePlacement.learnedAdjustment,
    modelUncertaintySpread: safePlacement.uncertaintySpread,
    hasUnacknowledgedUpdate: patient.evidence.some(
      (item) => !item.acknowledged && Date.parse(item.receivedAt) > Date.parse(patient.lastReviewedAt),
    ),
    hasManualConcern: patient.manualConcern,
    evidence: patient.evidence.map((item) => mapEvidence(item, uncertainties, input.simulatedNow)),
    uncertainties: uncertainties.map(mapUncertainty),
    wearable: mapWearable(patient, input.wearableModes[patient.id], input.simulatedNow),
    nextBestInformation,
  };
}

export function mapPatientQueueViewModels(input: MapperInput): PatientQueueViewModel[] {
  return input.patients
    .filter((patient) => patient.status !== "completed")
    .map((patient) => mapPatient(patient, input))
    .filter((patient) => !input.unstableOnly || patient.confidence === "low")
    .sort((a, b) => a.provisionalRank - b.provisionalRank || a.patientId.localeCompare(b.patientId));
}

export function mapQueueSummary(input: MapperInput): QueueSummaryViewModel {
  const waiting = input.patients.filter((patient) => patient.status === "waiting");
  const stabilities = waiting
    .map((patient) => input.engineResult.placements.find((placement) => placement.patientId === patient.id)?.stabilityPercent)
    .filter((value): value is number => value !== undefined);
  return {
    queueConfidence: stabilities.length === 0 ? 100 : Math.round(stabilities.reduce((sum, value) => sum + value, 0) / stabilities.length),
    unstableCount: input.engineResult.placements.filter((placement) => placement.confidence === "low").length,
    unresolvedUpdateCount: input.patients.reduce(
      (count, patient) => count + patient.evidence.filter((item) =>
        !item.acknowledged && Date.parse(item.receivedAt) > Date.parse(patient.lastReviewedAt),
      ).length,
      0,
    ),
    totalWaiting: waiting.length,
    simulatedTime: displayTime(input.simulatedNow),
    modelMode: input.engineResult.modelInfo?.mode ?? "local-ml",
    modelVersion: input.engineResult.modelInfo?.version ?? "unknown",
    modelValidationR2: input.engineResult.modelInfo?.adjustmentR2 ?? 0,
    modelTrainingData: input.engineResult.modelInfo?.trainingData ?? "unknown",
  };
}

function mapEvent(event: TimelineEvent, nowIso: string): TimelineEventViewModel {
  return {
    id: event.id,
    patientId: toUiPatientId(event.patientId),
    timestamp: displayTime(event.timestamp),
    relativeTime: relativeTime(event.timestamp, nowIso),
    type: event.type,
    actor: event.actor,
    title: event.title,
    description: event.description,
  };
}

export function mapSecondLookViewModel(input: MapperInput): SecondLookViewModel {
  const patients = mapPatientQueueViewModels(input);
  const selectedPatientId = input.selectedPatientId ? toUiPatientId(input.selectedPatientId) : null;
  return {
    patients,
    selectedPatientId,
    selectedPatient: patients.find((patient) => patient.patientId === selectedPatientId) ?? null,
    events: input.events
      .map((event, index) => ({ event, index }))
      .sort((a, b) => Date.parse(b.event.timestamp) - Date.parse(a.event.timestamp) || b.index - a.index)
      .map(({ event }) => mapEvent(event, input.simulatedNow)),
    summary: mapQueueSummary(input),
    viewMode: input.viewMode,
    unstableOnly: input.unstableOnly,
  };
}
