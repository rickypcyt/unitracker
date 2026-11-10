import { create } from 'zustand';

interface NotificationPromptState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useNotificationPromptStore = create<NotificationPromptState>(set => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
