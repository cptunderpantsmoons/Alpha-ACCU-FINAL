import { create } from 'zustand';

interface AuthState {
  user: {
    id: string;
    email: string;
    roles: string[];
    currentEntityId: string | null;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthState['user'], token: string) => void;
  logout: () => void;
  setCurrentEntity: (entityId: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
  setCurrentEntity: (entityId) => set((state) => ({
    user: state.user ? { ...state.user, currentEntityId: entityId } : null
  })),
}));