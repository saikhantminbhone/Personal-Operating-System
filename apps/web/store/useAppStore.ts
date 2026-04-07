import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Toast { message: string; type: 'success' | 'error' | 'info' }

interface AppState {
  sidebarCollapsed: boolean
  mobileMenuOpen: boolean
  activeModal: string | null
  toast: Toast | null
  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (val: boolean) => void
  setMobileMenuOpen: (val: boolean) => void
  setModal: (modal: string | null) => void
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  clearToast: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      activeModal: null,
      toast: null,

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),
      setMobileMenuOpen: (val) => set({ mobileMenuOpen: val }),
      setModal: (modal) => set({ activeModal: modal }),

      showToast: (message, type = 'success') => {
        set({ toast: { message, type } })
        setTimeout(() => set({ toast: null }), 3500)
      },
      clearToast: () => set({ toast: null }),
    }),
    {
      name: 'saikhant-os-app',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
)
