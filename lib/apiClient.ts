import type { AxiosError } from 'axios'

export interface ApiErrorPayload {
  message: string
  errorCode?: string
  status: number
  timestamp?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly errorCode: string | undefined
  readonly payload: ApiErrorPayload | null

  constructor(message: string, status: number, errorCode?: string, payload?: ApiErrorPayload | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errorCode = errorCode
    this.payload = payload ?? null
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.'

/**
 * Parses an axios error response and returns a user-facing message.
 * Prefers backend message; falls back to status-based or default message.
 */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  const axiosError = error as AxiosError<ApiErrorPayload>
  const data = axiosError.response?.data
  const status = axiosError.response?.status

  if (data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim()
  }

  if (status !== undefined) {
    if (status === 400) return 'Invalid request. Please check your input.'
    if (status === 401) return 'Please sign in again.'
    if (status === 403) return 'You do not have permission to do this.'
    if (status === 404) return 'The requested resource was not found.'
    if (status >= 500) return 'Server error. Please try again later.'
  }

  if (axiosError instanceof Error && axiosError.message) {
    return axiosError.message
  }

  return DEFAULT_MESSAGE
}

/**
 * Optionally create ApiError from axios error for consistent handling.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  const axiosError = error as AxiosError<ApiErrorPayload>
  const data = axiosError.response?.data
  const status = axiosError.response?.status ?? 0
  const message = (data && typeof data === 'object' && typeof data.message === 'string')
    ? data.message
    : getApiErrorMessage(error)

  return new ApiError(message, status, data?.errorCode, data ?? null)
}
