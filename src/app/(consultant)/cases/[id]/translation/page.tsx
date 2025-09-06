'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Copy,
  Edit,
  Save,
  FileText,
  Download,
  RefreshCw,
  MessageSquare,
  Clock,
  User,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { translationService } from '@/services/translation.service'

interface DS160Field {
  id: string
  section: string
  field_name: string
  chinese_question: string
  chinese_value: string
  english_question: string
  english_value: string
  status: 'completed' | 'pending' | 'warning' | 'error'
  is_modified: boolean
  consultant_note?: string
  translation_confidence?: number
}

interface DS160Section {
  id: string
  name_cn: string
  name_en: string
  completed_fields: number
  total_fields: number
  status: 'completed' | 'in_progress' | 'pending' | 'warning'
}

interface TranslationComparison {
  case_id: string
  sections: DS160Section[]
  fields: DS160Field[]
  overall_completion: number
  total_fields: number
  completed_fields: number
  warning_fields: number
  error_fields: number
  last_updated: string
  version: string
}

const sectionIcons = {
  'personal_info_1': '1',
  'personal_info_2': '2', 
  'address_phone': '3',
  'passport': '4',
  'travel': '5',
  'travel_companions': '6',
  'previous_us_travel': '7',
  'us_contact': '8',
  'family_info': '9',
  'work_education': '10',
  'security': '11'
}

const statusConfig = {
  completed: { 
    icon: CheckCircle, 
    color: 'text-green-600', 
    bg: 'bg-green-50 border-green-200',
    dot: 'bg-green-500'
  },
  in_progress: { 
    icon: Clock, 
    color: 'text-blue-600', 
    bg: 'bg-blue-50 border-blue-200',
    dot: 'bg-blue-500'
  },
  warning: { 
    icon: AlertTriangle, 
    color: 'text-orange-600', 
    bg: 'bg-orange-50 border-orange-200',
    dot: 'bg-orange-500'
  },
  error: { 
    icon: AlertTriangle, 
    color: 'text-red-600', 
    bg: 'bg-red-50 border-red-200',
    dot: 'bg-red-500'
  },
  pending: { 
    icon: Clock, 
    color: 'text-gray-600', 
    bg: 'bg-gray-50 border-gray-200',
    dot: 'bg-gray-400'
  }
} as const

