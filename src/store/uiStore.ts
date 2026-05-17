import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UiStore = {
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void;
};

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebarOpen: true,
      mobileMenuOpen: false,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open })
    }),
    {
      name: 'secureship-ui',
      partialize: (state) => ({ theme: state.theme, sidebarOpen: state.sidebarOpen })
    }
  )
);