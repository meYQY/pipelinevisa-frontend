'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronRight, Save, ArrowLeft, CheckCircle, Users, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ds160Service } from '@/services/ds160.service'

// 旅行同伴schema
const companionSchema = z.object({
  surname: z.string().optional(),
  given_name: z.string().optional(),
  relationship: z.string().optional()
})

// 表单验证schema
const travelCompanionsSchema = z.object({
  traveling_with_others: z.boolean(),
  traveling_as_group: z.boolean(),
  group_name: z.string().optional(),
  companions: z.array(companionSchema).optional()
}).superRefine((data, ctx) => {
  // 如果与他人一起旅行，需要提供同伴信息
  if (data.traveling_with_others && (!data.companions || data.companions.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '请添加至少一位旅行同伴',
      path: ['companions']
    })
  }
  
  // 如果是团体旅行，需要提供团体名称
  if (data.traveling_as_group && !data.group_name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '请输入团体名称',
      path: ['group_name']
    })
  }
  
  // 验证同伴信息完整性
  if (data.companions && data.companions.length > 0) {
    data.companions.forEach((companion, index) => {
      if (companion.surname || companion.given_name || companion.relationship) {
        if (!companion.surname) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '请输入同伴姓氏',
            path: [`companions.${index}.surname`]
          })
        }
        if (!companion.given_name) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '请输入同伴名字',
            path: [`companions.${index}.given_name`]
          })
        }
        if (!companion.relationship) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '请选择关系',
            path: [`companions.${index}.relationship`]
          })
        }
      }
    })
  }
})

type TravelCompanionsFormData = z.infer<typeof travelCompanionsSchema>

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
  { value: 'spouse', label: '配偶' },
  { value: 'child', label: '子女' },
  { value: 'parent', label: '父母' },
  { value: 'sibling', label: '兄弟姐妹' },
  { value: 'relative', label: '其他亲属' },
  { value: 'friend', label: '朋友' },
  { value: 'colleague', label: '同事' },
  { value: 'business_partner', label: '商业伙伴' },
  { value: 'other', label: '其他' }
]

export default function TravelCompanionsPage() {
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
  } = useForm<TravelCompanionsFormData>({
    resolver: zodResolver(travelCompanionsSchema),
    defaultValues: {
      traveling_with_others: false,
      traveling_as_group: false,
      companions: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "companions"
  })

  // 加载已保存的数据
  useEffect(() => {
    loadSavedData()
  }, [])

  const loadSavedData = async () => {
    try {
      const formData = await ds160Service.getFormData(token)
      if (formData?.form_data?.travel_companions) {
        const savedData = formData.form_data.travel_companions
        reset({
          traveling_with_others: savedData.traveling_with_others || false,
          traveling_as_group: savedData.traveling_as_group || false,
          group_name: savedData.group_name || '',
          companions: savedData.companions || []
        })
      }
      
      // 加载进度
      const progress = await ds160Service.getFormProgress(token)
      setCompletedSteps(progress.completed_steps || [])
    } catch (error) {
      console.error('Failed to load saved data:', error)
    }
  }

  const travelingWithOthers = watch('traveling_with_others')
  const travelingAsGroup = watch('traveling_as_group')

  const addCompanion = () => {
    append({ surname: '', given_name: '', relationship: '' })
  }

  const onSubmit = async (data: TravelCompanionsFormData) => {
    setIsLoading(true)
    try {
      // 清理空的同伴记录
      const cleanedCompanions = data.companions?.filter(companion => 
        companion.surname || companion.given_name || companion.relationship
      ) || []

      await ds160Service.saveFormStep(token, 'travel_companions', {
        traveling_with_others: data.traveling_with_others,
        traveling_as_group: data.traveling_as_group,
        group_name: data.group_name || '',
        companions: cleanedCompanions
      })

      toast.success('旅行同伴信息保存成功')
      router.push(`/fill/${token}/previous-us-travel` as any)
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
      const cleanedCompanions = formData.companions?.filter(companion => 
        companion.surname || companion.given_name || companion.relationship
      ) || []

      await ds160Service.saveFormStep(token, 'travel_companions', {
        traveling_with_others: formData.traveling_with_others || false,
        traveling_as_group: formData.traveling_as_group || false,
        group_name: formData.group_name || '',
        companions: cleanedCompanions
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
            <div className="absolute top-5 left-0 h-0.5 bg-blue-600" style={{ width: '70%' }}></div>
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center z-10",
                    index === 6 ? "bg-blue-600 text-white" :
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">第七步：旅行同伴</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 基本问题 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">旅行安排</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center">
                    <input
                      {...register('traveling_with_others')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      与他人一起旅行
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center">
                    <input
                      {...register('traveling_as_group')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      作为团体旅行
                    </label>
                  </div>
                </div>

                {travelingAsGroup && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      团体名称<span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('group_name')}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        errors.group_name ? "border-red-300" : "border-gray-300"
                      )}
                      placeholder="请输入团体或组织名称"
                    />
                    {errors.group_name && (
                      <p className="mt-1 text-xs text-red-600">{errors.group_name.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 同伴信息 */}
            {travelingWithOthers && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">同伴信息</h3>
                  <button
                    type="button"
                    onClick={addCompanion}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>添加同伴</span>
                  </button>
                </div>

                {fields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="mb-4">暂无同伴信息</p>
                    <button
                      type="button"
                      onClick={addCompanion}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      添加第一位同伴
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-md font-medium text-gray-900">同伴 {index + 1}</h4>
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
                              姓氏
                            </label>
                            <input
                              {...register(`companions.${index}.surname` as const)}
                              className={cn(
                                "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                                errors.companions?.[index]?.surname ? "border-red-300" : "border-gray-300"
                              )}
                              placeholder="张"
                            />
                            {errors.companions?.[index]?.surname && (
                              <p className="mt-1 text-xs text-red-600">
                                {errors.companions[index].surname?.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              名字
                            </label>
                            <input
                              {...register(`companions.${index}.given_name` as const)}
                              className={cn(
                                "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                                errors.companions?.[index]?.given_name ? "border-red-300" : "border-gray-300"
                              )}
                              placeholder="三"
                            />
                            {errors.companions?.[index]?.given_name && (
                              <p className="mt-1 text-xs text-red-600">
                                {errors.companions[index].given_name?.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              关系
                            </label>
                            <select
                              {...register(`companions.${index}.relationship` as const)}
                              className={cn(
                                "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                                errors.companions?.[index]?.relationship ? "border-red-300" : "border-gray-300"
                              )}
                            >
                              <option value="">请选择关系</option>
                              {relationshipOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {errors.companions?.[index]?.relationship && (
                              <p className="mt-1 text-xs text-red-600">
                                {errors.companions[index].relationship?.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {errors.companions && typeof errors.companions.message === 'string' && (
                  <p className="text-xs text-red-600">{errors.companions.message}</p>
                )}
              </div>
            )}

            {/* 按钮 */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => router.push(`/fill/${token}/travel-info` as any)}
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