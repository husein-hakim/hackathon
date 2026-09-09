export type ConfidenceLevel = "high" | "medium" | "low";

export type ViewMode = "traditional" | "secondlook";

export type WearableMode =
  | "stable"
  | "sustained-change"
  | "motion-artifact"
  | "intermittent-dropout"
  | "disconnected";

export type EvidenceSource =
  | "triage-nurse"
  | "provider"
  | "patient"
  | "wearable"
  | "ai-draft";

export type EvidenceStatus =
  | "verified"
  | "unverified"
  | "stale"
  | "conflicting"
  | "unavailable";

export type UncertaintyType =
  | "missing"
  | "stale"
  | "conflicting"
  | "unverified"
  | "unacknowledged"
  | "sensor-dropout"
  | "motion-artifact";

export type EvidenceViewModel = {
  id: string;
  label: string;
  value: string;
  source: EvidenceSource;
  status: EvidenceStatus;
  recordedAt: string;
  relativeTime: string;
  signalQuality?: number;
};

export type UncertaintyViewModel = {
  id: string;
  type: UncertaintyType;
  label: string;
  explanation: string;
  field: string;
  severity: "low" | "medium" | "high";
  resolutionAction: string;
};

export type WearablePoint = {
  timestamp: string;
  value: number;
};

export type WearableViewModel = {
  connected: boolean;
  mode: WearableMode;
  signalQuality: number;
  completenessPercent: number;
  motionDetected: boolean;
  lastReliableReadingAt: string;
  lastReliableReadingLabel: string;
  trend: "rising" | "falling" | "stable" | "uncertain";
  evidenceUsage: "full" | "reduced" | "excluded";
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  points: WearablePoint[];
};

export type NextBestInformationViewModel = {
  uncertaintyId: string;
  title: string;
  explanation: string;
  currentRange: [number, number];
  expectedRange: [number, number];
  estimatedSeconds: number;
  uncertaintyReductionPercent: number;
};

export type PatientQueueViewModel = {
  patientId: string;
  displayId: string;
  age?: number;
  ageGroup?: string;
  complaint: string;

  clinicianCategory: 1 | 2 | 3 | 4 | 5;

  waitingMinutes: number;
  minutesSinceReview: number;

  provisionalRank: number;
  bestPossibleRank: number;
  worstPossibleRank: number;

  stabilityPercent: number;
  confidence: ConfidenceLevel;

  reasons: string[];
  modelFactors?: string[];
  learnedAdjustment?: number;
  modelUncertaintySpread?: number;

  hasUnacknowledgedUpdate: boolean;
  hasManualConcern: boolean;

  evidence: EvidenceViewModel[];
  uncertainties: UncertaintyViewModel[];

  wearable?: WearableViewModel;
  nextBestInformation?: NextBestInformationViewModel;
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

export type TimelineEventViewModel = {
  id: string;
  patientId: string;
  timestamp: string;
  relativeTime: string;
  type: TimelineEventType;
  actor: string;
  title: string;
  description: string;
};

export type QueueSummaryViewModel = {
  queueConfidence: number;
  unstableCount: number;
  unresolvedUpdateCount: number;
  totalWaiting: number;
  simulatedTime: string;
  modelMode?: "local-ml";
  modelVersion?: string;
  modelValidationR2?: number;
  modelTrainingData?: string;
};

export type SecondLookViewModel = {
  patients: PatientQueueViewModel[];
  selectedPatientId: string | null;
  selectedPatient: PatientQueueViewModel | null;
  events: TimelineEventViewModel[];
  summary: QueueSummaryViewModel;
  viewMode: ViewMode;
  unstableOnly: boolean;
};

export type ResolveUncertaintyInput = {
  patientId: string;
  uncertaintyId: string;
  value?: string | number;
  markUnavailable?: boolean;
  note?: string;
};

export type OverridePlacementInput = {
  patientId: string;
  newPosition: number;
  reason: string;
};

export type AddPatientInput = {
  displayId: string;
  age: number;
  complaint: string;
  clinicianCategory: 1 | 2 | 3 | 4 | 5;
  arrivalTime: string;
  manualConcern: boolean;
  note?: string;
  connectWearable: boolean;
};

export type SecondLookActions = {
  selectPatient(patientId: string): void;
  setViewMode(mode: ViewMode): void;
  setUnstableOnly(enabled: boolean): void;

  resolveUncertainty(input: ResolveUncertaintyInput): void;

  acknowledgeUpdate(
    patientId: string,
    eventId?: string
  ): void;

  requestReassessment(patientId: string): void;

  overridePlacement(input: OverridePlacementInput): void;

  addPatient(input: AddPatientInput): void;

  setWearableMode(
    patientId: string,
    mode: WearableMode
  ): void;

  advanceDemoTime(minutes: number): void;
  resetDemo(): void;
};

export type SecondLookUIAdapter = {
  state: SecondLookViewModel;
  actions: SecondLookActions;
};
