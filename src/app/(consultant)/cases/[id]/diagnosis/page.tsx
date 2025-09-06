'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  Edit3,
  Download,
  Send,
  Plus,
  X,
  Save,
  RefreshCw,
  MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { diagnosisService, DiagnosisIssue, DiagnosisReport } from '@/services/diagnosis.service'

const severityConfig = {
  blocker: {
    label: '阻塞',
    color: 'bg-red-500 text-white',
    bgColor: 'bg-red-50 border-red-200',
    textColor: 'text-red-700',
    icon: AlertTriangle
  },
  critical: {
    label: '严重',
    color: 'bg-orange-500 text-white',
    bgColor: 'bg-orange-50 border-orange-200',
    textColor: 'text-orange-700',
    icon: AlertTriangle
  },
  warning: {
    label: '警告',
    color: 'bg-yellow-500 text-white',
    bgColor: 'bg-yellow-50 border-yellow-200',
    textColor: 'text-yellow-700',
    icon: AlertTriangle
  },
  info: {
    label: '信息',
    color: 'bg-blue-500 text-white',
    bgColor: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-700',
    icon: FileText
  }
}

export default function DiagnosisWorkbenchPage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [diagnosis, setDiagnosis] = useState<DiagnosisReport | null>(null)
  const [editingIssue, setEditingIssue] = useState<string | null>(null)
  const [consultantNotes, setConsultantNotes] = useState('')
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [autoFixing, setAutoFixing] = useState(false)
  const [statusPolling, setStatusPolling] = useState<NodeJS.Timeout | null>(null)

  // 加载诊断报告
  const loadDiagnosis = useCallback(async () => {
    try {
      setLoading(true)
      const data = await diagnosisService.getLatestDiagnosis(caseId)
      setDiagnosis(data)
      setConsultantNotes(data.consultant_notes || '')
    } catch (error) {
      console.error('Failed to load diagnosis:', error)
      toast.error('加载诊断报告失败')
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    loadDiagnosis()
  }, [loadDiagnosis])

  // 轮询状态
  useEffect(() => {
    if (!caseId) return
    const timer = setInterval(async () => {
      try {
        const s = await diagnosisService.getDiagnosisStatus(caseId)
        if (s.status === 'completed') {
          await loadDiagnosis()
        }
      } catch (_) {}
    }, 5000)
    setStatusPolling(timer)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [caseId, loadDiagnosis])

  // 保存顾问批注
  const saveConsultantNote = async (issueId: string, note: string) => {
    try {
      await diagnosisService.updateIssueNote(issueId, note)
      
      // 更新本地状态
      setDiagnosis((prev: DiagnosisReport | null) => {
        if (!prev) return prev
        return {
          ...prev,
          issues: prev.issues.map((issue: DiagnosisIssue) => 
            issue.id === issueId 
              ? { ...issue, consultant_note: note, consultant_adjusted: true }
              : issue
          )
        }
      })
      
      toast.success('批注已保存')
      setEditingIssue(null)
    } catch (error) {
      toast.error('保存批注失败')
    }
  }

  // 标记问题为已修复
  const markIssueFixed = async (issueId: string, fixed: boolean) => {
    try {
      await diagnosisService.markIssueFixed(issueId, fixed)
      
      // 更新本地状态
      setDiagnosis((prev: DiagnosisReport | null) => {
        if (!prev) return prev
        return {
          ...prev,
          issues: prev.issues.map((issue: DiagnosisIssue) => 
            issue.id === issueId ? { ...issue, fixed } : issue
          )
        }
      })
      
      toast.success(fixed ? '已标记为修复' : '已取消修复标记')
    } catch (error) {
      toast.error('更新失败')
    }
  }

  // 生成诊断报告PDF
  const generateReport = async () => {
    if (!diagnosis) return
    
    try {
      setIsGeneratingReport(true)
      const reportUrl = await diagnosisService.generateReport(diagnosis.id, {
        consultant_notes: consultantNotes,
        include_ai_analysis: true,
        include_consultant_adjustments: true
      })
      
      // 打开PDF预览
      window.open(reportUrl, '_blank')
      toast.success('报告生成成功')
    } catch (error) {
      toast.error('生成报告失败')
    } finally {
      setIsGeneratingReport(false)
    }
  }
  // 顾问总体意见保存
  const saveOverallNotes = async () => {
    if (!diagnosis) return
    try {
      setIsSavingNotes(true)
      await diagnosisService.updateConsultantNotes(diagnosis.id, consultantNotes)
      toast.success('总体意见已保存')
    } catch (e) {
      toast.error('保存总体意见失败')
    } finally {
      setIsSavingNotes(false)
    }
  }

  // 一键自动修复
  const autoFix = async () => {
    if (!diagnosis) return
    try {
      setAutoFixing(true)
      const res = await diagnosisService.autoFixIssues(diagnosis.id)
      toast.success(`已自动修复 ${res.fixed_count} 项，失败 ${res.failed_count} 项`)
      await loadDiagnosis()
    } catch (e) {
      toast.error('自动修复失败')
    } finally {
      setAutoFixing(false)
    }
  }

  // 发送给客户
  const sendToClient = async () => {
    if (!diagnosis) return
    
    try {
      setIsSending(true)
      await diagnosisService.sendToClient(diagnosis.id, {
        consultant_notes: consultantNotes,
        include_recommendations: true
      })
      
      toast.success('诊断报告已发送给客户')
      
      // 刷新数据
      await loadDiagnosis()
    } catch (error) {
      toast.error('发送失败')
    } finally {
      setIsSending(false)
    }
  }

  // 触发重新诊断
  const triggerReanalysis = async () => {
    try {
      await diagnosisService.requestReanalysis(caseId)
      toast.success('已触发重新分析，请等待AI处理完成')
      
      // 轮询检查状态
      const checkStatus = setInterval(async () => {
        try {
          const updated = await diagnosisService.getLatestDiagnosis(caseId)
          if (updated.status === 'completed') {
            setDiagnosis(updated)
            clearInterval(checkStatus)
            toast.success('重新分析完成')
          }
        } catch (error) {
          clearInterval(checkStatus)
        }
      }, 3000)
      
      // 10分钟后停止轮询
      setTimeout(() => clearInterval(checkStatus), 600000)
    } catch (error) {
      toast.error('触发重新分析失败')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!diagnosis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无诊断报告</h3>
          <p className="text-gray-600 mb-4">该案例还未生成AI诊断报告</p>
          <button
            onClick={() => router.push(`/cases/${caseId}`)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            返回案例详情
          </button>
        </div>
      </div>
    )
  }

  // 按严重程度分组问题
  const groupedIssues = diagnosis.issues.reduce((acc: Record<string, DiagnosisIssue[]>, issue: DiagnosisIssue) => {
    if (!acc[issue.severity]) acc[issue.severity] = []
    acc[issue.severity].push(issue)
    return acc
  }, {} as Record<string, DiagnosisIssue[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/cases/${caseId}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI诊断工作台</h1>
                <p className="text-sm text-gray-500">案例 ID: {caseId}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={autoFix}
                disabled={autoFixing}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{autoFixing ? '修复中...' : '一键修复'}</span>
              </button>
              <button
                onClick={triggerReanalysis}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>重新分析</span>
              </button>
              
              <button
                onClick={generateReport}
                disabled={isGeneratingReport}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isGeneratingReport ? '生成中...' : '生成报告'}</span>
              </button>
              
              <button
                onClick={sendToClient}
                disabled={isSending}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? '发送中...' : '发送客户'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* 左侧：诊断概览 */}
          <div className="col-span-12 lg:col-span-4">
            <div className="space-y-6">
              {/* 整体评估 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">整体评估</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">风险评分</span>
                    <div className="flex items-center space-x-2">
                      <span className={cn(
                        "text-lg font-semibold",
                        diagnosis.risk_score < 30 ? "text-green-600" :
                        diagnosis.risk_score < 60 ? "text-yellow-600" :
                        "text-red-600"
                      )}>
                        {diagnosis.risk_score}
                      </span>
                      <span className="text-sm text-gray-500">/100</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-600">阻塞问题</span>
                      <span className="font-medium">{diagnosis.blocker_issues}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-orange-600">严重问题</span>
                      <span className="font-medium">{diagnosis.critical_issues}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-yellow-600">警告问题</span>
                      <span className="font-medium">{diagnosis.warning_issues}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-600">信息问题</span>
                      <span className="font-medium">{diagnosis.info_issues}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI摘要 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">AI分析摘要</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>{diagnosis.summary?.overall || '暂无摘要'}</p>
                </div>
              </div>

              {/* 顾问总体意见 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">顾问总体意见</h3>
                <textarea
                  value={consultantNotes}
                  onChange={(e) => setConsultantNotes(e.target.value)}
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  placeholder="添加您的总体评估意见..."
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={saveOverallNotes}
                    disabled={isSavingNotes}
                    className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" />
                    <span>{isSavingNotes ? '保存中...' : '保存'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：问题详情 */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">问题详情</h2>
                <p className="text-sm text-gray-500 mt-1">
                  共发现 {diagnosis.total_issues} 个问题，请逐项审核并添加批注
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {(['blocker', 'critical', 'warning', 'info'] as const).map((severity) => {
                  const issues = groupedIssues[severity] || []
                  if (issues.length === 0) return null

                  const config = severityConfig[severity]
                  const Icon = config.icon

                  return (
                    <div key={severity} className="p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <span className={cn("px-2 py-1 text-xs font-medium rounded-full", config.color)}>
                          {config.label}
                        </span>
                        <span className="text-sm text-gray-500">({issues.length}个)</span>
                      </div>

                      <div className="space-y-4">
                        {issues.map((issue) => (
                          <div 
                            key={issue.id}
                            className={cn(
                              "border rounded-lg p-4 transition-colors",
                              issue.fixed ? "bg-green-50 border-green-200" : config.bgColor
                            )}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start space-x-3 flex-1">
                                <Icon className={cn("w-5 h-5 mt-0.5", issue.fixed ? "text-green-600" : config.textColor)} />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-medium text-gray-900">{issue.field_label}</h4>
                                    <span className="text-xs text-gray-500">({issue.field_name})</span>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
                                  {issue.suggestion && (
                                    <p className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                      建议：{issue.suggestion}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {issue.auto_fixable && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                    可自动修复
                                  </span>
                                )}
                                <button
                                  onClick={() => markIssueFixed(issue.id, !issue.fixed)}
                                  className={cn(
                                    "flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors",
                                    issue.fixed 
                                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  )}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span>{issue.fixed ? '已修复' : '标记修复'}</span>
                                </button>
                              </div>
                            </div>

                            {/* 顾问批注区域 */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              {editingIssue === issue.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    defaultValue={issue.consultant_note || ''}
                                    className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                                    placeholder="添加您的批注和建议..."
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && e.metaKey) {
                                        const value = (e.target as HTMLTextAreaElement).value
                                        saveConsultantNote(issue.id, value)
                                      }
                                    }}
                                  />
                                  <div className="flex items-center justify-end space-x-2">
                                    <button
                                      onClick={() => setEditingIssue(null)}
                                      className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                    >
                                      取消
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        const textarea = (e.target as HTMLElement).closest('.space-y-2')?.querySelector('textarea') as HTMLTextAreaElement
                                        saveConsultantNote(issue.id, textarea.value)
                                      }}
                                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      <Save className="w-3 h-3" />
                                      <span>保存</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    {issue.consultant_note ? (
                                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                        <div className="flex items-center space-x-1 mb-1">
                                          <MessageSquare className="w-3 h-3 text-blue-600" />
                                          <span className="text-xs font-medium text-blue-700">顾问批注</span>
                                        </div>
                                        <p className="text-sm text-blue-800">{issue.consultant_note}</p>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-500">暂无批注</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => setEditingIssue(issue.id)}
                                    className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>{issue.consultant_note ? '编辑' : '添加'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}