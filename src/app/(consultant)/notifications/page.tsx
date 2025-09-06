'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckCircle, AlertTriangle, FileText, MessageCircle, Settings, Clock, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { notificationsService, type NotificationItem } from '@/services/notifications.service'

// 通知类型
type NotificationType = 'urgent' | 'customer' | 'ai_complete' | 'material' | 'system'

// 通知分类配置
const notificationCategories = [
  { key: 'all', label: '全部通知', count: 15 },
  { key: 'customer', label: '客户消息', count: 3 },
  { key: 'ai_complete', label: 'AI处理完成', count: 5 },
  { key: 'material', label: '材料补充', count: 2 },
  { key: 'urgent', label: '紧急提醒', count: 1 },
  { key: 'system', label: '系统通知', count: 4 }
]

// 去除本地mock，通过服务加载

// 通知图标映射
const notificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  urgent: AlertTriangle,
  customer: MessageCircle,
  ai_complete: CheckCircle,
  material: FileText,
  system: Settings
}

// 通知颜色映射
const notificationColors: Record<NotificationType, string> = {
  urgent: 'text-red-600 bg-red-100',
  customer: 'text-blue-600 bg-blue-100',
  ai_complete: 'text-green-600 bg-green-100',
  material: 'text-orange-600 bg-orange-100',
  system: 'text-gray-600 bg-gray-100'
}

