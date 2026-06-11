import { create } from 'zustand';

interface ProfileState {
  displayName: string;
  avatarUrl: string | undefined;
  initials: string;
  initialized: boolean;
  setProfile: (p: Partial<Pick<ProfileState, 'displayName' | 'avatarUrl' | 'initials'>>) => void;
  initFromUser: (p: { displayName: string; avatarUrl: string | undefined; initials: string }) => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  displayName: 'Your Name',
  avatarUrl: undefined,
  initials: '?',
  initialized: false,
  setProfile: (p) => set(p),
  initFromUser: (p) => {
    if (get().initialized) return;
    set({ ...p, initialized: true });
  },
  reset: () => set({ displayName: 'Your Name', avatarUrl: undefined, initials: '?', initialized: false }),
}));
