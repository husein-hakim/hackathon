import { assessInformationQuality } from "@/engine/quality-engine";
import { buildScenarioQueue } from "@/engine/organisation-engine";
import { generateScenarios } from "@/engine/scenario-engine";
import { calculatePlacementResults } from "@/engine/stability-engine";
import type { ClinicalPolicy } from "@/lib/clinical-policy";
import type {
  EvidenceItem,
  InformationRecommendation,
  PatientCase,
  PlacementResult,
  Uncertainty,
} from "@/engine/types";

function resolveForEvaluation(patient: PatientCase, uncertainty: Uncertainty, now: Date): PatientCase {
  const copy = structuredClone(patient);
  const target = copy.evidence.find((item) => item.id === uncertainty.evidenceId);

  if (uncertainty.type === "missing") {
    copy.evidence.push({
      id: `evaluation-${uncertainty.id}`,
      patientId: copy.id,
      type: uncertainty.field as EvidenceItem["type"],
      label: "Clarified information",
      value: "Available for operational review",
      source: "provider",
      recordedAt: now.toISOString(),
      receivedAt: now.toISOString(),
      verified: true,
      acknowledged: true,
      policyStatus: "within-policy",
    });
  } else if (uncertainty.type === "stale" && target) {
    copy.evidence.push({
      ...target,
      id: `evaluation-${target.id}`,
      recordedAt: now.toISOString(),
      receivedAt: now.toISOString(),
      source: "provider",
      verified: true,
      acknowledged: true,
      signalQuality: target.source === "wearable" ? "high" : target.signalQuality,
      metadata: { ...target.metadata, motionDetected: false, connected: true, correctedEvidenceId: target.id },
    });
  } else if (uncertainty.type === "conflicting") {
    const group = copy.evidence.filter((item) => item.type === uncertainty.field);
    const retained = group.at(-1);
    if (retained) {
      retained.metadata = {
        ...retained.metadata,
        conflictsWith: undefined,
        correctedEvidenceId: group.find((item) => item.id !== retained.id)?.id,
      };
    }
  } else if (uncertainty.type === "sensor-dropout") {
    const priorValue = [...copy.evidence].reverse().find((item) => item.source === "wearable" && item.value !== null)?.value ?? 0;
    copy.evidence.push({
      id: `evaluation-${uncertainty.id}`,
      patientId: copy.id,
      type: "heart-rate",
      label: "Reliable wearable reading",
      value: priorValue,
      unit: "bpm",
      source: "wearable",
      recordedAt: now.toISOString(),
      receivedAt: now.toISOString(),
      verified: true,
      acknowledged: true,
      policyStatus: "unknown",
      signalQuality: "high",
      metadata: { connected: true, motionDetected: false },
    });
  } else if (target) {
    target.acknowledged = true;
    target.verified = true;
    if (uncertainty.type === "motion-artifact") {
      target.signalQuality = "high";
      target.metadata = { ...target.metadata, motionDetected: false };
    }
  }
  return copy;
}

function placementAfterResolution(
  patient: PatientCase,
  uncertainty: Uncertainty,
  allPatients: PatientCase[],
  now: Date,
  policy: ClinicalPolicy,
): PlacementResult | undefined {
  const resolved = resolveForEvaluation(patient, uncertainty, now);
  const patients = allPatients.map((item) => item.id === patient.id ? resolved : item);
  const qualities = patients.map((item) => assessInformationQuality(item, now, policy));
  const scenarios = generateScenarios(patients, qualities, now, policy);
  const queues = scenarios.map((scenario) => buildScenarioQueue(patients, scenario, now, policy));
  return calculatePlacementResults(queues[0], queues, qualities).find((item) => item.patientId === patient.id);
}

export function calculateNextBestInformation(
  patient: PatientCase,
  uncertainties: Uncertainty[],
  allPatients: PatientCase[],
  currentPlacement: PlacementResult,
  now: Date,
  policy: ClinicalPolicy,
): InformationRecommendation | undefined {
  const currentSpan = currentPlacement.worstPossibleRank - currentPlacement.bestPossibleRank;
  const recommendations = uncertainties.map((uncertainty) => {
    const expected = placementAfterResolution(patient, uncertainty, allPatients, now, policy);
    const expectedRange: [number, number] = expected
      ? [expected.bestPossibleRank, expected.worstPossibleRank]
      : [currentPlacement.bestPossibleRank, currentPlacement.worstPossibleRank];
    const expectedSpan = expectedRange[1] - expectedRange[0];
    const reduction = Math.max(0, currentSpan - expectedSpan);
    const reductionFraction = reduction / Math.max(currentSpan, 1);
    return {
      patientId: patient.id,
      uncertaintyId: uncertainty.id,
      title: uncertainty.resolutionAction,
      explanation: reduction > 0
        ? "This item is currently a major source of uncertainty in the provisional placement."
        : "This clarification preserves an auditable operational record even if the current range is unchanged.",
      currentRange: [currentPlacement.bestPossibleRank, currentPlacement.worstPossibleRank] as [number, number],
      expectedRange,
      estimatedSeconds: uncertainty.estimatedResolutionSeconds,
      uncertaintyReductionPercent: Math.round(reductionFraction * 100),
      valueScore: Number(((reductionFraction * 100) / Math.max(uncertainty.estimatedResolutionSeconds, 1)).toFixed(2)),
    } satisfies InformationRecommendation;
  });

  return recommendations.sort((a, b) =>
    b.valueScore - a.valueScore
    || b.uncertaintyReductionPercent - a.uncertaintyReductionPercent
    || a.estimatedSeconds - b.estimatedSeconds
    || a.uncertaintyId.localeCompare(b.uncertaintyId),
  )[0];
}
