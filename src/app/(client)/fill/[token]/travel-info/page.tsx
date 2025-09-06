'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronRight, Save, ArrowLeft, CheckCircle, Plane } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ds160Service } from '@/services/ds160.service'

// 表单验证schema
const travelInfoSchema = z.object({
  purpose_of_trip: z.string().min(1, '请选择访问目的'),
  arrival_date: z.string().min(1, '请选择预计到达日期'),
  arrival_flight: z.string().optional(),
  arrival_city: z.string().optional(),
  departure_date: z.string().min(1, '请选择预计离开日期'),
  departure_flight: z.string().optional(),
  departure_city: z.string().optional(),
  trip_duration: z.coerce.number().min(1, '请输入有效的停留天数'),
  address_in_us: z.string().min(1, '请输入在美国的地址'),
  paying_person_relationship: z.string().min(1, '请输入费用承担关系'),
}).superRefine((data, ctx) => {
  // 验证日期逻辑
  if (data.arrival_date && data.departure_date) {
    const arrival = new Date(data.arrival_date)
    const departure = new Date(data.departure_date)
    if (departure <= arrival) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '离开日期必须晚于到达日期',
        path: ['departure_date']
      })
    }
  }
})

type TravelInfoFormData = z.infer<typeof travelInfoSchema>

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

// 访问目的选项
const purposeOptions = [
  { value: 'tourism', label: '旅游观光' },
  { value: 'business', label: '商务访问' },
  { value: 'study', label: '学习交流' },
  { value: 'work', label: '工作访问' },
  { value: 'medical', label: '医疗治疗' },
  { value: 'conference', label: '会议参展' },
  { value: 'visit_family', label: '探亲访友' },
  { value: 'other', label: '其他' }
]

// 费用承担方选项
const payingPersonOptions = [
  { value: 'self', label: '本人' },
  { value: 'company', label: '公司' },
  { value: 'family', label: '家庭' },
  { value: 'friend', label: '朋友' },
  { value: 'organization', label: '组织机构' },
  { value: 'other', label: '其他' }
]

export default function TravelInfoPage() {
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
  } = useForm<TravelInfoFormData>({
    resolver: zodResolver(travelInfoSchema),
    defaultValues: {
      purpose_of_trip: 'tourism'
    }
  })

  // 加载已保存的数据
  useEffect(() => {
    loadSavedData()
  }, [])

  const loadSavedData = async () => {
    try {
      const formData = await ds160Service.getFormData(token)
      if (formData?.form_data?.travel) {
        const savedData = formData.form_data.travel
        reset({
          purpose_of_trip: savedData.purpose_of_trip || 'tourism',
          arrival_date: savedData.arrival_date || '',
          arrival_flight: savedData.arrival_flight || '',
          arrival_city: savedData.arrival_city || '',
          departure_date: savedData.departure_date || '',
          departure_flight: savedData.departure_flight || '',
          departure_city: savedData.departure_city || '',
          trip_duration: savedData.trip_duration || 0,
          address_in_us: savedData.address_in_us || '',
          paying_person_relationship: savedData.paying_person_relationship || '',
        })
      }
      
      // 加载进度
      const progress = await ds160Service.getFormProgress(token)
      setCompletedSteps(progress.completed_steps || [])
    } catch (error) {
      console.error('Failed to load saved data:', error)
    }
  }

  const onSubmit = async (data: TravelInfoFormData) => {
    setIsLoading(true)
    try {
      // 保存到后端
      await ds160Service.saveFormStep(token, 'travel', {
        purpose_of_trip: data.purpose_of_trip,
        arrival_date: data.arrival_date,
        arrival_flight: data.arrival_flight || '',
        arrival_city: data.arrival_city || '',
        departure_date: data.departure_date,
        departure_flight: data.departure_flight || '',
        departure_city: data.departure_city || '',
        trip_duration: data.trip_duration,
        address_in_us: data.address_in_us,
        paying_person_relationship: data.paying_person_relationship,
      })

      toast.success('旅行信息保存成功')
      router.push(`/fill/${token}/travel-companions` as any)
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
      await ds160Service.saveFormStep(token, 'travel', {
        purpose_of_trip: formData.purpose_of_trip || '',
        arrival_date: formData.arrival_date || '',
        arrival_flight: formData.arrival_flight || '',
        arrival_city: formData.arrival_city || '',
        departure_date: formData.departure_date || '',
        departure_flight: formData.departure_flight || '',
        departure_city: formData.departure_city || '',
        trip_duration: formData.trip_duration ? formData.trip_duration : undefined,
        address_in_us: formData.address_in_us || '',
        paying_person_relationship: formData.paying_person_relationship || '',
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
            <div className="absolute top-5 left-0 h-0.5 bg-blue-600" style={{ width: '60%' }}></div>
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center z-10",
                    index === 5 ? "bg-blue-600 text-white" :
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">第四步：旅行信息</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 旅行计划 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">旅行计划</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    访问目的<span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('purpose_of_trip')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.purpose_of_trip ? "border-red-300" : "border-gray-300"
                    )}
                  >
                    {purposeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.purpose_of_trip && (
                    <p className="mt-1 text-xs text-red-600">{errors.purpose_of_trip.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    预计停留天数<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('trip_duration')}
                    type="number"
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.trip_duration ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="30"
                  />
                  {errors.trip_duration && (
                    <p className="mt-1 text-xs text-red-600">{errors.trip_duration.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    预计到达日期<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('arrival_date')}
                    type="date"
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.arrival_date ? "border-red-300" : "border-gray-300"
                    )}
                  />
                  {errors.arrival_date && (
                    <p className="mt-1 text-xs text-red-600">{errors.arrival_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    预计离开日期<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('departure_date')}
                    type="date"
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.departure_date ? "border-red-300" : "border-gray-300"
                    )}
                  />
                  {errors.departure_date && (
                    <p className="mt-1 text-xs text-red-600">{errors.departure_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    到达航班（可选）
                  </label>
                  <input
                    {...register('arrival_flight')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：CA988"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    到达城市（可选）
                  </label>
                  <input
                    {...register('arrival_city')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：Los Angeles"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    离开航班（可选）
                  </label>
                  <input
                    {...register('departure_flight')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：CA987"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    离开城市（可选）
                  </label>
                  <input
                    {...register('departure_city')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：New York"
                  />
                </div>
              </div>
            </div>

            {/* 在美国的信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">在美国的信息</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    在美国的地址<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('address_in_us')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.address_in_us ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="如：123 Main Street, Los Angeles, CA 90210"
                  />
                  {errors.address_in_us && (
                    <p className="mt-1 text-xs text-red-600">{errors.address_in_us.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    费用承担关系<span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('paying_person_relationship')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.paying_person_relationship ? "border-red-300" : "border-gray-300"
                    )}
                  >
                    <option value="">请选择费用承担方</option>
                    {payingPersonOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.paying_person_relationship && (
                    <p className="mt-1 text-xs text-red-600">{errors.paying_person_relationship.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 按钮 */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => router.push(`/fill/${token}/family-info`)}
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