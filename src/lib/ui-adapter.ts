"use client";

import { create } from "zustand";
import {
  SecondLookViewModel,
  SecondLookActions,
  SecondLookUIAdapter,
  ViewMode,
  WearableMode,
  ResolveUncertaintyInput,
  OverridePlacementInput,
  AddPatientInput,
  PatientQueueViewModel,
  TimelineEventViewModel,
  QueueSummaryViewModel,
} from "@/types/ui";
import {
  INITIAL_PATIENTS,
  INITIAL_TIMELINE_EVENTS,
  INITIAL_SUMMARY,
} from "./frontend-demo-data";

/**
 * =========================================================================
 * SecondLook UI Adapter
 * =========================================================================
 * NOTE FOR PERSON 2:
 * This is the frontend state adapter. Visual components consume application
 * state and invoke actions solely through `useSecondLookUI()`.
 *
 * When Person 2 connects the live clinical engine or backend store, map it
 * into this exact interface (`SecondLookUIAdapter`) without altering visual
 * component consumption.
 * =========================================================================
 */

interface StoreState extends SecondLookViewModel {
  actions: SecondLookActions;
}

function calculateSummary(
  patients: PatientQueueViewModel[],
  simulatedTime: string
): QueueSummaryViewModel {
  const unstableCount = patients.filter(
    (p) => p.confidence === "low" || p.confidence === "medium"
  ).length;

  const unresolvedUpdateCount = patients.filter(
    (p) => p.hasUnacknowledgedUpdate
  ).length;

  // Confidence index: average stability weighted by lack of unacknowledged alerts
  const avgStability =
    patients.reduce((sum, p) => sum + p.stabilityPercent, 0) /
    (patients.length || 1);
  const penalty = unresolvedUpdateCount * 4;
  const queueConfidence = Math.max(
    20,
    Math.min(98, Math.round(avgStability - penalty))
  );

  return {
    queueConfidence,
    unstableCount,
    unresolvedUpdateCount,
    totalWaiting: patients.length,
    simulatedTime,
  };
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(":").map(Number);
  return { hours: isNaN(h) ? 14 : h, minutes: isNaN(m) ? 42 : m };
}

