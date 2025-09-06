'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronRight, Save, ArrowLeft, CheckCircle, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ds160Service } from '@/services/ds160.service'

// 表单验证schema
const usContactSchema = z.object({
  contact_person: z.string().optional(),
  organization_name: z.string().optional(),
  relationship: z.string().optional(),
  contact_address: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().optional()
}).superRefine((data, ctx) => {
  // 如果填写了任何联系人信息，必须填写姓名和关系
  const hasAnyContact = data.contact_person || data.organization_name || 
                       data.relationship || data.contact_address || 
                       data.contact_phone || data.contact_email
                       
  if (hasAnyContact) {
    if (!data.contact_person && !data.organization_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '请输入联系人姓名或机构名称',
        path: ['contact_person']
      })
    }
    
    if (!data.relationship) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '请选择与您的关系',
        path: ['relationship']
      })
    }
  }
  
  // 验证邮箱格式
  if (data.contact_email && data.contact_email.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.contact_email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '请输入有效的邮箱地址',
        path: ['contact_email']
      })
    }
  }
})

type UsContactFormData = z.infer<typeof usContactSchema>

// 进度步骤配置
const steps = [
  { id: 1, label: '基本信息', path: 'basic-info' },
  { id: 2, label: '个人详情', path: 'personal-info-2' },
  { id: 3, label: '地址电话', path: 'address-phone' },
  { id: 4, label: '工作信息', path: 'work-info' },
  { id: 5, label: '家庭信息', path: 'family-info' },
  { id: 6, label: '旅行信息', path: 'travel-info' },
  { id: 7, label: '旅行同伴', path: 'travel-companions' },
  { id: 8, label: '美国历史', path: 'previous-us-travel' },
  { id: 9, label: '美国联系人', path: 'us-contact' },
  { id: 10, label: '上传文件', path: 'upload' },
]

// 关系选项
const relationshipOptions = [
  { value: 'family', label: '家庭成员' },
  { value: 'friend', label: '朋友' },
  { value: 'business_contact', label: '商业联系人' },
  { value: 'colleague', label: '同事' },
  { value: 'employer', label: '雇主' },
  { value: 'school_official', label: '学校官员' },
  { value: 'organization_contact', label: '机构联系人' },
  { value: 'sponsor', label: '担保人' },
  { value: 'host', label: '接待方' },
  { value: 'other', label: '其他' }
]

export default function UsContactPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<UsContactFormData>({
    resolver: zodResolver(usContactSchema),
    defaultValues: {}
  })

  // 加载已保存的数据
  useEffect(() => {
    loadSavedData()
  }, [])

  const loadSavedData = async () => {
    try {
      const formData = await ds160Service.getFormData(token)
      if (formData?.form_data) {
        const savedData = (formData.form_data as any).us_contact
        reset({
          contact_person: savedData.contact_person || '',
          organization_name: savedData.organization_name || '',
          relationship: savedData.relationship || '',
          contact_address: savedData.contact_address || '',
          contact_phone: savedData.contact_phone || '',
          contact_email: savedData.contact_email || ''
        })
      }
      
      // 加载进度
      const progress = await ds160Service.getFormProgress(token)
      setCompletedSteps(progress.completed_steps || [])
    } catch (error) {
      console.error('Failed to load saved data:', error)
    }
  }

  const onSubmit = async (data: UsContactFormData) => {
    setIsLoading(true)
    try {
      await ds160Service.saveFormStep(token, 'us_contact' as any, {
        contact_person: data.contact_person || '',
        organization_name: data.organization_name || '',
        relationship: data.relationship || '',
        contact_address: data.contact_address || '',
        contact_phone: data.contact_phone || '',
        contact_email: data.contact_email || ''
      })

      toast.success('美国联系人信息保存成功')
      router.push(`/fill/${token}/upload`)
    } catch (error) {
      console.error('Save error:', error)
      toast.error('保存失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 保存草稿
  const handleSaveDraft = async () => {
    setIsSaving(true)
    const formData = watch()
    try {
      await ds160Service.saveFormStep(token, 'us_contact' as any, {
        contact_person: formData.contact_person || '',
        organization_name: formData.organization_name || '',
        relationship: formData.relationship || '',
        contact_address: formData.contact_address || '',
        contact_phone: formData.contact_phone || '',
        contact_email: formData.contact_email || ''
      })
      
      toast.success('草稿已保存')
    } catch (error) {
      toast.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/fill/${token}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LS</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">DS-160表单填写</h1>
                  <p className="text-xs text-gray-500">美国非移民签证申请</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? '保存中...' : '保存草稿'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200"></div>
            <div className="absolute top-5 left-0 h-0.5 bg-blue-600" style={{ width: '90%' }}></div>
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center z-10",
                    index === 8 ? "bg-blue-600 text-white" :
                    completedSteps.includes(step.id) ? "bg-green-500 text-white" :
                    "bg-gray-200 text-gray-600"
                  )}>
                    {completedSteps.includes(step.id) ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <span className="mt-2 text-xs text-gray-600">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">第九步：美国联系人</h2>
          
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>说明：</strong>此部分为选填项。如果您在美国有联系人（如朋友、家人、商业伙伴、雇主等），请提供其联系信息。
              如果没有特定的联系人，可以留空直接进入下一步。
            </p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 联系人基本信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">联系人信息</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    联系人姓名（个人）
                  </label>
                  <input
                    {...register('contact_person')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.contact_person ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="如：John Smith"
                  />
                  {errors.contact_person && (
                    <p className="mt-1 text-xs text-red-600">{errors.contact_person.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    机构名称（如适用）
                  </label>
                  <input
                    {...register('organization_name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：XYZ Company"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    与您的关系
                  </label>
                  <select
                    {...register('relationship')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.relationship ? "border-red-300" : "border-gray-300"
                    )}
                  >
                    <option value="">请选择关系</option>
                    {relationshipOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.relationship && (
                    <p className="mt-1 text-xs text-red-600">{errors.relationship.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    联系电话
                  </label>
                  <input
                    {...register('contact_phone')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：+1-555-123-4567"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    联系邮箱
                  </label>
                  <input
                    {...register('contact_email')}
                    type="email"
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.contact_email ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="如：contact@example.com"
                  />
                  {errors.contact_email && (
                    <p className="mt-1 text-xs text-red-600">{errors.contact_email.message}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    联系地址
                  </label>
                  <textarea
                    {...register('contact_address')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入在美国的详细地址，包括街道、城市、州和邮编"
                  />
                </div>
              </div>
            </div>

            {/* 温馨提示 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">💡 填写提示</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 如果您是商务访问，可填写邀请公司的联系信息</li>
                <li>• 如果您是旅游，可填写酒店或旅行社的联系信息</li>
                <li>• 如果您是探亲访友，请填写亲友的联系信息</li>
                <li>• 如果您是学术访问，可填写邀请机构的联系信息</li>
                <li>• 如果没有特定联系人，可以不填写直接进入下一步</li>
              </ul>
            </div>

            {/* 按钮 */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => router.push(`/fill/${token}/previous-us-travel` as any)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                返回
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <span>保存并继续</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}