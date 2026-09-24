import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { ACCOUNT_KEY, getAccount } from './auth'
import { getThemePreference, subscribeTheme } from './theme'

/** The signed-in account (`data` is null when signed out). Asked of the server once per visit. */
export function useAccount() {
  return useQuery({ queryKey: ACCOUNT_KEY, queryFn: getAccount, staleTime: Infinity })
}

export function useThemePreference() {
  return useSyncExternalStore(subscribeTheme, getThemePreference)
}

const SIDEBAR_KEY = 'rubriqly:sidebar-collapsed'

export function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === '1'
  } catch {
    return false
  }
}

export function writeSidebarCollapsed(collapsed: boolean): void {
  try {
    if (collapsed) localStorage.setItem(SIDEBAR_KEY, '1')
    else localStorage.removeItem(SIDEBAR_KEY)
  } catch {
    // Storage blocked: the choice lasts for this visit.
  }
}
