"use client";

import React from "react";
import { motion } from "framer-motion";
import { ConfidenceLevel } from "@/types/ui";
import { getConfidenceInfo, formatPlacementRange } from "@/lib/formatters";

export interface PlacementRangeProps {
  bestRank: number;
  worstRank: number;
  provisionalRank: number;
  maxRank?: number;
  confidence: ConfidenceLevel;
  compact?: boolean;
  showTicks?: boolean;
  className?: string;
}

export function PlacementRange({
  bestRank,
  worstRank,
  provisionalRank,
  maxRank = 7,
  confidence,
  compact = false,
  showTicks = true,
  className = "",
}: PlacementRangeProps) {
  const confInfo = getConfidenceInfo(confidence);
  const totalSlots = Math.max(maxRank, worstRank, 7);

  // Position calculations in percentages:
  // Slot 1 is at 0%, Slot totalSlots is at 100%
  const getPercent = (rank: number) => {
    if (totalSlots <= 1) return 50;
    return ((rank - 1) / (totalSlots - 1)) * 100;
  };

  const leftPercent = getPercent(bestRank);
  const rightPercent = getPercent(worstRank);
  const currentPercent = getPercent(provisionalRank);
  const widthPercent = Math.max(3, rightPercent - leftPercent);

  // Determine span width state for subtle visual reinforcement
  const spanDistance = worstRank - bestRank;
  const isStable = spanDistance <= 1;

  if (compact) {
    return (
      <div
        className={`flex flex-col gap-1 w-full ${className}`}
        aria-label={`Provisional position ${provisionalRank}, possible placement between ${bestRank} and ${worstRank}, ${confInfo.label} confidence`}
      >
        {/* Visual Mini Span */}
        <div className="relative h-3 w-full bg-[#EAF0EE] rounded-sm overflow-hidden flex items-center">
          {/* Active Range Bracket */}
          <motion.div
            className="absolute h-2 rounded-xs transition-all duration-300"
            style={{
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              backgroundColor: confInfo.hex,
              opacity: 0.25,
            }}
            layout
          />
          <motion.div
            className="absolute h-2 border-y-2 transition-all duration-300"
            style={{
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              borderColor: confInfo.hex,
            }}
            layout
          />
          {/* Current Marker Dot */}
          <motion.div
            className="absolute w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs z-10 transition-all duration-300"
            style={{
              left: `calc(${currentPercent}% - 5px)`,
              backgroundColor: confInfo.hex,
            }}
            layout
          />
        </div>

        {/* Text Representation */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#60706C] font-mono">
            Range:{" "}
            <span className="font-semibold text-[#132824]">
              {formatPlacementRange(bestRank, worstRank)}
            </span>
          </span>
          <span className="font-mono text-[#60706C]">
            Prov: <span className="font-bold text-[#132824]">#{provisionalRank}</span>
          </span>
        </div>
      </div>
    );
  }

  // Expanded Detailed Mode
  return (
    <div
      className={`p-3.5 bg-[#F4F7F6]/80 rounded-md border border-[#DCE5E2] flex flex-col gap-2.5 ${className}`}
      aria-label={`Provisional position ${provisionalRank}, possible placement between ${bestRank} and ${worstRank}, ${confInfo.label} confidence`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-[#60706C] uppercase">
          Possible Placement Span
        </span>
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-[#60706C]">Bounds:</span>
          <span
            className="font-bold px-1.5 py-0.5 rounded-xs"
            style={{
              backgroundColor: confInfo.bgClass.split(" ")[0].replace("bg-", ""),
              color: confInfo.hex,
            }}
          >
            {formatPlacementRange(bestRank, worstRank)}
          </span>
        </div>
      </div>

      {/* Axis Scale and Number Ticks */}
      <div className="relative pt-2 pb-5 px-2">
        {/* Scale Ticks */}
        {showTicks && (
          <div className="flex justify-between w-full mb-1">
            {Array.from({ length: totalSlots }).map((_, i) => {
              const rankNum = i + 1;
              const isCurrent = rankNum === provisionalRank;
              const inRange = rankNum >= bestRank && rankNum <= worstRank;
              return (
                <div
                  key={rankNum}
                  className="flex flex-col items-center select-none"
                  style={{ width: `${100 / totalSlots}%` }}
                >
                  <span
                    className={`text-[11px] font-mono font-medium ${
                      isCurrent
                        ? "text-[#132824] font-bold"
                        : inRange
                        ? "text-[#60706C]"
                        : "text-[#A8B6B2]"
                    }`}
                  >
                    #{rankNum}
                  </span>
                  <div
                    className={`w-0.5 h-1.5 mt-0.5 ${
                      isCurrent
                        ? "bg-[#132824] h-2"
                        : inRange
                        ? "bg-[#60706C]"
                        : "bg-[#DCE5E2]"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Track Line */}
        <div className="relative h-3 w-full bg-[#EAF0EE] rounded-sm flex items-center mx-auto">
          {/* Placement Range Highlight Band */}
          <motion.div
            className="absolute h-full rounded-sm transition-all duration-300"
            style={{
              left: `${leftPercent}%`,
              width: `${Math.max(2, rightPercent - leftPercent)}%`,
              backgroundColor: confInfo.hex,
              opacity: 0.22,
            }}
            layout
          />

          {/* Left Bracket / Boundary Ticks */}
          <motion.div
            className="absolute h-4 w-1 rounded-l-xs z-10 transition-all duration-300"
            style={{
              left: `calc(${leftPercent}% - 2px)`,
              backgroundColor: confInfo.hex,
            }}
            layout
            title={`Best possible rank: #${bestRank}`}
          />

          {/* Center Connector Bar */}
          <motion.div
            className="absolute h-1 z-10 transition-all duration-300"
            style={{
              left: `${leftPercent}%`,
              width: `${Math.max(2, rightPercent - leftPercent)}%`,
              backgroundColor: confInfo.hex,
            }}
            layout
          />

          {/* Right Bracket / Boundary Ticks */}
          <motion.div
            className="absolute h-4 w-1 rounded-r-xs z-10 transition-all duration-300"
            style={{
              left: `calc(${rightPercent}% - 2px)`,
              backgroundColor: confInfo.hex,
            }}
            layout
            title={`Worst possible rank: #${worstRank}`}
          />

          {/* Current Provisional Marker */}
          <motion.div
            className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md z-20 flex items-center justify-center transition-all duration-300"
            style={{
              left: `calc(${currentPercent}% - 8px)`,
              backgroundColor: confInfo.hex,
            }}
            layout
            title={`Provisional rank: #${provisionalRank}`}
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </motion.div>
        </div>

        {/* Indicator Callout Below Track */}
        <div
          className="absolute -bottom-1 transform -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300"
          style={{ left: `${currentPercent}%` }}
        >
          <div className="w-1.5 h-1.5 bg-[#132824] rotate-45 mb-0.5" />
          <span className="text-[10px] font-mono font-bold text-[#132824] whitespace-nowrap bg-white px-1 border border-[#DCE5E2] rounded-xs shadow-2xs">
            current #{provisionalRank}
          </span>
        </div>
      </div>

      {/* Narrative Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-[#DCE5E2] text-xs">
        <span className="text-[#60706C]">
          {isStable
            ? "Stable operational positioning"
            : `Wide variance across scenarios (span: ${spanDistance + 1} positions)`}
        </span>
        <span className="font-mono text-[#132824] font-medium">
          Confidence: <span style={{ color: confInfo.hex }}>{confInfo.label}</span>
        </span>
      </div>
    </div>
  );
}
