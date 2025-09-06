'use client'

import { useEffect, useMemo, useState } from 'react'
import { 
  Search, Plus, Star, 
  RotateCcw, UserPlus
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { caseService } from '@/services/case.service'
import type { Case } from '@/types'

// 客户类型
interface Client {
  id: string
  name: string
  nameEn: string
  phone: string
  email: string
  caseCount: number
  latestCase: {
    type: string
    date: string
  }
  tags: string[]
  avatar?: string
}

// 筛选类型
type FilterType = 'all' | 'vip' | 'new' | 'returning'

// 初始为空，加载后聚合生成

export default function ClientManagementPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const resp = await caseService.getCases({ page, per_page: perPage, sort_by: 'updated_at', sort_order: 'desc' })
        setTotal(resp.total)
        const map = new Map<string, Client>()
        resp.items.forEach((c: Case) => {
          const applicant = c.applicant
          const applicantId = applicant?.id || `unknown-${c.id}`
          const name = applicant?.name || '未命名'
          const email = applicant?.email || ''
          const phone = applicant?.phone || ''
          const nameEn = (applicant?.name_pinyin || '').toUpperCase()
          const latest = c.updated_at || c.created_at
          const existing = map.get(applicantId)
          if (existing) {
            existing.caseCount += 1
            if (new Date(latest) > new Date(existing.latestCase.date)) {
              existing.latestCase = { type: c.visa_type, date: latest }
            }
            if (!existing.tags.includes('回头客') && existing.caseCount > 1) existing.tags.push('回头客')
          } else {
            map.set(applicantId, {
              id: applicantId,
              name,
              nameEn,
              phone,
              email,
              caseCount: 1,
              latestCase: { type: c.visa_type, date: latest },
              tags: [],
              avatar: name[0],
            })
          }
        })
        setClients(Array.from(map.values()))
      } catch (_) {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [page, perPage])

  // 统计数据
  const stats = useMemo(() => ({
    total: clients.length,
    newThisMonth: clients.filter(c => c.tags.includes('新客户')).length,
    active: clients.filter(c => c.caseCount > 0).length,
    returningRate: `${Math.round((clients.filter(c => c.caseCount > 1).length / Math.max(1, clients.length)) * 100)}%`
  }), [clients])

  // 筛选选项
  const filterOptions = [
    { value: 'all' as FilterType, label: '全部', icon: null, active: true },
    { value: 'vip' as FilterType, label: 'VIP客户', icon: Star, active: false },
    { value: 'new' as FilterType, label: '新客户', icon: UserPlus, active: false },
    { value: 'returning' as FilterType, label: '回头客', icon: RotateCcw, active: false }
  ]

  // 过滤客户
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.includes(searchQuery) || 
                          client.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          client.email.includes(searchQuery) ||
                          client.id.includes(searchQuery)
    
    let matchesFilter = true
    switch (filterType) {
      case 'vip':
        matchesFilter = client.tags.includes('VIP')
        break
      case 'new':
        matchesFilter = client.tags.includes('新客户')
        break
      case 'returning':
        matchesFilter = client.tags.includes('回头客')
        break
    }
    
    return matchesSearch && matchesFilter
  })

  // 查看客户详情
  const handleViewClient = (client: Client) => {
    toast.info(`查看客户 ${client.name} 的详细信息`)
  }

  // 标记客户
  const handleMarkClient = (clientId: string, tag: string) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const newTags = c.tags.includes(tag) 
          ? c.tags.filter(t => t !== tag)
          : [...c.tags, tag]
        return { ...c, tags: newTags }
      }
      return c
    }))
    toast.success('标记更新成功')
  }
  
  // 临时使用函数避免警告
  console.log('Mark client function:', handleMarkClient)

  // 创建新客户
  const handleCreateClient = () => {
    toast.info('打开创建客户弹窗')
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([])
    } else {
      setSelectedClients(filteredClients.map(c => c.id))
    }
  }

  // 获取标签颜色
  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'VIP':
        return 'bg-yellow-100 text-yellow-800'
      case '新客户':
        return 'bg-green-100 text-green-800'
      case '回头客':
        return 'bg-blue-100 text-blue-800'
      case '待跟进':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面标题 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">客户管理</h1>
            <button
              onClick={handleCreateClient}
              className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建客户
            </button>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-4 gap-4">
          {/* 总客户数 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">总客户数</span>
            </div>
            <div className="text-2xl font-semibold">{stats.total}</div>
          </div>

          {/* 本月新增 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">本月新增</span>
            </div>
            <div className="text-2xl font-semibold">{stats.newThisMonth}</div>
          </div>

          {/* 活跃客户 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">活跃客户</span>
            </div>
            <div className="text-2xl font-semibold">{stats.active}</div>
          </div>

          {/* 回头客率 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">回头客率</span>
            </div>
            <div className="text-2xl font-semibold">{stats.returningRate}</div>
          </div>
        </div>
      </div>

      <div className="px-4 flex gap-4">
        {/* 左侧筛选栏 */}
        <div className="w-48">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索客户..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">客户类型</h3>
              <div className="space-y-1">
                {filterOptions.map((option) => {
                  const isActive = filterType === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() => setFilterType(option.value)}
                      className={cn(
                        'w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {option.icon && <option.icon className="w-4 h-4 mr-2" />}
                      <span>{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">客户状态</h3>
              <div className="space-y-2">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 mr-2"
                    defaultChecked
                  />
                  <span className="text-gray-700">全部</span>
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 mr-2"
                  />
                  <span className="text-gray-700">美国 B1/B2</span>
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 mr-2"
                  />
                  <span className="text-gray-700">申根签证</span>
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 mr-2"
                  />
                  <span className="text-gray-700">历史</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧客户列表 */}
        <div className="flex-1">
          <div className="bg-white rounded-lg border border-gray-200">
            {/* 表格 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">客户信息</th>
                    <th className="px-4 py-3 text-left">联系方式</th>
                    <th className="px-4 py-3 text-left">案例数</th>
                    <th className="px-4 py-3 text-left">最近案例</th>
                    <th className="px-4 py-3 text-left">标签</th>
                    <th className="px-4 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-gray-500" colSpan={7}>加载中...</td>
                    </tr>
                  ) : filteredClients.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-gray-500" colSpan={7}>暂无客户</td>
                    </tr>
                  ) : filteredClients.map(client => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(client.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClients([...selectedClients, client.id])
                            } else {
                              setSelectedClients(selectedClients.filter(id => id !== client.id))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium mr-3",
                            client.name === '张三' ? "bg-blue-100 text-blue-600" :
                            client.name === '李四' ? "bg-purple-100 text-purple-600" :
                            client.name === '王五' ? "bg-green-100 text-green-600" :
                            "bg-orange-100 text-orange-600"
                          )}>
                            {client.name[0]}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{client.name}</div>
                            <div className="text-xs text-gray-500">ID: {client.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{client.phone}</div>
                        <div className="text-xs text-gray-500">{client.email}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {client.caseCount}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{client.latestCase.type}</div>
                        <div className="text-xs text-gray-500">{client.latestCase.date}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {client.tags.map(tag => (
                            <span
                              key={tag}
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                getTagColor(tag)
                              )}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleViewClient(client)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div className="px-4 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">共 {total} 条</div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                  >上一页</button>
                  <span className="text-sm">第 {page} 页</span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={clients.length < perPage}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                  >下一页</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}