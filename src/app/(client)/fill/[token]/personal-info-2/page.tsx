'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronRight, Save, ArrowLeft, CheckCircle, User } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ds160Service } from '@/services/ds160.service'

// 表单验证schema
const personalInfo2Schema = z.object({
  nationality: z.string().min(1, '请选择国籍'),
  other_nationalities: z.boolean(),
  other_nationalities_list: z.array(z.string()).optional(),
  us_social_security_number: z.string().optional(),
  marital_status: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'LEGALLY_SEPARATED'], { required_error: '请选择婚姻状况' }),
  other_names_used: z.boolean(),
  other_surnames: z.string().optional(),
  other_given_names: z.string().optional(),
}).superRefine((data, ctx) => {
  // 如果有其他国籍，需要填写列表
  if (data.other_nationalities && (!data.other_nationalities_list || data.other_nationalities_list.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '请输入其他国籍',
      path: ['other_nationalities_list']
    })
  }
  
  // 如果曾用其他姓名，需要填写
  if (data.other_names_used && (!data.other_surnames || !data.other_given_names)) {
    if (!data.other_surnames) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '请输入曾用姓氏',
        path: ['other_surnames']
      })
    }
    if (!data.other_given_names) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '请输入曾用名字',
        path: ['other_given_names']
      })
    }
  }
})

type PersonalInfo2FormData = z.infer<typeof personalInfo2Schema>

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

// 国籍选项
const nationalities = [
  'China', 'United States', 'Canada', 'United Kingdom', 'Australia', 
  'Germany', 'France', 'Japan', 'South Korea', 'Singapore', 'Other'
]

// 婚姻状况选项
const maritalStatusOptions = [
  { value: 'SINGLE', label: '未婚' },
  { value: 'MARRIED', label: '已婚' },
  { value: 'DIVORCED', label: '离异' },
  { value: 'WIDOWED', label: '丧偶' },
  { value: 'LEGALLY_SEPARATED', label: '法律分居' }
]

