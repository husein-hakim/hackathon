import type { ClinicalPolicy } from "@/lib/clinical-policy";
import type { PatientCase, QualityResult, Scenario, Uncertainty } from "@/engine/types";

const baseScenario = (id: string, label: string, description: string, minutesAdvanced = 0): Scenario => ({
  id,
  label,
  description,
  minutesAdvanced,
  evidenceOverrides: {},
  assumedEffects: {},
});

function impact(uncertainty: Uncertainty): number {
  return Math.max(...uncertainty.possibleStates.map((state) => Math.abs(state.organisationalEffect)), 0);
}

export function generateScenarios(
  _patients: PatientCase[],
  qualityResults: QualityResult[],
  now: Date,
  policy: ClinicalPolicy,
): Scenario[] {
  void now;
  void policy;
  const uncertainties = qualityResults
    .flatMap((quality) => quality.uncertainties)
    .sort((a, b) => impact(b) - impact(a) || a.patientId.localeCompare(b.patientId) || a.id.localeCompare(b.id));

  const staleEffects: Record<string, number> = {};
  for (const uncertainty of uncertainties.filter((item) => item.type === "stale")) {
    const excluded = Math.min(...uncertainty.possibleStates.map((state) => state.organisationalEffect));
    staleEffects[uncertainty.patientId] = (staleEffects[uncertainty.patientId] ?? 0) + excluded;
  }

  const scenarios: Scenario[] = [
    baseScenario("baseline", "Current operational view", "Uses the currently recorded information and staff-assigned category."),
    {
      ...baseScenario("stale-excluded", "Stale information excluded", "Tests placement when information outside the demonstration freshness window is excluded."),
      assumedEffects: staleEffects,
    },
    baseScenario("future-5", "Five minutes later", "Advances operational waiting and review clocks by five minutes.", 5),
    baseScenario("future-10", "Ten minutes later", "Advances operational waiting and review clocks by ten minutes.", 10),
  ];

  for (const uncertainty of uncertainties) {
    for (const state of [...uncertainty.possibleStates].sort((a, b) => a.organisationalEffect - b.organisationalEffect || a.id.localeCompare(b.id))) {
      if (scenarios.length >= 12) return scenarios;
      scenarios.push({
        id: `uncertainty-${uncertainty.id}-${state.id}`,
        label: `${uncertainty.label}: ${state.label}`,
        description: `Operational scenario for unresolved ${uncertainty.type} information; it does not assert clinical truth.`,
        minutesAdvanced: 0,
        evidenceOverrides: {},
        assumedEffects: { [uncertainty.patientId]: state.organisationalEffect },
        resolvesUncertaintyId: uncertainty.id,
      });
    }
  }

  return scenarios;
}
