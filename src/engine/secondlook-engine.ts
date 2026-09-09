import { explainPlacement } from "@/engine/explanation-engine";
import { calculateNextBestInformation } from "@/engine/information-value-engine";
import { buildScenarioQueue } from "@/engine/organisation-engine";
import { assessInformationQuality } from "@/engine/quality-engine";
import { generateScenarios } from "@/engine/scenario-engine";
import { calculatePlacementResults } from "@/engine/stability-engine";
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
};

export function runSecondLookEngine(input: {
  patients: PatientCase[];
  now: Date;
  policy: ClinicalPolicy;
}): SecondLookEngineResult {
  const qualityResults = input.patients.map((patient) => assessInformationQuality(patient, input.now, input.policy));
  const scenarios = generateScenarios(input.patients, qualityResults, input.now, input.policy);
  const scenarioQueues = scenarios.map((scenario) => buildScenarioQueue(input.patients, scenario, input.now, input.policy));
  const baseline = scenarioQueues.find((queue) => queue.scenarioId === "baseline") ?? scenarioQueues[0];
  const rawPlacements = calculatePlacementResults(baseline, scenarioQueues, qualityResults);
  const placements = rawPlacements.map((placement) => {
    const uncertainties = qualityResults.find((quality) => quality.patientId === placement.patientId)?.uncertainties ?? [];
    return { ...placement, reasons: explainPlacement(placement, uncertainties) };
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

  return { qualityResults, scenarios, scenarioQueues, placements, recommendations };
}
