import type { ApiError } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Lee el token del localStorage directamente para evitar dependencia circular con Pinia
function getToken(): string | null {
  return localStorage.getItem('accessToken')
}

export class ApiRequestError extends Error {
  public readonly statusCode: number
  public readonly code: string | undefined

  constructor(
    statusCode: number,
    code: string | undefined,
    message: string,
  ) {
    super(message)
    this.name = 'ApiRequestError'
    this.statusCode = statusCode
    this.code = code
  }
}

interface FetcherOptions extends RequestInit {
  auth?: boolean   // true = adjunta el Bearer token
}

export async function fetcher<T>(
  path: string,
  options: FetcherOptions = {},
): Promise<T> {
  const { auth = false, ...init } = options

  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')

  if (auth) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
  })

  // 204 No Content — no intentar parsear JSON
  if (response.status === 204) return undefined as T

  const data = await response.json()

  if (!response.ok) {
    const err = data as ApiError

    // 401 → limpiar sesión y redirigir
    if (response.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }

    throw new ApiRequestError(response.status, err.code, err.error)
  }

  return data as T
}