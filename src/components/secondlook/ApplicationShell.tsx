"use client";

import React, { useState } from "react";
import { useSecondLookUI } from "@/lib/ui-adapter";
import { QueueHeader } from "./QueueHeader";
import { QueueBoard } from "./QueueBoard";
import { CaseDetailPanel } from "./CaseDetailPanel";
import { SafetyFooter } from "./SafetyFooter";
import { DemoControls } from "./DemoControls";
import { IntakeDrawer } from "./IntakeDrawer";
import { Drawer } from "@/components/ui/Drawer";
import { Bell } from "lucide-react";

export function ApplicationShell() {
  const { state, actions } = useSecondLookUI();
  const [isDemoControlsOpen, setIsDemoControlsOpen] = useState(false);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  const handleSelectPatient = (patientId: string) => {
    actions.selectPatient(patientId);
    // On small screens, open the detail drawer when a patient is tapped
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileDetailOpen(true);
    }
  };

  const latestEvent = state.events[0];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F4F7F6]">
      {/* 1. Command Centre Header */}
      <QueueHeader
        summary={state.summary}
        onOpenDemoControls={() => setIsDemoControlsOpen(true)}
        onOpenIntake={() => setIsIntakeOpen(true)}
      />

      {/* 2. Main Workstation Area: Split 65–70% Queue, 30–35% Case Detail */}
      <main
        role="main"
        className="flex-1 flex min-h-0 w-full overflow-hidden"
      >
        {/* Queue Board (Primary 65-70% on desktop) */}
        <div className="flex-1 lg:w-[68%] min-w-0 h-full flex flex-col">
          <QueueBoard
            patients={state.patients}
            selectedPatientId={state.selectedPatientId}
            viewMode={state.viewMode}
            unstableOnly={state.unstableOnly}
            onSelectPatient={handleSelectPatient}
            onViewChange={actions.setViewMode}
            onToggleUnstableOnly={actions.setUnstableOnly}
          />
        </div>

        {/* Persistent Selected Case Panel (32% on desktop) */}
        <div className="hidden lg:block w-[32%] min-w-[380px] max-w-[500px] h-full border-l border-[#DCE5E2] bg-white">
          <CaseDetailPanel
            patient={state.selectedPatient}
            totalPatients={state.patients.length}
            events={state.events}
            onResolveUncertainty={actions.resolveUncertainty}
            onAcknowledgeUpdate={actions.acknowledgeUpdate}
            onRequestReassessment={actions.requestReassessment}
            onOverridePlacement={actions.overridePlacement}
          />
        </div>
      </main>

      {/* 3. Operational Ticker Strip: Latest Event Banner */}
      {latestEvent && (
        <div
          role="status"
          aria-live="polite"
          className="shrink-0 bg-[#EAF0EE] border-t border-[#DCE5E2] px-6 py-1.5 flex items-center justify-between text-xs text-[#60706C] z-10"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="flex items-center gap-1 font-semibold text-[#147D6F] uppercase tracking-wider text-[10px]">
              <Bell className="w-3 h-3 text-[#147D6F]" />
              <span>Latest Queue Event:</span>
            </span>
            <span className="truncate text-[#132824] font-medium">
              {latestEvent.title} — {latestEvent.description}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] text-[#A8B6B2] shrink-0 ml-2">
            <span>{latestEvent.timestamp}</span>
            <span>({latestEvent.relativeTime})</span>
          </div>
        </div>
      )}

      {/* 4. Persistent Safety & Clinical Guardrails Footer */}
      <SafetyFooter />

      {/* Mobile / Tablet Full-Height Case Detail Drawer */}
      <Drawer
        isOpen={isMobileDetailOpen}
        onClose={() => setIsMobileDetailOpen(false)}
        title={state.selectedPatient ? `Case ${state.selectedPatient.displayId}` : "Case Detail"}
        subtitle={state.selectedPatient?.complaint}
        width="max-w-xl"
      >
        <CaseDetailPanel
          patient={state.selectedPatient}
          totalPatients={state.patients.length}
          events={state.events}
          onCloseMobile={() => setIsMobileDetailOpen(false)}
          onResolveUncertainty={actions.resolveUncertainty}
          onAcknowledgeUpdate={actions.acknowledgeUpdate}
          onRequestReassessment={actions.requestReassessment}
          onOverridePlacement={actions.overridePlacement}
        />
      </Drawer>

      {/* Demo Controls Drawer */}
      <DemoControls
        isOpen={isDemoControlsOpen}
        onClose={() => setIsDemoControlsOpen(false)}
        actions={actions}
      />

      {/* Patient Intake Drawer */}
      <IntakeDrawer
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onAddPatient={actions.addPatient}
        simulatedTime={state.summary.simulatedTime}
      />
    </div>
  );
}
