"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createDemoEvents } from "@/data/demo-events";
import { createDemoPatients, DEMO_START_TIME } from "@/data/demo-patients";
import { runSecondLookEngine, type SecondLookEngineResult } from "@/engine/secondlook-engine";
import type {
  ClinicianCategory,
  EvidenceItem,
  PatientCase,
  TimelineEvent,
  TimelineEventType,
  Uncertainty,
} from "@/engine/types";
import { processWearableWindow } from "@/engine/wearable-processor";
import { DEMO_POLICY } from "@/lib/clinical-policy";
import { generateWearableReadings, type WearableMode } from "@/lib/wearable-simulator";

export type SecondLookStoreState = {
  patients: PatientCase[];
  events: TimelineEvent[];
  selectedPatientId: string | null;
  viewMode: "traditional" | "secondlook";
  unstableOnly: boolean;
  simulatedNow: string;
  wearableModes: Record<string, WearableMode>;
  engineResult: SecondLookEngineResult;
};

export type SecondLookStoreActions = {
  selectPatient(patientId: string): void;
  setViewMode(mode: "traditional" | "secondlook"): void;
  setUnstableOnly(enabled: boolean): void;
  resolveUncertainty(input: {
    patientId: string;
    uncertaintyId: string;
    value?: string | number;
    markUnavailable?: boolean;
    note?: string;
  }): void;
  acknowledgeUpdate(patientId: string, eventId?: string): void;
  requestReassessment(patientId: string): void;
  overridePlacement(input: { patientId: string; newPosition: number; reason: string }): void;
  addPatient(input: {
    displayId: string;
    ageGroup: string;
    complaint: string;
    clinicianCategory: ClinicianCategory;
    arrivalTime: string;
    manualConcern: boolean;
    note?: string;
    connectWearable: boolean;
  }): void;
  setWearableMode(patientId: string, mode: WearableMode): void;
  advanceDemoTime(minutes: number): void;
  resetDemo(): void;
};

export type SecondLookStore = SecondLookStoreState & SecondLookStoreActions;

function compute(patients: PatientCase[], simulatedNow: string): SecondLookEngineResult {
  return runSecondLookEngine({ patients, now: new Date(simulatedNow), policy: DEMO_POLICY });
}

function initialState(): SecondLookStoreState {
  const patients = createDemoPatients();
  return {
    patients,
    events: createDemoEvents(),
    selectedPatientId: "patient-219",
    viewMode: "traditional",
    unstableOnly: false,
    simulatedNow: DEMO_START_TIME,
    wearableModes: { "patient-176": "motion-artifact", "patient-301": "disconnected" },
    engineResult: compute(patients, DEMO_START_TIME),
  };
}

function eventFor(
  state: SecondLookStoreState,
  patientId: string,
  type: TimelineEventType,
  title: string,
  description: string,
  details: Partial<TimelineEvent> = {},
): TimelineEvent {
  return {
    id: `${type}-${patientId}-${state.events.length + 1}-${state.simulatedNow}`,
    patientId,
    timestamp: state.simulatedNow,
    type,
    actor: "Provider",
    title,
    description,
    ...details,
  };
}

function findUncertainty(state: SecondLookStoreState, patientId: string, uncertaintyId: string): Uncertainty {
  const uncertainty = state.engineResult.qualityResults
    .find((quality) => quality.patientId === patientId)
    ?.uncertainties.find((item) => item.id === uncertaintyId);
  if (!uncertainty) throw new Error(`Unknown unresolved information item: ${uncertaintyId}`);
  return uncertainty;
}

