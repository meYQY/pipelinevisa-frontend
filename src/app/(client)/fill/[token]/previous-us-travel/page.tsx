'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronRight, Save, ArrowLeft, CheckCircle, Plane, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ds160Service } from '@/services/ds160.service'

// 以往访问记录schema
const previousVisitSchema = z.object({
  arrival_date: z.string().optional(),
  length_of_stay: z.string().optional(),
  visa_number: z.string().optional()
})

// 表单验证schema
const previousUsTravelSchema = z.object({
  been_to_us: z.boolean(),
  previous_visits: z.array(previousVisitSchema).optional(),
  us_drivers_license: z.boolean(),
  license_number: z.string().optional(),
  license_state: z.string().optional(),
  visa_lost: z.boolean()
}).superRefine((data, ctx) => {
  // 如果去过美国，需要提供访问记录
  if (data.been_to_us && (!data.previous_visits || data.previous_visits.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '请添加至少一次访问记录',
      path: ['previous_visits']
    })
  }
  
  // 如果有美国驾照，需要提供驾照信息
  if (data.us_drivers_license) {
    if (!data.license_number) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '请输入驾照号码',
        path: ['license_number']
      })
    }
    if (!data.license_state) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '请选择签发州',
        path: ['license_state']
      })
    }
  }
  
  // 验证访问记录完整性
  if (data.previous_visits && data.previous_visits.length > 0) {
    data.previous_visits.forEach((visit, index) => {
      if (visit.arrival_date || visit.length_of_stay || visit.visa_number) {
        if (!visit.arrival_date) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '请输入到达日期',
            path: [`previous_visits.${index}.arrival_date`]
          })
        }
        if (!visit.length_of_stay) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '请输入停留时长',
            path: [`previous_visits.${index}.length_of_stay`]
          })
        }
      }
    })
  }
})

type PreviousUsTravelFormData = z.infer<typeof previousUsTravelSchema>

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

// 美国各州列表
const usStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming', 'District of Columbia'
]

export default function PreviousUsTravelPage() {
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
    reset,
    control
  } = useForm<PreviousUsTravelFormData>({
    resolver: zodResolver(previousUsTravelSchema),
    defaultValues: {
      been_to_us: false,
      us_drivers_license: false,
      visa_lost: false,
      previous_visits: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "previous_visits"
  })

  // 加载已保存的数据
  useEffect(() => {
    loadSavedData()
  }, [])

  const loadSavedData = async () => {
    try {
      const formData = await ds160Service.getFormData(token)
      if (formData?.form_data?.previous_us_travel) {
        const savedData = formData.form_data.previous_us_travel
        reset({
          been_to_us: savedData.been_to_us || false,
          previous_visits: savedData.previous_visits || [],
          us_drivers_license: savedData.us_drivers_license || false,
          license_number: savedData.license_number || '',
          license_state: savedData.license_state || '',
          visa_lost: savedData.visa_lost || false
        })
      }
      
      // 加载进度
      const progress = await ds160Service.getFormProgress(token)
      setCompletedSteps(progress.completed_steps || [])
    } catch (error) {
      console.error('Failed to load saved data:', error)
    }
  }

  const beenToUs = watch('been_to_us')
  const usDriversLicense = watch('us_drivers_license')

  const addVisit = () => {
    append({ arrival_date: '', length_of_stay: '', visa_number: '' })
  }

  const onSubmit = async (data: PreviousUsTravelFormData) => {
    setIsLoading(true)
    try {
      // 清理空的访问记录
      const cleanedVisits = data.previous_visits?.filter(visit => 
        visit.arrival_date || visit.length_of_stay || visit.visa_number
      ) || []

      await ds160Service.saveFormStep(token, 'previous_us_travel', {
        been_to_us: data.been_to_us,
        previous_visits: cleanedVisits,
        us_drivers_license: data.us_drivers_license,
        license_number: data.license_number || '',
        license_state: data.license_state || '',
        visa_lost: data.visa_lost
      })

      toast.success('美国旅行历史保存成功')
      router.push(`/fill/${token}/us-contact` as any)
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
      const cleanedVisits = formData.previous_visits?.filter(visit => 
        visit.arrival_date || visit.length_of_stay || visit.visa_number
      ) || []

      await ds160Service.saveFormStep(token, 'previous_us_travel', {
        been_to_us: formData.been_to_us || false,
        previous_visits: cleanedVisits,
        us_drivers_license: formData.us_drivers_license || false,
        license_number: formData.license_number || '',
        license_state: formData.license_state || '',
        visa_lost: formData.visa_lost || false
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
            <div className="absolute top-5 left-0 h-0.5 bg-blue-600" style={{ width: '80%' }}></div>
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center z-10",
                    index === 7 ? "bg-blue-600 text-white" :
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">第八步：美国旅行历史</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 基本问题 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">美国旅行经历</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center">
                    <input
                      {...register('been_to_us')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      曾经访问过美国
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center">
                    <input
                      {...register('us_drivers_license')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      持有美国驾照
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center">
                    <input
                      {...register('visa_lost')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      曾经丢失过签证
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 美国驾照信息 */}
            {usDriversLicense && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">美国驾照信息</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      驾照号码<span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('license_number')}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        errors.license_number ? "border-red-300" : "border-gray-300"
                      )}
                      placeholder="请输入驾照号码"
                    />
                    {errors.license_number && (
                      <p className="mt-1 text-xs text-red-600">{errors.license_number.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      签发州<span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('license_state')}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        errors.license_state ? "border-red-300" : "border-gray-300"
                      )}
                    >
                      <option value="">请选择州</option>
                      {usStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    {errors.license_state && (
                      <p className="mt-1 text-xs text-red-600">{errors.license_state.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 访问记录 */}
            {beenToUs && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">以往访问记录</h3>
                  <button
                    type="button"
                    onClick={addVisit}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>添加访问记录</span>
                  </button>
                </div>

                {fields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Plane className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="mb-4">暂无访问记录</p>
                    <button
                      type="button"
                      onClick={addVisit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      添加第一次访问记录
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-md font-medium text-gray-900">第 {index + 1} 次访问</h4>
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              到达日期
                            </label>
                            <input
                              {...register(`previous_visits.${index}.arrival_date` as const)}
                              type="date"
                              className={cn(
                                "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                                errors.previous_visits?.[index]?.arrival_date ? "border-red-300" : "border-gray-300"
                              )}
                            />
                            {errors.previous_visits?.[index]?.arrival_date && (
                              <p className="mt-1 text-xs text-red-600">
                                {errors.previous_visits[index].arrival_date?.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              停留时长
                            </label>
                            <input
                              {...register(`previous_visits.${index}.length_of_stay` as const)}
                              className={cn(
                                "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                                errors.previous_visits?.[index]?.length_of_stay ? "border-red-300" : "border-gray-300"
                              )}
                              placeholder="如：30天"
                            />
                            {errors.previous_visits?.[index]?.length_of_stay && (
                              <p className="mt-1 text-xs text-red-600">
                                {errors.previous_visits[index].length_of_stay?.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              签证号码（可选）
                            </label>
                            <input
                              {...register(`previous_visits.${index}.visa_number` as const)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="签证号码"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {errors.previous_visits && typeof errors.previous_visits.message === 'string' && (
                  <p className="text-xs text-red-600">{errors.previous_visits.message}</p>
                )}
              </div>
            )}

            {/* 按钮 */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => router.push(`/fill/${token}/travel-companions` as any)}
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