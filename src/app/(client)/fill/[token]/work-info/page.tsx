'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronRight, Save, ArrowLeft, CheckCircle, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ds160Service } from '@/services/ds160.service'

// 表单验证schema
const workInfoSchema = z.object({
  primary_occupation: z.string().min(1, '请输入主要职业'),
  employment_status: z.enum(['employed', 'self_employed', 'unemployed', 'student', 'retired'], {
    required_error: '请选择就业状态'
  }),
  employer_name: z.string().optional(),
  employer_address: z.string().optional(),
  employer_phone: z.string().optional(),
  job_title: z.string().optional(),
  monthly_salary: z.coerce.number().optional(),
  employment_start_date: z.string().optional(),
  duties: z.string().optional()
}).superRefine((data, ctx) => {
  // 如果是在职或自雇，需要填写相关信息
  if (data.employment_status === 'employed' || data.employment_status === 'self_employed') {
    if (!data.employer_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '请输入雇主名称',
        path: ['employer_name']
      })
    }
    if (!data.job_title) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '请输入职位名称',
        path: ['job_title']
      })
    }
  }
})

type WorkInfoFormData = z.infer<typeof workInfoSchema>

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

// 就业状态选项
const employmentStatusOptions = [
  { value: 'employed', label: '在职' },
  { value: 'self_employed', label: '自雇' },
  { value: 'unemployed', label: '无业' },
  { value: 'student', label: '学生' },
  { value: 'retired', label: '退休' }
]

export default function WorkInfoPage() {
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
  } = useForm<WorkInfoFormData>({
    resolver: zodResolver(workInfoSchema),
    defaultValues: {
      employment_status: 'employed'
    }
  })

  // 加载已保存的数据
  useEffect(() => {
    loadSavedData()
  }, [])

  const loadSavedData = async () => {
    try {
      const formData = await ds160Service.getFormData(token)
      if (formData?.form_data) {
        const savedData = (formData.form_data as any).work_education
        reset({
          primary_occupation: savedData.primary_occupation || '',
          employment_status: savedData.employment_status as any || 'employed',
          employer_name: savedData.employer_name || '',
          employer_address: savedData.employer_address || '',
          employer_phone: savedData.employer_phone || '',
          job_title: savedData.job_title || '',
          monthly_salary: savedData.monthly_salary || 0,
          employment_start_date: savedData.employment_start_date || '',
          duties: savedData.duties || ''
        })
      }
      
      // 加载进度
      const progress = await ds160Service.getFormProgress(token)
      setCompletedSteps(progress.completed_steps || [])
    } catch (error) {
      console.error('Failed to load saved data:', error)
    }
  }

  const employmentStatus = watch('employment_status')
  const showEmploymentFields = employmentStatus === 'employed' || employmentStatus === 'self_employed'

  const onSubmit = async (data: WorkInfoFormData) => {
    setIsLoading(true)
    try {
      // 保存到后端
      await ds160Service.saveFormStep(token, 'work_education' as any, {
        primary_occupation: data.primary_occupation,
        employment_status: data.employment_status,
        employer_name: data.employer_name || '',
        employer_address: data.employer_address || '',
        employer_phone: data.employer_phone || '',
        job_title: data.job_title || '',
        monthly_salary: data.monthly_salary,
        employment_start_date: data.employment_start_date || '',
        duties: data.duties || ''
      })

      toast.success('工作信息保存成功')
      router.push(`/fill/${token}/family-info`)
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
      await ds160Service.saveFormStep(token, 'work_education' as any, {
        primary_occupation: formData.primary_occupation || '',
        employment_status: formData.employment_status,
        employer_name: formData.employer_name || '',
        employer_address: formData.employer_address || '',
        employer_phone: formData.employer_phone || '',
        job_title: formData.job_title || '',
        monthly_salary: formData.monthly_salary,
        employment_start_date: formData.employment_start_date || '',
        duties: formData.duties || ''
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
            <div className="absolute top-5 left-0 h-0.5 bg-blue-600" style={{ width: '40%' }}></div>
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center z-10",
                    index === 3 ? "bg-blue-600 text-white" :
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">第二步：工作信息</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 职业信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">职业信息</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    主要职业<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('primary_occupation')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.primary_occupation ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="如：软件工程师"
                  />
                  {errors.primary_occupation && (
                    <p className="mt-1 text-xs text-red-600">{errors.primary_occupation.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    就业状态<span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('employment_status')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.employment_status ? "border-red-300" : "border-gray-300"
                    )}
                  >
                    {employmentStatusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.employment_status && (
                    <p className="mt-1 text-xs text-red-600">{errors.employment_status.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 在职/自雇字段 */}
            {showEmploymentFields && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">雇主信息</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {employmentStatus === 'self_employed' ? '公司名称' : '雇主名称'}<span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('employer_name')}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        errors.employer_name ? "border-red-300" : "border-gray-300"
                      )}
                      placeholder={employmentStatus === 'self_employed' ? '您的公司名称' : '雇主全称'}
                    />
                    {errors.employer_name && (
                      <p className="mt-1 text-xs text-red-600">{errors.employer_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      职位名称<span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('job_title')}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        errors.job_title ? "border-red-300" : "border-gray-300"
                      )}
                      placeholder="如：高级软件工程师"
                    />
                    {errors.job_title && (
                      <p className="mt-1 text-xs text-red-600">{errors.job_title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      月薪（人民币）
                    </label>
                    <input
                      {...register('monthly_salary')}
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="15000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      入职日期
                    </label>
                    <input
                      {...register('employment_start_date')}
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      雇主电话
                    </label>
                    <input
                      {...register('employer_phone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="010-12345678"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      雇主地址
                    </label>
                    <input
                      {...register('employer_address')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="北京市朝阳区XX路XX号"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      工作职责描述
                    </label>
                    <textarea
                      {...register('duties')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="简要描述您的主要工作职责..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 按钮 */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => router.push(`/fill/${token}/address-phone` as any)}
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