export default function NotificationCenter() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: NotificationType
    title: string
    content: string
    time: string
    status: 'unread' | 'read'
    caseId?: string
    clientName?: string
    metadata?: Record<string, any>
  }>>([])
  const [sortBy, setSortBy] = useState<'time' | 'priority'>('time')
  const [showQuickReply, setShowQuickReply] = useState(false)
  const [activeNotification, setActiveNotification] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const load = async () => {
      const resp = await notificationsService.list({ type: selectedCategory as any, page: 1, per_page: perPage })
      const mapped = resp.items.map((n: NotificationItem) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        content: n.content,
        time: n.time,
        status: n.status,
        caseId: n.case_id,
        clientName: n.client_name,
        metadata: n.metadata,
      }))
      setNotifications(mapped)
      setPage(1)
      setTotal(resp.total)
    }
    void load()
  }, [selectedCategory, perPage])

  // 筛选通知
  const filteredNotifications = notifications.filter(notification => {
    if (selectedCategory === 'all') return true
    return notification.type === selectedCategory
  })

  const hasMore = notifications.length < total

  const loadMore = async () => {
    const nextPage = page + 1
    const resp = await notificationsService.list({ type: selectedCategory as any, page: nextPage, per_page: perPage })
    const mapped = resp.items.map((n: NotificationItem) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      content: n.content,
      time: n.time,
      status: n.status,
      caseId: n.case_id,
      clientName: n.client_name,
      metadata: n.metadata,
    }))
    setNotifications(prev => [...prev, ...mapped])
    setPage(nextPage)
    setTotal(resp.total)
  }

  // 标记为已读
  const markAsRead = async (id: string) => {
    await notificationsService.markRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n))
  }

  // 全部标记为已读
  const markAllAsRead = async () => {
    await notificationsService.markAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })))
    toast.success('已标记全部为已读')
  }

  // 清除已读（前端就地过滤）
  const clearRead = () => {
    setNotifications(prev => prev.filter(n => n.status !== 'read'))
    toast.success('已清除已读')
  }

  // 处理通知操作
  const handleNotificationAction = (notificationId: string, action: string) => {
    const notification = notifications.find(n => n.id === notificationId)
    if (!notification) return

    switch (action) {
      case 'handle':
        toast.success(`正在处理${notification.clientName}的案例`)
        break
      case 'reply':
        setActiveNotification(notificationId)
        setShowQuickReply(true)
        break
      case 'view_diagnosis':
        toast.info('跳转到AI诊断结果页面')
        break
      case 'review':
        toast.info('跳转到材料审核页面')
        break
      default:
        toast.info(`执行操作：${action}`)
    }
    
    markAsRead(notificationId)
  }

  // 快速回复
  const handleQuickReply = (message: string) => {
    const notification = notifications.find(n => n.id === activeNotification)
    if (notification) {
      toast.success(`已回复${notification.clientName}`)
      setShowQuickReply(false)
      setActiveNotification(null)
    }
  }

  // 获取相对时间显示
  const getTimeDisplay = (time: string) => {
    if (time.includes('已读')) return time
    return time
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* 左侧分类导航 */}
          <div className="w-64">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">通知类型</h3>
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  全部标记已读
                </button>
              </div>
              
              <nav className="space-y-1">
                {notificationCategories.map(category => (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                      selectedCategory === category.key
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <span>{category.label}</span>
                    {category.count > 0 && (
                      <span className={cn(
                        'px-2 py-0.5 text-xs rounded-full',
                        selectedCategory === category.key
                          ? 'bg-white text-gray-900'
                          : 'bg-gray-100 text-gray-600'
                      )}>
                        {category.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">快速筛选</h4>
                <div className="space-y-2">
                  <label className="flex items-center text-sm">
                    <input type="checkbox" className="rounded border-gray-300 mr-2" />
                    <span className="text-gray-700">仅显示未读</span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="checkbox" className="rounded border-gray-300 mr-2" />
                    <span className="text-gray-700">需要回复</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧通知列表 */}
          <div className="flex-1">
            <div className="bg-white rounded-lg border border-gray-200">
              {/* 顶部操作栏 */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:text-blue-700">
                      全部标记已读
                    </button>
                    <button onClick={clearRead} className="text-sm text-blue-600 hover:text-blue-700">
                      清除已读
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">排序：</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'time' | 'priority')}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="time">时间倒序</option>
                      <option value="priority">优先级</option>
                    </select>
                    <button className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800">
                      快速回复
                    </button>
                  </div>
                </div>
              </div>

              {/* 通知列表 */}
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map(notification => {
                  const Icon = notificationIcons[notification.type]
                  const isUnread = notification.status === 'unread'
                  
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-6 hover:bg-gray-50 transition-colors',
                        isUnread && 'bg-blue-50/30'
                      )}
                    >
                      <div className="flex items-start space-x-4">
                        {/* 通知图标 */}
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                          notificationColors[notification.type]
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* 通知内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className={cn(
                              'text-sm font-medium',
                              isUnread ? 'text-gray-900' : 'text-gray-700'
                            )}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 ml-4">
                              {isUnread && (
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              )}
                              <span>{getTimeDisplay(notification.time)}</span>
                              {notification.clientName && (
                                <>
                                  <span>·</span>
                                  <span>收件人：{notification.clientName}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{notification.content}</p>
                          
                          {/* 元数据信息 */}
                          {notification.metadata && (
                            <div className="text-xs text-gray-500 mb-3">
                              {notification.metadata.duration && (
                                <div className="bg-gray-100 inline-block px-2 py-1 rounded mr-2">
                                  {notification.metadata.duration}
                                </div>
                              )}
                              {notification.metadata.issues && (
                                <span className="text-orange-600">发现{notification.metadata.issues}个问题</span>
                              )}
                              {notification.metadata.files && (
                                <div className="mt-1">
                                  {notification.metadata.files.map((file, index) => (
                                    <span key={index} className="inline-block bg-gray-100 px-2 py-1 rounded mr-1 text-xs">
                                      {file}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 操作按钮 */}
                          {notification.actions && (
                            <div className="flex items-center space-x-3">
                              {notification.actions.primary && (
                                <button
                                  onClick={() => handleNotificationAction(notification.id, notification.actions!.primary!.action)}
                                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  {notification.actions.primary.label}
                                </button>
                              )}
                              {notification.actions.secondary && (
                                <button
                                  onClick={() => handleNotificationAction(notification.id, notification.actions!.secondary!.action)}
                                  className="text-sm text-gray-600 hover:text-gray-700"
                                >
                                  {notification.actions.secondary.label}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 加载更多 */}
              <div className="p-6 text-center border-t border-gray-200">
                {hasMore ? (
                  <button onClick={loadMore} className="text-sm text-blue-600 hover:text-blue-700">
                    加载更多通知
                  </button>
                ) : (
                  <span className="text-sm text-gray-500">已无更多</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 快速回复弹窗 */}
      {showQuickReply && (
        <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-medium">新的AI诊断完成</span>
              </div>
              <button
                onClick={() => setShowQuickReply(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              孙王的申请已完成AI诊断，请查看结果。
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleQuickReply('立即查看')}
                className="flex-1 px-3 py-2 bg-black text-white text-sm rounded hover:bg-gray-800"
              >
                立即查看
              </button>
              <button
                onClick={() => setShowQuickReply(false)}
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
              >
                忽略
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}