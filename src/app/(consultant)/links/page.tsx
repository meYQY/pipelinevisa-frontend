'use client'

import { useState, useEffect } from 'react'
import { 
  Copy, Send, RefreshCw, Eye, Search, Plus, Link2
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { linkService, type LinkResponse } from '@/services/link.service'
import { caseService } from '@/services/case.service'
import type { Case } from '@/types'

// 链接状态类型
type LinkStatus = 'active' | 'expired' | 'used' | 'revoked'

interface LinkWithCase extends LinkResponse {
  case?: Case
}

export default function LinkManagementPage() {
  const [links, setLinks] = useState<LinkWithCase[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLinks, setSelectedLinks] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<LinkStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 加载数据
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // 获取所有案例
      const casesData = await caseService.getCases({ per_page: 100 })
      setCases(casesData.items)
      
      // 获取每个案例的链接
      const allLinks: LinkWithCase[] = []
      for (const caseItem of casesData.items) {
        try {
          const linksData = await linkService.getCaseLinks(caseItem.id)
          const linksWithCase = linksData.items.map(link => ({
            ...link,
            case: caseItem
          }))
          allLinks.push(...linksWithCase)
        } catch (error) {
          console.error(`Failed to fetch links for case ${caseItem.id}:`, error)
        }
      }
      setLinks(allLinks)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('获取链接列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 统计数据
  const stats = {
    active: links.filter(l => l.status === 'active').length,
    used: links.filter(l => l.status === 'used').length,
    expired: links.filter(l => l.status === 'expired').length,
    revoked: links.filter(l => l.status === 'revoked').length,
    total: links.length
  }

  // 复制链接
  const handleCopyLink = async (url: string, caseName?: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success(`已复制${caseName ? ` ${caseName} 的` : ''}链接`)
    } catch (error) {
      toast.error('复制失败，请手动复制')
    }
  }

  // 撤销链接
  const handleRevokeLink = async (linkId: string) => {
    try {
      await linkService.revokeLink(linkId)
      await fetchData()
      toast.success('已撤销链接')
    } catch (error) {
      toast.error('撤销失败')
    }
  }

  // 生成新链接
  const handleGenerateNewLink = async (caseId: string) => {
    try {
      await linkService.generateLink(caseId, { expiry_hours: 72 })
      await fetchData()
      toast.success('已生成新链接')
    } catch (error) {
      toast.error('生成链接失败')
    }
  }

  // 批量操作
  const handleBatchAction = (action: string) => {
    if (selectedLinks.length === 0) {
      toast.error('请先选择要操作的链接')
      return
    }
    
    switch (action) {
      case 'revoke':
        selectedLinks.forEach(linkId => handleRevokeLink(linkId))
        toast.success(`已撤销 ${selectedLinks.length} 个链接`)
        break
      case 'regenerate':
        toast.success(`已为 ${selectedLinks.length} 个案例生成新链接`)
        break
      default:
        break
    }
    setSelectedLinks([])
  }

  // 过滤链接
  const filteredLinks = links.filter(link => {
    const matchesStatus = statusFilter === 'all' || link.status === statusFilter
    const matchesSearch = searchQuery === '' || 
                          link.case?.applicant?.name?.includes(searchQuery) ||
                          link.case?.case_number?.includes(searchQuery) ||
                          link.token.includes(searchQuery)
    return matchesStatus && matchesSearch
  })

  // 计算有效期剩余时间
  const getExpiryInfo = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffMs = expiry.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMs < 0) return { text: '已过期', urgent: true }
    if (diffDays > 0) return { text: `剩余 ${diffDays} 天`, urgent: false }
    if (diffHours > 0) return { text: `剩余 ${diffHours} 小时`, urgent: diffHours <= 12 }
    return { text: '即将过期', urgent: true }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    )
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedLinks.length === filteredLinks.length) {
      setSelectedLinks([])
    } else {
      setSelectedLinks(filteredLinks.map(l => l.id))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面标题 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold">链接管理</h1>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-4 gap-4">
          {/* 活跃链接 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">活跃链接</span>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">实时</span>
            </div>
            <div className="text-2xl font-semibold">{stats.active}</div>
            <p className="text-xs text-gray-500 mt-1">可正常访问</p>
          </div>

          {/* 已使用 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">已使用</span>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">已完成</span>
            </div>
            <div className="text-2xl font-semibold">{stats.used}</div>
            <p className="text-xs text-gray-500 mt-1">客户已填写</p>
          </div>

          {/* 已过期 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">已过期</span>
              <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">需关注</span>
            </div>
            <div className="text-2xl font-semibold">{stats.expired}</div>
            <p className="text-xs text-gray-500 mt-1">建议重新发送</p>
          </div>

          {/* 已撤销 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">已撤销</span>
              <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">无效</span>
            </div>
            <div className="text-2xl font-semibold">{stats.revoked}</div>
            <p className="text-xs text-gray-500 mt-1">手动停用</p>
          </div>
        </div>
      </div>

      {/* 链接列表 */}
      <div className="px-4">
        <div className="bg-white rounded-lg border border-gray-200">
          {/* 筛选栏 */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* 状态筛选 */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as LinkStatus | 'all')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部状态</option>
                  <option value="active">活跃</option>
                  <option value="used">已使用</option>
                  <option value="expired">已过期</option>
                  <option value="revoked">已撤销</option>
                </select>

                {/* 搜索框 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索客户姓名..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 批量操作 */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBatchAction('revoke')}
                  disabled={selectedLinks.length === 0}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  批量撤销
                </button>
                <button
                  onClick={() => handleBatchAction('regenerate')}
                  disabled={selectedLinks.length === 0}
                  className="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
                >
                  生成新链接
                </button>
              </div>
            </div>
          </div>

          {/* 表格 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLinks.length === filteredLinks.length && filteredLinks.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">案例信息</th>
                  <th className="px-4 py-3 text-left">链接状态</th>
                  <th className="px-4 py-3 text-left">创建时间</th>
                  <th className="px-4 py-3 text-left">有效期</th>
                  <th className="px-4 py-3 text-left">访问链接</th>
                  <th className="px-4 py-3 text-left">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLinks.map(link => {
                  const expiryInfo = getExpiryInfo(link.expires_at)
                  return (
                    <tr key={link.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLinks.includes(link.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLinks([...selectedLinks, link.id])
                            } else {
                              setSelectedLinks(selectedLinks.filter(id => id !== link.id))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {link.case?.applicant?.name || '未知客户'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {link.case?.visa_type} · {link.case?.case_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                          link.status === 'active' && "bg-green-100 text-green-800",
                          link.status === 'used' && "bg-blue-100 text-blue-800",
                          link.status === 'expired' && "bg-yellow-100 text-yellow-800",
                          link.status === 'revoked' && "bg-gray-100 text-gray-600"
                        )}>
                          {link.status === 'active' && '• 活跃'}
                          {link.status === 'used' && '• 已使用'}
                          {link.status === 'expired' && '• 已过期'}
                          {link.status === 'revoked' && '• 已撤销'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {new Date(link.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {link.status === 'active' ? (
                          <span className={cn(
                            expiryInfo.urgent && "text-red-600 font-medium"
                          )}>
                            {expiryInfo.text}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="max-w-xs truncate text-sm text-gray-600">
                          {link.access_url}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleCopyLink(link.access_url, link.case?.applicant?.name)}
                            className="p-1 text-gray-600 hover:text-blue-600"
                            title="复制链接"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {link.status === 'active' && (
                            <button
                              onClick={() => handleRevokeLink(link.id)}
                              className="p-1 text-gray-600 hover:text-red-600"
                              title="撤销链接"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          {link.status === 'expired' && link.case && (
                            <button
                              onClick={() => handleGenerateNewLink(link.case_id)}
                              className="p-1 text-gray-600 hover:text-green-600"
                              title="生成新链接"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => window.location.href = `/cases/${link.case_id}`}
                            className="p-1 text-gray-600 hover:text-gray-900"
                            title="查看案例"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 底部信息 */}
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                显示 {filteredLinks.length} 条，共 {links.length} 条
              </div>
              {links.length === 0 && (
                <div className="text-sm text-gray-500">
                  暂无链接记录
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}