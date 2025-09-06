import { api } from '@/lib/api'
import type { CaseStatus } from '@/types'

// 统计概览接口
export interface StatisticsOverview {
  total_cases: number
  active_cases: number
  completed_cases: number
  pending_review: number
  status_distribution: Record<CaseStatus, number>
  visa_type_distribution: Record<string, number>
  monthly_trend: Array<{
    month: string
    created: number
    completed: number
  }>
}

// 顾问统计接口
export interface ConsultantStatistics {
  consultant_id: string
  consultant_name: string
  total_cases: number
  active_cases: number
  completed_cases: number
  average_processing_time: number // 小时
  success_rate: number // 百分比
}

// 统计服务类
class StatisticsService {
  /**
   * 获取统计概览
   */
  async getOverview(): Promise<StatisticsOverview> {
    const response = await api.get<StatisticsOverview>('/statistics/overview')
    return response
  }

  /**
   * 获取顾问统计
   */
  async getConsultantStatistics(consultantId?: string): Promise<ConsultantStatistics[]> {
    const params = consultantId ? { consultant_id: consultantId } : {}
    const response = await api.get<ConsultantStatistics[]>('/statistics/consultants', { params })
    return response
  }

  /**
   * 获取案例趋势
   */
  async getCaseTrend(params?: {
    start_date?: string
    end_date?: string
    interval?: 'day' | 'week' | 'month'
  }): Promise<{
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
    }>
  }> {
    const response = await api.get('/statistics/trend', { params })
    return response
  }

  /**
   * 获取状态分布
   */
  async getStatusDistribution(): Promise<Array<{
    status: CaseStatus
    label: string
    count: number
    percentage: number
  }>> {
    const response = await api.get('/statistics/status-distribution')
    return response
  }

  /**
   * 获取签证类型分布
   */
  async getVisaTypeDistribution(): Promise<Array<{
    visa_type: string
    count: number
    percentage: number
  }>> {
    const response = await api.get('/statistics/visa-type-distribution')
    return response
  }

  /**
   * 获取平均处理时间
   */
  async getAverageProcessingTime(): Promise<{
    overall: number // 小时
    by_status: Record<CaseStatus, number>
    by_visa_type: Record<string, number>
  }> {
    const response = await api.get('/statistics/processing-time')
    return response
  }
}

// 导出单例
export const statisticsService = new StatisticsService()