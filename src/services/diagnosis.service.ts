import { api } from '@/lib/api'

export interface DiagnosisIssue {
  id: string
  field_name: string
  field_label: string
  severity: 'blocker' | 'critical' | 'warning' | 'info'
  issue_type: string
  description: string
  suggestion: string
  auto_fixable: boolean
  fixed: boolean
  consultant_note?: string
  consultant_adjusted?: boolean
}

export interface DiagnosisReport {
  id: string
  case_id: string
  status: string
  risk_score: number
  total_issues: number
  blocker_issues: number
  critical_issues: number
  warning_issues: number
  info_issues: number
  summary: {
    overall: string
    key_findings: string[]
    recommendations: string[]
  }
  diagnosis_data: any
  issues: DiagnosisIssue[]
  ai_provider: string
  created_at: string
  consultant_notes?: string
  consultant_reviewed_at?: string
}

interface ReportGenerationOptions {
  consultant_notes?: string
  include_ai_analysis?: boolean
  include_consultant_adjustments?: boolean
}

interface SendToClientOptions {
  consultant_notes?: string
  include_recommendations?: boolean
}

class DiagnosisService {
  async getLatestDiagnosis(caseId: string): Promise<DiagnosisReport> {
    const response = await api.get(`/cases/${caseId}/diagnosis/latest`)
    return response
  }

  async createDiagnosis(caseId: string, priority: 'normal' | 'high' = 'normal'): Promise<any> {
    const response = await api.post(`/cases/${caseId}/diagnosis`, { priority })
    return response
  }

  async updateIssueNote(issueId: string, note: string): Promise<void> {
    await api.patch(`/diagnosis/issues/${issueId}/note`, { consultant_note: note })
  }

  async markIssueFixed(issueId: string, fixed: boolean): Promise<void> {
    await api.patch(`/diagnosis/issues/${issueId}/status`, { fixed })
  }

  async generateReport(reportId: string, options: ReportGenerationOptions): Promise<string> {
    const response = await api.post(`/diagnosis/reports/${reportId}/generate`, options)
    
    // 创建blob URL用于预览
    const blob = new Blob([response as any], { type: 'application/pdf' })
    return URL.createObjectURL(blob)
  }

  async sendToClient(reportId: string, options: SendToClientOptions): Promise<void> {
    await api.post(`/diagnosis/reports/${reportId}/send-client`, options)
  }

  async requestReanalysis(caseId: string): Promise<void> {
    await api.post(`/cases/${caseId}/diagnosis/reanalyze`)
  }

  async getDiagnosisStatus(caseId: string): Promise<{ status: string; progress?: number }> {
    const response = await api.get(`/cases/${caseId}/diagnosis/status`)
    return response
  }

  async autoFixIssues(reportId: string): Promise<{ fixed_count: number; failed_count: number }> {
    const response = await api.post(`/diagnosis/reports/${reportId}/auto-fix`)
    return response
  }

  async updateConsultantNotes(reportId: string, notes: string): Promise<void> {
    await api.patch(`/diagnosis/reports/${reportId}/consultant-notes`, { notes })
  }

  async getIssueHistory(issueId: string): Promise<any[]> {
    const response = await api.get(`/diagnosis/issues/${issueId}/history`)
    return response
  }

  // 保留原有的兼容接口
  async startDiagnosis(caseId: string): Promise<any> {
    return this.createDiagnosis(caseId)
  }

  async getDiagnosisReport(caseId: string): Promise<any> {
    return this.getLatestDiagnosis(caseId)
  }

  async updateDiagnosisItem(caseId: string, itemId: string, suggestion: string): Promise<any> {
    return this.updateIssueNote(itemId, suggestion)
  }

  async confirmDiagnosis(caseId: string): Promise<void> {
    await api.post(`/cases/${caseId}/diagnosis/confirm`)
  }

  async sendAIMessage(caseId: string, message: string): Promise<{ response: string }> {
    const response = await api.post(`/cases/${caseId}/diagnosis/ai-chat`, { message })
    return response
  }
}

export const diagnosisService = new DiagnosisService()