import { api } from '@/lib/api'
import { DS160FormData } from '@/types'

export interface DS160Field {
  id: string
  section: string
  field_name: string
  chinese_question: string
  chinese_value: string
  english_question: string
  english_value: string
  status: 'completed' | 'pending' | 'warning' | 'error'
  is_modified: boolean
  consultant_note?: string
  translation_confidence?: number
}

export interface DS160Section {
  id: string
  name_cn: string
  name_en: string
  completed_fields: number
  total_fields: number
  status: 'completed' | 'in_progress' | 'pending' | 'warning'
}

export interface TranslationComparison {
  case_id: string
  sections: DS160Section[]
  fields: DS160Field[]
  overall_completion: number
  total_fields: number
  completed_fields: number
  warning_fields: number
  error_fields: number
  last_updated: string
  version: string
}

export interface TranslationData {
  id: string
  case_id: string
  sections: {
    [key: string]: {
      chinese: Record<string, any>
      english: Record<string, any>
    }
  }
  completeness: number
  is_locked: boolean
  created_at: string
  updated_at: string
}

export interface TranslationField {
  key: string
  label: string
  chinese_value: string
  english_value: string
  required: boolean
  validated: boolean
}

class TranslationService {
  async getTranslationComparison(caseId: string): Promise<TranslationComparison> {
    const response = await api.get(`/cases/${caseId}/translation/comparison`)
    return response
  }

  async updateFieldTranslation(fieldId: string, englishValue: string): Promise<void> {
    await api.patch(`/translation/fields/${fieldId}`, {
      english_value: englishValue
    })
  }

  async generateComparisonPDF(caseId: string): Promise<string> {
    const response = await api.post(`/cases/${caseId}/translation/pdf`, {}, {
      responseType: 'blob'
    })
    
    const blob = new Blob([response as any], { type: 'application/pdf' })
    return URL.createObjectURL(blob)
  }

  async addConsultantNote(fieldId: string, note: string): Promise<void> {
    await api.patch(`/translation/fields/${fieldId}/note`, {
      consultant_note: note
    })
  }

  async getTranslationHistory(caseId: string): Promise<any[]> {
    const response = await api.get(`/cases/${caseId}/translation/history`)
    return response
  }

  // 保留原有接口以保持兼容性
  async getTranslation(caseId: string): Promise<TranslationData> {
    const response = await api.get(`/cases/${caseId}/translation`)
    return response
  }

  async updateTranslation(
    caseId: string,
    sectionId: string,
    fieldKey: string,
    value: string
  ): Promise<TranslationField> {
    const response = await api.patch(
      `/cases/${caseId}/translation/${sectionId}/${fieldKey}`,
      { value }
    )
    return response
  }

  async lockTranslation(caseId: string): Promise<void> {
    await api.post(`/cases/${caseId}/translation/lock`)
  }

  async finalConfirm(caseId: string): Promise<void> {
    await api.post(`/cases/${caseId}/translation/confirm`)
  }

  async exportDS160(caseId: string): Promise<{ url: string }> {
    const response = await api.post(`/cases/${caseId}/translation/export`)
    return response
  }

  async copySection(caseId: string, sectionId: string): Promise<string> {
    const response = await api.get(
      `/cases/${caseId}/translation/${sectionId}/copy`
    )
    return response.text
  }

  async validateSection(caseId: string, sectionId: string): Promise<{
    valid: boolean
    errors: string[]
  }> {
    const response = await api.post(
      `/cases/${caseId}/translation/${sectionId}/validate`
    )
    return response
  }
}

export const translationService = new TranslationService()