import { beforeEach, describe, expect, it } from "vitest";
import { processWearableWindow } from "@/engine/wearable-processor";
import { generateWearableReadings } from "@/lib/wearable-simulator";
import { useSecondLookStore } from "@/store/useSecondLookStore";

describe("wearable processing", () => {
  const now = new Date("2026-09-09T12:00:00.000Z");

  it("treats stable windows as full-use and sustained changes as unlabelled trends", () => {
    expect(processWearableWindow(generateWearableReadings("p", "stable", now))).toMatchObject({
      evidenceUsage: "full", trend: "stable", connected: true,
    });
    expect(processWearableWindow(generateWearableReadings("p", "sustained-change", now))).toMatchObject({
      evidenceUsage: "full", trend: "rising",
    });
  });

  it("reduces motion-overlapped evidence and excludes disconnection", () => {
    const motion = processWearableWindow(generateWearableReadings("p", "motion-artifact", now));
    expect(motion.motionOverlap).toBe(true);
    expect(motion.evidenceUsage).toBe("reduced");
    expect(motion.trend).toBe("uncertain");
    expect(processWearableWindow(generateWearableReadings("p", "disconnected", now)).evidenceUsage).toBe("excluded");
  });
});

describe("SecondLook store", () => {
  beforeEach(() => useSecondLookStore.getState().resetDemo());

  it("resolves P-219's stale item, adds evidence and reduces learned uncertainty", () => {
    const before = useSecondLookStore.getState();
    const placementBefore = before.engineResult.placements.find((p) => p.patientId === "patient-219")!;
    expect(placementBefore.confidence).toBe("low");
    expect(placementBefore.uncertaintySpread).toBeGreaterThan(5);
    const stale = before.engineResult.qualityResults.find((q) => q.patientId === "patient-219")!.uncertainties.find((u) => u.type === "stale")!;
    const evidenceCount = before.patients.find((p) => p.id === "patient-219")!.evidence.length;
    before.resolveUncertainty({ patientId: "patient-219", uncertaintyId: stale.id, value: 95 });
    const after = useSecondLookStore.getState();
    const placementAfter = after.engineResult.placements.find((p) => p.patientId === "patient-219")!;
    expect(after.patients.find((p) => p.id === "patient-219")!.evidence).toHaveLength(evidenceCount + 1);
    expect(placementAfter.uncertaintySpread!).toBeLessThan(placementBefore.uncertaintySpread!);
    expect(placementAfter.stabilityPercent).toBeGreaterThan(placementBefore.stabilityPercent);
    expect(placementAfter.confidence).not.toBe("low");
    expect(after.events.at(-1)?.type).toBe("uncertainty-resolved");
  });

  it("acknowledges updates and recomputes uncertainty", () => {
    useSecondLookStore.getState().acknowledgeUpdate("patient-412");
    const state = useSecondLookStore.getState();
    expect(state.engineResult.qualityResults.find((q) => q.patientId === "patient-412")!.uncertainties.some((u) => u.type === "unacknowledged")).toBe(false);
    expect(state.events.at(-1)?.type).toBe("update-acknowledged");
  });

  it("advancing time changes freshness", () => {
    const before = useSecondLookStore.getState().engineResult.qualityResults.find((q) => q.patientId === "patient-104")!.freshnessPercent;
    useSecondLookStore.getState().advanceDemoTime(40);
    const after = useSecondLookStore.getState().engineResult.qualityResults.find((q) => q.patientId === "patient-104")!.freshnessPercent;
    expect(after).toBeLessThan(before);
  });

  it("represents motion as reduced-quality evidence and disconnection as sensor uncertainty", () => {
    useSecondLookStore.getState().setWearableMode("patient-176", "motion-artifact");
    let state = useSecondLookStore.getState();
    expect(state.engineResult.qualityResults.find((q) => q.patientId === "patient-176")!.uncertainties.some((u) => u.type === "motion-artifact")).toBe(true);
    useSecondLookStore.getState().setWearableMode("patient-301", "disconnected");
    state = useSecondLookStore.getState();
    expect(state.engineResult.qualityResults.find((q) => q.patientId === "patient-301")!.uncertainties.some((u) => u.type === "sensor-dropout")).toBe(true);
  });

  it("turns a reliable sustained trend into new information awaiting review", () => {
    useSecondLookStore.getState().setWearableMode("patient-176", "sustained-change");
    const state = useSecondLookStore.getState();
    expect(state.engineResult.qualityResults.find((q) => q.patientId === "patient-176")!.uncertainties.some((u) => u.type === "unacknowledged")).toBe(true);
    expect(state.events.at(-1)?.description).toContain("full evidence usage");
  });

  it("requires an override reason and preserves both system and human placement", () => {
    expect(() => useSecondLookStore.getState().overridePlacement({ patientId: "patient-219", newPosition: 1, reason: "" })).toThrow(/reason/i);
    const provisional = useSecondLookStore.getState().engineResult.placements.find((p) => p.patientId === "patient-219")!.provisionalRank;
    useSecondLookStore.getState().overridePlacement({ patientId: "patient-219", newPosition: 1, reason: "Provider operational judgement" });
    const state = useSecondLookStore.getState();
    expect(state.patients.find((p) => p.id === "patient-219")!.placementOverride?.newPosition).toBe(1);
    expect(state.engineResult.placements.find((p) => p.patientId === "patient-219")!.provisionalRank).toBe(provisional);
  });

  it("records reassessment as pending and reset reliably restores the demo", () => {
    useSecondLookStore.getState().requestReassessment("patient-219");
    expect(useSecondLookStore.getState().events.at(-1)?.type).toBe("reassessment-requested");
    useSecondLookStore.getState().advanceDemoTime(9);
    useSecondLookStore.getState().resetDemo();
    const state = useSecondLookStore.getState();
    expect(state.simulatedNow).toBe("2026-09-09T12:00:00.000Z");
    expect(state.patients).toHaveLength(6);
    expect(state.patients.every((patient) => !patient.placementOverride)).toBe(true);
  });
});
