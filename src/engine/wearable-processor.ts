import type { WearableReading } from "@/lib/wearable-simulator";

export type WearableWindow = {
  patientId: string;
  medianHeartRate: number | null;
  medianRespiratoryRate: number | null;
  medianOxygenSaturation: number | null;
  validReadingPercent: number;
  averageSignalQuality: number;
  trend: "rising" | "falling" | "stable" | "uncertain";
  motionOverlap: boolean;
  connected: boolean;
  lastReliableReadingAt: string | null;
  evidenceUsage: "full" | "reduced" | "excluded";
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Number(((sorted[middle - 1] + sorted[middle]) / 2).toFixed(1));
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function processWearableWindow(readings: WearableReading[]): WearableWindow {
  const sorted = [...readings].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  const patientId = sorted[0]?.patientId ?? "unknown";
  const valid = sorted.filter((reading) =>
    reading.connected
    && reading.signalQuality >= 25
    && reading.heartRate !== null
    && reading.respiratoryRate !== null
    && reading.oxygenSaturation !== null,
  );
  const validReadingPercent = sorted.length === 0 ? 0 : Math.round((valid.length / sorted.length) * 100);
  const averageSignalQuality = Math.round(average(sorted.map((reading) => reading.signalQuality)));
  const motionOverlap = sorted.some((reading) => reading.motionLevel >= 60 && reading.signalQuality < 50);
  const connected = Boolean(sorted.at(-1)?.connected);
  const reliable = sorted.filter((reading) => reading.connected && reading.signalQuality >= 70 && reading.heartRate !== null);
  const lastReliableReadingAt = reliable.at(-1)?.timestamp ?? null;

  let evidenceUsage: WearableWindow["evidenceUsage"] = "excluded";
  if (connected && validReadingPercent >= 80 && averageSignalQuality >= 75 && !motionOverlap) evidenceUsage = "full";
  else if (connected && validReadingPercent >= 40 && averageSignalQuality >= 35) evidenceUsage = "reduced";

  let trend: WearableWindow["trend"] = "uncertain";
  if (evidenceUsage !== "excluded" && !motionOverlap && valid.length >= 4) {
    const midpoint = Math.floor(valid.length / 2);
    const change = average(valid.slice(midpoint).map((reading) => reading.heartRate as number))
      - average(valid.slice(0, midpoint).map((reading) => reading.heartRate as number));
    trend = change > 3 ? "rising" : change < -3 ? "falling" : "stable";
  }

  return {
    patientId,
    medianHeartRate: median(valid.map((reading) => reading.heartRate as number)),
    medianRespiratoryRate: median(valid.map((reading) => reading.respiratoryRate as number)),
    medianOxygenSaturation: median(valid.map((reading) => reading.oxygenSaturation as number)),
    validReadingPercent,
    averageSignalQuality,
    trend,
    motionOverlap,
    connected,
    lastReliableReadingAt,
    evidenceUsage,
  };
}
