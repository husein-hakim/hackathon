import type { ClinicianCategory, EvidenceType } from "@/engine/types";

export type ClinicalPolicy = {
  categoryWeights: Record<ClinicianCategory, number>;
  reassessmentMinutes: Record<ClinicianCategory, number>;
  freshnessMinutes: Partial<Record<EvidenceType, number>>;
  waitingContributionMaximum: number;
  overdueContributionMaximum: number;
  unacknowledgedUpdateContribution: number;
  manualConcernContribution: number;
  confirmedPolicyFlagContribution: number;
  wearableDropoutSeconds: number;
  motionQualityPenalty: number;
};

/** Fictional demonstration policy. These values are not clinically validated. */
export const DEMO_POLICY: ClinicalPolicy = {
  categoryWeights: { 1: 100, 2: 80, 3: 60, 4: 40, 5: 20 },
  reassessmentMinutes: { 1: 5, 2: 10, 3: 20, 4: 35, 5: 50 },
  freshnessMinutes: {
    "heart-rate": 15,
    "respiratory-rate": 15,
    "oxygen-saturation": 15,
    "blood-pressure": 20,
    temperature: 30,
    "clinical-note": 30,
  },
  waitingContributionMaximum: 15,
  overdueContributionMaximum: 20,
  unacknowledgedUpdateContribution: 8,
  manualConcernContribution: 12,
  confirmedPolicyFlagContribution: 10,
  wearableDropoutSeconds: 120,
  motionQualityPenalty: 35,
};

export const DEMO_POLICY_NOTICE = "Demonstration rules are fictional and hospital-configurable.";
