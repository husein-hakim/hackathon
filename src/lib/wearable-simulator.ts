export type WearableMode =
  | "stable"
  | "sustained-change"
  | "motion-artifact"
  | "intermittent-dropout"
  | "disconnected";

export type WearableReading = {
  id: string;
  patientId: string;
  timestamp: string;
  heartRate: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  motionLevel: number;
  signalQuality: number;
  connected: boolean;
};

export function generateWearableReadings(
  patientId: string,
  mode: WearableMode,
  endTime: Date,
  count = 8,
): WearableReading[] {
  return Array.from({ length: count }, (_, index) => {
    const timestamp = new Date(endTime.getTime() - (count - index - 1) * 30_000).toISOString();
    const base = {
      id: `${patientId}-${mode}-${index}`,
      patientId,
      timestamp,
    };
    if (mode === "disconnected") {
      return { ...base, heartRate: null, respiratoryRate: null, oxygenSaturation: null, motionLevel: 0, signalQuality: 0, connected: false };
    }
    if (mode === "intermittent-dropout") {
      const available = index % 3 !== 1;
      return {
        ...base,
        heartRate: available ? 80 + (index % 2) : null,
        respiratoryRate: available ? 17 : null,
        oxygenSaturation: available ? 97 : null,
        motionLevel: 12,
        signalQuality: available ? 58 : 0,
        connected: available,
      };
    }
    if (mode === "motion-artifact") {
      const affected = index >= count - 3;
      return {
        ...base,
        heartRate: affected ? 111 + index : 81 + (index % 2),
        respiratoryRate: affected ? 24 : 17,
        oxygenSaturation: affected ? 93 : 97,
        motionLevel: affected ? 92 : 8,
        signalQuality: affected ? 24 : 88,
        connected: true,
      };
    }
    if (mode === "sustained-change") {
      return {
        ...base,
        heartRate: 78 + index * 3,
        respiratoryRate: 16 + Math.floor(index / 2),
        oxygenSaturation: 97 - Math.floor(index / 4),
        motionLevel: 7,
        signalQuality: 91,
        connected: true,
      };
    }
    return {
      ...base,
      heartRate: 80 + [0, 1, -1, 0][index % 4],
      respiratoryRate: 17 + [0, 0, 1, -1][index % 4],
      oxygenSaturation: 97 + [0, 0, -1, 0][index % 4],
      motionLevel: 6 + (index % 3),
      signalQuality: 92 - (index % 3),
      connected: true,
    };
  });
}
