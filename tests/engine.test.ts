import { describe, expect, it } from "vitest";
import { createDemoPatients, DEMO_START_TIME } from "@/data/demo-patients";
import { calculateNextBestInformation } from "@/engine/information-value-engine";
import { buildScenarioQueue, calculateAttentionValue } from "@/engine/organisation-engine";
import { assessInformationQuality } from "@/engine/quality-engine";
import { generateScenarios } from "@/engine/scenario-engine";
import { runSecondLookEngine } from "@/engine/secondlook-engine";
import { calculatePlacementResults } from "@/engine/stability-engine";
import type { PatientCase, Scenario, ScenarioQueue, Uncertainty } from "@/engine/types";
import { DEMO_POLICY } from "@/lib/clinical-policy";
import { extractOperationalFeatures, OPERATIONAL_MODEL_INFO, predictOperationalPlacement } from "@/ml/operational-placement-model";

const now = new Date(DEMO_START_TIME);
const baseline: Scenario = {
  id: "baseline",
  label: "Baseline",
  description: "Test baseline",
  minutesAdvanced: 0,
  evidenceOverrides: {},
  assumedEffects: {},
};

describe("information quality", () => {
  it("detects required uncertainty states without interpreting clinical meaning", () => {
    const patients = createDemoPatients();
    const p219 = assessInformationQuality(patients.find((p) => p.id === "patient-219")!, now, DEMO_POLICY);
    const p083 = assessInformationQuality(patients.find((p) => p.id === "patient-083")!, now, DEMO_POLICY);
    const p176 = assessInformationQuality(patients.find((p) => p.id === "patient-176")!, now, DEMO_POLICY);
    const p301 = assessInformationQuality(patients.find((p) => p.id === "patient-301")!, now, DEMO_POLICY);
    expect(p219.uncertainties.map((u) => u.type)).toEqual(expect.arrayContaining(["stale", "unacknowledged"]));
    expect(p083.uncertainties.map((u) => u.type)).toContain("conflicting");
    expect(p176.uncertainties.map((u) => u.type)).toContain("motion-artifact");
    expect(p301.uncertainties.map((u) => u.type)).toContain("sensor-dropout");
  });

  it("detects missing and unverified draft information, while recent evidence is not stale", () => {
    const patient = createDemoPatients()[0];
    patient.expectedEvidenceTypes = [...(patient.expectedEvidenceTypes ?? []), "temperature"];
    patient.evidence.push({
      id: "draft", patientId: patient.id, type: "clinical-note", label: "Draft", value: "Unconfirmed text",
      source: "ai-draft", recordedAt: now.toISOString(), receivedAt: now.toISOString(), verified: false,
      acknowledged: false, policyStatus: "unknown",
    });
    const result = assessInformationQuality(patient, now, DEMO_POLICY);
    expect(result.uncertainties.map((u) => u.type)).toEqual(expect.arrayContaining(["missing", "unverified"]));
    expect(result.uncertainties.filter((u) => u.type === "stale")).toHaveLength(0);
  });

  it("detects unresolved duplicate staff observations without explicit conflict metadata", () => {
    const patient = createDemoPatients()[0];
    patient.evidence.push({
      ...patient.evidence.find((item) => item.type === "heart-rate")!,
      id: "duplicate-staff-observation",
      value: 91,
      recordedAt: now.toISOString(),
    });
    expect(assessInformationQuality(patient, now, DEMO_POLICY).uncertainties.some((u) => u.type === "conflicting")).toBe(true);
  });

  it("returns unavailable sensor reliability when no wearable exists", () => {
    expect(assessInformationQuality(createDemoPatients()[0], now, DEMO_POLICY).sensorReliabilityPercent).toBeNull();
  });
});

describe("operational organisation", () => {
  it("keeps category baseline dominant and applies manual concern only while active", () => {
    const patients = createDemoPatients();
    const categoryThree = patients.find((p) => p.id === "patient-219")!;
    const categoryFour = { ...categoryThree, id: "lower", clinicianCategory: 4 as const, manualConcern: true };
    expect(calculateAttentionValue(categoryThree, baseline, now, DEMO_POLICY))
      .toBeGreaterThan(calculateAttentionValue(categoryFour, baseline, now, DEMO_POLICY));
    const withConcern = calculateAttentionValue({ ...categoryThree, manualConcern: true }, baseline, now, DEMO_POLICY);
    const withoutConcern = calculateAttentionValue({ ...categoryThree, manualConcern: false }, baseline, now, DEMO_POLICY);
    expect(withConcern - withoutConcern).toBe(DEMO_POLICY.manualConcernContribution);
  });

  it("caps waiting and overdue contributions", () => {
    const patient = createDemoPatients()[0];
    const farFuture = new Date(now.getTime() + 10_000 * 60_000);
    const score = calculateAttentionValue(patient, baseline, farFuture, DEMO_POLICY);
    const maximum = DEMO_POLICY.categoryWeights[4] + DEMO_POLICY.waitingContributionMaximum + DEMO_POLICY.overdueContributionMaximum;
    expect(score).toBe(maximum);
  });

  it("uses deterministic arrival then patient-id tie breaking", () => {
    const seed = createDemoPatients()[0];
    const sameTime = now.toISOString();
    const patients: PatientCase[] = [
      { ...seed, id: "patient-b", arrivalTime: sameTime, lastReviewedAt: sameTime, evidence: [] },
      { ...seed, id: "patient-a", arrivalTime: sameTime, lastReviewedAt: sameTime, evidence: [] },
    ];
    expect(buildScenarioQueue(patients, baseline, now, DEMO_POLICY).patients.map((p) => p.patientId))
      .toEqual(["patient-a", "patient-b"]);
  });
});

