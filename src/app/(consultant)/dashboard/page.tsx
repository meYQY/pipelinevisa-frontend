'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  AlertCircle,
  Search,
  ChevronRight,
  FileText,
  Users,
  BarChart3,
  Bell,
  ChevronDown,
  LogOut
} from 'lucide-react'
import { statisticsService } from '@/services/statistics.service'
import { caseService } from '@/services/case.service'
import { cn } from '@/lib/utils'
import { CaseStatus, VisaType, type Case } from '@/types'
import Link from 'next/link'
import { toast } from 'sonner'
import CreateCaseModal from '@/components/consultant/CreateCaseModal'

// 状态映射配置
const statusConfig = {
  [CaseStatus.CREATED]: { label: '已创建', color: 'text-gray-600 bg-gray-100' },
  [CaseStatus.LINK_SENT]: { label: '链接已发送', color: 'text-blue-600 bg-blue-100' },
  [CaseStatus.CLIENT_FILLING]: { label: '客户填写中', color: 'text-yellow-600 bg-yellow-100' },
  [CaseStatus.CLIENT_SUBMITTED]: { label: '客户已提交', color: 'text-green-600 bg-green-100' },
  [CaseStatus.AI_REVIEWING]: { label: 'AI诊断中', color: 'text-purple-600 bg-purple-100' },
  [CaseStatus.CONSULTANT_REVIEWING]: { label: '待顾问诊断', color: 'text-orange-600 bg-orange-100' },
  [CaseStatus.NEED_SUPPLEMENT]: { label: '需要补充', color: 'text-red-600 bg-red-100' },
  [CaseStatus.MATERIALS_APPROVED]: { label: '材料确认', color: 'text-teal-600 bg-teal-100' },
  [CaseStatus.AI_PROCESSING]: { label: 'AI处理中', color: 'text-purple-600 bg-purple-100' },
  [CaseStatus.CONSULTANT_FINAL_REVIEW]: { label: '待客户填写', color: 'text-indigo-600 bg-indigo-100' },
  [CaseStatus.CONSULTANT_FINAL_APPROVED]: { label: '待客户补充', color: 'text-orange-600 bg-orange-100' },
  [CaseStatus.SENT_TO_CLIENT]: { label: 'AI异常', color: 'text-red-600 bg-red-100' },
  [CaseStatus.CLIENT_CONFIRMED]: { label: '已完成', color: 'text-green-600 bg-green-100' },
  [CaseStatus.COMPLETED]: { label: '已取消', color: 'text-gray-600 bg-gray-100' },
}

// 侧边栏菜单项基础配置（计数后续用统计接口填充）
const baseSidebarMenuItems = [
  { key: 'all', label: '全部', divider: false },
  { key: 'group-need', label: '需要处理', divider: true },
  { key: CaseStatus.CONSULTANT_REVIEWING, label: '待顾问诊断', icon: AlertCircle, iconColor: 'text-orange-500', divider: false },
  { key: 'processing', label: '顾问处理中', divider: false },
  { key: CaseStatus.CONSULTANT_FINAL_REVIEW, label: '待终审', divider: true },
  { key: CaseStatus.CLIENT_FILLING, label: '待客户填写', divider: false },
  { key: CaseStatus.CLIENT_SUBMITTED, label: '客户已提交', divider: false },
  { key: CaseStatus.NEED_SUPPLEMENT, label: '待客户补充', divider: false },
  { key: 'group-ai', label: 'AI处理', divider: true },
  { key: CaseStatus.AI_REVIEWING, label: 'AI诊断中', divider: false },
  { key: CaseStatus.AI_PROCESSING, label: 'AI生成中', divider: false },
  { key: CaseStatus.SENT_TO_CLIENT, label: 'AI异常', icon: AlertCircle, iconColor: 'text-red-500', divider: false },
  { key: 'group-end', label: '已结束', divider: true },
  { key: CaseStatus.CLIENT_CONFIRMED, label: '已完成', divider: false },
  { key: CaseStatus.COMPLETED, label: '已取消', divider: false },
]

