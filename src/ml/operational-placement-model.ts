import { RandomForestRegression } from "ml-random-forest";
import artifact from "@/ml/models/operational-placement-model.json";
import type { ClinicalPolicy } from "@/lib/clinical-policy";
import type { PatientCase, QualityResult, Scenario, ScenarioQueue } from "@/engine/types";

export type OperationalModelInfo = {
  mode: "local-ml";
  version: string;
  modelType: string;
  trainingData: string;
  validationRows: number;
  adjustmentMae: number;
  adjustmentR2: number;
  spreadMae: number;
  spreadR2: number;
  excludedFeatures: string[];
};

export type OperationalPrediction = {
  patientId: string;
  attentionValue: number;
  lowerAttentionValue: number;
  upperAttentionValue: number;
  learnedAdjustment: number;
  uncertaintySpread: number;
  factors: string[];
};

type ModelJson = Parameters<typeof RandomForestRegression.load>[0];

const adjustmentModel = RandomForestRegression.load(artifact.adjustmentModel as unknown as ModelJson);
const spreadModel = RandomForestRegression.load(artifact.spreadModel as unknown as ModelJson);
const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

const neutralFeatures = [0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const factorLabels = [
  "time already waiting",
  "time since the last review",
  "information completeness",
  "information freshness",
  "verification coverage",
  "agreement between sources",
  "device signal reliability",
  "connected device availability",
  "a new unacknowledged update",
  "the recorded staff concern",
  "confirmed policy flags",
  "missing information",
  "stale information",
  "conflicting records",
  "unverified information",
  "device-data problems",
  "the active uncertainty scenario",
];

export const OPERATIONAL_MODEL_INFO: OperationalModelInfo = {
  mode: "local-ml",
  version: artifact.modelVersion,
  modelType: artifact.modelType,
  trainingData: artifact.trainingData,
  validationRows: artifact.validation.rows,
  adjustmentMae: artifact.validation.adjustment.mae,
  adjustmentR2: artifact.validation.adjustment.r2,
  spreadMae: artifact.validation.spread.mae,
  spreadR2: artifact.validation.spread.r2,
  excludedFeatures: artifact.excludedFeatures,
};

function countQuality(quality: QualityResult, types: string[]): number {
  return quality.uncertainties.filter((uncertainty) => types.includes(uncertainty.type)).length;
}

export function extractOperationalFeatures(
  patient: PatientCase,
  quality: QualityResult,
  scenario: Scenario,
  now: Date,
  policy: ClinicalPolicy,
): number[] {
  const scenarioNow = new Date(now.getTime() + scenario.minutesAdvanced * 60_000);
  const interval = policy.reassessmentMinutes[patient.clinicianCategory];
  const waitingMinutes = Math.max(0, (scenarioNow.getTime() - Date.parse(patient.arrivalTime)) / 60_000);
  const reviewMinutes = Math.max(0, (scenarioNow.getTime() - Date.parse(patient.lastReviewedAt)) / 60_000);
  const hasSensor = patient.evidence.some((item) => item.source === "wearable");
  const hasUpdate = patient.evidence.some(
    (item) => !item.acknowledged && Date.parse(item.receivedAt) > Date.parse(patient.lastReviewedAt),
  );
  const confirmedFlags = patient.evidence.filter(
    (item) => item.policyStatus === "flagged-by-policy" && item.verified && item.acknowledged,
  ).length;
  return [
    clamp(waitingMinutes / interval, 0, 3),
    clamp(reviewMinutes / interval, 0, 3),
    quality.completenessPercent / 100,
    quality.freshnessPercent / 100,
    quality.verificationPercent / 100,
    quality.sourceAgreementPercent / 100,
    (quality.sensorReliabilityPercent ?? 50) / 100,
    hasSensor ? 1 : 0,
    hasUpdate ? 1 : 0,
    patient.manualConcern ? 1 : 0,
    clamp(confirmedFlags, 0, 2),
    clamp(countQuality(quality, ["missing"]), 0, 2),
    clamp(countQuality(quality, ["stale"]), 0, 2),
    clamp(countQuality(quality, ["conflicting"]), 0, 1),
    clamp(countQuality(quality, ["unverified"]), 0, 1),
    clamp(countQuality(quality, ["sensor-dropout", "motion-artifact"]), 0, 3),
    clamp((scenario.assumedEffects[patient.id] ?? 0) / 12, -1, 1),
  ];
}

function explainPrediction(features: number[], prediction: number): string[] {
  return features
    .map((_, index) => {
      const counterfactual = [...features];
      counterfactual[index] = neutralFeatures[index];
      const withoutFeature = adjustmentModel.predict([counterfactual])[0];
      return { index, effect: prediction - withoutFeature };
    })
    .filter(({ effect }) => Math.abs(effect) >= 0.35)
    .sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect) || a.index - b.index)
    .slice(0, 3)
    .map(({ index, effect }) => `${factorLabels[index]} ${effect >= 0 ? "raised" : "lowered"} the learned operational score`);
}