export default function PersonalInfo2Page() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [additionalNationalities, setAdditionalNationalities] = useState<string[]>([''])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<PersonalInfo2FormData>({
    resolver: zodResolver(personalInfo2Schema),
    defaultValues: {
      nationality: 'China',
      other_nationalities: false,
      other_names_used: false,
      marital_status: 'SINGLE'
    }
  })

  // 加载已保存的数据
  useEffect(() => {
    loadSavedData()
  }, [])

  const loadSavedData = async () => {
    try {
      const formData = await ds160Service.getFormData(token)
      const originalData = (formData as any)?.original_data || formData?.form_data?.personal_info_2;
      if (originalData) {
        // 从后端JSONB字段读取personal_info_2数据
        const savedData = originalData
        reset({
          nationality: savedData.nationality || 'China',
          other_nationalities: savedData.has_other_nationality || false,
          other_nationalities_list: savedData.other_nationality ? [savedData.other_nationality] : [],
          us_social_security_number: savedData.us_social_security_number || '',
          marital_status: savedData.marital_status || 'SINGLE',
          other_names_used: savedData.has_used_other_names || false,
          other_surnames: savedData.other_surnames || '',
          other_given_names: savedData.other_given_names || ''
        })
        
        if (savedData.other_nationality) {
          setAdditionalNationalities([savedData.other_nationality])
        }
      }
      
      // 加载进度
      const progress = await ds160Service.getFormProgress(token)
      setCompletedSteps(progress.completed_steps || [])
    } catch (error) {
      console.error('Failed to load saved data:', error)
    }
  }

  const otherNationalities = watch('other_nationalities')
  const otherNamesUsed = watch('other_names_used')

  const addNationality = () => {
    setAdditionalNationalities([...additionalNationalities, ''])
  }

  const removeNationality = (index: number) => {
    const updated = additionalNationalities.filter((_, i) => i !== index)
    setAdditionalNationalities(updated)
    setValue('other_nationalities_list', updated.filter(n => n.trim()))
  }

  const updateNationality = (index: number, value: string) => {
    const updated = [...additionalNationalities]
    updated[index] = value
    setAdditionalNationalities(updated)
    setValue('other_nationalities_list', updated.filter(n => n.trim()))
  }

  const onSubmit = async (data: PersonalInfo2FormData) => {
    setIsLoading(true)
    try {
      // 保存personal-info-2数据 - 使用官方DS-160字段名
      await ds160Service.saveFormStep(token, 'personal_info_2', {
        nationality: data.nationality,
        has_other_nationality: data.other_nationalities,
        other_nationality: data.other_nationalities_list?.[0] || '',
        us_social_security_number: data.us_social_security_number || ''
      })
      
      // 更新personal-info-1中的相关字段
      await ds160Service.saveFormStep(token, 'personal_info_1', {
        marital_status: data.marital_status,
        has_used_other_names: data.other_names_used,
        other_surnames: data.other_surnames || '',
        other_given_names: data.other_given_names || ''
      })

      toast.success('个人详情保存成功')
      router.push(`/fill/${token}/address-phone` as any)
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
      await ds160Service.saveFormStep(token, 'personal_info_2', {
        nationality: formData.nationality || '',
        has_other_nationality: formData.other_nationalities || false,
        other_nationality: formData.other_nationalities_list?.[0] || '',
        us_social_security_number: formData.us_social_security_number || ''
      })
      
      await ds160Service.saveFormStep(token, 'personal_info_1', {
        marital_status: formData.marital_status,
        has_used_other_names: formData.other_names_used || false,
        other_surnames: formData.other_surnames || '',
        other_given_names: formData.other_given_names || ''
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
            <div className="absolute top-5 left-0 h-0.5 bg-blue-600" style={{ width: '20%' }}></div>
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center z-10",
                    index === 1 ? "bg-blue-600 text-white" :
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">第二步：个人详情</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 国籍信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">国籍信息</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    国籍<span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('nationality')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.nationality ? "border-red-300" : "border-gray-300"
                    )}
                  >
                    {nationalities.map(nationality => (
                      <option key={nationality} value={nationality}>{nationality}</option>
                    ))}
                  </select>
                  {errors.nationality && (
                    <p className="mt-1 text-xs text-red-600">{errors.nationality.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    婚姻状况<span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('marital_status')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.marital_status ? "border-red-300" : "border-gray-300"
                    )}
                  >
                    {maritalStatusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.marital_status && (
                    <p className="mt-1 text-xs text-red-600">{errors.marital_status.message}</p>
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <div className="flex items-center">
                  <input
                    {...register('other_nationalities')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    持有其他国籍
                  </label>
                </div>
              </div>

              {otherNationalities && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    其他国籍<span className="text-red-500">*</span>
                  </label>
                  {additionalNationalities.map((nationality, index) => (
                    <div key={index} className="flex space-x-2">
                      <select
                        value={nationality}
                        onChange={(e) => updateNationality(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">选择国籍</option>
                        {nationalities.filter(n => n !== watch('nationality')).map(nat => (
                          <option key={nat} value={nat}>{nat}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeNationality(index)}
                        className="px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addNationality}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    + 添加其他国籍
                  </button>
                  {errors.other_nationalities_list && (
                    <p className="text-xs text-red-600">{errors.other_nationalities_list.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* 曾用名信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">曾用名信息</h3>
              
              <div>
                <div className="flex items-center">
                  <input
                    {...register('other_names_used')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    曾使用过其他姓名
                  </label>
                </div>
              </div>

              {otherNamesUsed && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      曾用姓氏<span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('other_surnames')}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        errors.other_surnames ? "border-red-300" : "border-gray-300"
                      )}
                      placeholder="曾用姓氏"
                    />
                    {errors.other_surnames && (
                      <p className="mt-1 text-xs text-red-600">{errors.other_surnames.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      曾用名字<span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('other_given_names')}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        errors.other_given_names ? "border-red-300" : "border-gray-300"
                      )}
                      placeholder="曾用名字"
                    />
                    {errors.other_given_names && (
                      <p className="mt-1 text-xs text-red-600">{errors.other_given_names.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 社会安全号 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">美国信息（如有）</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  美国社会安全号（可选）
                </label>
                <input
                  {...register('us_social_security_number')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000-00-0000"
                />
              </div>
            </div>

            {/* 按钮 */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => router.push(`/fill/${token}/basic-info`)}
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