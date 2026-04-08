import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data as
      | { statusCode?: number; error?: string; message?: string; details?: unknown }
      | undefined

    let message = data?.message ?? error.message ?? 'Unknown error'

    if (Array.isArray(data?.details) && data.details.length > 0) {
      const detailLines = data.details
        .map((d) => (typeof d === 'string' ? d : JSON.stringify(d)))
        .join('\n')
      message = detailLines
    } else if (data?.details && typeof data.details === 'string') {
      message = data.details
    }

    return Promise.reject(new Error(message))
  },
)

export default client
