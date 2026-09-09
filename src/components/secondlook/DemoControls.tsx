"use client";

import React from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  RotateCcw,
  Clock,
  Activity,
  Move,
  WifiOff,
  Wifi,
  Sparkles,
  BellRing,
} from "lucide-react";
import { SecondLookActions } from "@/types/ui";

export interface DemoControlsProps {
  isOpen: boolean;
  onClose: () => void;
  actions: SecondLookActions;
}

export function DemoControls({ isOpen, onClose, actions }: DemoControlsProps) {
  const { showToast } = useToast();

  const handleReset = () => {
    actions.resetDemo();
    showToast({
      type: "info",
      title: "Demonstration Reset",
      description: "Restored pristine fictional cases and initial timestamps.",
    });
  };

  const handleSelectP219 = () => {
    actions.selectPatient("pat-219");
    actions.setViewMode("secondlook");
    showToast({
      type: "info",
      title: "Selected Case P-219",
      description: "Primary demo case: Older adult with breathing discomfort and stale vitals.",
    });
  };

  const handleRefreshP219 = () => {
    actions.resolveUncertainty({
      patientId: "pat-219",
      uncertaintyId: "unc-219-1",
      value: "SpO2 96% on ambient air, RR 18/min",
      note: "Bedside observation refreshed by triage staff.",
    });
    showToast({
      type: "success",
      title: "P-219 Observation Refreshed",
      description: "Placement range collapsed to #3–#4 with High confidence.",
    });
  };

  const handleAdvanceTime = () => {
    actions.advanceDemoTime(5);
    showToast({
      type: "info",
      title: "Operational Time Advanced",
      description: "Simulated clock +5 minutes. Observation aging recomputed.",
    });
  };

  const handleMotionArtefact = () => {
    actions.selectPatient("pat-176");
    actions.setWearableMode("pat-176", "motion-artifact");
    showToast({
      type: "warning",
      title: "P-176 Motion Artefact",
      description: "Movement detected; signal quality reduced to 38% without clinical alarm.",
    });
  };

  const handleSustainedTrend = () => {
    actions.selectPatient("pat-176");
    actions.setWearableMode("pat-176", "sustained-change");
    showToast({
      type: "info",
      title: "P-176 Sustained Trend",
      description: "Consistent multi-reading elevation logged. Awaiting staff review.",
    });
  };

  const handleDisconnect = () => {
    actions.selectPatient("pat-176");
    actions.setWearableMode("pat-176", "disconnected");
    showToast({
      type: "warning",
      title: "P-176 Telemetry Disconnected",
      description: "Continuous signal lost; evidence excluded from queue placement.",
    });
  };

  const handleReconnect = () => {
    actions.selectPatient("pat-301");
    actions.setWearableMode("pat-301", "stable");
    showToast({
      type: "success",
      title: "P-301 Telemetry Reconnected",
      description: "Reliable telemetry baseline re-established.",
    });
  };

  const handleAddUpdate = () => {
    actions.selectPatient("pat-412");
    showToast({
      type: "info",
      title: "P-412 Unacknowledged Note",
      description: "Waiting room note awaiting attending clinician acknowledgement.",
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Hackathon Demo Controller"
      subtitle="Deterministic scenario triggers. Use these buttons to step through the exact judging sequence."
      width="max-w-md"
    >
      <div className="space-y-4 text-xs">
        {/* Scenario 1: Primary Demo Case P-219 */}
        <div className="p-3 bg-[#FAFBFB] rounded-md border border-[#DCE5E2] space-y-2">
          <div className="font-bold text-[#132824] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#147D6F]" />
            <span>Scenario 1: Stale Information & Resolution (P-219)</span>
          </div>
          <p className="text-[11px] text-[#60706C] leading-relaxed">
            Case P-219 starts with a wide #2–#7 range because vital signs are 31
            minutes old. Resolving the uncertainty collapses the range to #3–#4.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={handleSelectP219}>
              Select P-219
            </Button>
            <Button variant="action" size="sm" onClick={handleRefreshP219}>
              Refresh Stale Observation
            </Button>
          </div>
        </div>

        {/* Scenario 2: Wearable Telemetry & Motion (P-176) */}
        <div className="p-3 bg-[#FAFBFB] rounded-md border border-[#DCE5E2] space-y-2">
          <div className="font-bold text-[#132824] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#147D6F]" />
            <span>Scenario 2: Telemetry Artefacts (P-176)</span>
          </div>
          <p className="text-[11px] text-[#60706C] leading-relaxed">
            Distinguishes movement interference from true physiological trend
            without sounding false alarms.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMotionArtefact}
              icon={<Move className="w-3 h-3 text-[#C78B25]" />}
            >
              Simulate Motion Artefact
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSustainedTrend}
              icon={<Activity className="w-3 h-3 text-[#147D6F]" />}
            >
              Simulate Sustained Trend
            </Button>
          </div>
        </div>

        {/* Scenario 3: Telemetry Dropout & Recovery (P-301) */}
        <div className="p-3 bg-[#FAFBFB] rounded-md border border-[#DCE5E2] space-y-2">
          <div className="font-bold text-[#132824] flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5 text-[#C95C4A]" />
            <span>Scenario 3: Wearable Disconnection</span>
          </div>
          <p className="text-[11px] text-[#60706C] leading-relaxed">
            Demonstrates graceful fallback when wearable signal drops out and
            subsequent re-synchronization.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDisconnect}
              icon={<WifiOff className="w-3 h-3 text-[#C95C4A]" />}
            >
              Disconnect P-176
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReconnect}
              icon={<Wifi className="w-3 h-3 text-[#2E8B72]" />}
            >
              Reconnect P-301
            </Button>
          </div>
        </div>

        {/* Scenario 4: Operational Clock & Aging */}
        <div className="p-3 bg-[#FAFBFB] rounded-md border border-[#DCE5E2] space-y-2">
          <div className="font-bold text-[#132824] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#147D6F]" />
            <span>Operational Time & Aging</span>
          </div>
          <p className="text-[11px] text-[#60706C] leading-relaxed">
            Simulate the passage of time to demonstrate how waiting time accumulates
            and observations become stale.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAdvanceTime}
              icon={<Clock className="w-3 h-3" />}
            >
              Advance 5 Minutes
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddUpdate}
              icon={<BellRing className="w-3 h-3" />}
            >
              Highlight Unacknowledged Note
            </Button>
          </div>
        </div>

        {/* Global Reset */}
        <div className="pt-3 border-t border-[#DCE5E2] flex items-center justify-between">
          <span className="text-[11px] text-[#60706C]">
            Restore initial demo data
          </span>
          <Button
            variant="danger"
            size="sm"
            onClick={handleReset}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Entire Demo
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
