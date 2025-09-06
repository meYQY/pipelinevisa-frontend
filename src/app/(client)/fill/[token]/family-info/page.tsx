'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronRight, Save, ArrowLeft, CheckCircle, Users } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ds160Service } from '@/services/ds160.service'

// 表单验证schema
const familyInfoSchema = z.object({
  father_surname: z.string().min(1, '请输入父亲姓氏'),
  father_given_name: z.string().min(1, '请输入父亲名字'),
  father_birth_date: z.string().min(1, '请选择父亲出生日期'),
  father_in_us: z.boolean(),
  mother_surname: z.string().min(1, '请输入母亲姓氏'),
  mother_given_name: z.string().min(1, '请输入母亲名字'),
  mother_birth_date: z.string().min(1, '请选择母亲出生日期'),
  mother_in_us: z.boolean(),
  spouse_surname: z.string().optional(),
  spouse_given_name: z.string().optional(),
  spouse_birth_date: z.string().optional(),
  spouse_nationality: z.string().optional(),
})

type FamilyInfoFormData = z.infer<typeof familyInfoSchema>

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

export default function FamilyInfoPage() {
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
  } = useForm<FamilyInfoFormData>({
    resolver: zodResolver(familyInfoSchema),
    defaultValues: {
      father_in_us: false,
      mother_in_us: false,
    }
  })

  // 加载已保存的数据
  useEffect(() => {
    loadSavedData()
  }, [])

  const loadSavedData = async () => {
    try {
      const formData = await ds160Service.getFormData(token)
      if (formData?.form_data?.family) {
        const savedData = formData.form_data.family
        reset({
          father_surname: savedData.father_surname || '',
          father_given_name: savedData.father_given_name || '',
          father_birth_date: savedData.father_birth_date || '',
          father_in_us: savedData.father_in_us || false,
          mother_surname: savedData.mother_surname || '',
          mother_given_name: savedData.mother_given_name || '',
          mother_birth_date: savedData.mother_birth_date || '',
          mother_in_us: savedData.mother_in_us || false,
          spouse_surname: savedData.spouse_surname || '',
          spouse_given_name: savedData.spouse_given_name || '',
          spouse_birth_date: savedData.spouse_birth_date || '',
          spouse_nationality: savedData.spouse_nationality || '',
        })
      }
      
      // 加载进度
      const progress = await ds160Service.getFormProgress(token)
      setCompletedSteps(progress.completed_steps || [])
    } catch (error) {
      console.error('Failed to load saved data:', error)
    }
  }

  const onSubmit = async (data: FamilyInfoFormData) => {
    setIsLoading(true)
    try {
      // 保存到后端
      await ds160Service.saveFormStep(token, 'family', {
        father_surname: data.father_surname,
        father_given_name: data.father_given_name,
        father_birth_date: data.father_birth_date,
        father_in_us: data.father_in_us,
        mother_surname: data.mother_surname,
        mother_given_name: data.mother_given_name,
        mother_birth_date: data.mother_birth_date,
        mother_in_us: data.mother_in_us,
        spouse_surname: data.spouse_surname || '',
        spouse_given_name: data.spouse_given_name || '',
        spouse_birth_date: data.spouse_birth_date || '',
        spouse_nationality: data.spouse_nationality || '',
      })

      toast.success('家庭信息保存成功')
      router.push(`/fill/${token}/travel-info`)
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
      await ds160Service.saveFormStep(token, 'family', {
        father_surname: formData.father_surname || '',
        father_given_name: formData.father_given_name || '',
        father_birth_date: formData.father_birth_date || '',
        father_in_us: formData.father_in_us || false,
        mother_surname: formData.mother_surname || '',
        mother_given_name: formData.mother_given_name || '',
        mother_birth_date: formData.mother_birth_date || '',
        mother_in_us: formData.mother_in_us || false,
        spouse_surname: formData.spouse_surname || '',
        spouse_given_name: formData.spouse_given_name || '',
        spouse_birth_date: formData.spouse_birth_date || '',
        spouse_nationality: formData.spouse_nationality || '',
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
            <div className="absolute top-5 left-0 h-0.5 bg-blue-600" style={{ width: '50%' }}></div>
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center z-10",
                    index === 4 ? "bg-blue-600 text-white" :
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">第三步：家庭信息</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 父亲信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">父亲信息</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓氏<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('father_surname')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.father_surname ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="张"
                  />
                  {errors.father_surname && (
                    <p className="mt-1 text-xs text-red-600">{errors.father_surname.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名字<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('father_given_name')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.father_given_name ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="三"
                  />
                  {errors.father_given_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.father_given_name.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    出生日期<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('father_birth_date')}
                    type="date"
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.father_birth_date ? "border-red-300" : "border-gray-300"
                    )}
                  />
                  {errors.father_birth_date && (
                    <p className="mt-1 text-xs text-red-600">{errors.father_birth_date.message}</p>
                  )}
                </div>
                
                <div className="col-span-3">
                  <div className="flex items-center">
                    <input
                      {...register('father_in_us')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      父亲目前在美国
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 母亲信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">母亲信息</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓氏<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('mother_surname')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.mother_surname ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="李"
                  />
                  {errors.mother_surname && (
                    <p className="mt-1 text-xs text-red-600">{errors.mother_surname.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名字<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('mother_given_name')}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.mother_given_name ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="四"
                  />
                  {errors.mother_given_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.mother_given_name.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    出生日期<span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('mother_birth_date')}
                    type="date"
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.mother_birth_date ? "border-red-300" : "border-gray-300"
                    )}
                  />
                  {errors.mother_birth_date && (
                    <p className="mt-1 text-xs text-red-600">{errors.mother_birth_date.message}</p>
                  )}
                </div>
                
                <div className="col-span-3">
                  <div className="flex items-center">
                    <input
                      {...register('mother_in_us')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      母亲目前在美国
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 配偶信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">配偶信息（如有）</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓氏
                  </label>
                  <input
                    {...register('spouse_surname')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="配偶姓氏"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名字
                  </label>
                  <input
                    {...register('spouse_given_name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="配偶名字"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    出生日期
                  </label>
                  <input
                    {...register('spouse_birth_date')}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    国籍
                  </label>
                  <input
                    {...register('spouse_nationality')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：中国"
                  />
                </div>
              </div>
            </div>

            {/* 按钮 */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => router.push(`/fill/${token}/work-info`)}
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