import type { PlacementResult, QualityResult, ScenarioQueue } from "@/engine/types";

export function confidenceFromStability(stability: number): "high" | "medium" | "low" {
  if (stability >= 80) return "high";
  if (stability >= 50) return "medium";
  return "low";
}

export function calculatePlacementResults(
  provisionalQueue: ScenarioQueue,
  scenarioQueues: ScenarioQueue[],
  qualityResults: QualityResult[] = [],
): PlacementResult[] {
  const totalPatients = provisionalQueue.patients.length;
  const qualityByPatient = new Map(qualityResults.map((result) => [result.patientId, result]));

  return provisionalQueue.patients.map((patient, provisionalIndex) => {
    const positions = scenarioQueues
      .map((queue) => queue.patients.findIndex((item) => item.patientId === patient.patientId) + 1)
      .filter((position) => position > 0);
    const usablePositions = positions.length > 0 ? positions : [provisionalIndex + 1];
    const bestPossibleRank = Math.min(...usablePositions);
    const worstPossibleRank = Math.max(...usablePositions);
    const span = worstPossibleRank - bestPossibleRank;
    const stabilityPercent = Math.round(100 * (1 - span / Math.max(totalPatients - 1, 1)));
    const reasons = qualityByPatient.get(patient.patientId)?.uncertainties
      .map((uncertainty) => uncertainty.explanation)
      .filter((reason, index, all) => all.indexOf(reason) === index)
      .slice(0, 4) ?? [];

    return {
      patientId: patient.patientId,
      provisionalRank: provisionalIndex + 1,
      bestPossibleRank,
      worstPossibleRank,
      stabilityPercent,
      confidence: confidenceFromStability(stabilityPercent),
      reasons,
    };
  });
}
