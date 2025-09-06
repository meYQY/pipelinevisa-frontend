import { api } from '@/lib/api'
import type { 
  Case, 
  CaseStatus, 
  PaginatedResponse, 
  ApiResponse,
  Applicant 
} from '@/types'
import { linkService } from './link.service'

// 创建案例请求接口
export interface CreateCaseRequest {
  applicant_name: string
  applicant_phone?: string
  applicant_email?: string
  visa_type: string
  interview_date?: string
  is_rescheduled?: boolean
  is_vip?: boolean
  notes?: string
  link_validity_days?: number
}

// 更新案例请求接口
export interface UpdateCaseRequest {
  status?: CaseStatus
  applicant?: Partial<Applicant>
}

// 案例服务类
class CaseService {
  /**
   * 获取案例列表
   */
  async getCases(params?: {
    page?: number
    per_page?: number
    status?: CaseStatus
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<Case>> {
    const response = await api.get<PaginatedResponse<Case>>('/cases', { params })
    return response
  }

  /**
   * 获取案例详情
   */
  async getCaseById(id: string): Promise<Case> {
    const response = await api.get<Case>(`/cases/${id}`)
    return response
  }

  /**
   * 创建新案例
   */
  async createCase(data: CreateCaseRequest): Promise<Case> {
    const response = await api.post<Case>('/cases', data)
    return response
  }

  /**
   * 更新案例
   */
  async updateCase(id: string, data: UpdateCaseRequest): Promise<Case> {
    const response = await api.put<Case>(`/cases/${id}`, data)
    return response
  }

  /**
   * 删除案例
   */
  async deleteCase(id: string): Promise<void> {
    await api.delete(`/cases/${id}`)
  }

  /**
   * 生成客户链接
   */
  async generateLink(caseId: string): Promise<{
    link_id: string
    token: string
    url: string
    expires_at: string
  }> {
    const linkResponse = await linkService.generateLink(caseId)
    return {
      link_id: linkResponse.id,
      token: linkResponse.token,
      url: linkResponse.access_url,
      expires_at: linkResponse.expires_at
    }
  }

  /**
   * 获取案例进度
   */
  async getCaseProgress(caseId: string): Promise<{
    current_step: number
    total_steps: number
    percentage: number
    steps: Array<{
      step: number
      name: string
      key: string
      status: 'completed' | 'current' | 'pending'
      completed_at?: string
    }>
  }> {
    const response = await api.get(`/cases/${caseId}/progress`)
    return response
  }

  /**
   * 触发AI诊断
   */
  async triggerDiagnosis(caseId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.post(`/ai/diagnose/${caseId}`)
    return response
  }

  /**
   * 获取诊断报告
   */
  async getDiagnosisReport(caseId: string): Promise<any> {
    const response = await api.get(`/cases/${caseId}/diagnosis`)
    return response
  }

  /**
   * 获取附件列表
   */
  async listAttachments(caseId: string): Promise<{ items: Array<{
    id: string
    case_id: string
    filename: string
    size: number
    content_type: string
    url: string
    uploaded_at: string
    uploaded_by?: { id: string; name: string }
  }> }> {
    try {
      const response = await api.get(`/cases/${caseId}/attachments`)
      return response
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        const now = new Date().toISOString()
        return {
          items: [
            {
              id: 'att_1',
              case_id: caseId,
              filename: 'passport_main.jpg',
              size: 2_100_000,
              content_type: 'image/jpeg',
              url: '#',
              uploaded_at: now,
              uploaded_by: { id: 'u1', name: '系统' }
            },
            {
              id: 'att_2',
              case_id: caseId,
              filename: 'employment_letter.pdf',
              size: 1_500_000,
              content_type: 'application/pdf',
              url: '#',
              uploaded_at: now,
              uploaded_by: { id: 'u2', name: '王明' }
            }
          ]
        }
      }
      throw error
    }
  }

  /**
   * 获取状态时间线/活动
   */
  async getActivityTimeline(caseId: string): Promise<Array<{
    id: string
    status: string
    time: string
    user: string
    description?: string
  }>> {
    try {
      const response = await api.get(`/cases/${caseId}/timeline`)
      return response
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return [
          { id: 't1', status: 'AI诊断开始', time: '30分钟前', user: '系统' },
          { id: 't2', status: '客户提交信息', time: '35分钟前', user: '王五' },
          { id: 't3', status: '发送采集链接', time: '2小时前', user: '王明' },
          { id: 't4', status: '创建案例', time: '2小时前', user: '王明' },
        ]
      }
      throw error
    }
  }
}

// 导出单例
export const caseService = new CaseService()