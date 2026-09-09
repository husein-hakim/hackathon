import type { EvidenceItem, EvidenceType, PatientCase } from "@/engine/types";

export const DEMO_START_TIME = "2026-09-09T12:00:00.000Z";

const atMinutesAgo = (minutes: number) =>
  new Date(new Date(DEMO_START_TIME).getTime() - minutes * 60_000).toISOString();

function evidence(
  patientId: string,
  id: string,
  type: EvidenceType,
  label: string,
  value: EvidenceItem["value"],
  minutesAgo: number,
  overrides: Partial<EvidenceItem> = {},
): EvidenceItem {
  return {
    id,
    patientId,
    type,
    label,
    value,
    source: "triage-nurse",
    recordedAt: atMinutesAgo(minutesAgo),
    receivedAt: atMinutesAgo(minutesAgo),
    verified: true,
    acknowledged: true,
    policyStatus: "within-policy",
    ...overrides,
  };
}

const standardExpected: EvidenceType[] = ["chief-complaint", "clinical-note", "heart-rate"];

export const DEMO_PATIENTS: PatientCase[] = [
  {
    id: "patient-104",
    displayId: "P-104",
    age: 29,
    ageGroup: "Adult",
    complaint: "Minor hand injury",
    clinicianCategory: 4,
    arrivalTime: atMinutesAgo(16),
    lastReviewedAt: atMinutesAgo(4),
    status: "waiting",
    manualConcern: false,
    expectedEvidenceTypes: standardExpected,
    evidence: [
      evidence("patient-104", "p104-complaint", "chief-complaint", "Chief complaint", "Minor hand injury", 16),
      evidence("patient-104", "p104-note", "clinical-note", "Triage note", "Information complete for the demonstration workflow", 4),
      evidence("patient-104", "p104-hr", "heart-rate", "Heart rate", 78, 4, { unit: "bpm" }),
    ],
  },
  {
    id: "patient-219",
    displayId: "P-219",
    age: 72,
    ageGroup: "Older adult",
    complaint: "Breathing discomfort",
    clinicianCategory: 3,
    arrivalTime: atMinutesAgo(34),
    lastReviewedAt: atMinutesAgo(15),
    status: "waiting",
    manualConcern: false,
    expectedEvidenceTypes: standardExpected,
    evidence: [
      evidence("patient-219", "p219-complaint", "chief-complaint", "Chief complaint", "Breathing discomfort", 34),
      evidence("patient-219", "p219-hr-old", "heart-rate", "Latest observation", 96, 31, { unit: "bpm" }),
      evidence("patient-219", "p219-new-note", "clinical-note", "New nursing update", "New operational note awaiting review", 4, {
        acknowledged: false,
      }),
    ],
  },
  {
    id: "patient-083",
    displayId: "P-083",
    age: 41,
    ageGroup: "Adult",
    complaint: "Abdominal discomfort",
    clinicianCategory: 3,
    arrivalTime: atMinutesAgo(23),
    lastReviewedAt: atMinutesAgo(27),
    status: "waiting",
    manualConcern: true,
    expectedEvidenceTypes: standardExpected,
    evidence: [
      evidence("patient-083", "p083-complaint", "chief-complaint", "Chief complaint", "Abdominal discomfort", 23),
      evidence("patient-083", "p083-note", "clinical-note", "Triage note", "Two observations require reconciliation", 8),
      evidence("patient-083", "p083-hr-a", "heart-rate", "Observation record A", 88, 8, {
        unit: "bpm",
        metadata: { conflictsWith: ["p083-hr-b"] },
      }),
      evidence("patient-083", "p083-hr-b", "heart-rate", "Observation record B", 104, 7, {
        unit: "bpm",
        metadata: { conflictsWith: ["p083-hr-a"] },
      }),
    ],
  },
  {
    id: "patient-176",
    displayId: "P-176",
    age: 24,
    ageGroup: "Young adult",
    complaint: "Dizziness",
    clinicianCategory: 3,
    arrivalTime: atMinutesAgo(19),
    lastReviewedAt: atMinutesAgo(18),
    status: "waiting",
    manualConcern: false,
    expectedEvidenceTypes: standardExpected,
    evidence: [
      evidence("patient-176", "p176-complaint", "chief-complaint", "Chief complaint", "Dizziness", 19),
      evidence("patient-176", "p176-note", "clinical-note", "Review status", "Staff review recorded", 18, {
        type: "review-status",
        policyStatus: "flagged-by-policy",
      }),
      evidence("patient-176", "p176-clinical-note", "clinical-note", "Triage note", "Wearable context attached", 8),
      evidence("patient-176", "p176-hr-prior", "heart-rate", "Earlier wearable reading", 82, 2, {
        unit: "bpm",
        source: "wearable",
        signalQuality: "high",
        metadata: { connected: true, motionDetected: false },
      }),
      evidence("patient-176", "p176-hr-motion", "heart-rate", "Wearable reading during movement", 113, 1, {
        unit: "bpm",
        source: "wearable",
        verified: false,
        acknowledged: false,
        signalQuality: "low",
        policyStatus: "unknown",
        metadata: { connected: true, motionDetected: true },
      }),
    ],
  },
  {
    id: "patient-301",
    displayId: "P-301",
    age: 58,
    ageGroup: "Adult",
    complaint: "Persistent weakness",
    clinicianCategory: 4,
    arrivalTime: atMinutesAgo(28),
    lastReviewedAt: atMinutesAgo(42),
    status: "waiting",
    manualConcern: true,
    expectedEvidenceTypes: standardExpected,
    evidence: [
      evidence("patient-301", "p301-complaint", "chief-complaint", "Chief complaint", "Persistent weakness", 28),
      evidence("patient-301", "p301-note", "clinical-note", "Triage note", "Wearable connection was previously available", 12),
      evidence("patient-301", "p301-hr-reliable", "heart-rate", "Last reliable wearable reading", 84, 6, {
        unit: "bpm",
        source: "wearable",
        signalQuality: "high",
        metadata: { connected: true, motionDetected: false },
      }),
      evidence("patient-301", "p301-disconnected", "heart-rate", "Wearable connection", null, 1, {
        unit: "bpm",
        source: "wearable",
        verified: false,
        acknowledged: false,
        signalQuality: "unavailable",
        policyStatus: "unknown",
        metadata: { connected: false, motionDetected: false },
      }),
    ],
  },
  {
    id: "patient-412",
    displayId: "P-412",
    age: 36,
    ageGroup: "Adult",
    complaint: "Headache",
    clinicianCategory: 4,
    arrivalTime: atMinutesAgo(12),
    lastReviewedAt: atMinutesAgo(10),
    status: "waiting",
    manualConcern: false,
    expectedEvidenceTypes: standardExpected,
    evidence: [
      evidence("patient-412", "p412-complaint", "chief-complaint", "Chief complaint", "Headache", 12),
      evidence("patient-412", "p412-hr", "heart-rate", "Heart rate", 80, 5, { unit: "bpm" }),
      evidence("patient-412", "p412-new-note", "clinical-note", "New nursing note", "New information awaiting provider acknowledgement", 3, {
        acknowledged: false,
      }),
    ],
  },
];

export function createDemoPatients(): PatientCase[] {
  return structuredClone(DEMO_PATIENTS);
}
