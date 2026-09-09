"use client";

import { useState } from "react";
import { useSecondLookUI } from "@/lib/ui-adapter";
import { Drawer } from "@/components/ui/Drawer";
import { QueueHeader } from "./QueueHeader";
import { QueueBoard } from "./QueueBoard";
import { CaseDetailPanel } from "./CaseDetailPanel";
import { SafetyFooter } from "./SafetyFooter";
import { DemoControls } from "./DemoControls";
import { IntakeDrawer } from "./IntakeDrawer";

export function ApplicationShell() {
  const { state, actions } = useSecondLookUI();
  const [isDemoControlsOpen, setIsDemoControlsOpen] = useState(false);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  const selectPatient = (patientId: string) => {
    actions.selectPatient(patientId);
    if (typeof window !== "undefined" && window.innerWidth < 768) setIsMobileDetailOpen(true);
  };

  const detailProps = {
    patient: state.selectedPatient,
    totalPatients: state.patients.length,
    events: state.events,
    onResolveUncertainty: actions.resolveUncertainty,
    onAcknowledgeUpdate: actions.acknowledgeUpdate,
    onRequestReassessment: actions.requestReassessment,
    onOverridePlacement: actions.overridePlacement,
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#F3F6F5]">
      <QueueHeader summary={state.summary} onOpenDemoControls={() => setIsDemoControlsOpen(true)} onOpenIntake={() => setIsIntakeOpen(true)} />
      <main className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col md:w-[48%]">
          <QueueBoard
            patients={state.patients}
            selectedPatientId={state.selectedPatientId}
            unstableOnly={state.unstableOnly}
            onSelectPatient={selectPatient}
            onToggleUnstableOnly={actions.setUnstableOnly}
          />
        </div>
        <div className="hidden h-full w-[52%] min-w-[420px] border-l border-[#D8E1DE] md:block">
          <CaseDetailPanel {...detailProps} />
        </div>
      </main>
      <SafetyFooter />

      <Drawer isOpen={isMobileDetailOpen} onClose={() => setIsMobileDetailOpen(false)} title={state.selectedPatient ? `Case ${state.selectedPatient.displayId}` : "Case detail"} subtitle={state.selectedPatient?.complaint} width="max-w-xl">
        <CaseDetailPanel {...detailProps} onCloseMobile={() => setIsMobileDetailOpen(false)} />
      </Drawer>
      <DemoControls isOpen={isDemoControlsOpen} onClose={() => setIsDemoControlsOpen(false)} actions={actions} />
      <IntakeDrawer isOpen={isIntakeOpen} onClose={() => setIsIntakeOpen(false)} onAddPatient={actions.addPatient} simulatedTime={state.summary.simulatedTime} />
    </div>
  );
}
