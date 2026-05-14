'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ModelPreferencesState {
  allowedModelIds: string[];
  enabledModelIds: string[];
  hasHydrated: boolean;
  setAllowedModelIds: (ids: string[]) => void;
  setEnabledModelIds: (ids: string[]) => void;
  toggleModelEnabled: (id: string) => void;
  markHydrated: () => void;
}

export const useModelPreferencesStore = create<ModelPreferencesState>()(
  persist(
    (set, get) => ({
      allowedModelIds: [],
      enabledModelIds: [],
      hasHydrated: false,

      setAllowedModelIds: (ids) => {
        const allowed = Array.from(new Set(ids));
        const currentEnabled = get().enabledModelIds;
        const filteredEnabled = currentEnabled.filter((id) =>
          allowed.includes(id),
        );

        set({
          allowedModelIds: allowed,
          enabledModelIds:
            filteredEnabled.length > 0 ? filteredEnabled : allowed,
        });
      },

      setEnabledModelIds: (ids) => {
        const allowed = get().allowedModelIds;
        const cleaned = Array.from(new Set(ids)).filter((id) =>
          allowed.includes(id),
        );
        set({ enabledModelIds: cleaned.length > 0 ? cleaned : allowed });
      },

      toggleModelEnabled: (id) => {
        const { allowedModelIds, enabledModelIds } = get();
        if (!allowedModelIds.includes(id)) return;

        const currentlyEnabled = enabledModelIds.includes(id);
        const nextEnabled = currentlyEnabled
          ? enabledModelIds.filter((modelId) => modelId !== id)
          : [...enabledModelIds, id];

        set({
          enabledModelIds:
            nextEnabled.length > 0 ? nextEnabled : enabledModelIds,
        });
      },

      markHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: 'vel-model-preferences-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ enabledModelIds: state.enabledModelIds }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);
