import type { Assignment, CheckResult, Draft, Rubric } from './types'

// Drafts stay on this device: assignments, drafts, check results and the rubrics a student
// creates live in the browser's localStorage. Only the text being checked leaves the
// device, sent to the backend for scoring. Storage can be unavailable (private windows, blocked
// site data), so every access is guarded and falls back to memory for the current tab.
//
// Each account has its own key (`rubriqly:v1:<user id>`), so two people sharing a computer don't
// see each other's drafts. The signed-in account is set with `setStorageUser`.

const LEGACY_KEY = 'rubriqly:v1'
const keyFor = (userId: string) => `${LEGACY_KEY}:${userId}`

export interface LocalData {
  assignments: Assignment[]
  drafts: Draft[]
  checks: CheckResult[]
  rubrics: Rubric[]
}

const empty = (): LocalData => ({ assignments: [], drafts: [], checks: [], rubrics: [] })

let currentUser: string | null = null
const memory = new Map<string, LocalData>()

/**
 * Switch storage to this account (or to none when signed out). The first account to sign in on
 * a browser takes over drafts saved there before accounts existed.
 */
export function setStorageUser(userId: string | null): void {
  if (userId === currentUser) return
  currentUser = userId
  if (!userId) return
  try {
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy !== null && localStorage.getItem(keyFor(userId)) === null) {
      localStorage.setItem(keyFor(userId), legacy)
    }
    if (legacy !== null) localStorage.removeItem(LEGACY_KEY)
  } catch {
    // Storage blocked: nothing to move.
  }
}

export function getStorageUser(): string | null {
  return currentUser
}

export function loadData(): LocalData {
  if (!currentUser) return empty()
  try {
    const raw = localStorage.getItem(keyFor(currentUser))
    if (raw) return { ...empty(), ...(JSON.parse(raw) as Partial<LocalData>) }
    return empty()
  } catch {
    return memory.get(currentUser) ?? empty()
  }
}

export function saveData(data: LocalData): void {
  if (!currentUser) throw new Error('Sign in to save drafts.')
  memory.set(currentUser, data)
  try {
    localStorage.setItem(keyFor(currentUser), JSON.stringify(data))
  } catch {
    // Storage full or blocked: keep the in-memory copy for this tab.
  }
}

export function updateData(change: (data: LocalData) => void): LocalData {
  const data = loadData()
  change(data)
  saveData(data)
  return data
}

export function newId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}_${random}`
}

/** Delete everything this account stored on this device (assignments, drafts, checks, rubrics). */
export function clearData(): void {
  if (!currentUser) return
  memory.delete(currentUser)
  try {
    localStorage.removeItem(keyFor(currentUser))
  } catch {
    // Storage blocked: nothing was persisted.
  }
}