export default function DashboardPage() {
  const router = useRouter()
  const [cases, setCases] = useState<Case[]>([])
  const [todayProcessed, setTodayProcessed] = useState<number>(0)
  const [urgentCount, setUrgentCount] = useState<number>(0)
  const [todayCompleted, setTodayCompleted] = useState<number>(0)
  const [avgProcessingTime, setAvgProcessingTime] = useState<string>('—')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [sidebarCounts, setSidebarCounts] = useState<Record<string, number>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // 获取用户信息
  const [user, setUser] = useState<any>(null)
  
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
    void fetchStatistics()
    void fetchCases()
  }, [])

  const fetchCases = async () => {
    try {
      const statusParam = sidebarKeyToStatus(selectedMenuItem)
      const response = await caseService.getCases({
        per_page: 10,
        sort_by: 'created_at',
        sort_order: 'desc',
        status: statusParam as CaseStatus | undefined,
        search: searchQuery || undefined,
      })
      setCases(response.items)
    } catch (error) {
      console.error('Failed to fetch cases:', error)
      toast.error('获取案例列表失败')
    }
  }

  const fetchStatistics = async () => {
    try {
      const [overview, avg] = await Promise.all([
        statisticsService.getOverview(),
        statisticsService.getAverageProcessingTime().catch(() => null),
      ])
      // 待处理：用 pending_review
      setTodayProcessed(overview.pending_review ?? 0)
      // 紧急：以需要补充作为代替
      setUrgentCount(overview.status_distribution?.[CaseStatus.NEED_SUPPLEMENT] ?? 0)
      // 今日完成：尝试从趋势里取当日完成
      try {
        const trend = await statisticsService.getCaseTrend({ interval: 'day' })
        const completedDataset = trend.datasets.find(d => d.label?.toLowerCase().includes('complete')) || trend.datasets[1]
        const last = completedDataset?.data?.[completedDataset.data.length - 1] ?? 0
        setTodayCompleted(last)
      } catch {
        setTodayCompleted(0)
      }
      // 平均耗时
      if (avg?.overall != null) setAvgProcessingTime(`${avg.overall.toFixed(1)}h`)
      setLastUpdated(new Date())

      // 侧边栏计数
      const counts: Record<string, number> = {}
      counts['all'] = overview.total_cases ?? 0
      counts[CaseStatus.CONSULTANT_REVIEWING] = overview.status_distribution?.[CaseStatus.CONSULTANT_REVIEWING] ?? 0
      counts['processing'] = (overview.status_distribution?.[CaseStatus.CONSULTANT_REVIEWING] ?? 0)
      counts[CaseStatus.CONSULTANT_FINAL_REVIEW] = overview.status_distribution?.[CaseStatus.CONSULTANT_FINAL_REVIEW] ?? 0
      counts[CaseStatus.CLIENT_FILLING] = overview.status_distribution?.[CaseStatus.CLIENT_FILLING] ?? 0
      counts[CaseStatus.CLIENT_SUBMITTED] = overview.status_distribution?.[CaseStatus.CLIENT_SUBMITTED] ?? 0
      counts[CaseStatus.NEED_SUPPLEMENT] = overview.status_distribution?.[CaseStatus.NEED_SUPPLEMENT] ?? 0
      counts[CaseStatus.AI_REVIEWING] = overview.status_distribution?.[CaseStatus.AI_REVIEWING] ?? 0
      counts[CaseStatus.AI_PROCESSING] = overview.status_distribution?.[CaseStatus.AI_PROCESSING] ?? 0
      counts[CaseStatus.SENT_TO_CLIENT] = overview.status_distribution?.[CaseStatus.SENT_TO_CLIENT] ?? 0
      counts[CaseStatus.CLIENT_CONFIRMED] = overview.status_distribution?.[CaseStatus.CLIENT_CONFIRMED] ?? 0
      counts[CaseStatus.COMPLETED] = overview.status_distribution?.[CaseStatus.COMPLETED] ?? 0
      setSidebarCounts(counts)
    } catch (e) {
      console.error('Failed to fetch statistics:', e)
      toast.error('获取统计数据失败')
    }
  }

  const sidebarKeyToStatus = (key: string): CaseStatus | undefined => {
    switch (key) {
      case 'all':
      case 'group-need':
      case 'group-ai':
      case 'group-end':
        return undefined
      case 'processing':
        return CaseStatus.CONSULTANT_REVIEWING
      default:
        return key as CaseStatus
    }
  }

  const handleCreateCase = () => {
    setShowCreateModal(true)
  }

  const getTimeDisplay = (date: string) => {
    const now = new Date()
    const caseDate = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - caseDate.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}分钟前`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}小时前`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}天前`
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  // 顶部导航由壳层提供，这里不再重复实现登出等逻辑

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 左侧边栏 */}
      <div className="w-52 bg-white border-r border-gray-200 flex flex-col">
        {/* 搜索框 */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* 菜单列表 */}
        <div className="flex-1 overflow-y-auto">
          {baseSidebarMenuItems.map((item, index) => (
            <div key={index}>
              {item.divider && index > 0 && (
                <div className="mx-4 my-2 border-t border-gray-100" />
              )}
              <button
                onClick={() => { setSelectedMenuItem(String(item.key)); void fetchCases() }}
                className={cn(
                  "w-full px-4 py-2 flex items-center justify-between text-sm hover:bg-gray-50 transition-colors",
                  selectedMenuItem === String(item.key) ? "bg-gray-50 font-medium" : ""
                )}
              >
                <div className="flex items-center space-x-2">
                  {item.icon && (
                    <item.icon className={cn("w-4 h-4", item.iconColor)} />
                  )}
                  <span className={selectedMenuItem === String(item.key) ? "text-gray-900" : "text-gray-600"}>
                    {item.label}
                  </span>
                </div>
                <span className="text-gray-400">{sidebarCounts[String(item.key)] ?? 0}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 中间内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部统计栏 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">待处理</span>
                <span className="text-2xl font-semibold text-orange-600">{todayProcessed}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">紧急</span>
                <span className="text-2xl font-semibold text-red-600">{urgentCount}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">今日完成</span>
                <span className="text-2xl font-semibold text-gray-900">{todayCompleted}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">平均耗时</span>
                <span className="text-2xl font-semibold text-gray-900">{avgProcessingTime}</span>
              </div>
            </div>
            <span className="text-sm text-gray-400">最后更新: {lastUpdated ? `${Math.max(1, Math.floor((Date.now() - lastUpdated.getTime())/60000))} 分钟前` : '—'}</span>
          </div>
        </div>

        {/* 标题栏 */}
        <div className="bg-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">需要立即处理</h2>
          <button
            onClick={handleCreateCase}
            className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建案例
          </button>
        </div>

        {/* 案例列表 */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white">
            {cases.map((case_, index) => {
              const status = statusConfig[case_.status] || { label: case_.status, color: 'text-gray-600 bg-gray-100' }
              const isUrgent = case_.status === CaseStatus.CONSULTANT_REVIEWING
              
              return (
                <div
                  key={case_.id}
                  className={cn(
                    "px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
                    index === 0 ? "border-t" : ""
                  )}
                  onClick={() => router.push(`/cases/${case_.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* 状态指示器 */}
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        isUrgent ? "bg-orange-500" : "bg-blue-500"
                      )} />
                      
                      {/* 案例信息 */}
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">
                          {case_.applicant?.name || '未命名'}
                        </span>
                        {case_.visa_type && (
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {case_.visa_type}
                          </span>
                        )}
                        <span className="text-sm text-gray-400">
                          {case_.case_number} · 面签日期: {formatDate(case_.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* 右侧信息 */}
                    <div className="flex items-center space-x-6">
                      <span className={cn(
                        "text-sm px-2.5 py-1 rounded-full font-medium",
                        status.color
                      )}>
                        {status.label}
                      </span>
                      {case_.visa_type && (
                        <span className="text-sm text-gray-500">{case_.visa_type}</span>
                      )}
                      <span className="text-sm text-gray-400">
                        {getTimeDisplay(case_.updated_at)}
                      </span>
                      <Link
                        href={`/cases/${case_.id}`}
                        className="text-gray-400 hover:text-gray-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isUrgent ? (
                          <span className="text-orange-500 text-sm font-medium">
                            开始诊断 →
                          </span>
                        ) : (
                          <span className="text-blue-500 text-sm font-medium">
                            进入详情 →
                          </span>
                        )}
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 右侧统计面板 */}
      <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">其他案例</h3>
        
        {/* 案例统计卡片 */}
        <div className="space-y-4">
          {/* AI诊断中 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-900">AI诊断中</span>
              <span className="text-xs text-blue-600">查看详情</span>
            </div>
            <div className="flex items-center justify-between text-2xl font-semibold">
              <span>2</span>
              <span className="text-sm text-gray-400 font-normal">30分钟前</span>
            </div>
          </div>

          {/* 待客户填写 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-900">待客户填写</span>
              <span className="text-xs text-blue-600">查看详情</span>
            </div>
            <div className="flex items-center justify-between text-2xl font-semibold">
              <span>1</span>
              <span className="text-sm text-gray-400 font-normal">1小时前</span>
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">快捷操作</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">制作链接</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">查看客户</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">数据分析</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* 创建案例模态框 */}
      <CreateCaseModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchCases()
          setShowCreateModal(false)
        }}
      />
    </div>
  )
}