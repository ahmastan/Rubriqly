import { ApiError, apiFetch } from './http'
import { clearData, setStorageUser } from './localStore'

// Accounts live on the backend (docs/architecture.md, "Accounts"). Sign-in sets an HttpOnly cookie that
// JavaScript can't read, so "am I signed in?" is always asked of the server (`getAccount`).

export interface Account {
  id: string
  email: string
  displayName: string
  createdAt: string
}

interface AccountOut {
  id: string
  email: string
  display_name: string
  created_at: string
}

/** React Query key for the signed-in account (`null` when signed out). */
export const ACCOUNT_KEY = ['account'] as const

/** Sign-up asks people to confirm this (self-declared; the backend's MIN_AGE matches). */
export const MIN_AGE = 13

function toAccount(out: AccountOut): Account {
  // Every account's drafts are stored under its own key on this device.
  setStorageUser(out.id)
  return {
    id: out.id,
    email: out.email,
    displayName: out.display_name,
    createdAt: out.created_at,
  }
}

/** The signed-in account, or null. Other errors (e.g. offline) are thrown. */
export async function getAccount(): Promise<Account | null> {
  try {
    return toAccount(await apiFetch<AccountOut>('/api/auth/me'))
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      setStorageUser(null)
      return null
    }
    throw error
  }
}

export async function signIn(email: string, password: string): Promise<Account> {
  return toAccount(
    await apiFetch<AccountOut>('/api/auth/login', { method: 'POST', body: { email, password } }),
  )
}

export interface SignUpInput {
  displayName: string
  email: string
  password: string
  confirmsAge: boolean
  acceptsTerms: boolean
}

export async function signUp(input: SignUpInput): Promise<Account> {
  return toAccount(
    await apiFetch<AccountOut>('/api/auth/signup', {
      method: 'POST',
      body: {
        display_name: input.displayName,
        email: input.email,
        password: input.password,
        confirms_age: input.confirmsAge,
        accepts_terms: input.acceptsTerms,
      },
    }),
  )
}

export async function signOut(): Promise<void> {
  await apiFetch<void>('/api/auth/logout', { method: 'POST' })
  setStorageUser(null)
}

export async function updateDisplayName(displayName: string): Promise<Account> {
  return toAccount(
    await apiFetch<AccountOut>('/api/auth/me', {
      method: 'PATCH',
      body: { display_name: displayName },
    }),
  )
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await apiFetch<void>('/api/auth/password', {
    method: 'POST',
    body: { current_password: currentPassword, new_password: newPassword },
  })
}

/** Deletes the account on the server, then its drafts, checks and rubrics on this device. */
export async function deleteAccount(password: string): Promise<void> {
  await apiFetch<void>('/api/auth/me', { method: 'DELETE', body: { password } })
  clearData()
  setStorageUser(null)
}

/** Where to go after signing in: only paths inside this site, never another website. */
export function safeNext(next: string | null | undefined): string {
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) {
    return next
  }
  return '/check/new'
}
