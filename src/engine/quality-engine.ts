import type { ClinicalPolicy } from "@/lib/clinical-policy";
import type {
  EvidenceItem,
  EvidenceType,
  PatientCase,
  QualityResult,
  Uncertainty,
  UncertaintyType,
} from "@/engine/types";

const DEFAULT_EXPECTED: EvidenceType[] = ["chief-complaint", "clinical-note"];
const percent = (numerator: number, denominator: number) =>
  denominator === 0 ? 100 : Math.round((numerator / denominator) * 100);
const slug = (value: string) => value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();

function correctedIds(evidence: EvidenceItem[]): Set<string> {
  return new Set(
    evidence
      .map((item) => item.metadata?.correctedEvidenceId)
      .filter((id): id is string => Boolean(id)),
  );
}

function activeEvidence(patient: PatientCase): EvidenceItem[] {
  const corrected = correctedIds(patient.evidence);
  return patient.evidence.filter((item) => !corrected.has(item.id));
}

function latestByType(evidence: EvidenceItem[]): Map<EvidenceType, EvidenceItem> {
  const latest = new Map<EvidenceType, EvidenceItem>();
  for (const item of evidence) {
    const current = latest.get(item.type);
    if (!current || Date.parse(item.recordedAt) > Date.parse(current.recordedAt)) latest.set(item.type, item);
  }
  return latest;
}

function effectFor(type: UncertaintyType, patientId: string): number {
  if (type === "stale") return patientId === "patient-219" ? 40 : 16;
  if (type === "conflicting") return 10;
  if (type === "sensor-dropout") return 16;
  if (type === "motion-artifact") return 1;
  if (type === "missing") return 10;
  if (type === "unacknowledged") return 8;
  return 6;
}

function makeUncertainty(input: {
  patient: PatientCase;
  type: UncertaintyType;
  field: string;
  label: string;
  explanation: string;
  severity: Uncertainty["severity"];
  action: string;
  seconds: number;
  evidenceId?: string;
}): Uncertainty {
  const magnitude = effectFor(input.type, input.patient.id);
  const possibleStates = input.type === "stale" && input.patient.id === "patient-219"
    ? [
        { id: "excluded", label: "Stale observation excluded", organisationalEffect: -magnitude },
        { id: "retained", label: "Configured provisional effect retained", organisationalEffect: 10 },
      ]
    : input.type === "conflicting"
    ? [
        { id: "record-a", label: "First unresolved record retained", organisationalEffect: -magnitude },
        { id: "record-b", label: "Second unresolved record retained", organisationalEffect: magnitude },
      ]
    : input.type === "missing"
      ? [
          { id: "no-effect", label: "No additional operational effect", organisationalEffect: 0 },
          { id: "configured-effect", label: "Configured operational effect applies", organisationalEffect: magnitude },
        ]
      : [
          { id: "excluded-or-resolved", label: "Uncertain information excluded or resolved", organisationalEffect: -magnitude },
          { id: "current-view", label: "Current operational view retained", organisationalEffect: 0 },
        ];
  return {
    id: `${input.patient.id}-${input.type}-${slug(input.field)}`,
    patientId: input.patient.id,
    type: input.type,
    field: input.field,
    label: input.label,
    explanation: input.explanation,
    severity: input.severity,
    possibleStates,
    resolutionAction: input.action,
    estimatedResolutionSeconds: input.seconds,
    evidenceId: input.evidenceId,
  };
}

