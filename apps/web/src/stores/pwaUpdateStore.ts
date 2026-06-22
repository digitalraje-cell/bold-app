import { create } from 'zustand';

export type PwaUpdateEvent = 'UPDATE_AVAILABLE' | null;

type PwaUpdateState = {
  updateAvailable: boolean;
  pendingUpdate: boolean;
  forceUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
  lastEvent: PwaUpdateEvent;
  dismissedMeetingBanner: boolean;
  setRegistration: (registration: ServiceWorkerRegistration | null) => void;
  dispatchUpdateAvailable: (forceUpdate?: boolean) => void;
  setPendingUpdate: (pending: boolean) => void;
  setForceUpdate: (force: boolean) => void;
  dismissMeetingBanner: () => void;
  clearUpdate: () => void;
};

export const usePwaUpdateStore = create<PwaUpdateState>((set) => ({
  updateAvailable: false,
  pendingUpdate: false,
  forceUpdate: false,
  registration: null,
  lastEvent: null,
  dismissedMeetingBanner: false,
  setRegistration: (registration) => set({ registration }),
  dispatchUpdateAvailable: (forceUpdate) =>
    set((state) => ({
      updateAvailable: true,
      pendingUpdate: true,
      forceUpdate: forceUpdate ?? state.forceUpdate,
      lastEvent: 'UPDATE_AVAILABLE',
      dismissedMeetingBanner: false,
    })),
  setPendingUpdate: (pending) => set({ pendingUpdate: pending }),
  setForceUpdate: (force) => set({ forceUpdate: force }),
  dismissMeetingBanner: () => set({ dismissedMeetingBanner: true }),
  clearUpdate: () =>
    set({
      updateAvailable: false,
      pendingUpdate: false,
      forceUpdate: false,
      lastEvent: null,
      dismissedMeetingBanner: false,
    }),
}));