describe("local operational machine learning", () => {
  it("loads a trained random forest artifact with held-out validation metadata", () => {
    expect(OPERATIONAL_MODEL_INFO.mode).toBe("local-ml");
    expect(OPERATIONAL_MODEL_INFO.modelType).toContain("random-forest");
    expect(OPERATIONAL_MODEL_INFO.validationRows).toBeGreaterThan(0);
    expect(OPERATIONAL_MODEL_INFO.adjustmentR2).toBeGreaterThan(0.8);
    expect(OPERATIONAL_MODEL_INFO.excludedFeatures).toEqual(expect.arrayContaining(["age", "complaint text"]));
  });

  it("changes learned placement from operational data and narrows uncertainty when stale data is refreshed", () => {
    const patients = createDemoPatients();
    const patient = patients.find((item) => item.id === "patient-219")!;
    const quality = assessInformationQuality(patient, now, DEMO_POLICY);
    const prediction = predictOperationalPlacement(patient, quality, baseline, now, DEMO_POLICY);
    const later = predictOperationalPlacement(patient, quality, baseline, new Date(now.getTime() + 20 * 60_000), DEMO_POLICY);
    expect(later.learnedAdjustment).not.toBe(prediction.learnedAdjustment);

    const freshPatient = structuredClone(patient);
    const stale = freshPatient.evidence.find((item) => item.type === "heart-rate")!;
    stale.recordedAt = now.toISOString();
    stale.receivedAt = now.toISOString();
    stale.verified = true;
    stale.acknowledged = true;
    const freshQuality = assessInformationQuality(freshPatient, now, DEMO_POLICY);
    const freshPrediction = predictOperationalPlacement(freshPatient, freshQuality, baseline, now, DEMO_POLICY);
    expect(freshPrediction.uncertaintySpread).toBeLessThan(prediction.uncertaintySpread);
  });

  it("does not feed age or complaint text into the forest", () => {
    const patient = createDemoPatients()[0];
    const quality = assessInformationQuality(patient, now, DEMO_POLICY);
    const original = extractOperationalFeatures(patient, quality, baseline, now, DEMO_POLICY);
    const changed = extractOperationalFeatures({ ...patient, age: 99, complaint: "entirely different text" }, quality, baseline, now, DEMO_POLICY);
    expect(changed).toEqual(original);
  });
});

describe("scenarios and placement stability", () => {
  it("always includes fixed scenarios, is deterministic, and stays within twelve", () => {
    const patients = createDemoPatients();
    const quality = patients.map((patient) => assessInformationQuality(patient, now, DEMO_POLICY));
    const first = generateScenarios(patients, quality, now, DEMO_POLICY);
    const second = generateScenarios(patients, quality, now, DEMO_POLICY);
    expect(first.map((scenario) => scenario.id)).toEqual(second.map((scenario) => scenario.id));
    expect(first.map((scenario) => scenario.id)).toEqual(expect.arrayContaining(["baseline", "future-5", "future-10"]));
    expect(first.length).toBeLessThanOrEqual(12);
    expect(first.some((scenario) => scenario.resolvesUncertaintyId)).toBe(true);
  });

  it("computes exact best/worst ranks and handles a single case", () => {
    const q1: ScenarioQueue = { scenarioId: "a", patients: [{ patientId: "a", attentionValue: 2 }, { patientId: "b", attentionValue: 1 }] };
    const q2: ScenarioQueue = { scenarioId: "b", patients: [{ patientId: "b", attentionValue: 2 }, { patientId: "a", attentionValue: 1 }] };
    const placements = calculatePlacementResults(q1, [q1, q2]);
    expect(placements[0]).toMatchObject({ bestPossibleRank: 1, worstPossibleRank: 2, stabilityPercent: 0 });
    const single: ScenarioQueue = { scenarioId: "one", patients: [{ patientId: "a", attentionValue: 1 }] };
    expect(calculatePlacementResults(single, [single])[0].stabilityPercent).toBe(100);
  });
});

describe("next best information", () => {
  it("selects P-219's stale observation and assigns positive value", () => {
    const patients = createDemoPatients();
    const result = runSecondLookEngine({ patients, now, policy: DEMO_POLICY });
    const quality = result.qualityResults.find((q) => q.patientId === "patient-219")!;
    const placement = result.placements.find((p) => p.patientId === "patient-219")!;
    const recommendation = calculateNextBestInformation(
      patients.find((p) => p.id === "patient-219")!, quality.uncertainties, patients, placement, now, DEMO_POLICY,
    );
    expect(recommendation?.title.toLowerCase()).toContain("refresh");
    expect(recommendation?.uncertaintyId).toContain("stale");
    expect(recommendation!.valueScore).toBeGreaterThan(0);
    expect(recommendation!.uncertaintyReductionPercent).toBeGreaterThan(0);
    expect(recommendation!.expectedRange[1] - recommendation!.expectedRange[0])
      .toBeLessThanOrEqual(recommendation!.currentRange[1] - recommendation!.currentRange[0]);
  });

  it("does not divide by zero for zero-effort clarifications", () => {
    const patients = createDemoPatients();
    const result = runSecondLookEngine({ patients, now, policy: DEMO_POLICY });
    const patient = patients.find((p) => p.id === "patient-219")!;
    const placement = result.placements.find((p) => p.patientId === patient.id)!;
    const stale = result.qualityResults.find((q) => q.patientId === patient.id)!.uncertainties.find((u) => u.type === "stale")!;
    const zeroEffort: Uncertainty = { ...stale, estimatedResolutionSeconds: 0 };
    const recommendation = calculateNextBestInformation(patient, [zeroEffort], patients, placement, now, DEMO_POLICY);
    expect(Number.isFinite(recommendation!.valueScore)).toBe(true);
  });
});
