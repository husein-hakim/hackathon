import { useSecondLookStore } from "../lib/ui-adapter";

async function runTests() {
  console.log("=== SECONDLOOK LIVE DEMO SEQUENCE VERIFICATION ===");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      failed++;
    }
  }

  useSecondLookStore.getState().actions.resetDemo();
  let store = useSecondLookStore.getState();

  assert(store.patients.length === 6, "Initial queue contains exactly 6 fictional cases");
  assert(store.viewMode === "secondlook", "Initial queue starts in the uncertainty-aware view");
  assert(store.summary.totalWaiting === 6, "Queue summary is derived from waiting cases");
  assert(store.summary.queueConfidence >= 0 && store.summary.queueConfidence <= 100, "Queue confidence is a bounded operational metric");
  assert(store.summary.modelMode === "local-ml", "A local machine-learning model is running without an API");
  assert((store.summary.modelValidationR2 ?? 0) > 0.8, "The bundled model passes its held-out synthetic validation threshold");

  const p219 = store.patients.find((patient) => patient.displayId === "P-219");
  assert(!!p219, "Primary demo case P-219 exists in queue");
  assert(p219?.provisionalRank === 3, "P-219 is currently third after local model inference");
  assert(p219 !== undefined && p219.bestPossibleRank <= p219.provisionalRank && p219.worstPossibleRank >= p219.provisionalRank, "P-219's learned range contains its provisional rank");
  assert(p219 !== undefined && p219.worstPossibleRank - p219.bestPossibleRank >= 2, "P-219 has a materially wide learned placement range");
  assert(p219?.confidence === "low", "P-219 placement confidence is Low");
  assert(p219?.nextBestInformation?.title === "Refresh the latest observation", "P-219 recommends refreshing the latest observation");

  const p104 = store.patients.find((patient) => patient.displayId === "P-104");
  assert(p104?.confidence === "high", "P-104 remains a High-confidence stable case");
  assert(
    p104 !== undefined && p104.worstPossibleRank - p104.bestPossibleRank <= 1,
    "P-104 has a narrow placement range",
  );

  store.actions.setViewMode("secondlook");
  assert(useSecondLookStore.getState().viewMode === "secondlook", "Switched to SecondLook View");
  store.actions.selectPatient("pat-219");
  assert(useSecondLookStore.getState().selectedPatientId === "pat-219", "Selected patient P-219 through UI ID translation");

  store.actions.resolveUncertainty({ patientId: "pat-219", uncertaintyId: "unc-219-1", value: "Refreshed staff observation", note: "Bedside observation refreshed by triage staff." });
  store = useSecondLookStore.getState();
  const updatedP219 = store.patients.find((patient) => patient.displayId === "P-219");
  assert(
    updatedP219 !== undefined && p219?.modelUncertaintySpread !== undefined && updatedP219.modelUncertaintySpread !== undefined
      && updatedP219.modelUncertaintySpread < p219.modelUncertaintySpread,
    "After clarification, P-219's learned uncertainty decreases",
  );
  assert(updatedP219?.confidence !== "low", "After clarification, P-219 is no longer marked unstable");
  assert(store.events[0]?.type === "uncertainty-resolved", "Timeline records the uncertainty resolution");

  store.actions.selectPatient("pat-176");
  store.actions.setWearableMode("pat-176", "motion-artifact");
  let p176 = useSecondLookStore.getState().patients.find((patient) => patient.displayId === "P-176");
  assert(p176?.wearable?.mode === "motion-artifact", "P-176 enters motion-artifact mode");
  assert(p176?.wearable?.motionDetected === true, "Movement overlap is visible");
  assert(p176?.wearable?.evidenceUsage === "reduced", "Motion evidence is used with reduced confidence");

  store.actions.setWearableMode("pat-176", "sustained-change");
  p176 = useSecondLookStore.getState().patients.find((patient) => patient.displayId === "P-176");
  assert(p176?.hasUnacknowledgedUpdate === true, "Sustained trend becomes new information awaiting review");
  store.actions.acknowledgeUpdate("pat-176");
  p176 = useSecondLookStore.getState().patients.find((patient) => patient.displayId === "P-176");
  assert(p176?.hasUnacknowledgedUpdate === false, "P-176 update can be acknowledged");

  store.actions.overridePlacement({ patientId: "pat-219", newPosition: 1, reason: "Provider operational judgement" });
  store = useSecondLookStore.getState();
  assert(store.patients.find((patient) => patient.displayId === "P-219")?.provisionalRank === 1, "Human override is exposed as the displayed order");
  assert(store.events[0]?.type === "placement-overridden", "Override rationale is recorded in the timeline");

  store.actions.resetDemo();
  store = useSecondLookStore.getState();
  const resetP219 = store.patients.find((patient) => patient.displayId === "P-219");
  assert(resetP219?.provisionalRank === 3, "Reset restores P-219's inferred position");
  assert(resetP219?.modelUncertaintySpread === p219?.modelUncertaintySpread, "Reset restores P-219's learned uncertainty");
  assert(resetP219?.confidence === "low", "Reset restores Low confidence");

  const prohibitedTerms = [
    ["AI", "diagnosis"],
    ["predicted", "disease"],
    ["patient", "is", "safe"],
    ["critical", "patient", "detected"],
    ["mortality", "risk"],
    ["recommended", "treatment"],
  ].map((words) => words.join(" "));
  const serializedState = JSON.stringify(store);
  for (const term of prohibitedTerms) {
    assert(!serializedState.toLowerCase().includes(term.toLowerCase()), `State excludes prohibited phrase: ${term}`);
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
