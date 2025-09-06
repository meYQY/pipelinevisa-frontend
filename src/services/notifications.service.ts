import { api } from '@/lib/api'

export type NotificationType = 'urgent' | 'customer' | 'ai_complete' | 'material' | 'system'
export type NotificationStatus = 'unread' | 'read'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  content: string
  time: string
  status: NotificationStatus
  case_id?: string
  client_name?: string
  metadata?: Record<string, any>
}

export interface NotificationListResponse {
  items: NotificationItem[]
  total: number
  page: number
  per_page: number
}

class NotificationsService {
  async list(params?: { page?: number; per_page?: number; type?: NotificationType | 'all' }): Promise<NotificationListResponse> {
    try {
      const response = await api.get<NotificationListResponse>('/notifications', { params })
      return response
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        const items: NotificationItem[] = [
          {
            id: '1',
            type: 'urgent',
            title: '紧急：张三案例即将到期',
            content: '案例 #2024011501 的预约面签时间为明天上午，请立即完成材料终审。',
            time: '5分钟前',
            status: 'unread',
            case_id: '2024011501',
            client_name: '张三',
          },
          {
            id: '2',
            type: 'ai_complete',
            title: 'AI诊断完成：王五',
            content: '案例已完成初步诊断，发现3个需要注意的问题，请及时审核。',
            time: '30分钟前',
            status: 'read',
            case_id: '2024011503',
            client_name: '王五',
            metadata: { issues: 3 },
          },
        ]
        return { items, total: items.length, page: 1, per_page: items.length }
      }
      throw error
    }
  }

  async markRead(id: string): Promise<void> {
    try {
      await api.post(`/notifications/${id}/read`)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') return
      throw error
    }
  }

  async markAllRead(): Promise<void> {
    try {
      await api.post('/notifications/mark-all-read')
    } catch (error) {
      if (process.env.NODE_ENV === 'development') return
      throw error
    }
  }
}

export const notificationsService = new NotificationsService()