function resolvedPatient(
  patient: PatientCase,
  uncertainty: Uncertainty,
  now: string,
  input: { value?: string | number; markUnavailable?: boolean },
): PatientCase {
  const copy = structuredClone(patient);
  const target = copy.evidence.find((item) => item.id === uncertainty.evidenceId);
  const baseEvidence = target;

  if (uncertainty.type === "missing" || uncertainty.type === "stale") {
    const type = uncertainty.type === "missing" ? uncertainty.field as EvidenceItem["type"] : target?.type;
    if (!type) return copy;
    copy.evidence.push({
      id: `${copy.id}-${type}-resolved-${Date.parse(now)}`,
      patientId: copy.id,
      type,
      label: uncertainty.type === "stale" ? "Refreshed observation" : "Clarified information",
      value: input.markUnavailable ? null : (input.value ?? baseEvidence?.value ?? "Confirmed for operational review"),
      unit: baseEvidence?.unit,
      source: "provider",
      recordedAt: now,
      receivedAt: now,
      verified: true,
      acknowledged: true,
      policyStatus: baseEvidence?.policyStatus ?? "unknown",
      signalQuality: baseEvidence?.source === "wearable" ? "high" : baseEvidence?.signalQuality,
      metadata: {
        unavailable: Boolean(input.markUnavailable),
        connected: baseEvidence?.source === "wearable" ? true : baseEvidence?.metadata?.connected,
        motionDetected: false,
        correctedEvidenceId: baseEvidence?.id,
      },
    });
  } else if (uncertainty.type === "conflicting") {
    const group = copy.evidence.filter((item) => item.type === uncertainty.field);
    const retained = target ?? group.at(-1);
    if (retained) {
      retained.verified = true;
      retained.acknowledged = true;
      retained.metadata = {
        ...retained.metadata,
        conflictsWith: undefined,
        correctedEvidenceId: group.find((item) => item.id !== retained.id)?.id,
      };
    }
  } else if (uncertainty.type === "sensor-dropout") {
    const prior = [...copy.evidence].reverse().find((item) => item.source === "wearable" && item.value !== null);
    copy.evidence.push({
      id: `${copy.id}-wearable-resolved-${Date.parse(now)}`,
      patientId: copy.id,
      type: prior?.type ?? "heart-rate",
      label: input.markUnavailable ? "Wearable marked unavailable" : "Reliable wearable reading",
      value: input.markUnavailable ? null : (input.value ?? prior?.value ?? 0),
      unit: prior?.unit,
      source: "wearable",
      recordedAt: now,
      receivedAt: now,
      verified: true,
      acknowledged: true,
      policyStatus: "unknown",
      signalQuality: input.markUnavailable ? "unavailable" : "high",
      metadata: { unavailable: Boolean(input.markUnavailable), connected: !input.markUnavailable, motionDetected: false },
    });
  } else if (target) {
    target.acknowledged = true;
    target.verified = true;
    if (uncertainty.type === "motion-artifact") {
      target.signalQuality = "high";
      target.metadata = { ...target.metadata, motionDetected: false };
    }
  }
  return copy;
}

