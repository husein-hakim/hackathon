import { DEMO_START_TIME } from "@/data/demo-patients";
import type { TimelineEvent } from "@/engine/types";

const atMinutesAgo = (minutes: number) =>
  new Date(new Date(DEMO_START_TIME).getTime() - minutes * 60_000).toISOString();

export const DEMO_EVENTS: TimelineEvent[] = [
  {
    id: "event-p219-update",
    patientId: "patient-219",
    timestamp: atMinutesAgo(4),
    type: "information-added",
    actor: "Triage nurse",
    title: "New nursing update",
    description: "A fictional operational note arrived after the last recorded review.",
  },
  {
    id: "event-p412-update",
    patientId: "patient-412",
    timestamp: atMinutesAgo(3),
    type: "information-added",
    actor: "Triage nurse",
    title: "New nursing note",
    description: "A fictional note is awaiting acknowledgement.",
  },
  {
    id: "event-p301-disconnected",
    patientId: "patient-301",
    timestamp: atMinutesAgo(1),
    type: "wearable-disconnected",
    actor: "Simulator",
    title: "Wearable disconnected",
    description: "The demonstration device stopped supplying current data.",
  },
];

export function createDemoEvents(): TimelineEvent[] {
  return structuredClone(DEMO_EVENTS);
}
