import { explainPlacement } from "@/engine/explanation-engine";
import { calculateNextBestInformation } from "@/engine/information-value-engine";
import { assessInformationQuality } from "@/engine/quality-engine";
import { generateScenarios } from "@/engine/scenario-engine";
import { calculatePlacementResults } from "@/engine/stability-engine";
import { buildLearnedPlacementQueues, OPERATIONAL_MODEL_INFO, type OperationalModelInfo } from "@/ml/operational-placement-model";
import type { ClinicalPolicy } from "@/lib/clinical-policy";
import type {
  InformationRecommendation,
  PatientCase,
  PlacementResult,
  QualityResult,
  Scenario,
  ScenarioQueue,
} from "@/engine/types";

export type SecondLookEngineResult = {
  qualityResults: QualityResult[];
  scenarios: Scenario[];
  scenarioQueues: ScenarioQueue[];
  placements: PlacementResult[];
  recommendations: InformationRecommendation[];
  modelInfo: OperationalModelInfo;
};

export function runSecondLookEngine(input: {
  patients: PatientCase[];
  now: Date;
  policy: ClinicalPolicy;
}): SecondLookEngineResult {
  const qualityResults = input.patients.map((patient) => assessInformationQuality(patient, input.now, input.policy));
  const scenarios = generateScenarios(input.patients, qualityResults, input.now, input.policy);
  const learned = buildLearnedPlacementQueues({
    patients: input.patients,
    qualityResults,
    scenarios,
    now: input.now,
    policy: input.policy,
  });
  const scenarioQueues = learned.queues;
  const baseline = scenarioQueues.find((queue) => queue.scenarioId === "baseline") ?? scenarioQueues[0];
  const rawPlacements = calculatePlacementResults(baseline, scenarioQueues, qualityResults);
  const placements = rawPlacements.map((placement) => {
    const uncertainties = qualityResults.find((quality) => quality.patientId === placement.patientId)?.uncertainties ?? [];
    const prediction = learned.baselinePredictions.find((item) => item.patientId === placement.patientId);
    const modelStability = prediction ? Math.round(clampPercent(100 - prediction.uncertaintySpread * 7.5)) : 100;
    const combinedStability = Math.min(placement.stabilityPercent, modelStability);
    const confidence: PlacementResult["confidence"] = prediction && prediction.uncertaintySpread >= 5
      ? "low"
      : combinedStability >= 75 ? "high" : combinedStability >= 50 ? "medium" : "low";
    const placementWithModel = { ...placement, stabilityPercent: combinedStability, confidence };
    return {
      ...placementWithModel,
      reasons: explainPlacement(placementWithModel, uncertainties),
      learnedAdjustment: prediction?.learnedAdjustment,
      uncertaintySpread: prediction?.uncertaintySpread,
      modelFactors: prediction?.factors ?? [],
    };
  });
  const recommendations = placements
    .map((placement) => {
      const patient = input.patients.find((item) => item.id === placement.patientId);
      const uncertainties = qualityResults.find((quality) => quality.patientId === placement.patientId)?.uncertainties ?? [];
      return patient
        ? calculateNextBestInformation(patient, uncertainties, input.patients, placement, input.now, input.policy)
        : undefined;
    })
    .filter((recommendation): recommendation is InformationRecommendation => Boolean(recommendation));

  return { qualityResults, scenarios, scenarioQueues, placements, recommendations, modelInfo: OPERATIONAL_MODEL_INFO };
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}
