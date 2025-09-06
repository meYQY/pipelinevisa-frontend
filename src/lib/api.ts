import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import { toast } from 'sonner'

// API配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_VERSION = '/api/v1'

// 创建axios实例
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: `${API_BASE_URL}${API_VERSION}`,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 简单异步延迟
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const isRetryable = (method?: string, status?: number) => {
    const m = (method || 'get').toLowerCase()
    const s = status || 0
    // 仅对幂等请求进行重试
    const idempotent = m === 'get' || m === 'head'
    return idempotent && (s === 429 || s >= 500)
  }

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      // 添加认证token
      const token = localStorage.getItem('access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // 添加时间戳防止缓存
      if (config.method === 'get') {
        config.params = {
          ...config.params,
          _t: Date.now(),
        }
      }

      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      return response
    },
    async (error: AxiosError) => {
      const { response } = error

      if (!response) {
        toast.error('网络错误，请检查您的网络连接')
        return Promise.reject(error)
      }

      // 指数退避重试（429/5xx，仅幂等请求）
      try {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean; _retryCount?: number; retry?: number }
        const status = response.status
        if (isRetryable(originalRequest.method, status)) {
          const maxRetries = typeof originalRequest.retry === 'number' ? originalRequest.retry : 2
          originalRequest._retryCount = (originalRequest._retryCount || 0)
          if (originalRequest._retryCount < maxRetries) {
            originalRequest._retryCount += 1
            const headerRetryAfter = Number((response.headers?.['retry-after'] as string) || 0)
            const baseDelay = 500 * 2 ** (originalRequest._retryCount - 1)
            const jitter = Math.floor(Math.random() * 200)
            const computed = baseDelay + jitter
            const retryAfterMs = headerRetryAfter > 0 ? headerRetryAfter * 1000 : computed
            await delay(Math.min(retryAfterMs, 8000))
            return instance(originalRequest)
          }
        }
      } catch (_) {
        // fallthrough to error handling
      }

      // 刷新令牌逻辑（仅处理一次401）
      if (response.status === 401) {
        try {
          const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
          if (!originalRequest._retry) {
            originalRequest._retry = true
            const refreshToken = localStorage.getItem('refresh_token')
            if (refreshToken) {
              // 使用基础axios避免循环拦截
              const refreshResp = await axios.post(
                `${API_BASE_URL}${API_VERSION}/auth/refresh`,
                { refresh_token: refreshToken },
                { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
              )
              const data = refreshResp.data as any
              if (data?.access_token) {
                localStorage.setItem('access_token', data.access_token)
                // 重试原请求
                originalRequest.headers = originalRequest.headers || {}
                originalRequest.headers.Authorization = `Bearer ${data.access_token}`
                return instance(originalRequest)
              }
            }
          }
        } catch (_) {
          // ignore and fall through to sign-out
        }
      }

      // 处理各种HTTP错误
      switch (response.status) {
        case 401:
          // Token过期或无效
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user')
          
          // 如果不是登录页，跳转到登录
          if (!window.location.pathname.includes('/login')) {
            toast.error('登录已过期，请重新登录')
            window.location.href = '/login'
          }
          break

        case 403:
          toast.error('您没有权限执行此操作')
          break

        case 404:
          toast.error('请求的资源不存在')
          break

        case 422:
          // 验证错误
          const validationError = response.data as any
          if (validationError.detail) {
            if (Array.isArray(validationError.detail)) {
              const firstError = validationError.detail[0]
              toast.error(firstError.msg || '输入验证失败')
            } else {
              toast.error(validationError.detail)
            }
          } else {
            toast.error('输入验证失败')
          }
          break

        case 429:
          toast.error('请求过于频繁，请稍后再试')
          break

        case 500:
          toast.error('服务器内部错误，请稍后再试')
          break

        default:
          const errorData = response.data as any
          toast.error(errorData.detail || errorData.message || '请求失败')
      }

      return Promise.reject(error)
    }
  )

  return instance
}

// 导出API客户端实例
export const apiClient = createApiClient()

// 基于 fetch 的轻量 API，用于单测环境与简单调用
const buildUrl = (path: string, params?: Record<string, any>): string => {
  const base = `${API_BASE_URL}${API_VERSION}`
  const url = new URL(path.startsWith('http') ? path : `${base}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
    })
  }
  return url.toString()
}

type FetchConfig = Pick<AxiosRequestConfig, 'headers' | 'params'>

async function fetchRequest<T = any>(method: string, path: string, data?: any, config?: FetchConfig): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(config?.headers as Record<string, string> || {}),
  }
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null
  if (token) headers['Authorization'] = `Bearer ${token}`

  const url = buildUrl(path, method.toLowerCase() === 'get' ? config?.params as any : undefined)
  const init: RequestInit = {
    method: method.toUpperCase(),
    headers,
  }
  if (data !== undefined && method.toLowerCase() !== 'get') {
    init.body = JSON.stringify(data)
  }

  try {
    // @ts-ignore - global.fetch is available in browser/jsdom and mocked in tests
    const resp = await fetch(url, init)

    if (resp.ok) {
      if (resp.status === 204) return null as unknown as T
      const json = await resp.json().catch(() => null)
      return json as T
    }

    // 解析错误
    let detail: any = undefined
    try {
      detail = await resp.json()
    } catch (_) {
      detail = undefined
    }

    if (resp.status === 401) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
      }
      toast.error('登录已过期，请重新登录')
      throw new Error(detail?.detail || 'Unauthorized')
    }
    if (resp.status === 400) {
      const msg = detail?.detail || 'Bad request'
      toast.error(msg)
      throw new Error(msg)
    }
    if (resp.status === 422) {
      const msgs = Array.isArray(detail?.detail) ? detail.detail.map((d: any) => d.msg).join(', ') : (detail?.detail || 'Unprocessable Entity')
      toast.error(msgs)
      throw new Error(msgs)
    }
    if (resp.status >= 500) {
      const msg = detail?.detail || '服务器错误，请稍后重试'
      toast.error('服务器错误，请稍后重试')
      throw new Error(msg)
    }

    const generic = detail?.detail || detail?.message || '请求失败'
    toast.error(generic)
    throw new Error(generic)
  } catch (err: any) {
    const msg = String(err?.message || err || '')
    if (msg.toLowerCase().includes('network') || (err?.name === 'TypeError' && /fetch/i.test(String(err)))) {
      toast.error('网络错误，请检查网络连接')
    }
    throw err
  }
}

// 通用请求方法（基于 fetch）
export const api = {
  get: <T = any>(url: string, config?: FetchConfig) => fetchRequest<T>('GET', url, undefined, config),
  post: <T = any>(url: string, data?: any, config?: FetchConfig) => fetchRequest<T>('POST', url, data, config),
  put: <T = any>(url: string, data?: any, config?: FetchConfig) => fetchRequest<T>('PUT', url, data, config),
  patch: <T = any>(url: string, data?: any, config?: FetchConfig) => fetchRequest<T>('PATCH', url, data, config),
  delete: <T = any>(url: string, config?: FetchConfig) => fetchRequest<T>('DELETE', url, undefined, config),

  // 文件上传：仍使用 axios 能力（非单测路径）
  upload: <T = any>(url: string, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (ev) => {
        if (onProgress && ev.total) {
          const progress = Math.round((ev.loaded * 100) / ev.total)
          onProgress(progress)
        }
      },
    }).then(res => res.data)
  },
}

// 导出类型
export type { AxiosError, AxiosRequestConfig }

// Abort 支持：创建控制器供调用方传入 config.signal
export const createAbortController = () => new AbortController()