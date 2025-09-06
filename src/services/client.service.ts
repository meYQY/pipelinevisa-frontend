import { api } from '@/lib/api'
import { DS160FormData } from '@/types'

export interface TokenValidation {
  valid: boolean
  case_id: string
  applicant_name: string
  visa_type: string
  expires_at: string
  case_status: string
}

export interface DS160FormResponse {
  form_data: Partial<DS160FormData>
  last_saved_at: string
  completion_percentage: number
  current_section: string
}

export interface ClientSubmitRequest {
  token: string
  form_data: DS160FormData
  documents: string[]
}

export interface DiagnosisReport {
  id: string
  created_at: string
  issues_count: {
    blocker: number
    critical: number
    warning: number
    info: number
  }
  issues: {
    blocker: DiagnosisIssue[]
    critical: DiagnosisIssue[]
    warning: DiagnosisIssue[]
    info: DiagnosisIssue[]
  }
  consultant_notes?: string
}

export interface DiagnosisIssue {
  field_path: string
  field_label: string
  message: string
  suggestion: string
  is_resolved: boolean
}

class ClientService {
  /**
   * 验证客户端链接
   */
  async validateToken(token: string): Promise<TokenValidation> {
    try {
      const response = await api.get<TokenValidation>(`/client/validate/${token}`)
      return response
    } catch (error) {
      // 模拟数据用于开发
      if (process.env.NODE_ENV === 'development') {
        return {
          valid: true,
          case_id: 'mock-case-id',
          applicant_name: '张三',
          visa_type: 'B1/B2',
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          case_status: 'client_filling'
        }
      }
      throw error
    }
  }

  /**
   * 获取DS-160表单数据
   */
  async getFormData(token: string): Promise<DS160FormResponse> {
    try {
      const response = await api.get<DS160FormResponse>(`/client/form/${token}`)
      return response
    } catch (error) {
      // 模拟数据
      if (process.env.NODE_ENV === 'development') {
        const savedData = sessionStorage.getItem('ds160_form')
        return {
          form_data: savedData ? JSON.parse(savedData) : {},
          last_saved_at: new Date().toISOString(),
          completion_percentage: 20,
          current_section: 'basic_info'
        }
      }
      throw error
    }
  }

  /**
   * 保存表单数据（部分保存）
   */
  async saveFormData(token: string, formData: Partial<DS160FormData>): Promise<void> {
    try {
      await api.put(`/client/form/${token}`, formData)
    } catch (error) {
      // 开发环境保存到sessionStorage
      if (process.env.NODE_ENV === 'development') {
        const existing = sessionStorage.getItem('ds160_form') || '{}'
        const merged = { ...JSON.parse(existing), ...formData }
        sessionStorage.setItem('ds160_form', JSON.stringify(merged))
        return
      }
      throw error
    }
  }

  /**
   * 提交完整表单
   */
  async submitForm(token: string, formData: DS160FormData): Promise<void> {
    try {
      await api.post(`/client/submit/${token}`, { form_data: formData })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        sessionStorage.setItem('ds160_form_submitted', 'true')
        return
      }
      throw error
    }
  }

  /**
   * 上传文件
   */
  async uploadDocument(
    token: string,
    file: File,
    documentType: string,
    onProgress?: (progress: number) => void
  ): Promise<{ document_id: string; url: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', documentType)

    try {
      const response = await api.upload<{ document_id: string; url: string }>(
        `/client/upload/${token}`,
        file,
        onProgress
      )
      return response
    } catch (error) {
      // 模拟响应
      if (process.env.NODE_ENV === 'development') {
        return {
          document_id: `doc_${Date.now()}`,
          url: URL.createObjectURL(file)
        }
      }
      throw error
    }
  }

  /**
   * 获取最新诊断报告
   */
  async getLatestDiagnosis(token: string): Promise<DiagnosisReport | null> {
    try {
      const response = await api.get<{ has_report: boolean; report?: DiagnosisReport }>(
        `/client/diagnosis/${token}/latest`
      )
      return response.has_report ? response.report! : null
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return null
      }
      throw error
    }
  }

  /**
   * 提交补充材料
   */
  async submitSupplement(
    token: string,
    reportId: string,
    supplements: Record<string, any>
  ): Promise<void> {
    try {
      await api.post(`/client/supplement/${token}`, {
        report_id: reportId,
        supplements
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Supplement submitted:', supplements)
        return
      }
      throw error
    }
  }
}

export const clientService = new ClientService()