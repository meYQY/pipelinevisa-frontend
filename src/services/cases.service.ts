import { api } from '@/lib/api'

export interface CreateCaseRequest {
  applicant: {
    first_name: string
    last_name: string
    email: string
    phone: string
    address: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
  }
  case_info: {
    visa_type: string
    purpose_of_travel: string
    preferred_interview_location?: string
    consultant_notes?: string
  }
}

export interface CreateCaseResponse {
  case_id: string
  case_number: string
  message: string
}

export interface CaseDetails {
  id: string
  case_number: string
  status: string
  applicant_name: string
  visa_type: string
  created_at: string
  updated_at: string
  client_link: string
  progress: {
    current_step: string
    completion_percentage: number
    last_activity: string
  }
  applicant: {
    first_name: string
    last_name: string
    email: string
    phone: string
    address?: string
  }
  documents: Array<{
    id: string
    filename: string
    type: string
    uploaded_at: string
    status: string
  }>
  activities: Array<{
    id: string
    type: string
    description: string
    created_at: string
    user: string
  }>
}

export interface CaseListItem {
  id: string
  case_number: string
  applicant_name: string
  visa_type: string
  status: string
  created_at: string
  progress: number
  consultant_name?: string
  last_activity: string
}

class CasesService {
  /**
   * 创建新案例
   */
  async createCase(data: CreateCaseRequest): Promise<CreateCaseResponse> {
    try {
      const response = await api.post<CreateCaseResponse>('/cases', {
        applicant_name: `${data.applicant.first_name} ${data.applicant.last_name}`,
        applicant_email: data.applicant.email,
        applicant_phone: data.applicant.phone,
        visa_type: data.case_info.visa_type,
        purpose_of_travel: data.case_info.purpose_of_travel,
        preferred_interview_location: data.case_info.preferred_interview_location,
        consultant_notes: data.case_info.consultant_notes,
        applicant_details: {
          first_name: data.applicant.first_name,
          last_name: data.applicant.last_name,
          email: data.applicant.email,
          phone: data.applicant.phone,
          address: data.applicant.address,
          emergency_contact_name: data.applicant.emergency_contact_name,
          emergency_contact_phone: data.applicant.emergency_contact_phone
        }
      })
      return response
    } catch (error) {
      console.error('Failed to create case:', error)
      throw error
    }
  }

  /**
   * 获取案例列表
   */
  async getCases(page = 1, limit = 20, status?: string): Promise<{
    cases: CaseListItem[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status })
      })
      
      const response = await api.get(`/cases?${params}`)
      return response
    } catch (error) {
      console.error('Failed to get cases:', error)
      throw error
    }
  }

  /**
   * 获取案例详情
   */
  async getCaseDetails(caseId: string): Promise<CaseDetails> {
    try {
      const response = await api.get<CaseDetails>(`/cases/${caseId}`)
      return response
    } catch (error) {
      console.error('Failed to get case details:', error)
      throw error
    }
  }

  /**
   * 生成客户链接
   */
  async generateClientLink(caseId: string): Promise<{ link: string; expires_at: string }> {
    try {
      const response = await api.post(`/cases/${caseId}/generate-link`)
      return response
    } catch (error) {
      console.error('Failed to generate client link:', error)
      throw error
    }
  }

  /**
   * 更新案例状态
   */
  async updateCaseStatus(caseId: string, status: string, reason?: string): Promise<void> {
    try {
      await api.patch(`/cases/${caseId}/status`, { status, reason })
    } catch (error) {
      console.error('Failed to update case status:', error)
      throw error
    }
  }

  /**
   * 删除案例
   */
  async deleteCase(caseId: string): Promise<void> {
    try {
      await api.delete(`/cases/${caseId}`)
    } catch (error) {
      console.error('Failed to delete case:', error)
      throw error
    }
  }

  /**
   * 获取案例统计
   */
  async getCaseStats(): Promise<{
    total: number
    active: number
    completed: number
    pending_review: number
    this_month: number
  }> {
    try {
      const response = await api.get('/cases/stats')
      return response
    } catch (error) {
      console.error('Failed to get case stats:', error)
      throw error
    }
  }

  /**
   * 分配案例给顾问
   */
  async assignCase(caseId: string, consultantId: string): Promise<void> {
    try {
      await api.post(`/cases/${caseId}/assign`, { consultant_id: consultantId })
    } catch (error) {
      console.error('Failed to assign case:', error)
      throw error
    }
  }

  /**
   * 添加案例备注
   */
  async addCaseNote(caseId: string, note: string): Promise<void> {
    try {
      await api.post(`/cases/${caseId}/notes`, { note })
    } catch (error) {
      console.error('Failed to add case note:', error)
      throw error
    }
  }
}

export const casesService = new CasesService()