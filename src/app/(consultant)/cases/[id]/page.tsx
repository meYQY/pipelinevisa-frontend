'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  CheckCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Calendar,
  Mail,
  Phone,
  User,
  Hash,
  Shield,
  Check,
  X,
  Brain
} from 'lucide-react'
import { caseService } from '@/services/case.service'
import { cn } from '@/lib/utils'
import { CaseStatus, type Case } from '@/types'
import Link from 'next/link'
import { toast } from 'sonner'

// 处理进度步骤配置
const progressSteps = [
  { 
    id: 1, 
    label: '客户填写', 
    sublabel: '已完成',
    status: 'completed'
  },
  { 
    id: 2, 
    label: 'AI诊断', 
    sublabel: '处理中...',
    status: 'active'
  },
  { 
    id: 3, 
    label: '顾问诊断', 
    sublabel: '待处理',
    status: 'pending'
  },
  { 
    id: 4, 
    label: 'AI生成', 
    sublabel: '待处理',
    status: 'pending'
  },
  { 
    id: 5, 
    label: '终审', 
    sublabel: '待处理',
    status: 'pending'
  }
]

// 状态历史记录
const statusHistory = [
  {
    status: 'AI诊断开始',
    time: '30分钟前',
    user: '系统'
  },
  {
    status: '客户提交信息',
    time: '35分钟前',
    user: '王五'
  },
  {
    status: '发送采集链接',
    time: '2小时前',
    user: '王明'
  },
  {
    status: '创建案例',
    time: '2小时前',
    user: '王明'
  }
]

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.id as string
  const [loading, setLoading] = useState(true)
  const [case_, setCase] = useState<Case | null>(null)
  const [attachments, setAttachments] = useState<Array<{
    id: string
    case_id: string
    filename: string
    size: number
    content_type: string
    url: string
    uploaded_at: string
    uploaded_by?: { id: string; name: string }
  }>>([])
  const [timeline, setTimeline] = useState<Array<{ id: string; status: string; time: string; user: string }>>([])
  const [progress, setProgress] = useState<{ current_step: number; total_steps: number; steps: Array<{ step: number; name: string; key: string; status: 'completed' | 'current' | 'pending' }> } | null>(null)

  const fetchCaseDetail = useCallback(async () => {
    try {
      setLoading(true)
      const data = await caseService.getCaseById(caseId)
      setCase(data)
    } catch (error) {
      console.error('Failed to fetch case detail:', error)
      toast.error('获取案例详情失败')
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    fetchCaseDetail()
    ;(async () => {
      try {
        const [attRes, tl, prog] = await Promise.all([
          caseService.listAttachments(caseId),
          caseService.getActivityTimeline(caseId),
          caseService.getCaseProgress(caseId),
        ])
        setAttachments(attRes.items)
        setTimeline(tl)
        setProgress(prog)
      } catch (_) {
        // ignore
      }
    })()
  }, [fetchCaseDetail, caseId])

  const handleStartDiagnosis = () => {
    toast.success('开始诊断')
    router.push(`/cases/${caseId}/diagnosis` as any)
  }

  // 确认操作函数
  const handleConfirmClientSubmission = async () => {
    try {
      await caseService.updateCase(caseId, { 
        status: CaseStatus.AI_REVIEWING 
      })
      toast.success('已确认客户提交，开始AI审查')
      await fetchCaseDetail()
    } catch (error) {
      toast.error('确认失败')
    }
  }

  const handleConfirmConsultantReview = async () => {
    try {
      await caseService.updateCase(caseId, { 
        status: CaseStatus.MATERIALS_APPROVED 
      })
      toast.success('已确认审核通过，准备AI翻译')
      await fetchCaseDetail()
    } catch (error) {
      toast.error('确认失败')
    }
  }

  const handleConfirmTranslation = async () => {
    try {
      await caseService.updateCase(caseId, { 
        status: CaseStatus.CONSULTANT_FINAL_REVIEW 
      })
      toast.success('已确认翻译，进入终审')
      await fetchCaseDetail()
    } catch (error) {
      toast.error('确认失败')
    }
  }

  const handleFinalConfirm = async () => {
    try {
      await caseService.updateCase(caseId, { 
        status: CaseStatus.SENT_TO_CLIENT 
      })
      toast.success('已最终确认，发送给客户')
      await fetchCaseDetail()
    } catch (error) {
      toast.error('确认失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!case_) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">案例不存在</p>
          <Link 
            href="/cases" 
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            返回案例列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/cases"
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回案例列表
              </Link>
              <h1 className="text-lg font-semibold text-gray-900">案例详情</h1>
              <span className="text-sm text-gray-500">{case_.applicant?.name} {case_.case_number}</span>
            </div>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              AI诊断中
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容区 */}
      <div className="px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-6">
            {/* 左侧主要内容 */}
            <div className="col-span-8 space-y-6">
              {/* 处理进度 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-6">处理进度</h2>
                <div className="relative">
                  <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200"></div>
                  <div className="absolute top-6 left-0 h-0.5 bg-blue-600" style={{ width: `${progress ? Math.min(100, Math.round((progress.current_step / Math.max(1, progress.total_steps)) * 100)) : 0}%` }}></div>
                  <div className="relative flex justify-between">
                    {(progress?.steps || []).map((s) => {
                      const state = s.status
                      return (
                        <div key={s.step} className="flex flex-col items-center">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center relative z-10",
                            state === 'completed' ? "bg-green-500" : 
                            state === 'current' ? "bg-blue-600" : 
                            "bg-gray-200"
                          )}>
                            {state === 'completed' ? (
                              <CheckCircle className="w-6 h-6 text-white" />
                            ) : state === 'current' ? (
                              <div className="w-6 h-6 bg-white rounded-full" />
                            ) : (
                              <span className="text-gray-500 font-medium">{s.step}</span>
                            )}
                          </div>
                          <div className="mt-3 text-center">
                            <p className="text-sm font-medium text-gray-900">{s.name}</p>
                            <p className={cn(
                              "text-xs mt-1",
                              state === 'current' ? "text-blue-600" : "text-gray-500"
                            )}>
                              {state === 'completed' ? '已完成' : state === 'current' ? '进行中' : '待处理'}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* AI诊断提示 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900">AI正在处理中</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    正在进行信息整合与诊断分析，预计需3分钟
                  </p>
                </div>
              </div>

              {/* 申请人信息 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">申请人信息</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">姓名</p>
                      <p className="text-sm font-medium text-gray-900">{case_.applicant?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">签证类型</p>
                      <p className="text-sm font-medium text-gray-900">美国 {case_.visa_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">联系电话</p>
                      <p className="text-sm font-medium text-gray-900">{case_.applicant?.phone || '未提供'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">护照号</p>
                      <p className="text-sm font-medium text-gray-900">{case_.applicant?.passport_number || '未提供'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">邮箱</p>
                      <p className="text-sm font-medium text-gray-900">{case_.applicant?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">提交时间</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(case_.created_at).toLocaleDateString('zh-CN')} {new Date(case_.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 已上传文件 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">已上传文件</h2>
                {attachments.length === 0 ? (
                  <div className="text-sm text-gray-500">暂无附件</div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {attachments.map(att => (
                      <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="border border-gray-200 rounded-lg p-4 flex items-center space-x-3 hover:bg-gray-50 cursor-pointer">
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <FileText className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{att.filename}</p>
                          <p className="text-xs text-gray-500">{(att.size/1024/1024).toFixed(1)} MB · {new Date(att.uploaded_at).toLocaleString('zh-CN')}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 右侧侧边栏 */}
            <div className="col-span-4 space-y-6">
              {/* 可用操作 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">可用操作</h3>
                <div className="space-y-3">
                  {/* 根据状态显示不同的确认按钮 */}
                  {case_.status === CaseStatus.CLIENT_SUBMITTED && (
                    <button
                      onClick={handleConfirmClientSubmission}
                      className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      确认客户提交
                    </button>
                  )}
                  
                  {case_.status === CaseStatus.CONSULTANT_REVIEWING && (
                    <>
                      <button
                        onClick={() => router.push(`/cases/${case_.id}/diagnosis` as any)}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        进入诊断工作台
                      </button>
                      <button
                        onClick={handleStartDiagnosis}
                        className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                      >
                        开始诊断
                      </button>
                      <button
                        onClick={handleConfirmConsultantReview}
                        className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        确认审核通过
                      </button>
                    </>
                  )}
                  
                  {case_.status === CaseStatus.AI_PROCESSING && (
                    <>
                      <button
                        onClick={() => router.push(`/cases/${case_.id}/translation` as any)}
                        className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        翻译对照界面
                      </button>
                      <button
                        onClick={handleConfirmTranslation}
                        className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        确认AI翻译
                      </button>
                    </>
                  )}
                  
                  {case_.status === CaseStatus.CONSULTANT_FINAL_REVIEW && (
                    <button
                      onClick={handleFinalConfirm}
                      className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      最终确认提交
                    </button>
                  )}
                  
                  {/* 通用操作 */}
                  <button className="w-full px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    分配给其他顾问
                  </button>
                  <button className="w-full px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    标记为紧急
                  </button>
                  <button className="w-full px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    添加备注
                  </button>
                  <button className="w-full px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    查看历史
                  </button>
                </div>
              </div>

              {/* 状态历史 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">状态历史</h3>
                <div className="space-y-4">
                  {timeline.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.status}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.time} · {item.user}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}