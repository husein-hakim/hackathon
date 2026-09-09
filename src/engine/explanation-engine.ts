import type { PlacementResult, Uncertainty } from "@/engine/types";

export function explainUncertainty(uncertainty: Uncertainty): string {
  switch (uncertainty.type) {
    case "stale":
      return uncertainty.explanation;
    case "conflicting":
      return "Two unresolved records disagree. Neither has been marked as corrected.";
    case "unverified":
      return "This information has not yet been confirmed by a staff member.";
    case "unacknowledged":
      return "New information has arrived since the last recorded review.";
    case "sensor-dropout":
      return "The connected device has not supplied a reliable recent reading.";
    case "motion-artifact":
      return "Movement occurred during the signal change, reducing confidence in the reading.";
    default:
      return uncertainty.explanation;
  }
}

export function explainPlacement(placement: PlacementResult, uncertainties: Uncertainty[]): string[] {
  const facts = uncertainties.map(explainUncertainty);
  if (placement.bestPossibleRank !== placement.worstPossibleRank) {
    facts.push(`The operational position changes between #${placement.bestPossibleRank} and #${placement.worstPossibleRank} across transparent scenarios.`);
  }
  return facts.filter((reason, index, all) => all.indexOf(reason) === index).slice(0, 4);
}
