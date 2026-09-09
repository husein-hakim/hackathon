"use client";

import React, { useState } from "react";
import {
  Clock,
  AlertCircle,
  BellRing,
  HelpCircle,
  SlidersHorizontal,
  UserPlus,
  Activity,
  Users,
} from "lucide-react";
import { QueueSummaryViewModel } from "@/types/ui";
import { Button } from "@/components/ui/Button";

export interface QueueHeaderProps {
  summary: QueueSummaryViewModel;
  onOpenDemoControls: () => void;
  onOpenIntake: () => void;
}

export function QueueHeader({
  summary,
  onOpenDemoControls,
  onOpenIntake,
}: QueueHeaderProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <header
      role="banner"
      className="shrink-0 bg-white border-b border-[#DCE5E2] px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-20"
    >
      {/* Brand & USP Positioning */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#123D37] text-white font-bold text-sm tracking-wider shadow-xs">
          SL
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-[#132824]">
              SecondLook
            </h1>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-[#EAF0EE] text-[#147D6F] font-semibold rounded-xs">
              Ops Layer
            </span>
          </div>
          <p className="text-xs text-[#60706C]">
            Uncertainty-aware patient attention
          </p>
        </div>
      </div>

      {/* Center Operational Metrics */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        {/* Queue Confidence Chip with Tooltip */}
        <div className="relative">
          <button
            type="button"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F4F7F6] border border-[#DCE5E2] hover:border-[#147D6F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147D6F]"
            aria-describedby="queue-confidence-tooltip"
          >
            <Activity className="w-3.5 h-3.5 text-[#147D6F]" />
            <span className="text-xs text-[#60706C]">Queue confidence:</span>
            <span className="text-xs font-bold font-mono text-[#132824]">
              {summary.queueConfidence}%
            </span>
            <HelpCircle className="w-3 h-3 text-[#A8B6B2] ml-0.5" />
          </button>

          {showTooltip && (
            <div
              id="queue-confidence-tooltip"
              role="tooltip"
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 p-2.5 bg-[#132824] text-white text-[11px] rounded-md shadow-xl z-50 pointer-events-none leading-relaxed"
            >
              <div className="font-semibold text-[#86E0CF] mb-1">
                Operational Stability Index
              </div>
              Queue confidence describes the stability of patient placement
              across tested information scenarios. It is not a measure of
              clinical safety.
            </div>
          )}
        </div>

        {/* Unstable Cases Chip */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs ${
            summary.unstableCount > 0
              ? "bg-[#FCEEEC] border-[#F5C2BA] text-[#932C1E]"
              : "bg-[#F4F7F6] border-[#DCE5E2] text-[#60706C]"
          }`}
          title="Cases where placement changes substantially under reasonable alternative scenarios"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="font-bold font-mono">{summary.unstableCount}</span>
          <span>unstable</span>
        </div>

        {/* Unresolved Updates Chip */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs ${
            summary.unresolvedUpdateCount > 0
              ? "bg-[#FDF6E9] border-[#F4DCB0] text-[#87590C]"
              : "bg-[#F4F7F6] border-[#DCE5E2] text-[#60706C]"
          }`}
          title="New clinical notes or telemetry events awaiting attending staff review"
        >
          <BellRing className="w-3.5 h-3.5" />
          <span className="font-bold font-mono">
            {summary.unresolvedUpdateCount}
          </span>
          <span>updates</span>
        </div>

        {/* Total Waiting */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#F4F7F6] border border-[#DCE5E2] text-xs text-[#60706C]">
          <Users className="w-3.5 h-3.5 text-[#60706C]" />
          <span className="font-bold font-mono text-[#132824]">
            {summary.totalWaiting}
          </span>
          <span>waiting</span>
        </div>

        {/* Simulated Time */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#F4F7F6] border border-[#DCE5E2] text-xs font-mono text-[#132824]">
          <Clock className="w-3.5 h-3.5 text-[#147D6F]" />
          <span className="font-bold">{summary.simulatedTime}</span>
        </div>
      </div>

      {/* Header Actions: Demo Controls & Intake */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenIntake}
          icon={<UserPlus className="w-3.5 h-3.5" />}
        >
          <span>Intake</span>
        </Button>

        <Button
          variant="action"
          size="sm"
          onClick={onOpenDemoControls}
          icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
        >
          <span>Demo Controls</span>
        </Button>
      </div>
    </header>
  );
}