export default function TranslationComparisonPage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TranslationComparison | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [consultantNote, setConsultantNote] = useState('')
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isCopying, setIsCopying] = useState<string | null>(null)

  const loadTranslationData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await translationService.getTranslationComparison(caseId)
      setData(response)
      
      // 默认选择第一个未完成的章节
      const firstIncompleteSection = response.sections.find(s => s.status !== 'completed')
      if (firstIncompleteSection) {
        setSelectedSection(firstIncompleteSection.id)
      } else if (response.sections.length > 0) {
        setSelectedSection(response.sections[0].id)
      }
    } catch (error) {
      console.error('Failed to load translation data:', error)
      toast.error('加载翻译对照数据失败')
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    loadTranslationData()
  }, [loadTranslationData])

  const handleFieldEdit = async (fieldId: string, newValue: string) => {
    try {
      await translationService.updateFieldTranslation(fieldId, newValue)
      
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          fields: prev.fields.map(field => 
            field.id === fieldId 
              ? { ...field, english_value: newValue, is_modified: true }
              : field
          ),
          // 同步提升选中章节完成度（乐观更新）
          sections: prev.sections.map(s => {
            if (!selectedSection || s.id !== selectedSection) return s
            const total = s.total_fields
            const completed = Math.min(total, s.completed_fields + 1)
            return { ...s, completed_fields: completed, status: completed === total ? 'completed' : 'in_progress' }
          })
        }
      })
      
      toast.success('翻译已更新')
      setEditingField(null)
    } catch (error) {
      toast.error('更新失败')
    }
  }

  const handleCopyField = async (text: string, fieldId: string) => {
    try {
      setIsCopying(fieldId)
      await navigator.clipboard.writeText(text)
      toast.success('已复制到剪贴板')
      
      setTimeout(() => setIsCopying(null), 1000)
    } catch (error) {
      toast.error('复制失败')
      setIsCopying(null)
    }
  }

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true)
      const pdfUrl = await translationService.generateComparisonPDF(caseId)
      window.open(pdfUrl, '_blank')
      toast.success('PDF已生成')
    } catch (error) {
      toast.error('PDF生成失败')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleCopyAllContent = async () => {
    if (!data) return
    
    const currentSectionFields = data.fields.filter(f => 
      selectedSection ? f.section === selectedSection : true
    )
    
    const content = currentSectionFields.map(field => 
      `${field.chinese_question}\n${field.english_value}\n`
    ).join('\n')
    
    try {
      await navigator.clipboard.writeText(content)
      toast.success('已复制全部内容')
    } catch (error) {
      toast.error('复制失败')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无翻译对照数据</h3>
          <p className="text-gray-600 mb-4">请先完成AI翻译处理</p>
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

  const currentSectionFields = data.fields.filter(field => 
    selectedSection ? field.section === selectedSection : true
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/cases/${caseId}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">DS-160表格对照</h1>
                <p className="text-sm text-gray-500">案例 ID: {caseId}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>完成度</span>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${data.overall_completion}%` }}
                  />
                </div>
                <span className="font-medium text-green-600">{data.overall_completion}%</span>
              </div>
              
              <button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isGeneratingPDF ? '生成中...' : '导出PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* 左侧：章节导航 */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              DS-160 SECTIONS
            </h2>
            <div className="space-y-2">
              {data.sections.map((section) => {
                const isSelected = selectedSection === section.id
                const StatusIcon = statusConfig[section.status].icon
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={cn(
                      "w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors",
                      isSelected 
                        ? "bg-blue-50 border border-blue-200" 
                        : "hover:bg-gray-50"
                    )}
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded text-xs font-medium flex items-center justify-center">
                      {sectionIcons[section.id as keyof typeof sectionIcons] || section.id.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {section.name_cn}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {section.name_en}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <StatusIcon className={cn("w-4 h-4", statusConfig[section.status].color)} />
                      <div className="text-xs text-gray-500">
                        {section.completed_fields}/{section.total_fields}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 中间：字段对照 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {selectedSection && (
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {data.sections.find(s => s.id === selectedSection)?.name_en}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {data.sections.find(s => s.id === selectedSection)?.name_cn}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-1 bg-green-500 rounded-full">
                      <div 
                        className="h-full bg-green-600 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(data.sections.find(s => s.id === selectedSection)?.completed_fields || 0) / 
                                    (data.sections.find(s => s.id === selectedSection)?.total_fields || 1) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">
                      {data.sections.find(s => s.id === selectedSection)?.completed_fields}/
                      {data.sections.find(s => s.id === selectedSection)?.total_fields}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {currentSectionFields.map((field) => (
                <div 
                  key={field.id}
                  className={cn(
                    "bg-white rounded-lg border p-4 transition-colors",
                    statusConfig[field.status].bg
                  )}
                >
                  <div className="flex items-start space-x-4">
                    {/* 状态指示点 */}
                    <div className={cn(
                      "w-3 h-3 rounded-full mt-2 flex-shrink-0",
                      statusConfig[field.status].dot
                    )} />
                    
                    {/* 字段内容 */}
                    <div className="flex-1 space-y-3">
                      {/* 中文问题 */}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {field.chinese_question}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {field.english_question}
                        </p>
                      </div>

                      {/* 英文值 */}
                      <div className="flex items-center space-x-2">
                        {editingField === field.id ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              defaultValue={field.english_value}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleFieldEdit(field.id, (e.target as HTMLInputElement).value)
                                } else if (e.key === 'Escape') {
                                  setEditingField(null)
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement
                                handleFieldEdit(field.id, input.value)
                              }}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingField(null)}
                              className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 bg-gray-50 rounded px-3 py-2 border">
                              <p className="text-sm font-medium text-gray-900">
                                {field.english_value}
                              </p>
                              {field.chinese_value && (
                                <p className="text-xs text-gray-500 mt-1">
                                  中文值: {field.chinese_value}
                                </p>
                              )}
                              {field.translation_confidence && (
                                <p className="text-xs text-blue-600 mt-1">
                                  置信度: {(field.translation_confidence * 100).toFixed(1)}%
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleCopyField(field.english_value, field.id)}
                                className={cn(
                                  "p-2 rounded-lg transition-colors",
                                  isCopying === field.id 
                                    ? "bg-green-100 text-green-600"
                                    : "hover:bg-gray-100 text-gray-600"
                                )}
                                disabled={isCopying === field.id}
                              >
                                {isCopying === field.id ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                              
                              <button
                                onClick={() => setEditingField(field.id)}
                                className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* 修改标识 */}
                      {field.is_modified && (
                        <div className="flex items-center space-x-1 text-xs text-blue-600">
                          <Edit className="w-3 h-3" />
                          <span>已修改</span>
                        </div>
                      )}

                      {/* 顾问备注 */}
                      {field.consultant_note && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                          <div className="flex items-center space-x-1 mb-1">
                            <MessageSquare className="w-3 h-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700">备注</span>
                          </div>
                          <p className="text-xs text-blue-800">{field.consultant_note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：快速操作面板 */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">快速操作</h3>
            
            {/* 统计卡片 */}
            <div className="space-y-3 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">已完成</span>
                  <span className="text-lg font-bold text-green-600">{data.completed_fields}</span>
                </div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-700">需补充</span>
                  <span className="text-lg font-bold text-orange-600">{data.warning_fields}</span>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-700">错误</span>
                  <span className="text-lg font-bold text-red-600">{data.error_fields}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700">总字段数</span>
                  <span className="text-lg font-bold text-blue-600">{data.total_fields}</span>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-2 mb-6">
              <button
                onClick={handleCopyAllContent}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>复制全部内容</span>
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>刷新数据</span>
              </button>
            </div>

            {/* 备注区域 */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">备注</h4>
              <textarea
                value={consultantNote}
                onChange={(e) => setConsultantNote(e.target.value)}
                placeholder="添加备注..."
                className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
              <button
                onClick={() => {
                  // 保存备注逻辑
                  toast.success('备注已保存')
                  setConsultantNote('')
                }}
                className="mt-2 w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存备注
              </button>
            </div>

            {/* 历史版本 */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">历史版本</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium">v{data.version} (当前)</span>
                    <div className="text-gray-500 mt-0.5">
                      {new Date(data.last_updated).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                    最新
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium">v2</span>
                    <div className="text-gray-500 mt-0.5">
                      2024-01-15 10:20
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-xs">
                    查看
                  </button>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium">v1</span>
                    <div className="text-gray-500 mt-0.5">
                      2024-01-14 15:00
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-xs">
                    查看
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}