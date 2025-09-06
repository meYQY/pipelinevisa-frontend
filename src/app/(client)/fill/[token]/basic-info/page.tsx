'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, ChevronRight, Save, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ds160Service } from '@/services/ds160.service'

// 表单验证schema - 完全符合官方DS-160字段
const basicInfoSchema = z.object({
  // Personal Information 1 - Official DS-160 Fields
  surname: z.string().min(1, '请输入姓氏 (Last Name)'),
  given_names: z.string().min(1, '请输入名字 (First Names)'),
  full_name_native: z.string().min(1, '请输入中文全名'),
  has_used_other_names: z.boolean().default(false),
  other_surnames: z.string().optional(),
  other_given_names: z.string().optional(),
  sex: z.enum(['MALE', 'FEMALE'], { required_error: '请选择性别' }),
  marital_status: z.enum(['SINGLE', 'MARRIED', 'LEGALLY_SEPARATED', 'DIVORCED', 'WIDOWED'], { required_error: '请选择婚姻状况' }),
  date_of_birth: z.string().min(1, '请选择出生日期'),
  city_of_birth: z.string().min(1, '请输入出生城市'),
  state_province_of_birth: z.string().min(1, '请选择出生省份'),
  // 护照信息单独验证
  passport_number: z.string().regex(/^[A-Z]\d{8}$/, '护照号码格式不正确（如：G12345678）'),
  passport_expiry: z.string().min(1, '请选择护照有效期至')
}).superRefine((data, ctx) => {
  // 如果使用过其他姓名，则必须填写其他姓名字段
  if (data.has_used_other_names && (!data.other_surnames || !data.other_given_names)) {
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

type BasicInfoFormData = z.infer<typeof basicInfoSchema>

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

export default function BasicInfoPage() {
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
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      sex: 'MALE',
      marital_status: 'SINGLE',
      has_used_other_names: false,
      state_province_of_birth: '北京市'
    }
  })

  // 加载已保存的数据
  useEffect(() => {
    loadSavedData()
  }, [])

  const loadSavedData = async () => {
    try {
      const formData = await ds160Service.getFormData(token)
      if (formData?.original_data) {
        // 从后端JSONB字段读取数据
        const savedData = formData.original_data
        reset({
          surname: savedData.surname || '',
          given_names: savedData.given_names || '',
          full_name_native: savedData.full_name_native || '',
          has_used_other_names: savedData.has_used_other_names || false,
          other_surnames: savedData.other_surnames || '',
          other_given_names: savedData.other_given_names || '',
          sex: savedData.sex || 'MALE',
          marital_status: savedData.marital_status || 'SINGLE',
          date_of_birth: savedData.date_of_birth || '',
          city_of_birth: savedData.city_of_birth || '',
          state_province_of_birth: savedData.state_province_of_birth || '北京市',
          passport_number: savedData.passport_number || '',
          passport_expiry: savedData.passport_expiry || ''
        })
      }
      
      // 加载进度
      const progress = await ds160Service.getFormProgress(token)
      setCompletedSteps(progress.completed_steps || [])
    } catch (error) {
      console.error('Failed to load saved data:', error)
    }
  }

  const onSubmit = async (data: BasicInfoFormData) => {
    setIsLoading(true)
    try {
      // 按照官方DS-160标准格式发送数据到后端
      await ds160Service.saveFormStep(token, 'personal_info_1', {
        surname: data.surname,
        given_names: data.given_names,
        full_name_native: data.full_name_native,
        has_used_other_names: data.has_used_other_names,
        other_surnames: data.other_surnames,
        other_given_names: data.other_given_names,
        sex: data.sex,
        marital_status: data.marital_status,
        date_of_birth: data.date_of_birth,
        city_of_birth: data.city_of_birth,
        state_province_of_birth: data.state_province_of_birth,
        country_of_birth: 'CHINA'
      })
      
      // 保存护照信息到单独的passport步骤
      await ds160Service.saveFormStep(token, 'passport', {
        passport_number: data.passport_number,
        passport_expiry_date: data.passport_expiry,
        passport_issued_country: 'CHINA',
        passport_type: 'REGULAR'
      })

      toast.success('基本信息保存成功')
      router.push(`/fill/${token}/personal-info-2` as any)
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
      // 按照官方DS-160标准格式保存草稿
      await ds160Service.saveFormStep(token, 'personal_info_1', {
        surname: formData.surname || '',
        given_names: formData.given_names || '',
        full_name_native: formData.full_name_native || '',
        has_used_other_names: formData.has_used_other_names || false,
        other_surnames: formData.other_surnames || '',
        other_given_names: formData.other_given_names || '',
        sex: formData.sex || 'MALE',
        marital_status: formData.marital_status || 'SINGLE',
        date_of_birth: formData.date_of_birth || '',
        city_of_birth: formData.city_of_birth || '',
        state_province_of_birth: formData.state_province_of_birth || '',
        country_of_birth: 'CHINA'
      })
      
      if (formData.passport_number) {
        await ds160Service.saveFormStep(token, 'passport', {
          passport_number: formData.passport_number,
          passport_expiry_date: formData.passport_expiry || '',
          passport_issued_country: 'CHINA',
          passport_type: 'REGULAR'
        })
      }
      
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
                    index === 0 ? "bg-blue-600 text-white" :
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">第一步：基本信息</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 姓名信息 - 官方DS-160标准字段 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">姓名信息</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓氏 (Last Name)<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('surname')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.surname ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="张"
                  />
                  {errors.surname && (
                    <p className="mt-1 text-xs text-red-600">{errors.surname.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名字 (First Names)<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('given_names')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.given_names ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="三"
                  />
                  {errors.given_names && (
                    <p className="mt-1 text-xs text-red-600">{errors.given_names.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  中文全名 (Full Name in Native Language)<span className="text-red-500">*</span>
                </label>
                <input
                  {...register('full_name_native')}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.full_name_native ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="张三"
                />
                {errors.full_name_native && (
                  <p className="mt-1 text-xs text-red-600">{errors.full_name_native.message}</p>
                )}
              </div>

              {/* 曾用其他姓名 */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    {...register('has_used_other_names')}
                    type="checkbox"
                    className="rounded border-gray-300"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    是否使用过其他姓名？
                  </label>
                </div>
                {watch('has_used_other_names') && (
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
            </div>

            {/* 个人信息 - 官方DS-160标准字段 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">个人信息</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    性别 (Sex)<span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('sex')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.sex ? "border-red-300" : "border-gray-300"
                    )}
                  >
                    <option value="MALE">男 (Male)</option>
                    <option value="FEMALE">女 (Female)</option>
                  </select>
                  {errors.sex && (
                    <p className="mt-1 text-xs text-red-600">{errors.sex.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    婚姻状况 (Marital Status)<span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('marital_status')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.marital_status ? "border-red-300" : "border-gray-300"
                    )}
                  >
                    <option value="SINGLE">未婚 (Single)</option>
                    <option value="MARRIED">已婚 (Married)</option>
                    <option value="LEGALLY_SEPARATED">法律分居 (Legally Separated)</option>
                    <option value="DIVORCED">离婚 (Divorced)</option>
                    <option value="WIDOWED">丧偶 (Widowed)</option>
                  </select>
                  {errors.marital_status && (
                    <p className="mt-1 text-xs text-red-600">{errors.marital_status.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  出生日期 (Date of Birth)<span className="text-red-500">*</span>
                </label>
                <input
                  {...register('date_of_birth')}
                  type="date"
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.date_of_birth ? "border-red-300" : "border-gray-300"
                  )}
                />
                {errors.date_of_birth && (
                  <p className="mt-1 text-xs text-red-600">{errors.date_of_birth.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    出生省份 (State/Province of Birth)<span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('state_province_of_birth')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.state_province_of_birth ? "border-red-300" : "border-gray-300"
                    )}
                  >
                    {provinces.map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                  {errors.state_province_of_birth && (
                    <p className="mt-1 text-xs text-red-600">{errors.state_province_of_birth.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    出生城市 (City of Birth)<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('city_of_birth')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.city_of_birth ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="北京市"
                  />
                  {errors.city_of_birth && (
                    <p className="mt-1 text-xs text-red-600">{errors.city_of_birth.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 护照信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">护照信息</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    护照号码 (Passport Number)<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('passport_number')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.passport_number ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="G12345678"
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.passport_number && (
                    <p className="mt-1 text-xs text-red-600">{errors.passport_number.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    护照有效期至 (Passport Expiration Date)<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('passport_expiry')}
                    type="date"
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.passport_expiry ? "border-red-300" : "border-gray-300"
                    )}
                  />
                  {errors.passport_expiry && (
                    <p className="mt-1 text-xs text-red-600">{errors.passport_expiry.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 按钮 */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => router.push(`/fill/${token}`)}
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