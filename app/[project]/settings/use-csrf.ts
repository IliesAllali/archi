export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/arbo_csrf=([^;]+)/)
  return match ? match[1] : null
}

export function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["x-csrf-token"] = token
  return headers
}
