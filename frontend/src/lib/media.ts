const apiBaseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api/v1'
const staticOrigin = apiBaseURL.replace(/\/api\/v1\/?$/, '')

export function mediaUrl(filePath: string): string {
  return `${staticOrigin}/static/${filePath}`
}
