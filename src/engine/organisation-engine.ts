import type { ClinicalPolicy } from "@/lib/clinical-policy";
import type { EvidenceItem, PatientCase, Scenario, ScenarioQueue } from "@/engine/types";

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

function scenarioEvidence(patient: PatientCase, scenario: Scenario): EvidenceItem[] {
  return patient.evidence.map((item) => ({ ...item, ...(scenario.evidenceOverrides[item.id] ?? {}) }));
}

export function calculateAttentionValue(
  patient: PatientCase,
  scenario: Scenario,
  now: Date,
  policy: ClinicalPolicy,
): number {
  const scenarioNow = new Date(now.getTime() + scenario.minutesAdvanced * 60_000);
  const evidence = scenarioEvidence(patient, scenario);
  const interval = policy.reassessmentMinutes[patient.clinicianCategory];
  const waitingMinutes = Math.max(0, (scenarioNow.getTime() - Date.parse(patient.arrivalTime)) / 60_000);
  const minutesSinceReview = Math.max(0, (scenarioNow.getTime() - Date.parse(patient.lastReviewedAt)) / 60_000);
  const waitingContribution = clamp(
    (waitingMinutes / interval) * policy.waitingContributionMaximum,
    0,
    policy.waitingContributionMaximum,
  );
  const overdueRatio = minutesSinceReview / interval;
  const overdueContribution = overdueRatio > 1
    ? clamp((overdueRatio - 1) * policy.overdueContributionMaximum, 0, policy.overdueContributionMaximum)
    : 0;
  const hasNewUpdate = evidence.some(
    (item) => !item.acknowledged && Date.parse(item.receivedAt) > Date.parse(patient.lastReviewedAt),
  );
  const confirmedFlags = evidence.filter(
    (item) => item.policyStatus === "flagged-by-policy" && item.verified && item.acknowledged,
  ).length;

  return Number((
    policy.categoryWeights[patient.clinicianCategory]
    + waitingContribution
    + overdueContribution
    + (hasNewUpdate ? policy.unacknowledgedUpdateContribution : 0)
    + (patient.manualConcern ? policy.manualConcernContribution : 0)
    + confirmedFlags * policy.confirmedPolicyFlagContribution
    + (scenario.assumedEffects[patient.id] ?? 0)
  ).toFixed(4));
}

export function buildScenarioQueue(
  patients: PatientCase[],
  scenario: Scenario,
  now: Date,
  policy: ClinicalPolicy,
): ScenarioQueue {
  return {
    scenarioId: scenario.id,
    patients: patients
      .filter((patient) => patient.status !== "completed")
      .map((patient) => ({
        patientId: patient.id,
        attentionValue: calculateAttentionValue(patient, scenario, now, policy),
        arrivalTime: patient.arrivalTime,
      }))
      .sort((a, b) =>
        b.attentionValue - a.attentionValue
        || Date.parse(a.arrivalTime) - Date.parse(b.arrivalTime)
        || a.patientId.localeCompare(b.patientId),
      )
      .map(({ patientId, attentionValue }) => ({ patientId, attentionValue })),
  };
}