export function assessInformationQuality(
  patient: PatientCase,
  now: Date,
  policy: ClinicalPolicy,
): QualityResult {
  const evidence = activeEvidence(patient);
  const latest = latestByType(evidence);
  const expected = patient.expectedEvidenceTypes ?? DEFAULT_EXPECTED;
  const uncertainties: Uncertainty[] = [];

  for (const type of expected) {
    const item = latest.get(type);
    if (!item || (item.value === null && !item.metadata?.unavailable)) {
      uncertainties.push(makeUncertainty({
        patient,
        type: "missing",
        field: type,
        label: "Expected observation unavailable",
        explanation: "This staff-configured information item has not been recorded.",
        severity: "medium",
        action: `Record or mark ${type.replaceAll("-", " ")} unavailable`,
        seconds: 45,
      }));
    }
  }

  const timeSensitive = [...latest.values()].filter((item) => policy.freshnessMinutes[item.type] !== undefined);
  let freshCount = 0;
  for (const item of timeSensitive) {
    const ageMinutes = Math.max(0, (now.getTime() - Date.parse(item.recordedAt)) / 60_000);
    const freshnessLimit = policy.freshnessMinutes[item.type] ?? Infinity;
    if (ageMinutes <= freshnessLimit) {
      freshCount += 1;
    } else {
      const observationLabel = item.type === "heart-rate" || item.type === "respiratory-rate" || item.type === "oxygen-saturation"
        ? "latest observation"
        : item.label.toLowerCase();
      uncertainties.push(makeUncertainty({
        patient,
        type: "stale",
        field: item.type,
        label: "Information is outside the demonstration freshness window",
        explanation: `The ${observationLabel} was recorded ${Math.round(ageMinutes)} minutes ago.`,
        severity: ageMinutes > freshnessLimit * 1.5 ? "high" : "medium",
        action: item.type === "heart-rate" ? "Refresh the latest observation" : `Refresh ${item.label.toLowerCase()}`,
        seconds: item.type === "heart-rate" ? 30 : 60,
        evidenceId: item.id,
      }));
    }
  }

  const comparableGroups = [...new Set(evidence.map((item) => item.type))];
  let conflictingGroups = 0;
  for (const type of comparableGroups) {
    const group = evidence.filter((item) => item.type === type && !item.metadata?.unavailable);
    const explicitlyConflicts = group.some((item) => (item.metadata?.conflictsWith?.length ?? 0) > 0);
    const distinctValues = new Set(group.map((item) => `${item.value}|${item.recordedAt}`));
    const duplicateStaffObservation = ["heart-rate", "respiratory-rate", "oxygen-saturation", "blood-pressure", "temperature"].includes(type)
      && group.filter((item) => item.source !== "wearable").length > 1
      && distinctValues.size > 1;
    if (explicitlyConflicts || duplicateStaffObservation) {
      conflictingGroups += 1;
      uncertainties.push(makeUncertainty({
        patient,
        type: "conflicting",
        field: type,
        label: "Unresolved records disagree",
        explanation: "Two unresolved records disagree. Neither has been marked as corrected.",
        severity: "high",
        action: `Confirm which ${type.replaceAll("-", " ")} record to retain`,
        seconds: 75,
        evidenceId: group[0]?.id,
      }));
    }
  }

  for (const item of evidence) {
    if (item.source === "ai-draft" && !item.verified) {
      uncertainties.push(makeUncertainty({
        patient,
        type: "unverified",
        field: item.id,
        label: "Draft information is unverified",
        explanation: "This information has not yet been confirmed by a staff member.",
        severity: "medium",
        action: `Confirm or discard ${item.label.toLowerCase()}`,
        seconds: 30,
        evidenceId: item.id,
      }));
    }
    if (!item.acknowledged && Date.parse(item.receivedAt) > Date.parse(patient.lastReviewedAt)) {
      uncertainties.push(makeUncertainty({
        patient,
        type: "unacknowledged",
        field: item.id,
        label: "New information awaits acknowledgement",
        explanation: "New information has arrived since the last recorded review.",
        severity: "medium",
        action: `Review and acknowledge ${item.label.toLowerCase()}`,
        seconds: 20,
        evidenceId: item.id,
      }));
    }
  }

  const wearable = evidence.filter((item) => item.source === "wearable");
  const reliableWearable = wearable.filter(
    (item) => item.value !== null && item.metadata?.connected !== false && item.signalQuality !== "low" && item.signalQuality !== "unavailable",
  );
  const latestWearable = [...wearable].sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))[0];
  const lastReliable = [...reliableWearable].sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))[0];
  const reliableAgeSeconds = lastReliable ? (now.getTime() - Date.parse(lastReliable.recordedAt)) / 1000 : Infinity;
  if (wearable.length > 0 && !latestWearable?.metadata?.unavailable
    && (latestWearable?.metadata?.connected === false || reliableAgeSeconds > policy.wearableDropoutSeconds)) {
    uncertainties.push(makeUncertainty({
      patient,
      type: "sensor-dropout",
      field: "wearable",
      label: "Recent reliable device data is unavailable",
      explanation: "The connected device has not supplied a reliable recent reading.",
      severity: "high",
      action: "Reconnect the wearable or confirm device data is unavailable",
      seconds: 60,
      evidenceId: latestWearable?.id,
    }));
  }

  const numericWearable = wearable.filter((item) => typeof item.value === "number");
  const motionItem = numericWearable.find((item) => item.metadata?.motionDetected && item.signalQuality === "low");
  const sameTypePrior = motionItem
    ? numericWearable.find((item) => item.id !== motionItem.id && item.type === motionItem.type && !item.metadata?.motionDetected)
    : undefined;
  const suddenChange = motionItem && sameTypePrior
    ? Math.abs(Number(motionItem.value) - Number(sameTypePrior.value)) / Math.max(Math.abs(Number(sameTypePrior.value)), 1) >= 0.1
    : false;
  if (motionItem && suddenChange) {
    uncertainties.push(makeUncertainty({
      patient,
      type: "motion-artifact",
      field: motionItem.id,
      label: "Movement overlaps the signal change",
      explanation: "Movement occurred during the signal change, reducing confidence in the reading.",
      severity: "medium",
      action: "Capture a low-motion wearable window",
      seconds: 45,
      evidenceId: motionItem.id,
    }));
  }

  const availableExpected = expected.filter((type) => {
    const item = latest.get(type);
    return Boolean(item && (item.value !== null || item.metadata?.unavailable));
  }).length;
  const verificationRelevant = evidence.filter((item) => item.source === "ai-draft" || item.source === "wearable");
  const validWearable = wearable.filter(
    (item) => item.value !== null && item.metadata?.connected !== false && item.signalQuality !== "unavailable",
  );

  return {
    patientId: patient.id,
    uncertainties: uncertainties.sort((a, b) => a.id.localeCompare(b.id)),
    completenessPercent: percent(availableExpected, expected.length),
    freshnessPercent: percent(freshCount, timeSensitive.length),
    verificationPercent: percent(verificationRelevant.filter((item) => item.verified).length, verificationRelevant.length),
    sourceAgreementPercent: percent(comparableGroups.length - conflictingGroups, comparableGroups.length),
    sensorReliabilityPercent: wearable.length === 0 ? null : percent(validWearable.length, wearable.length),
  };
}
