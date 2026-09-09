"use client";

import { mapSecondLookViewModel, toDomainPatientId } from "@/lib/view-model-mapper";
import { useSecondLookStore as useDomainStore, type SecondLookStore } from "@/store/useSecondLookStore";
import type { SecondLookActions, SecondLookUIAdapter, SecondLookViewModel } from "@/types/ui";

type UIStoreState = SecondLookViewModel & { actions: SecondLookActions };

function createActions(): SecondLookActions {
  return {
    selectPatient: (patientId) => useDomainStore.getState().selectPatient(toDomainPatientId(patientId)),
    setViewMode: (mode) => useDomainStore.getState().setViewMode(mode),
    setUnstableOnly: (enabled) => useDomainStore.getState().setUnstableOnly(enabled),
    resolveUncertainty: (input) => {
      const store = useDomainStore.getState();
      const patientId = toDomainPatientId(input.patientId);
      const uncertainties = store.engineResult.qualityResults.find((quality) => quality.patientId === patientId)?.uncertainties ?? [];
      const uncertaintyId = uncertainties.some((uncertainty) => uncertainty.id === input.uncertaintyId)
        ? input.uncertaintyId
        : (uncertainties.find((uncertainty) => uncertainty.type === "stale")?.id ?? input.uncertaintyId);
      store.resolveUncertainty({ ...input, patientId, uncertaintyId });
    },
    acknowledgeUpdate: (patientId, eventId) => useDomainStore.getState().acknowledgeUpdate(toDomainPatientId(patientId), eventId),
    requestReassessment: (patientId) => useDomainStore.getState().requestReassessment(toDomainPatientId(patientId)),
    overridePlacement: (input) => useDomainStore.getState().overridePlacement({ ...input, patientId: toDomainPatientId(input.patientId) }),
    addPatient: (input) => useDomainStore.getState().addPatient(input),
    setWearableMode: (patientId, mode) => useDomainStore.getState().setWearableMode(toDomainPatientId(patientId), mode),
    advanceDemoTime: (minutes) => useDomainStore.getState().advanceDemoTime(minutes),
    resetDemo: () => useDomainStore.getState().resetDemo(),
  };
}

function mapStore(store: SecondLookStore): UIStoreState {
  return { ...mapSecondLookViewModel(store), actions: createActions() };
}

/** Compatibility hook retaining Person 1's original public store shape. */
export function useSecondLookStore(): UIStoreState {
  return mapStore(useDomainStore());
}

useSecondLookStore.getState = (): UIStoreState => mapStore(useDomainStore.getState());

export function useSecondLookUI(): SecondLookUIAdapter {
  const store = useSecondLookStore();
  const { actions, ...state } = store;
  return { state, actions };
}
