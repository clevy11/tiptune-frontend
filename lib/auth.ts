import { authApi } from './api'
import type { User } from './types'

export function getCurrentUser(): User | null {
  return authApi.getCurrentUser()
}

export function getCurrentUserId(): number | null {
  const user = getCurrentUser()
  return user?.id || null
}

export function isAuthenticated(): boolean {
  return authApi.getToken() !== null
}
