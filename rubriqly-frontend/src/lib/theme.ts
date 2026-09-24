// Light / dark / system theme. The choice is a per-device preference kept in localStorage;
// index.html applies it before first paint, and this module keeps it in sync afterwards.

export type ThemePreference = 'light' | 'dark' | 'system'

const KEY = 'rubriqly:theme'
const listeners = new Set<() => void>()

export function getThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

function systemPrefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return pref
}

export function applyTheme(pref: ThemePreference = getThemePreference()): void {
  document.documentElement.dataset.theme = resolveTheme(pref)
}

export function setThemePreference(pref: ThemePreference): void {
  try {
    if (pref === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, pref)
  } catch {
    // Storage blocked: the theme still applies for this visit.
  }
  applyTheme(pref)
  listeners.forEach((notify) => notify())
}

/** For useSyncExternalStore: re-render when the preference changes. */
export function subscribeTheme(notify: () => void): () => void {
  listeners.add(notify)
  return () => listeners.delete(notify)
}

/** Follow the OS setting live while the preference is "system". */
export function watchSystemTheme(): () => void {
  if (typeof matchMedia !== 'function') return () => {}
  const media = matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (getThemePreference() === 'system') applyTheme('system')
  }
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
