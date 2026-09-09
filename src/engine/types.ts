export type ClinicianCategory = 1 | 2 | 3 | 4 | 5;

export type PatientStatus = "waiting" | "under-review" | "acknowledged" | "completed";

export type EvidenceType =
  | "heart-rate"
  | "respiratory-rate"
  | "oxygen-saturation"
  | "blood-pressure"
  | "temperature"
  | "clinical-note"
  | "chief-complaint"
  | "staff-concern"
  | "review-status";

export type EvidenceSource = "triage-nurse" | "provider" | "patient" | "wearable" | "ai-draft";
export type PolicyStatus = "within-policy" | "flagged-by-policy" | "unknown";
export type SignalQuality = "high" | "medium" | "low" | "unavailable";

export type EvidenceItem = {
  id: string;
  patientId: string;
  type: EvidenceType;
  label: string;
  value: string | number | null;
  unit?: string;
  source: EvidenceSource;
  recordedAt: string;
  receivedAt: string;
  verified: boolean;
  acknowledged: boolean;
  policyStatus: PolicyStatus;
  signalQuality?: SignalQuality;
  metadata?: {
    motionDetected?: boolean;
    connected?: boolean;
    correctedEvidenceId?: string;
    conflictsWith?: string[];
    unavailable?: boolean;
    simulated?: boolean;
  };
};

export type PlacementOverride = {
  newPosition: number;
  reason: string;
  actor: string;
  timestamp: string;
};

export type PatientCase = {
  id: string;
  displayId: string;
  age: number;
  ageGroup?: string;
  complaint: string;
  clinicianCategory: ClinicianCategory;
  arrivalTime: string;
  lastReviewedAt: string;
  assignedProvider?: string;
  status: PatientStatus;
  manualConcern: boolean;
  evidence: EvidenceItem[];
  expectedEvidenceTypes?: EvidenceType[];
  placementOverride?: PlacementOverride;
};

export type UncertaintyType =
  | "missing"
  | "stale"
  | "conflicting"
  | "unverified"
  | "unacknowledged"
  | "sensor-dropout"
  | "motion-artifact";

export type PossibleState = { id: string; label: string; organisationalEffect: number };

export type Uncertainty = {
  id: string;
  patientId: string;
  type: UncertaintyType;
  field: string;
  label: string;
  explanation: string;
  severity: "low" | "medium" | "high";
  possibleStates: PossibleState[];
  resolutionAction: string;
  estimatedResolutionSeconds: number;
  evidenceId?: string;
};

export type QualityResult = {
  patientId: string;
  uncertainties: Uncertainty[];
  completenessPercent: number;
  freshnessPercent: number;
  verificationPercent: number;
  sourceAgreementPercent: number;
  sensorReliabilityPercent: number | null;
};

export type Scenario = {
  id: string;
  label: string;
  description: string;
  minutesAdvanced: number;
  evidenceOverrides: Record<string, Partial<EvidenceItem>>;
  assumedEffects: Record<string, number>;
  resolvesUncertaintyId?: string;
};

export type ScenarioPatientResult = { patientId: string; attentionValue: number };
export type ScenarioQueue = { scenarioId: string; patients: ScenarioPatientResult[] };

export type PlacementResult = {
  patientId: string;
  provisionalRank: number;
  bestPossibleRank: number;
  worstPossibleRank: number;
  stabilityPercent: number;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  learnedAdjustment?: number;
  uncertaintySpread?: number;
  modelFactors?: string[];
};

export type InformationRecommendation = {
  patientId: string;
  uncertaintyId: string;
  title: string;
  explanation: string;
  currentRange: [number, number];
  expectedRange: [number, number];
  estimatedSeconds: number;
  uncertaintyReductionPercent: number;
  valueScore: number;
};

export type TimelineEventType =
  | "arrival"
  | "information-added"
  | "information-confirmed"
  | "update-acknowledged"
  | "reassessment-requested"
  | "wearable-connected"
  | "wearable-disconnected"
  | "uncertainty-resolved"
  | "placement-overridden";

export type TimelineEvent = {
  id: string;
  patientId: string;
  timestamp: string;
  type: TimelineEventType;
  actor: string;
  title: string;
  description: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
};
