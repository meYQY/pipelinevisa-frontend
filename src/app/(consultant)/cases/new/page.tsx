'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, User, Mail, Phone, MapPin, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { casesService } from '@/services/cases.service'

// 表单验证schema
const newCaseSchema = z.object({
  // 申请人基本信息
  first_name: z.string().min(1, '请输入名字'),
  last_name: z.string().min(1, '请输入姓氏'),
  email: z.string().email('请输入有效的邮箱地址'),
  phone: z.string().min(1, '请输入电话号码'),
  
  // 案例信息
  visa_type: z.enum(['B1', 'B2', 'B1_B2', 'F1', 'H1B', 'L1', 'O1', 'OTHER'], {
    required_error: '请选择签证类型'
  }),
  purpose_of_travel: z.string().min(1, '请输入旅行目的'),
  preferred_interview_location: z.string().optional(),
  
  // 联系信息
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  
  // 备注
  notes: z.string().optional()
})

type NewCaseFormData = z.infer<typeof newCaseSchema>

const visaTypeOptions = [
  { value: 'B1', label: 'B1 (商务)' },
  { value: 'B2', label: 'B2 (旅游)' },
  { value: 'B1_B2', label: 'B1/B2 (商务/旅游)' },
  { value: 'F1', label: 'F1 (学生)' },
  { value: 'H1B', label: 'H1B (工作)' },
  { value: 'L1', label: 'L1 (公司内部调动)' },
  { value: 'O1', label: 'O1 (杰出人才)' },
  { value: 'OTHER', label: '其他' }
]

export default function NewCasePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<NewCaseFormData>({
    resolver: zodResolver(newCaseSchema),
    defaultValues: {
      visa_type: 'B1_B2'
    }
  })

  const onSubmit = async (data: NewCaseFormData) => {
    setIsLoading(true)
    try {
      const result = await casesService.createCase({
        applicant: {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          address: data.address || '',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || ''
        },
        case_info: {
          visa_type: data.visa_type,
          purpose_of_travel: data.purpose_of_travel,
          preferred_interview_location: data.preferred_interview_location || '',
          consultant_notes: data.notes || ''
        }
      })

      toast.success('新案例创建成功！')
      router.push(`/cases/${result.case_id}`)
    } catch (error) {
      console.error('Failed to create case:', error)
      toast.error('创建案例失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/cases')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">创建新案例</h1>
              <p className="text-sm text-gray-500">为新申请人创建签证申请档案</p>
            </div>
          </div>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* 申请人信息 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">申请人信息</h2>
                <p className="text-sm text-gray-500">基本联系信息</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名字 (First Name) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('first_name')}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.first_name ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="三"
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓氏 (Last Name) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('last_name')}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.last_name ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="张"
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.email ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="zhangsan@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  电话号码 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('phone')}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.phone ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="138-1234-5678"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  地址
                </label>
                <input
                  {...register('address')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="北京市朝阳区XX路XX号"
                />
              </div>
            </div>
          </div>

          {/* 签证信息 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">签证信息</h2>
                <p className="text-sm text-gray-500">申请类型和目的</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  签证类型 <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('visa_type')}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.visa_type ? "border-red-300" : "border-gray-300"
                  )}
                >
                  {visaTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.visa_type && (
                  <p className="mt-1 text-xs text-red-600">{errors.visa_type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  面试地点偏好
                </label>
                <input
                  {...register('preferred_interview_location')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="北京/上海/广州/沈阳/成都"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  旅行目的 <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('purpose_of_travel')}
                  rows={3}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.purpose_of_travel ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="请简要描述旅行目的..."
                />
                {errors.purpose_of_travel && (
                  <p className="mt-1 text-xs text-red-600">{errors.purpose_of_travel.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* 紧急联系人 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">紧急联系人</h2>
                <p className="text-sm text-gray-500">备用联系信息（可选）</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  紧急联系人姓名
                </label>
                <input
                  {...register('emergency_contact_name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="王五"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  紧急联系人电话
                </label>
                <input
                  {...register('emergency_contact_phone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="139-8765-4321"
                />
              </div>
            </div>
          </div>

          {/* 备注 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">顾问备注</h2>
                <p className="text-sm text-gray-500">内部记录，客户不可见</p>
              </div>
            </div>

            <textarea
              {...register('notes')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="记录案例特殊情况、客户需求等..."
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => router.push('/cases')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <span>创建中...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>创建案例</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}