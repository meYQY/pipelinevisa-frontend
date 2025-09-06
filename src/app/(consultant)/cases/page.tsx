'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Link as LinkIcon,
  Eye,
  Trash2
} from 'lucide-react'
import { caseService } from '@/services/case.service'
import { cn } from '@/lib/utils'
import { CaseStatus, type Case } from '@/types'
import Link from 'next/link'
import { toast } from 'sonner'
import CreateCaseModal from '@/components/consultant/CreateCaseModal'
import ConfirmDialog from '@/components/common/ConfirmDialog'

// 状态映射
const statusConfig = {
  [CaseStatus.CREATED]: { label: '已创建', color: 'bg-gray-100 text-gray-700', icon: Clock },
  [CaseStatus.LINK_SENT]: { label: '链接已发送', color: 'bg-blue-100 text-blue-700', icon: LinkIcon },
  [CaseStatus.CLIENT_FILLING]: { label: '客户填写中', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  [CaseStatus.CLIENT_SUBMITTED]: { label: '客户已提交', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  [CaseStatus.AI_REVIEWING]: { label: 'AI审查中', color: 'bg-purple-100 text-purple-700', icon: Clock },
  [CaseStatus.CONSULTANT_REVIEWING]: { label: '顾问审核中', color: 'bg-indigo-100 text-indigo-700', icon: AlertCircle },
  [CaseStatus.NEED_SUPPLEMENT]: { label: '需要补充', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  [CaseStatus.MATERIALS_APPROVED]: { label: '材料确认无误', color: 'bg-teal-100 text-teal-700', icon: CheckCircle },
  [CaseStatus.AI_PROCESSING]: { label: 'AI翻译处理中', color: 'bg-purple-100 text-purple-700', icon: Clock },
  [CaseStatus.CONSULTANT_FINAL_REVIEW]: { label: '顾问最终核对', color: 'bg-indigo-100 text-indigo-700', icon: AlertCircle },
  [CaseStatus.CONSULTANT_FINAL_APPROVED]: { label: '顾问最终确认', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  [CaseStatus.SENT_TO_CLIENT]: { label: '已发送给客户', color: 'bg-blue-100 text-blue-700', icon: LinkIcon },
  [CaseStatus.CLIENT_CONFIRMED]: { label: '客户确认无误', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  [CaseStatus.COMPLETED]: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle },
}

interface FilterState {
  status?: CaseStatus
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export default function CasesPage() {
  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState<Case[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  })
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'created_at',
    sortOrder: 'desc'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCases, setSelectedCases] = useState<string[]>([])
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; caseId?: string }>({ show: false })

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true)
      const response = await caseService.getCases({
        page: pagination.page,
        per_page: pagination.per_page,
        status: filters.status,
        search: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      })
      
      setCases(response.items)
      setPagination({
        page: response.page,
        per_page: response.per_page,
        total: response.total,
        total_pages: Math.ceil(response.total / response.per_page)
      })
    } catch (error) {
      console.error('Failed to fetch cases:', error)
      toast.error('获取案例列表失败')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.per_page, filters.status, filters.search, filters.sortBy, filters.sortOrder])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  const handleCreateCase = () => {
    setShowCreateModal(true)
  }

  const handleGenerateLink = async (caseId: string) => {
    try {
      const result = await caseService.generateLink(caseId)
      
      // 复制链接到剪贴板
      await navigator.clipboard.writeText(result.url)
      toast.success('链接已复制到剪贴板')
      
      // 刷新列表
      fetchCases()
    } catch (error) {
      console.error('Failed to generate link:', error)
      toast.error('生成链接失败')
    }
  }

  const handleDeleteCase = async (caseId: string) => {
    setDeleteConfirm({ show: true, caseId })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.caseId) return

    try {
      await caseService.deleteCase(deleteConfirm.caseId)
      toast.success('案例已删除')
      fetchCases()
    } catch (error) {
      console.error('Failed to delete case:', error)
      toast.error('删除案例失败')
    } finally {
      setDeleteConfirm({ show: false })
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const search = formData.get('search') as string
    setFilters({ ...filters, search })
    setPagination({ ...pagination, page: 1 })
  }

  const toggleSelectAll = () => {
    if (selectedCases.length === cases.length) {
      setSelectedCases([])
    } else {
      setSelectedCases(cases.map(c => c.id))
    }
  }

  const toggleSelectCase = (caseId: string) => {
    if (selectedCases.includes(caseId)) {
      setSelectedCases(selectedCases.filter(id => id !== caseId))
    } else {
      setSelectedCases([...selectedCases, caseId])
    }
  }

  return (
    <div className="px-4 py-6">
      {/* 页面标题和操作 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">案例管理</h1>
            <p className="mt-1 text-sm text-gray-500">
              管理所有签证申请案例，跟踪处理进度
            </p>
          </div>
          <button
            onClick={handleCreateCase}
            className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建新案例
          </button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="search"
                placeholder="搜索案例编号、申请人姓名、签证类型..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                defaultValue={filters.search}
              />
            </div>
          </form>

          {/* 筛选按钮 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors",
              showFilters
                ? "border-black text-black bg-gray-50"
                : "border-gray-200 text-gray-700 hover:bg-gray-50"
            )}
          >
            <Filter className="w-4 h-4 mr-2" />
            筛选
            {filters.status && (
              <span className="ml-2 px-2 py-0.5 bg-black text-white text-xs rounded-full">
                1
              </span>
            )}
          </button>

          {/* 批量操作 */}
          {selectedCases.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                已选择 {selectedCases.length} 项
              </span>
              <button className="text-sm text-gray-700 hover:text-gray-900">
                批量导出
              </button>
            </div>
          )}
        </div>

        {/* 筛选选项 */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 状态筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  状态
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => {
                    setFilters({ ...filters, status: e.target.value as CaseStatus || undefined })
                    setPagination({ ...pagination, page: 1 })
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">全部状态</option>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 排序 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  排序方式
                </label>
                <select
                  value={`${filters.sortBy}:${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split(':')
                    setFilters({ ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc' })
                    setPagination({ ...pagination, page: 1 })
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="created_at:desc">创建时间（最新）</option>
                  <option value="created_at:asc">创建时间（最早）</option>
                  <option value="updated_at:desc">更新时间（最新）</option>
                  <option value="updated_at:asc">更新时间（最早）</option>
                </select>
              </div>

              {/* 重置按钮 */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilters({ sortBy: 'created_at', sortOrder: 'desc' })
                    setPagination({ ...pagination, page: 1 })
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  重置筛选
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 案例列表 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500">加载中...</span>
            </div>
          </div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-12 h-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无案例</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search ? '没有找到匹配的案例' : '创建您的第一个案例开始使用'}
            </p>
            {!filters.search && (
              <div className="mt-6">
                <button
                  onClick={handleCreateCase}
                  className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  创建新案例
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* 表格 */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-6 py-3">
                      <input
                        type="checkbox"
                        checked={selectedCases.length === cases.length && cases.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      案例编号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请人
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      签证类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cases.map((case_) => {
                    const status = statusConfig[case_.status]
                    const StatusIcon = status?.icon || Clock
                    
                    return (
                      <tr key={case_.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedCases.includes(case_.id)}
                            onChange={() => toggleSelectCase(case_.id)}
                            className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/cases/${case_.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-black"
                          >
                            {case_.case_number}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {case_.applicant?.name || '未命名'}
                          </div>
                          {case_.applicant?.email && (
                            <div className="text-xs text-gray-500">
                              {case_.applicant.email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {case_.visa_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            status?.color || 'bg-gray-100 text-gray-700'
                          )}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status?.label || case_.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(case_.created_at).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="relative flex items-center space-x-2">
                            <Link
                              href={`/cases/${case_.id}`}
                              className="text-gray-600 hover:text-gray-900"
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            
                            {case_.status === CaseStatus.CREATED && (
                              <button
                                onClick={() => handleGenerateLink(case_.id)}
                                className="text-gray-600 hover:text-gray-900"
                                title="生成链接"
                              >
                                <LinkIcon className="w-4 h-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => setShowActionMenu(showActionMenu === case_.id ? null : case_.id)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {showActionMenu === case_.id && (
                              <div className="absolute right-0 top-8 z-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                                <button
                                  onClick={() => {
                                    handleDeleteCase(case_.id)
                                    setShowActionMenu(null)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  删除案例
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  共 <span className="font-medium">{pagination.total}</span> 条记录，
                  第 <span className="font-medium">{pagination.page}</span> / <span className="font-medium">{pagination.total_pages}</span> 页
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: 1 })}
                    disabled={pagination.page === 1}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {/* 页码 */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      let pageNumber
                      if (pagination.total_pages <= 5) {
                        pageNumber = i + 1
                      } else if (pagination.page <= 3) {
                        pageNumber = i + 1
                      } else if (pagination.page >= pagination.total_pages - 2) {
                        pageNumber = pagination.total_pages - 4 + i
                      } else {
                        pageNumber = pagination.page - 2 + i
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setPagination({ ...pagination, page: pageNumber })}
                          className={cn(
                            "w-8 h-8 text-sm font-medium rounded",
                            pageNumber === pagination.page
                              ? "bg-black text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          )}
                        >
                          {pageNumber}
                        </button>
                      )
                    })}
                  </div>
                  
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.total_pages}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.total_pages })}
                    disabled={pagination.page === pagination.total_pages}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
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

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false })}
        onConfirm={confirmDelete}
        type="danger"
        title="删除案例"
        message="确定要删除这个案例吗？此操作不可恢复。"
        confirmText="删除"
        cancelText="取消"
      />
    </div>
  )
}