const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useSecondLookStore = create<SecondLookStore>()(persist((set, get) => ({
  ...initialState(),
  selectPatient: (patientId) => set({ selectedPatientId: patientId }),
  setViewMode: (viewMode) => set({ viewMode }),
  setUnstableOnly: (unstableOnly) => set({ unstableOnly }),
  resolveUncertainty: (input) => {
    const state = get();
    const uncertainty = findUncertainty(state, input.patientId, input.uncertaintyId);
    const patients = state.patients.map((patient) =>
      patient.id === input.patientId ? resolvedPatient(patient, uncertainty, state.simulatedNow, input) : patient,
    );
    const event = eventFor(
      state,
      input.patientId,
      "uncertainty-resolved",
      uncertainty.resolutionAction,
      input.note?.trim() || "A staff member clarified the selected information item.",
      { before: uncertainty, after: { value: input.value, unavailable: Boolean(input.markUnavailable) } },
    );
    set({ patients, events: [...state.events, event], engineResult: compute(patients, state.simulatedNow) });
  },
  acknowledgeUpdate: (patientId, eventId) => {
    const state = get();
    const patients = state.patients.map((patient) => patient.id === patientId
      ? { ...patient, evidence: patient.evidence.map((item) => ({ ...item, acknowledged: true })) }
      : patient,
    );
    const sourceEvent = eventId ? state.events.find((item) => item.id === eventId && item.patientId === patientId) : undefined;
    const event = eventFor(
      state,
      patientId,
      "update-acknowledged",
      "Update acknowledged",
      sourceEvent ? `Acknowledged: ${sourceEvent.title}.` : "All currently received information was acknowledged.",
    );
    set({ patients, events: [...state.events, event], engineResult: compute(patients, state.simulatedNow) });
  },
  requestReassessment: (patientId) => {
    const state = get();
    const event = eventFor(
      state,
      patientId,
      "reassessment-requested",
      "Reassessment requested",
      "The request is recorded and remains pending; no reassessment result was fabricated.",
    );
    set({ events: [...state.events, event] });
  },
  overridePlacement: ({ patientId, newPosition, reason }) => {
    const state = get();
    if (!reason.trim()) throw new Error("A reason is required for a placement override.");
    const waitingCount = state.patients.filter((patient) => patient.status !== "completed").length;
    if (!Number.isInteger(newPosition) || newPosition < 1 || newPosition > waitingCount) {
      throw new Error(`Override position must be between 1 and ${waitingCount}.`);
    }
    const patients = state.patients.map((patient) => patient.id === patientId
      ? { ...patient, placementOverride: { newPosition, reason: reason.trim(), actor: "Provider", timestamp: state.simulatedNow } }
      : patient,
    );
    const event = eventFor(
      state,
      patientId,
      "placement-overridden",
      `Human placement override to #${newPosition}`,
      "The system provisional placement remains available alongside the provider-selected order.",
      { reason: reason.trim(), before: state.engineResult.placements.find((item) => item.patientId === patientId), after: { newPosition } },
    );
    set({ patients, events: [...state.events, event], engineResult: compute(patients, state.simulatedNow) });
  },
  addPatient: (input) => {
    const state = get();
    const patientId = `patient-${input.displayId.replace(/[^a-z0-9]/gi, "").toLowerCase()}-${state.patients.length + 1}`;
    const evidence: EvidenceItem[] = [{
      id: `${patientId}-complaint`, patientId, type: "chief-complaint", label: "Chief complaint", value: input.complaint,
      source: "triage-nurse", recordedAt: input.arrivalTime, receivedAt: input.arrivalTime, verified: true,
      acknowledged: true, policyStatus: "within-policy",
    }];
    if (input.note?.trim()) evidence.push({
      id: `${patientId}-note`, patientId, type: "clinical-note", label: "Triage note", value: input.note.trim(),
      source: "triage-nurse", recordedAt: input.arrivalTime, receivedAt: input.arrivalTime, verified: true,
      acknowledged: true, policyStatus: "unknown",
    });
    const patient: PatientCase = {
      id: patientId,
      displayId: input.displayId,
      ageGroup: input.ageGroup,
      complaint: input.complaint,
      clinicianCategory: input.clinicianCategory,
      arrivalTime: input.arrivalTime,
      lastReviewedAt: input.arrivalTime,
      status: "waiting",
      manualConcern: input.manualConcern,
      expectedEvidenceTypes: ["chief-complaint", "clinical-note"],
      evidence,
    };
    const patients = [...state.patients, patient];
    const arrival = eventFor(state, patientId, "arrival", `${input.displayId} added`, "A fictional case was added to the operational queue.");
    set({ patients, events: [...state.events, arrival], selectedPatientId: patientId, engineResult: compute(patients, state.simulatedNow) });
    if (input.connectWearable) get().setWearableMode(patientId, "stable");
  },
  setWearableMode: (patientId, mode) => {
    const state = get();
    const readings = generateWearableReadings(patientId, mode, new Date(state.simulatedNow));
    const window = processWearableWindow(readings);
    const quality = (value: number): EvidenceItem["signalQuality"] => value >= 75 ? "high" : value >= 40 ? "medium" : value > 0 ? "low" : "unavailable";
    const wearableEvidence: EvidenceItem[] = readings.map((reading) => ({
      id: `sim-${reading.id}`,
      patientId,
      type: "heart-rate",
      label: mode === "sustained-change" ? "Wearable trend reading" : "Wearable heart-rate reading",
      value: reading.heartRate,
      unit: "bpm",
      source: "wearable",
      recordedAt: reading.timestamp,
      receivedAt: reading.timestamp,
      verified: false,
      acknowledged: mode === "stable",
      policyStatus: "unknown",
      signalQuality: quality(reading.signalQuality),
      metadata: { connected: reading.connected, motionDetected: reading.motionLevel >= 60, simulated: true },
    }));
    const patients = state.patients.map((patient) => patient.id === patientId
      ? { ...patient, evidence: [...patient.evidence.filter((item) => item.source !== "wearable"), ...wearableEvidence] }
      : patient,
    );
    const type: TimelineEventType = mode === "disconnected" ? "wearable-disconnected" : "wearable-connected";
    const event = eventFor(
      state,
      patientId,
      type,
      mode === "disconnected" ? "Wearable disconnected" : `Wearable mode: ${mode}`,
      `Simulator window processed with ${window.evidenceUsage} evidence usage and ${window.validReadingPercent}% valid readings.`,
      { actor: "Simulator", after: window },
    );
    set({
      patients,
      events: [...state.events, event],
      wearableModes: { ...state.wearableModes, [patientId]: mode },
      engineResult: compute(patients, state.simulatedNow),
    });
  },
  advanceDemoTime: (minutes) => {
    if (!Number.isFinite(minutes)) throw new Error("Time advancement must be a finite number of minutes.");
    const state = get();
    const simulatedNow = new Date(Date.parse(state.simulatedNow) + minutes * 60_000).toISOString();
    set({ simulatedNow, engineResult: compute(state.patients, simulatedNow) });
  },
  resetDemo: () => set(initialState()),
}), {
  name: "secondlook-fictional-demo-v1",
  storage: createJSONStorage(() => typeof window === "undefined" ? memoryStorage : window.localStorage),
  version: 1,
}));
