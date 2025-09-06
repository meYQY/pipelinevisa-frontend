import { api } from '@/lib/api'

export interface LinkCreate {
  expiry_hours?: number
  purpose?: string
  message?: string
  force_regenerate?: boolean
}

export interface LinkResponse {
  id: string
  case_id: string
  token: string
  expires_at: string
  status: 'active' | 'expired' | 'used' | 'revoked'
  purpose: string
  created_at: string
  access_url: string
}

export interface LinkListResponse {
  items: LinkResponse[]
  total: number
  page: number
  per_page: number
}

class LinkService {
  /**
   * 生成客户访问链接
   */
  async generateLink(caseId: string, data?: LinkCreate): Promise<LinkResponse> {
    try {
      const response = await api.post<LinkResponse>(
        `/links/${caseId}/generate`,
        data || { expiry_hours: 72 }
      )
      return response
    } catch (error) {
      // 开发环境模拟
      if (process.env.NODE_ENV === 'development') {
        const token = `test-token-${Date.now()}`
        return {
          id: `link-${Date.now()}`,
          case_id: caseId,
          token,
          expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          purpose: 'form_submission',
          created_at: new Date().toISOString(),
          access_url: `${window.location.origin}/fill/${token}`
        }
      }
      throw error
    }
  }

  /**
   * 获取案例的所有链接
   */
  async getCaseLinks(caseId: string): Promise<LinkListResponse> {
    try {
      const response = await api.get<LinkListResponse>(`/links/case/${caseId}`)
      return response
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return {
          items: [],
          total: 0,
          page: 1,
          per_page: 10
        }
      }
      throw error
    }
  }

  /**
   * 撤销链接
   */
  async revokeLink(linkId: string): Promise<void> {
    try {
      await api.post(`/links/${linkId}/revoke`)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Link revoked:', linkId)
        return
      }
      throw error
    }
  }

  /**
   * 获取链接访问日志
   */
  async getLinkAccessLogs(linkId: string): Promise<any[]> {
    try {
      const response = await api.get<any[]>(`/links/${linkId}/logs`)
      return response
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return []
      }
      throw error
    }
  }
}

export const linkService = new LinkService()