export function predictOperationalPlacement(
  patient: PatientCase,
  quality: QualityResult,
  scenario: Scenario,
  now: Date,
  policy: ClinicalPolicy,
): OperationalPrediction {
  const features = extractOperationalFeatures(patient, quality, scenario, now, policy);
  // The learned component cannot erase the 20-point spacing between adjacent
  // staff categories in the demo policy; it only reorders operational peers.
  const learnedAdjustment = clamp(adjustmentModel.predict([features])[0], 0, 18);
  const uncertaintySpread = clamp(spreadModel.predict([features])[0], 0.5, 14);
  const attentionValue = policy.categoryWeights[patient.clinicianCategory] + learnedAdjustment;
  return {
    patientId: patient.id,
    attentionValue: Number(attentionValue.toFixed(4)),
    lowerAttentionValue: Number((attentionValue - uncertaintySpread).toFixed(4)),
    upperAttentionValue: Number((attentionValue + uncertaintySpread).toFixed(4)),
    learnedAdjustment: Number(learnedAdjustment.toFixed(3)),
    uncertaintySpread: Number(uncertaintySpread.toFixed(3)),
    factors: explainPrediction(features, learnedAdjustment),
  };
}

function queueFromScores(scenarioId: string, patients: PatientCase[], scores: Map<string, number>): ScenarioQueue {
  return {
    scenarioId,
    patients: patients
      .filter((patient) => patient.status !== "completed")
      .map((patient) => ({ patientId: patient.id, attentionValue: scores.get(patient.id) ?? 0, arrivalTime: patient.arrivalTime }))
      .sort((a, b) => b.attentionValue - a.attentionValue
        || Date.parse(a.arrivalTime) - Date.parse(b.arrivalTime)
        || a.patientId.localeCompare(b.patientId))
      .map(({ patientId, attentionValue }) => ({ patientId, attentionValue })),
  };
}

export function buildLearnedPlacementQueues(input: {
  patients: PatientCase[];
  qualityResults: QualityResult[];
  scenarios: Scenario[];
  now: Date;
  policy: ClinicalPolicy;
}): { queues: ScenarioQueue[]; baselinePredictions: OperationalPrediction[] } {
  const qualityByPatient = new Map(input.qualityResults.map((quality) => [quality.patientId, quality]));
  const predictionsFor = (scenario: Scenario) => input.patients
    .filter((patient) => patient.status !== "completed")
    .map((patient) => predictOperationalPlacement(patient, qualityByPatient.get(patient.id)!, scenario, input.now, input.policy));
  const baselineScenario = input.scenarios.find((scenario) => scenario.id === "baseline") ?? input.scenarios[0];
  const baselinePredictions = predictionsFor(baselineScenario);
  const queues = input.scenarios.map((scenario) => {
    const predictions = scenario.id === baselineScenario.id ? baselinePredictions : predictionsFor(scenario);
    return queueFromScores(scenario.id, input.patients, new Map(predictions.map((prediction) => [prediction.patientId, prediction.attentionValue])));
  });

  for (const target of baselinePredictions) {
    const best = new Map(baselinePredictions.map((prediction) => [
      prediction.patientId,
      prediction.patientId === target.patientId ? prediction.upperAttentionValue : prediction.lowerAttentionValue,
    ]));
    const worst = new Map(baselinePredictions.map((prediction) => [
      prediction.patientId,
      prediction.patientId === target.patientId ? prediction.lowerAttentionValue : prediction.upperAttentionValue,
    ]));
    queues.push(queueFromScores(`ml-best-${target.patientId}`, input.patients, best));
    queues.push(queueFromScores(`ml-worst-${target.patientId}`, input.patients, worst));
  }
  return { queues, baselinePredictions };
}
