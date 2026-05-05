/**
 * Error handling utilities for network requests and API calls
 */

export interface ApiError {
  message: string
  status?: number
  code?: string
  isNetworkError?: boolean
  isTimeout?: boolean
}

/**
 * Detects if an error is a network error (no internet connection)
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError") ||
      error.message.includes("Network request failed") ||
      error.message.includes("ERR_INTERNET_DISCONNECTED") ||
      error.message.includes("ERR_NETWORK_CHANGED")
    )
  }
  return false
}

/**
 * Detects if an error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("timeout") || error.message.includes("Timeout")
  }
  return false
}

/**
 * Formats an error into a user-friendly message
 */
export function formatErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return "No internet connection. Please check your network and try again."
  }

  if (isTimeoutError(error)) {
    return "Request timed out. Please try again."
  }

  if (error instanceof Error) {
    return error.message || "An unexpected error occurred"
  }

  if (typeof error === "string") {
    return error
  }

  return "An unexpected error occurred. Please try again."
}

/**
 * Handles fetch errors and returns a formatted error
 */
export async function handleFetchError(response: Response): Promise<ApiError> {
  let errorMessage = "An error occurred"
  let errorData: any = {}

  try {
    errorData = await response.json().catch(() => ({}))
    errorMessage = errorData.error || errorData.message || `Server error (${response.status})`
  } catch {
    errorMessage = `Server error (${response.status})`
  }

  return {
    message: errorMessage,
    status: response.status,
    code: errorData.code,
    isNetworkError: false,
  }
}

/**
 * Wrapper for fetch with better error handling
 */
export async function safeFetch(
  url: string,
  options?: RequestInit,
  timeout: number = 30000
): Promise<Response> {
  // Check if online
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("No internet connection. Please check your network.")
  }

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await handleFetchError(response)
      throw new Error(error.message)
    }

    return response
  } catch (error: unknown) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.")
    }

    if (isNetworkError(error)) {
      throw new Error("No internet connection. Please check your network and try again.")
    }

    throw error
  }
}

/**
 * Retry a fetch request with exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await safeFetch(url, options)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on network errors or client errors (4xx)
      if (isNetworkError(error) || (error instanceof Error && error.message.includes("4"))) {
        throw lastError
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw lastError
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt)))
    }
  }

  throw lastError || new Error("Failed to fetch after retries")
}

