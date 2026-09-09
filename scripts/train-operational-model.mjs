import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { RandomForestRegression } from "ml-random-forest";

const FEATURE_NAMES = [
  "waitingRatio",
  "reviewOverdueRatio",
  "completeness",
  "freshness",
  "verification",
  "sourceAgreement",
  "sensorReliability",
  "sensorAttached",
  "unacknowledgedUpdate",
  "manualConcern",
  "confirmedPolicyFlags",
  "missingCount",
  "staleCount",
  "conflictCount",
  "unverifiedCount",
  "sensorProblemCount",
  "scenarioEffect",
];

let randomState = 0x5ec0d10;
function random() {
  randomState = (1664525 * randomState + 1013904223) >>> 0;
  return randomState / 0x100000000;
}

function integer(maximum) {
  return Math.floor(random() * maximum);
}

function example() {
  const waitingRatio = random() * 3;
  const reviewOverdueRatio = random() * 3;
  const completeness = 0.35 + random() * 0.65;
  const freshness = 0.2 + random() * 0.8;
  const verification = 0.4 + random() * 0.6;
  const sourceAgreement = 0.35 + random() * 0.65;
  const sensorAttached = random() > 0.38 ? 1 : 0;
  const sensorReliability = sensorAttached ? random() : 0.5;
  const unacknowledgedUpdate = random() > 0.72 ? 1 : 0;
  const manualConcern = random() > 0.9 ? 1 : 0;
  const confirmedPolicyFlags = integer(3);
  const missingCount = integer(3);
  const staleCount = integer(3);
  const conflictCount = random() > 0.78 ? 1 : 0;
  const unverifiedCount = random() > 0.76 ? 1 : 0;
  const sensorProblemCount = sensorAttached && random() > 0.72 ? integer(3) + 1 : 0;
  const scenarioEffect = random() > 0.72 ? random() * 2 - 1 : 0;
  const features = [
    waitingRatio, reviewOverdueRatio, completeness, freshness, verification,
    sourceAgreement, sensorReliability, sensorAttached, unacknowledgedUpdate,
    manualConcern, confirmedPolicyFlags, missingCount, staleCount, conflictCount,
    unverifiedCount, sensorProblemCount, scenarioEffect,
  ];

  const waitEffect = 6 * (1 - Math.exp(-waitingRatio / 1.2));
  const overdueEffect = reviewOverdueRatio > 0.8
    ? 6 * (1 - Math.exp(-(reviewOverdueRatio - 0.8)))
    : 0;
  const updateInteraction = unacknowledgedUpdate * (3.5 + Math.min(reviewOverdueRatio, 2));
  const adjustment = waitEffect + overdueEffect + updateInteraction + manualConcern * 5
    + confirmedPolicyFlags * 2.5 + scenarioEffect * 11
    + (random() - 0.5) * 0.6;
  const informationGap = (1 - completeness) + (1 - freshness) + (1 - verification) + (1 - sourceAgreement);
  const sensorGap = sensorAttached ? (1 - sensorReliability) * 2 + sensorProblemCount * 0.9 : 0;
  const spread = 0.5 + informationGap * 1.8 + missingCount * 1.2 + staleCount * 1.8
    + conflictCount * 2.6 + unverifiedCount * 1.4 + sensorGap
    + unacknowledgedUpdate * (1 - freshness) * 2;
  return { features, adjustment, spread };
}

function metrics(expected, predicted) {
  const mean = expected.reduce((sum, value) => sum + value, 0) / expected.length;
  const absoluteError = expected.reduce((sum, value, index) => sum + Math.abs(value - predicted[index]), 0) / expected.length;
  const squaredError = expected.reduce((sum, value, index) => sum + (value - predicted[index]) ** 2, 0);
  const total = expected.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  return { mae: Number(absoluteError.toFixed(3)), r2: Number((1 - squaredError / total).toFixed(3)) };
}

const rows = Array.from({ length: 1800 }, example);
const training = rows.slice(0, 1440);
const validation = rows.slice(1440);
const options = {
  seed: 20260909,
  nEstimators: 20,
  maxFeatures: 0.82,
  replacement: false,
  useSampleBagging: true,
  noOOB: true,
  treeOptions: { maxDepth: 8, minNumSamples: 6 },
};
const adjustmentModel = new RandomForestRegression(options);
const spreadModel = new RandomForestRegression({ ...options, seed: 20260910 });
adjustmentModel.train(training.map((row) => row.features), training.map((row) => row.adjustment));
spreadModel.train(training.map((row) => row.features), training.map((row) => row.spread));
const validationFeatures = validation.map((row) => row.features);
const artifact = {
  schemaVersion: 1,
  modelVersion: "operational-rf-2026-09-09.1",
  modelType: "random-forest-regression-ensemble",
  trainingData: "1800 deterministic synthetic operational scenarios; not patient outcomes",
  featureNames: FEATURE_NAMES,
  excludedFeatures: ["age", "complaint text", "diagnosis", "treatment", "demographics"],
  validation: {
    rows: validation.length,
    adjustment: metrics(validation.map((row) => row.adjustment), adjustmentModel.predict(validationFeatures)),
    spread: metrics(validation.map((row) => row.spread), spreadModel.predict(validationFeatures)),
  },
  adjustmentModel: adjustmentModel.toJSON(),
  spreadModel: spreadModel.toJSON(),
};
const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, "../src/ml/models/operational-placement-model.json");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(artifact)}\n`);
console.log(JSON.stringify({ output, version: artifact.modelVersion, validation: artifact.validation }, null, 2));
