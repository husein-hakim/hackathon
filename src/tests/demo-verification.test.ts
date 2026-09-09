import { useSecondLookStore } from "../lib/ui-adapter";
import { INITIAL_PATIENTS } from "../lib/frontend-demo-data";

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

  const store = useSecondLookStore.getState();

  // Test 1: Initial state and fictional cases
  assert(store.patients.length === 6, "Initial queue contains exactly 6 fictional cases");
  assert(store.viewMode === "traditional", "Initial queue starts in Traditional View per demo requirements");
  assert(store.summary.queueConfidence === 68, "Initial queue confidence is 68%");
  assert(store.summary.unstableCount === 2, "Initial unstable count is 2");

  // Test 2: Primary demo case P-219 initial characteristics
  const p219 = store.patients.find((p) => p.displayId === "P-219");
  assert(!!p219, "Primary demo case P-219 exists in queue");
  assert(p219?.provisionalRank === 4, "P-219 provisional position is #4");
  assert(p219?.bestPossibleRank === 2 && p219?.worstPossibleRank === 7, "P-219 possible placement is #2–#7");
  assert(p219?.confidence === "low", "P-219 placement confidence is Low");
  assert(!!p219?.nextBestInformation, "P-219 presents Next Best Information");
  assert(
    p219?.nextBestInformation?.title === "Refresh the latest observation",
    "P-219 Next Best Information recommends refreshing latest observation"
  );

  // Test 3: Stable case P-104 characteristics (Demonstrate SecondLook does not flag everyone)
  const p104 = store.patients.find((p) => p.displayId === "P-104");
  assert(p104?.confidence === "high", "P-104 has High placement confidence (stable case)");
  assert(p104?.bestPossibleRank === 1 && p104?.worstPossibleRank === 2, "P-104 has narrow placement bounds #1–#2");

  // Test 4: View switching
  store.actions.setViewMode("secondlook");
  assert(useSecondLookStore.getState().viewMode === "secondlook", "Switched to SecondLook View");

  // Test 5: Patient selection
  store.actions.selectPatient("pat-219");
  assert(useSecondLookStore.getState().selectedPatientId === "pat-219", "Selected patient P-219");

  // Test 6: Resolving P-219 Stale Information
  store.actions.resolveUncertainty({
    patientId: "pat-219",
    uncertaintyId: "unc-219-1",
    value: "96% ambient air, RR 18/min",
    note: "Staff vital check performed",
  });

  const updatedP219 = useSecondLookStore.getState().patients.find((p) => p.displayId === "P-219");
  assert(updatedP219?.confidence === "high", "After clarification, P-219 confidence becomes High");
  assert(
    updatedP219?.bestPossibleRank === 3 && updatedP219?.worstPossibleRank === 4,
    "After clarification, P-219 range collapses to #3–#4"
  );
  assert(
    useSecondLookStore.getState().events[0].type === "uncertainty-resolved",
    "Timeline recorded uncertainty-resolved audit event"
  );

  // Test 7: Wearable telemetry motion artefact on P-176
  store.actions.selectPatient("pat-176");
  store.actions.setWearableMode("pat-176", "motion-artifact");
  const p176Artifact = useSecondLookStore.getState().patients.find((p) => p.displayId === "P-176");
  assert(p176Artifact?.wearable?.mode === "motion-artifact", "P-176 wearable switched to motion-artifact");
  assert(p176Artifact?.wearable?.motionDetected === true, "P-176 motion detected is true");
  assert(p176Artifact?.wearable?.evidenceUsage === "reduced", "P-176 evidence usage reduced without false alarm");

  // Test 8: Wearable sustained trend on P-176
  store.actions.setWearableMode("pat-176", "sustained-change");
  const p176Sustained = useSecondLookStore.getState().patients.find((p) => p.displayId === "P-176");
  assert(p176Sustained?.hasUnacknowledgedUpdate === true, "P-176 sustained trend flagged as unacknowledged update");

  // Test 9: Acknowledge update
  store.actions.acknowledgeUpdate("pat-176");
  const p176Ack = useSecondLookStore.getState().patients.find((p) => p.displayId === "P-176");
  assert(p176Ack?.hasUnacknowledgedUpdate === false, "P-176 update acknowledged and flag cleared");

  // Test 10: Clinical Override with Mandatory Reason
  store.actions.overridePlacement({
    patientId: "pat-219",
    newPosition: 1,
    reason: "Clinical concern regarding speech effort; moving to immediate review room.",
  });
  const overriddenP219 = useSecondLookStore.getState().patients.find((p) => p.displayId === "P-219");
  assert(overriddenP219?.provisionalRank === 1, "P-219 position successfully overridden to #1");
  assert(
    useSecondLookStore.getState().events[0].type === "placement-overridden",
    "Timeline recorded placement-overridden audit event with rationale"
  );

  // Test 11: Demo Reset
  store.actions.resetDemo();
  const resetStore = useSecondLookStore.getState();
  assert(resetStore.patients.length === INITIAL_PATIENTS.length, "Demo reset restored all original patients");
  const resetP219 = resetStore.patients.find((p) => p.displayId === "P-219");
  assert(resetP219?.bestPossibleRank === 2 && resetP219?.worstPossibleRank === 7, "P-219 reset to #2–#7 range");
  assert(resetP219?.confidence === "low", "P-219 reset to Low confidence");

  // Test 12: Prohibited Terms Safety Audit
  const prohibitedTerms = [
    "AI diagnosis",
    "predicted disease",
    "patient is safe",
    "critical patient detected",
    "mortality risk",
    "recommended treatment",
    "correct clinical priority",
    "autonomous triage",
  ];

  const serializedData = JSON.stringify(INITIAL_PATIENTS);
  for (const term of prohibitedTerms) {
    assert(
      !serializedData.toLowerCase().includes(term.toLowerCase()),
      `Safety guardrail: Patient dataset does NOT contain prohibited term "${term}"`
    );
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
