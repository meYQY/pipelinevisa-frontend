import { api } from '@/lib/api'
import { DS160FormData } from '@/types'

export interface FormSubmission {
  id: string
  case_id: string
  form_data: DS160FormData
  current_step: number
  is_complete: boolean
  created_at: string
  updated_at: string
}

export interface FormProgress {
  case_id: string
  current_step: number
  completed_steps: number[]
  total_steps: number
  percentage: number
  last_saved_at: string
}

// 定义各个步骤的数据类型
type PersonalInfo1Data = Partial<DS160FormData['personal_info_1']>
type PersonalInfo2Data = Partial<DS160FormData['personal_info_2']>
type AddressPhoneData = Partial<DS160FormData['address_phone']>
type PassportData = Partial<DS160FormData['passport']>
type TravelData = Partial<DS160FormData['travel']>
type TravelCompanionsData = Partial<DS160FormData['travel_companions']>
type PreviousUsTravelData = Partial<DS160FormData['previous_us_travel']>
type UsContactData = Partial<DS160FormData['us_contact']>
type FamilyData = Partial<DS160FormData['family']>
type WorkEducationData = Partial<DS160FormData['work_education']>

// 定义步骤数据映射 - 按照client API sections格式
type StepDataMap = {
  'personal_info_1': PersonalInfo1Data
  'personal_info_2': PersonalInfo2Data
  'address_phone': AddressPhoneData
  'passport': PassportData
  'travel': TravelData
  'travel_companions': TravelCompanionsData
  'previous_us_travel': PreviousUsTravelData
  'us_contact': UsContactData
  'family': FamilyData
  'work_education': WorkEducationData
}

class DS160Service {
  /**
   * 获取表单数据 - 调用client API端点
   */
  async getFormData(token: string): Promise<FormSubmission | null> {
    try {
      const response = await api.get<FormSubmission>(`/client/form/${token}`)
      return response
    } catch (error) {
      console.error('Failed to get form data:', error)
      return null
    }
  }

  /**
   * 保存表单数据（分步保存）- 使用client API
   */
  async saveFormStep<K extends keyof StepDataMap>(
    token: string,
    step: K,
    data: StepDataMap[K]
  ): Promise<any> {
    // 构建client API期望的数据格式
    const submitData = {
      sections: {
        [step]: data
      },
      completion_percentage: 10 // 简单的进度计算，后续可以改进
    }
    
    const response = await api.put(`/client/form/${token}`, submitData)
    return response
  }

  /**
   * 获取表单进度 - 使用client API
   */
  async getFormProgress(token: string): Promise<FormProgress> {
    // 从getFormData中获取进度信息
    const formData = await this.getFormData(token)
    if (!formData) {
      throw new Error('Failed to get form data')
    }
    
    return {
      case_id: formData.case_id,
      current_step: 1,
      completed_steps: [],
      total_steps: 10,
      percentage: (formData as any).completion_percentage || 0,
      last_saved_at: (formData as any).last_saved_at || new Date().toISOString()
    }
  }

  /**
   * 提交完整表单 - 使用client API
   */
  async submitForm(token: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(
      `/client/submit/${token}`
    )
    return response
  }

  /**
   * 验证表单完整性 - 基于客户端数据
   */
  async validateForm(token: string): Promise<{
    valid: boolean
    missing_fields: string[]
    errors: Array<{ field: string; message: string }>
  }> {
    const formData = await this.getFormData(token)
    const errors: Array<{ field: string; message: string }> = []
    const missing_fields: string[] = []

    const originalData = (formData as any)?.original_data || formData?.form_data;
    if (!originalData) {
      missing_fields.push('form_data')
      errors.push({ field: 'form_data', message: 'No form data found' })
    } else {
      // 基本验证
      if (!originalData.surname) {
        missing_fields.push('surname')
        errors.push({ field: 'surname', message: 'Surname is required' })
      }
      if (!originalData.given_names) {
        missing_fields.push('given_names')
        errors.push({ field: 'given_names', message: 'Given names are required' })
      }
      if (!originalData.passport_number) {
        missing_fields.push('passport_number')
        errors.push({ field: 'passport_number', message: 'Passport number is required' })
      }
    }

    return {
      valid: errors.length === 0,
      missing_fields,
      errors
    }
  }

  /**
   * 上传文件 - 使用client API
   */
  async uploadFile(
    token: string,
    file: File,
    type: 'passport' | 'photo' | 'employment' | 'financial' | 'other'
  ): Promise<{ id: string; url: string; filename: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', type)

    const response = await api.post<{ id: string; url: string; filename: string }>(
      `/client/upload/${token}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return response
  }

  /**
   * 获取已上传的文件列表 - 使用client API
   */
  async getUploadedFiles(token: string): Promise<Array<{
    id: string
    filename: string
    type: string
    size: number
    url: string
    uploaded_at: string
  }>> {
    const response = await api.get(`/client/files/${token}`)
    return response
  }

  /**
   * 删除已上传的文件 - 使用client API  
   */
  async deleteFile(token: string, fileId: string): Promise<void> {
    await api.delete(`/client/files/${token}/${fileId}`)
  }
}

export const ds160Service = new DS160Service()