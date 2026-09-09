import React from "react";
import { WearableViewModel } from "@/types/ui";
import { getWearableModeInfo } from "@/lib/formatters";
import {
  Activity,
  Wifi,
  WifiOff,
  Move,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export interface WearableStatusProps {
  wearable?: WearableViewModel;
}

export function WearableStatus({ wearable }: WearableStatusProps) {
  if (!wearable) {
    return (
      <div className="rounded-md border border-[#DCE5E2] bg-white p-4 text-xs text-[#60706C] flex items-center gap-2">
        <Activity className="w-4 h-4 text-[#A8B6B2]" />
        <span>
          No continuous wearable monitor attached. Patient is managed using
          periodic staff observations.
        </span>
      </div>
    );
  }

  const modeInfo = getWearableModeInfo(wearable.mode);

  // Generate SVG Sparkline coordinates
  const points = wearable.points || [];
  const svgWidth = 240;
  const svgHeight = 44;

  let pathD = "";
  if (points.length > 1) {
    const values = points.map((p) => p.value);
    const minVal = Math.min(...values) - 5;
    const maxVal = Math.max(...values) + 5;
    const valRange = maxVal - minVal || 1;

    const coords = points.map((p, idx) => {
      const x = (idx / (points.length - 1)) * svgWidth;
      const y = svgHeight - ((p.value - minVal) / valRange) * (svgHeight - 10) - 5;
      return { x, y };
    });

    pathD = `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map((c) => `L ${c.x} ${c.y}`).join(" ");
  }

  const getUsageBadge = () => {
    switch (wearable.evidenceUsage) {
      case "full":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1D5E4D] bg-[#EAF5F1] border border-[#BCE1D5] px-1.5 py-0.5 rounded-xs">
            <CheckCircle2 className="w-3 h-3" />
            <span>Full Evidence Usage</span>
          </span>
        );
      case "reduced":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#87590C] bg-[#FDF6E9] border border-[#F4DCB0] px-1.5 py-0.5 rounded-xs">
            <AlertTriangle className="w-3 h-3" />
            <span>Reduced Weight (Uncertain)</span>
          </span>
        );
      case "excluded":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#932C1E] bg-[#FCEEEC] border-[#F5C2BA] px-1.5 py-0.5 rounded-xs">
            <WifiOff className="w-3 h-3" />
            <span>Evidence Excluded</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-md border border-[#DCE5E2] bg-white overflow-hidden">
      <div className="px-4 py-2.5 bg-[#F4F7F6]/60 border-b border-[#DCE5E2] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#147D6F]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#60706C]">
            Continuous Monitor Telemetry
          </h4>
        </div>
        <span
          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-xs border ${modeInfo.badgeClass}`}
        >
          {modeInfo.label}
        </span>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Connection & Evidence Usage Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {wearable.connected ? (
              <span className="flex items-center gap-1.5 font-medium text-[#132824]">
                <Wifi className="w-3.5 h-3.5 text-[#2E8B72]" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-medium text-[#C95C4A]">
                <WifiOff className="w-3.5 h-3.5 text-[#C95C4A]" />
                <span>Disconnected (4m without signal)</span>
              </span>
            )}
          </div>
          {getUsageBadge()}
        </div>

        {/* Status Description (Non-diagnostic clinical wording) */}
        <p className="text-xs text-[#60706C] bg-[#F4F7F6] p-2 rounded-xs border border-[#DCE5E2]/60">
          {modeInfo.description}
        </p>

        {/* Primary Reading Display & Lightweight Sparkline */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-[#FAFBFB] rounded-md border border-[#DCE5E2]">
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#60706C]">
              Continuous Pulse Telemetry
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-[#132824]">
                {wearable.connected && wearable.heartRate ? wearable.heartRate : "—"}
              </span>
              <span className="text-xs text-[#60706C]">bpm</span>
            </div>
            <div className="text-[10px] text-[#60706C] mt-0.5">
              Latest reliable: {wearable.lastReliableReadingLabel}
            </div>
          </div>

          {/* SVG Sparkline */}
          {pathD && (
            <div className="w-full sm:w-auto flex flex-col items-end">
              <svg
                width={svgWidth}
                height={svgHeight}
                className="overflow-visible"
                aria-label="Telemetry pulse trend sparkline"
              >
                {/* Horizontal guide line */}
                <line
                  x1="0"
                  y1={svgHeight / 2}
                  x2={svgWidth}
                  y2={svgHeight / 2}
                  stroke="#DCE5E2"
                  strokeDasharray="2 2"
                />
                {/* Sparkline curve */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={
                    wearable.mode === "motion-artifact"
                      ? "#C78B25"
                      : wearable.mode === "disconnected"
                      ? "#A8B6B2"
                      : "#147D6F"
                  }
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[9px] font-mono text-[#A8B6B2] mt-1">
                Recent 15m Telemetry Trend
              </span>
            </div>
          )}
        </div>

        {/* Sensor Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border-t border-[#F4F7F6] pt-3">
          <div>
            <span className="text-[10px] text-[#60706C] block">Signal Quality</span>
            <span className="font-mono font-bold text-[#132824]">
              {wearable.signalQuality}%
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#60706C] block">Completeness</span>
            <span className="font-mono font-bold text-[#132824]">
              {wearable.completenessPercent}%
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#60706C] block">Movement</span>
            <span className="font-medium text-[#132824] flex items-center gap-1">
              {wearable.motionDetected ? (
                <>
                  <Move className="w-3 h-3 text-[#C78B25]" />
                  <span className="text-[#87590C]">Detected</span>
                </>
              ) : (
                <span className="text-[#60706C]">Stationary</span>
              )}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#60706C] block">Trend Assessment</span>
            <span className="font-semibold capitalize text-[#132824]">
              {wearable.trend}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