function formatTime(hours: number, minutes: number): string {
  const h = hours % 24;
  return `${h.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export const useSecondLookStore = create<StoreState>((set, get) => ({
  patients: INITIAL_PATIENTS,
  selectedPatientId: "pat-219", // Default to primary demo case
  selectedPatient:
    INITIAL_PATIENTS.find((p) => p.patientId === "pat-219") ||
    INITIAL_PATIENTS[0] ||
    null,
  events: INITIAL_TIMELINE_EVENTS,
  summary: INITIAL_SUMMARY,
  viewMode: "traditional", // Starts in Traditional view per demo script
  unstableOnly: false,

  actions: {
    selectPatient: (patientId: string) => {
      const patient =
        get().patients.find((p) => p.patientId === patientId) || null;
      set({
        selectedPatientId: patientId,
        selectedPatient: patient,
      });
    },

    setViewMode: (mode: ViewMode) => {
      set({ viewMode: mode });
    },

    setUnstableOnly: (enabled: boolean) => {
      set({ unstableOnly: enabled });
    },

    resolveUncertainty: (input: ResolveUncertaintyInput) => {
      const { patientId, uncertaintyId, value, markUnavailable, note } = input;
      const state = get();
      const patient = state.patients.find((p) => p.patientId === patientId);
      if (!patient) return;

      const updatedPatients = state.patients.map((p) => {
        if (p.patientId !== patientId) return p;

        // Specific handling for primary demo case P-219
        if (p.patientId === "pat-219" || p.displayId === "P-219") {
          const updatedEvidence = p.evidence.map((ev) => {
            if (ev.status === "stale") {
              return {
                ...ev,
                status: "verified" as const,
                value: value
                  ? `SpO2 ${value}% (refreshed via staff recheck)`
                  : "SpO2 96%, RR 18 / min (refreshed via staff recheck)",
                recordedAt: state.summary.simulatedTime,
                relativeTime: "Just now",
              };
            }
            return ev;
          });

          return {
            ...p,
            provisionalRank: 3, // Refined position
            bestPossibleRank: 3,
            worstPossibleRank: 4,
            confidence: "high" as const,
            stabilityPercent: 92,
            reasons: [
              "Vital observation refreshed and verified by staff",
              "Placement uncertainty collapsed from #2–#7 to #3–#4",
            ],
            evidence: updatedEvidence,
            uncertainties: p.uncertainties.filter(
              (u) => u.id !== uncertaintyId && u.type !== "stale"
            ),
            nextBestInformation: undefined,
          };
        }

        // Generic resolution for other patients
        const remainingUncertainties = p.uncertainties.filter(
          (u) => u.id !== uncertaintyId
        );
        const newBest = Math.max(1, p.bestPossibleRank);
        const newWorst = Math.max(newBest, p.bestPossibleRank + 1);

        return {
          ...p,
          bestPossibleRank: newBest,
          worstPossibleRank: newWorst,
          confidence: "high" as const,
          stabilityPercent: Math.min(95, p.stabilityPercent + 25),
          reasons: [
            markUnavailable
              ? "Uncertainty acknowledged as currently unavailable"
              : "Information verified by attending clinician",
            ...(note ? [note] : []),
          ],
          uncertainties: remainingUncertainties,
          nextBestInformation: undefined,
        };
      });

      // Sort patients by provisional rank
      const sortedPatients = [...updatedPatients].sort(
        (a, b) => a.provisionalRank - b.provisionalRank
      );

      const updatedSelected =
        sortedPatients.find((p) => p.patientId === patientId) || null;

      const newEvent: TimelineEventViewModel = {
        id: `evt-res-${Date.now()}`,
        patientId,
        timestamp: state.summary.simulatedTime,
        relativeTime: "Just now",
        type: "uncertainty-resolved",
        actor: "Attending Provider",
        title: "Uncertainty Resolved",
        description: markUnavailable
          ? `Fact marked unavailable for ${patient.displayId}. Operational bounds stabilized.`
          : `Information verified for ${patient.displayId}. Placement uncertainty narrowed.`,
      };

      const newSummary = calculateSummary(
        sortedPatients,
        state.summary.simulatedTime
      );

      set({
        patients: sortedPatients,
        selectedPatient: updatedSelected,
        events: [newEvent, ...state.events],
        summary: newSummary,
      });
    },

    acknowledgeUpdate: (patientId: string) => {
      const state = get();
      const patient = state.patients.find((p) => p.patientId === patientId);
      if (!patient) return;

      const updatedPatients = state.patients.map((p) => {
        if (p.patientId !== patientId) return p;
        return {
          ...p,
          hasUnacknowledgedUpdate: false,
          uncertainties: p.uncertainties.filter(
            (u) => u.type !== "unacknowledged"
          ),
          stabilityPercent: Math.min(98, p.stabilityPercent + 10),
        };
      });

      const updatedSelected =
        updatedPatients.find((p) => p.patientId === patientId) || null;

      const newEvent: TimelineEventViewModel = {
        id: `evt-ack-${Date.now()}`,
        patientId,
        timestamp: state.summary.simulatedTime,
        relativeTime: "Just now",
        type: "update-acknowledged",
        actor: "Attending Staff",
        title: "Nursing Update Acknowledged",
        description: `Attending staff acknowledged recent update for ${patient.displayId}.`,
      };

      const newSummary = calculateSummary(
        updatedPatients,
        state.summary.simulatedTime
      );

      set({
        patients: updatedPatients,
        selectedPatient: updatedSelected,
        events: [newEvent, ...state.events],
        summary: newSummary,
      });
    },

    requestReassessment: (patientId: string) => {
      const state = get();
      const patient = state.patients.find((p) => p.patientId === patientId);
      if (!patient) return;

      const newEvent: TimelineEventViewModel = {
        id: `evt-reassess-${Date.now()}`,
        patientId,
        timestamp: state.summary.simulatedTime,
        relativeTime: "Just now",
        type: "reassessment-requested",
        actor: "Attending Clinician",
        title: "Reassessment Requested",
        description: `Formal bedside reassessment requested for ${patient.displayId}.`,
      };

      set({
        events: [newEvent, ...state.events],
      });
    },

    overridePlacement: (input: OverridePlacementInput) => {
      const { patientId, newPosition, reason } = input;
      const state = get();
      const patient = state.patients.find((p) => p.patientId === patientId);
      if (!patient) return;

      const clampedPos = Math.max(1, Math.min(state.patients.length, newPosition));
      const oldPos = patient.provisionalRank;

      // Adjust positions of other patients to accommodate the change
      const updatedPatients = state.patients.map((p) => {
        if (p.patientId === patientId) {
          return {
            ...p,
            provisionalRank: clampedPos,
            hasManualConcern: true,
          };
        }
        if (oldPos < clampedPos) {
          if (p.provisionalRank > oldPos && p.provisionalRank <= clampedPos) {
            return { ...p, provisionalRank: p.provisionalRank - 1 };
          }
        } else if (oldPos > clampedPos) {
          if (p.provisionalRank >= clampedPos && p.provisionalRank < oldPos) {
            return { ...p, provisionalRank: p.provisionalRank + 1 };
          }
        }
        return p;
      });

      const sortedPatients = [...updatedPatients].sort(
        (a, b) => a.provisionalRank - b.provisionalRank
      );

      const updatedSelected =
        sortedPatients.find((p) => p.patientId === patientId) || null;

      const newEvent: TimelineEventViewModel = {
        id: `evt-override-${Date.now()}`,
        patientId,
        timestamp: state.summary.simulatedTime,
        relativeTime: "Just now",
        type: "placement-overridden",
        actor: "Provider (Final Authority)",
        title: "Provisional Placement Overridden",
        description: `Position manually updated to #${clampedPos} (previously #${oldPos}). Reason: ${reason}`,
      };

      set({
        patients: sortedPatients,
        selectedPatient: updatedSelected,
        events: [newEvent, ...state.events],
      });
    },

    addPatient: (input: AddPatientInput) => {
      const state = get();
      const newRank = state.patients.length + 1;
      const newPatientId = `pat-${Date.now()}`;

      const newPatient: PatientQueueViewModel = {
        patientId: newPatientId,
        displayId: input.displayId || `P-${Math.floor(100 + Math.random() * 900)}`,
        ageGroup: input.ageGroup || "Adult",
        complaint: input.complaint || "Undifferentiated symptoms",
        clinicianCategory: input.clinicianCategory,
        waitingMinutes: 0,
        minutesSinceReview: 0,
        provisionalRank: newRank,
        bestPossibleRank: Math.max(1, newRank - 1),
        worstPossibleRank: newRank,
        stabilityPercent: 80,
        confidence: "medium",
        reasons: ["Initial intake recorded; baseline observations pending verification"],
        hasUnacknowledgedUpdate: false,
        hasManualConcern: input.manualConcern,
        evidence: [
          {
            id: `ev-init-${Date.now()}`,
            label: "Intake symptom presentation",
            value: input.complaint,
            source: "triage-nurse",
            status: "verified",
            recordedAt: state.summary.simulatedTime,
            relativeTime: "Just now",
          },
        ],
        uncertainties: [],
        wearable: input.connectWearable
          ? {
              connected: true,
              mode: "stable",
              signalQuality: 96,
              completenessPercent: 100,
              motionDetected: false,
              lastReliableReadingAt: state.summary.simulatedTime,
              lastReliableReadingLabel: "Telemetry attached",
              trend: "stable",
              evidenceUsage: "full",
              heartRate: 76,
              points: [{ timestamp: state.summary.simulatedTime, value: 76 }],
            }
          : undefined,
      };

      const updatedPatients = [...state.patients, newPatient];
      const newEvent: TimelineEventViewModel = {
        id: `evt-arr-${Date.now()}`,
        patientId: newPatientId,
        timestamp: state.summary.simulatedTime,
        relativeTime: "Just now",
        type: "arrival",
        actor: "Triage Intake",
        title: "Patient Registered & Triaged",
        description: `Intake complete for ${newPatient.displayId}. Staff Category ${input.clinicianCategory}.`,
      };

      const newSummary = calculateSummary(
        updatedPatients,
        state.summary.simulatedTime
      );

      set({
        patients: updatedPatients,
        selectedPatientId: newPatientId,
        selectedPatient: newPatient,
        events: [newEvent, ...state.events],
        summary: newSummary,
      });
    },

    setWearableMode: (patientId: string, mode: WearableMode) => {
      const state = get();
      const patient = state.patients.find((p) => p.patientId === patientId);
      if (!patient || !patient.wearable) return;

      let signalQuality = 95;
      let motionDetected = false;
      let evidenceUsage: "full" | "reduced" | "excluded" = "full";
      let trend: "rising" | "falling" | "stable" | "uncertain" = "stable";
      let confidence = patient.confidence;
      let eventTitle = "Continuous Monitor Status Changed";
      let eventDesc = `Telemetry mode transitioned to ${mode}.`;

      if (mode === "motion-artifact") {
        signalQuality = 38;
        motionDetected = true;
        evidenceUsage = "reduced";
        trend = "uncertain";
        confidence = "medium";
        eventTitle = "Motion Artefact Detected";
        eventDesc =
          "Movement interference detected. Evidence weight reduced without triggering clinical alert.";
      } else if (mode === "sustained-change") {
        signalQuality = 94;
        motionDetected = false;
        evidenceUsage = "full";
        trend = "rising";
        eventTitle = "Sustained Physiological Trend";
        eventDesc =
          "Multi-reading trend logged. Observation placed in queue awaiting staff confirmation.";
      } else if (mode === "disconnected") {
        signalQuality = 0;
        motionDetected = false;
        evidenceUsage = "excluded";
        trend = "uncertain";
        eventTitle = "Monitor Telemetry Disconnected";
        eventDesc =
          "Continuous connection dropped. Telemetry evidence excluded from placement model.";
      } else if (mode === "stable") {
        signalQuality = 98;
        motionDetected = false;
        evidenceUsage = "full";
        trend = "stable";
        eventTitle = "Continuous Monitor Synchronized";
        eventDesc = "Reliable baseline signal re-established.";
      }

      const updatedPatients = state.patients.map((p) => {
        if (p.patientId !== patientId) return p;
        return {
          ...p,
          confidence,
          hasUnacknowledgedUpdate:
            mode === "sustained-change" ? true : p.hasUnacknowledgedUpdate,
          wearable: p.wearable
            ? {
                ...p.wearable,
                connected: mode !== "disconnected",
                mode,
                signalQuality,
                motionDetected,
                evidenceUsage,
                trend,
              }
            : undefined,
        };
      });

      const updatedSelected =
        updatedPatients.find((p) => p.patientId === patientId) || null;

      const newEvent: TimelineEventViewModel = {
        id: `evt-wear-${Date.now()}`,
        patientId,
        timestamp: state.summary.simulatedTime,
        relativeTime: "Just now",
        type:
          mode === "disconnected"
            ? "wearable-disconnected"
            : "wearable-connected",
        actor: "Continuous Telemetry",
        title: eventTitle,
        description: eventDesc,
      };

      const newSummary = calculateSummary(
        updatedPatients,
        state.summary.simulatedTime
      );

      set({
        patients: updatedPatients,
        selectedPatient: updatedSelected,
        events: [newEvent, ...state.events],
        summary: newSummary,
      });
    },

    advanceDemoTime: (minutes: number) => {
      const state = get();
      const current = parseTime(state.summary.simulatedTime);
      const totalMins = current.hours * 60 + current.minutes + minutes;
      const newSimulatedTime = formatTime(
        Math.floor(totalMins / 60),
        totalMins % 60
      );

      const updatedPatients = state.patients.map((p) => {
        const newWait = p.waitingMinutes + minutes;
        const newReview = p.minutesSinceReview + minutes;

        // If review time exceeds 30m, evidence ages and placement widens
        let confidence = p.confidence;
        let worst = p.worstPossibleRank;
        if (newReview > 30 && p.confidence === "high") {
          confidence = "medium";
          worst = Math.min(state.patients.length, worst + 1);
        }

        return {
          ...p,
          waitingMinutes: newWait,
          minutesSinceReview: newReview,
          confidence,
          worstPossibleRank: worst,
        };
      });

      const newEvent: TimelineEventViewModel = {
        id: `evt-time-${Date.now()}`,
        patientId: state.selectedPatientId || "",
        timestamp: newSimulatedTime,
        relativeTime: "Just now",
        type: "information-added",
        actor: "Operational Clock",
        title: `Simulated Time Advanced (+${minutes}m)`,
        description: `Operational clock advanced to ${newSimulatedTime}. Evidence freshness recalculation applied.`,
      };

      const newSummary = calculateSummary(updatedPatients, newSimulatedTime);

      set({
        patients: updatedPatients,
        selectedPatient:
          updatedPatients.find(
            (p) => p.patientId === state.selectedPatientId
          ) || null,
        events: [newEvent, ...state.events],
        summary: newSummary,
      });
    },

    resetDemo: () => {
      set({
        patients: INITIAL_PATIENTS,
        selectedPatientId: "pat-219",
        selectedPatient:
          INITIAL_PATIENTS.find((p) => p.patientId === "pat-219") || null,
        events: INITIAL_TIMELINE_EVENTS,
        summary: INITIAL_SUMMARY,
        viewMode: "secondlook",
        unstableOnly: false,
      });
    },
  },
}));

/**
 * Standard hook consumed by all visual components.
 */
export function useSecondLookUI(): SecondLookUIAdapter {
  const store = useSecondLookStore();

  return {
    state: {
      patients: store.patients,
      selectedPatientId: store.selectedPatientId,
      selectedPatient: store.selectedPatient,
      events: store.events,
      summary: store.summary,
      viewMode: store.viewMode,
      unstableOnly: store.unstableOnly,
    },
    actions: store.actions,
  };
}
