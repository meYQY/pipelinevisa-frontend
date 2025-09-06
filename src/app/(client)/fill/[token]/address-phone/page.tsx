'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronRight, Save, ArrowLeft, CheckCircle, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ds160Service } from '@/services/ds160.service'

// 表单验证schema - 与后端API字段对齐
const addressPhoneSchema = z.object({
  home_address_street: z.string().min(1, '请输入家庭地址'),
  home_address_city: z.string().min(1, '请输入城市'),
  home_address_state: z.string().min(1, '请选择省/市'),
  home_address_postal_code: z.string().optional(),
  home_address_country: z.string().min(1, '请选择国家'),
  is_mailing_address_same_as_home: z.boolean(),
  mailing_address_street: z.string().optional(),
  mailing_address_city: z.string().optional(),
  mailing_address_state: z.string().optional(),
  mailing_address_postal_code: z.string().optional(),
  mailing_address_country: z.string().optional(),
  primary_phone_number: z.string().min(1, '请输入主要电话号码'),
  secondary_phone_number: z.string().optional(),
  work_phone_number: z.string().optional(),
  email_address: z.string().email('请输入有效的邮箱地址'),
  social_media_accounts: z.array(z.object({
    platform: z.string(),
    username: z.string()
  })).optional().default([])
}).superRefine((data, ctx) => {
  // 如果邮寄地址与家庭地址不同，需要填写邮寄地址
  if (!data.is_mailing_address_same_as_home && !data.mailing_address_street) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '请输入邮寄地址',
      path: ['mailing_address_street']
    })
  }
})

type AddressPhoneFormData = z.infer<typeof addressPhoneSchema>

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

// 省份列表
const provinces = [
  '北京市', '天津市', '河北省', '山西省', '内蒙古自治区',
  '辽宁省', '吉林省', '黑龙江省', '上海市', '江苏省',
  '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '广西壮族自治区',
  '海南省', '重庆市', '四川省', '贵州省', '云南省',
  '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区',
  '新疆维吾尔自治区', '台湾省', '香港特别行政区', '澳门特别行政区'
]

// 国家列表
const countries = ['中国', '美国', '加拿大', '英国', '澳大利亚', '其他']

export default function AddressPhonePage() {
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
  } = useForm<AddressPhoneFormData>({
    resolver: zodResolver(addressPhoneSchema),
    defaultValues: {
      home_address_state: '北京市',
      home_address_country: '中国',
      is_mailing_address_same_as_home: true
    }
  })

  // 加载已保存的数据
  useEffect(() => {
    loadSavedData()
  }, [])

  const loadSavedData = async () => {
    try {
      const formData = await ds160Service.getFormData(token)
      if (formData?.form_data?.address_phone) {
        const savedData = formData.form_data.address_phone
        reset({
          home_address_street: savedData.home_address_street || '',
          home_address_city: savedData.home_address_city || '',
          home_address_state: savedData.home_address_state || '北京市',
          home_address_postal_code: savedData.home_address_postal_code || '',
          home_address_country: savedData.home_address_country || '中国',
          is_mailing_address_same_as_home: savedData.is_mailing_address_same_as_home ?? true,
          mailing_address_street: savedData.mailing_address_street || '',
          primary_phone_number: savedData.primary_phone_number || '',
          secondary_phone_number: savedData.secondary_phone_number || '',
          work_phone_number: savedData.work_phone_number || '',
          email_address: savedData.email_address || '',
          social_media_accounts: savedData.social_media_accounts || []
        })
      }
      
      // 加载进度
      const progress = await ds160Service.getFormProgress(token)
      setCompletedSteps(progress.completed_steps || [])
    } catch (error) {
      console.error('Failed to load saved data:', error)
    }
  }

  const isMailingAddressSameAsHome = watch('is_mailing_address_same_as_home')

  const onSubmit = async (data: AddressPhoneFormData) => {
    setIsLoading(true)
    try {
      // 保存到后端 - 使用官方DS-160字段名
      await ds160Service.saveFormStep(token, 'address_phone', data)

      toast.success('地址电话保存成功')
      router.push(`/fill/${token}/work-info`)
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
      await ds160Service.saveFormStep(token, 'address_phone', formData)
      
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
            <div className="absolute top-5 left-0 h-0.5 bg-blue-600" style={{ width: '30%' }}></div>
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center z-10",
                    index === 2 ? "bg-blue-600 text-white" :
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">第三步：地址和电话</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 家庭地址 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">家庭地址</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    详细地址<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('home_address_street')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.home_address_street ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="请输入详细地址，如：朝阳区建国门外大街1号"
                  />
                  {errors.home_address_street && (
                    <p className="mt-1 text-xs text-red-600">{errors.home_address_street.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    城市<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('home_address_city')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.home_address_city ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="北京市"
                  />
                  {errors.home_address_city && (
                    <p className="mt-1 text-xs text-red-600">{errors.home_address_city.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    省/市<span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('home_address_state')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.home_address_state ? "border-red-300" : "border-gray-300"
                    )}
                  >
                    {provinces.map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                  {errors.home_address_state && (
                    <p className="mt-1 text-xs text-red-600">{errors.home_address_state.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    邮政编码
                  </label>
                  <input
                    {...register('home_address_postal_code')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    国家<span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('home_address_country')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.home_address_country ? "border-red-300" : "border-gray-300"
                    )}
                  >
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  {errors.home_address_country && (
                    <p className="mt-1 text-xs text-red-600">{errors.home_address_country.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 邮寄地址 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">邮寄地址</h3>
              
              <div>
                <div className="flex items-center">
                  <input
                    {...register('is_mailing_address_same_as_home')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    邮寄地址与家庭地址相同
                  </label>
                </div>
              </div>

              {!isMailingAddressSameAsHome && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    邮寄地址<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('mailing_address_street')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.mailing_address_street ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="请输入邮寄地址"
                  />
                  {errors.mailing_address_street && (
                    <p className="mt-1 text-xs text-red-600">{errors.mailing_address_street.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* 电话信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">联系电话</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    主要电话<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('primary_phone_number')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.primary_phone_number ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="13800138000"
                  />
                  {errors.primary_phone_number && (
                    <p className="mt-1 text-xs text-red-600">{errors.primary_phone_number.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    备用电话（可选）
                  </label>
                  <input
                    {...register('secondary_phone_number')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="010-12345678"
                  />
                </div>
              </div>
            </div>

            {/* 按钮 */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => router.push(`/fill/${token}/personal-info-2` as any)}
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