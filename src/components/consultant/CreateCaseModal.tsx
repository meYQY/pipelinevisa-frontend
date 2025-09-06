'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Calendar, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { VisaType } from '@/types'
import { caseService } from '@/services/case.service'
import SuccessModal from '@/components/common/SuccessModal'

// 表单验证schema
const createCaseSchema = z.object({
  applicantName: z.string().min(1, '请输入客户姓名'),
  phone: z.string().optional(),
  email: z.string().optional(),
  visaType: z.nativeEnum(VisaType, {
    errorMap: () => ({ message: '请选择签证类型' })
  }),
  interviewDate: z.string().optional(),
  isRescheduled: z.boolean().default(false),
  isVip: z.boolean().default(false),
  notes: z.string().optional(),
  linkValidityDays: z.number().default(72)
})

type CreateCaseFormData = z.infer<typeof createCaseSchema>

interface CreateCaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateCaseModal({ isOpen, onClose, onSuccess }: CreateCaseModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [applicationType, setApplicationType] = useState<'individual' | 'family'>('individual')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdCase, setCreatedCase] = useState<{ caseNumber: string; link: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateCaseFormData>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      visaType: VisaType.B1_B2,
      linkValidityDays: 72,
      isRescheduled: false,
      isVip: false
    }
  })

  const onSubmit = async (data: CreateCaseFormData) => {
    setIsLoading(true)
    try {
      // 创建案例
      const createdCaseData = await caseService.createCase({
        applicant_name: data.applicantName,
        applicant_phone: data.phone,
        applicant_email: data.email,
        visa_type: data.visaType,
        interview_date: data.interviewDate,
        is_rescheduled: data.isRescheduled,
        is_vip: data.isVip,
        notes: data.notes,
        link_validity_days: data.linkValidityDays
      })

      // 生成采集链接
      const linkData = await caseService.generateLink(createdCaseData.id)

      // 设置创建的案例信息
      setCreatedCase({
        caseNumber: createdCaseData.case_number,
        link: linkData.url
      })

      // 显示成功弹窗
      setShowSuccessModal(true)
      onSuccess?.()
    } catch (error) {
      console.error('Create case error:', error)
      toast.error('创建案例失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* 背景遮罩 */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* 模态框 */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
            {/* 头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">新建案例</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 申请类型选择 */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">申请类型</span>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setApplicationType('individual')}
                    className={cn(
                      "px-6 py-2 text-sm font-medium transition-colors",
                      applicationType === 'individual' 
                        ? "bg-black text-white" 
                        : "bg-white text-gray-700 border border-gray-300"
                    )}
                  >
                    个人申请
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplicationType('family')}
                    className={cn(
                      "px-6 py-2 text-sm font-medium transition-colors -ml-px",
                      applicationType === 'family' 
                        ? "bg-black text-white" 
                        : "bg-white text-gray-700 border border-gray-300"
                    )}
                  >
                    家庭/团组申请
                  </button>
                </div>
              </div>
            </div>

            {/* 表单内容 */}
            <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6">
              <div className="space-y-6">
                {/* 客户姓名 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    客户姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('applicantName')}
                    type="text"
                    placeholder="请输入客户姓名"
                    className={cn(
                      "w-full px-3 py-2 border rounded-md",
                      "placeholder-gray-400 text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent",
                      errors.applicantName ? "border-red-300" : "border-gray-300"
                    )}
                  />
                  {errors.applicantName && (
                    <p className="mt-1 text-xs text-red-600">{errors.applicantName.message}</p>
                  )}
                </div>

                {/* 手机号和邮箱 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      手机号
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      placeholder="138****5678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      邮箱
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="可选"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 签证类型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    签证类型 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      {...register('visaType')}
                      className={cn(
                        "w-full px-3 py-2 border rounded-md appearance-none",
                        "text-gray-900 bg-white",
                        "focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent",
                        errors.visaType ? "border-red-300" : "border-gray-300"
                      )}
                    >
                      <option value="">请选择签证类型</option>
                      <option value={VisaType.B1_B2}>B1/B2 - 商务/旅游签证</option>
                      <option value={VisaType.F1}>F1 - 学生签证</option>
                      <option value={VisaType.H1B}>H1B - 工作签证</option>
                      <option value={VisaType.L1}>L1 - 跨国公司管理人员签证</option>
                      <option value={VisaType.O1}>O1 - 杰出人才签证</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.visaType && (
                    <p className="mt-1 text-xs text-red-600">{errors.visaType.message}</p>
                  )}
                </div>

                {/* 面签日期 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    面签日期
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="relative flex-1">
                      <input
                        {...register('interviewDate')}
                        type="date"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <span className="text-sm text-gray-500">期望完成日期</span>
                    <div className="relative flex-1">
                      <input
                        type="date"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* 特殊标记 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    特殊标记
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        {...register('isRescheduled')}
                        type="checkbox"
                        className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                      />
                      <span className="ml-2 text-sm text-gray-700">拒签重申（需特别注意）</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('isVip')}
                        type="checkbox"
                        className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                      />
                      <span className="ml-2 text-sm text-gray-700">VIP客户</span>
                    </label>
                  </div>
                </div>

                {/* 备注 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    备注
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    placeholder="如有拒签历史、请详细说明"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  />
                </div>

                {/* 链接有效期 */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    采集链接有效期
                  </label>
                  <select
                    {...register('linkValidityDays', { valueAsNumber: true })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value={72}>72小时</option>
                    <option value={168}>7天</option>
                    <option value={720}>30天</option>
                  </select>
                </div>
              </div>

              {/* 底部按钮 */}
              <div className="flex items-center justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  创建并继续添加
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "px-4 py-2 text-sm font-medium text-white bg-black rounded-md",
                    "hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900",
                    "disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  )}
                >
                  {isLoading ? '创建中...' : '创建案例'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 成功弹窗 */}
      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          reset()
          onClose()
        }}
        title="创建成功"
        caseNumber={createdCase?.caseNumber}
        link={createdCase?.link}
        linkExpiry="72小时"
        onViewCase={() => {
          setShowSuccessModal(false)
          reset()
          onClose()
          // 这里可以跳转到案例详情页
        }}
      />
    </>
  )
}