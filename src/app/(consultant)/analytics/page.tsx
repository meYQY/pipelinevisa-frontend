'use client'

import { useState, useEffect } from 'react'
import { 
  Download
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { statisticsService, type StatisticsOverview } from '@/services/statistics.service'

// 数据类型定义
interface AnalyticsData {
  overview: {
    totalClients: number
    totalClientsGrowth: number
    completionRate: number
    completionRateGrowth: number
    avgProcessTime: string
    avgProcessTimeChange: number
    passRate: number
    passRateGrowth: number
  }
  caseStatus: {
    labels: string[]
    data: number[]
  }
  passRateByType: {
    美国B1B2: { rate: number; count: number }
    申根签: { rate: number; count: number }
    英国签证: { rate: number; count: number }
    加拿大: { rate: number; count: number }
  }
  workProgress: {
    type: string
    location: string
    completionRate: number
    avgTime: string
    changePercent: number
    status: 'up' | 'down' | 'stable'
  }[]
}

// 时间范围选项
const timeRangeOptions = [
  { value: '7d', label: '最近7天' },
  { value: '30d', label: '最近30天' },
  { value: '90d', label: '最近90天' },
  { value: '1y', label: '最近一年' },
  { value: 'custom', label: '自定义' }
]

// 模拟数据
const mockData: AnalyticsData = {
  overview: {
    totalClients: 156,
    totalClientsGrowth: 12,
    completionRate: 92,
    completionRateGrowth: 5,
    avgProcessTime: '2.5h',
    avgProcessTimeChange: -30,
    passRate: 87,
    passRateGrowth: 0
  },
  caseStatus: {
    labels: ['9月', '10月', '11月', '12月', '1月'],
    data: [42, 38, 45, 52, 48]
  },
  passRateByType: {
    美国B1B2: { rate: 91, count: 144 },
    申根签: { rate: 85, count: 36 },
    英国签证: { rate: 88, count: 28 },
    加拿大: { rate: 82, count: 22 }
  },
  workProgress: [
    {
      type: '王明',
      location: '美国',
      completionRate: 95,
      avgTime: '42',
      changePercent: 2,
      status: 'up'
    },
    {
      type: '张颖',
      location: '加拿大',
      completionRate: 92,
      avgTime: '38',
      changePercent: 2.5,
      status: 'up'
    },
    {
      type: '赵丽',
      location: '英国',
      completionRate: 88,
      avgTime: '35',
      changePercent: 3.3,
      status: 'down'
    }
  ]
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')
  const [data, setData] = useState<AnalyticsData>(mockData)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [statusDist, setStatusDist] = useState<Array<{ label: string; count: number; percentage: number }>>([])
  const [visaDist, setVisaDist] = useState<Array<{ visa_type: string; count: number; percentage: number }>>([])
  
  // 临时使用变量避免警告
  console.log('Time range:', timeRange)

  // 导出报表
  const handleExport = (format: 'pdf' | 'excel') => {
    toast.success(`正在导出${format.toUpperCase()}格式报表...`)
    setShowExportMenu(false)
  }

  // 拉取真实统计数据
  useEffect(() => {
    const load = async () => {
      try {
        const [overview, trend, avg, statusDistribution, visaTypeDistribution] = await Promise.all([
          statisticsService.getOverview(),
          statisticsService.getCaseTrend({ interval: 'month' }),
          statisticsService.getAverageProcessingTime().catch(() => null),
          statisticsService.getStatusDistribution().catch(() => []),
          statisticsService.getVisaTypeDistribution().catch(() => []),
        ])
        const mapped: AnalyticsData = {
          overview: {
            totalClients: overview.active_cases ?? overview.total_cases ?? mockData.overview.totalClients,
            totalClientsGrowth: mockData.overview.totalClientsGrowth,
            completionRate: Math.round(((overview.completed_cases ?? 0) / Math.max(1, overview.total_cases ?? 1)) * 100),
            completionRateGrowth: mockData.overview.completionRateGrowth,
            avgProcessTime: avg?.overall != null ? `${avg.overall.toFixed(1)}h` : mockData.overview.avgProcessTime,
            avgProcessTimeChange: mockData.overview.avgProcessTimeChange,
            passRate: mockData.overview.passRate,
            passRateGrowth: mockData.overview.passRateGrowth,
          },
          caseStatus: {
            labels: trend.labels,
            data: trend.datasets?.[0]?.data || mockData.caseStatus.data,
          },
          passRateByType: mockData.passRateByType,
          workProgress: mockData.workProgress,
        }
        setData(mapped)
        // 设置分布数据
        setStatusDist((statusDistribution as any[]).map((d: any) => ({
          label: d.label ?? String(d.status ?? ''),
          count: Number(d.count ?? 0),
          percentage: Number(d.percentage ?? 0),
        })))
        setVisaDist((visaTypeDistribution as any[]).map((d: any) => ({
          visa_type: d.visa_type ?? '未知',
          count: Number(d.count ?? 0),
          percentage: Number(d.percentage ?? 0),
        })))
      } catch (e) {
        // 失败则保留mock
      }
    }
    void load()
  }, [])

  // 获取案例状态趋势数据
  const getCaseStatusChart = () => {
    const maxValue = Math.max(...data.caseStatus.data)
    return data.caseStatus.data.map((value, index) => ({
      label: data.caseStatus.labels[index],
      value,
      height: (value / maxValue) * 100
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面标题和操作 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">数据分析</h1>
            </div>
            <div className="flex items-center space-x-3">
              {/* 时间范围选择 */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* 导出按钮 */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  导出报表
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    <button
                      onClick={() => handleExport('pdf')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      导出为PDF
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      导出为Excel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="px-4 py-6">
        <div className="mb-4 text-sm text-gray-500">今日 • 本周 • 本月 • 今年</div>
        
        <div className="grid grid-cols-4 gap-4">
          {/* 总客户数 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">总客户数</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                data.overview.totalClientsGrowth > 0 
                  ? "text-green-600 bg-green-50" 
                  : "text-red-600 bg-red-50"
              )}>
                + {data.overview.totalClientsGrowth}%
              </span>
            </div>
            <div className="text-2xl font-semibold">{data.overview.totalClients}</div>
            <p className="text-xs text-gray-500 mt-1">较上月新增{Math.round(data.overview.totalClients * data.overview.totalClientsGrowth / 100)}个</p>
          </div>

          {/* 完成率 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">完成率</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                data.overview.completionRateGrowth > 0 
                  ? "text-green-600 bg-green-50" 
                  : "text-red-600 bg-red-50"
              )}>
                + {data.overview.completionRateGrowth}%
              </span>
            </div>
            <div className="text-2xl font-semibold">{data.overview.completionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">14/15个文件已完成</p>
          </div>

          {/* 平均处理时间 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">平均处理时间</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                data.overview.avgProcessTimeChange < 0 
                  ? "text-green-600 bg-green-50" 
                  : "text-red-600 bg-red-50"
              )}>
                {data.overview.avgProcessTimeChange > 0 ? '+' : ''}{data.overview.avgProcessTimeChange}%
              </span>
            </div>
            <div className="text-2xl font-semibold">{data.overview.avgProcessTime}</div>
            <p className="text-xs text-gray-500 mt-1">客户平均填表时间</p>
          </div>

          {/* 通过率 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">通过率</span>
              <span className="text-xs text-gray-400">—</span>
            </div>
            <div className="text-2xl font-semibold">{data.overview.passRate}%</div>
            <p className="text-xs text-gray-500 mt-1">签证通过率持平</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 grid grid-cols-12 gap-4">
        {/* 左侧图表区域 */}
        <div className="col-span-8 space-y-4">
          {/* 案例趋势 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium text-gray-900">案例趋势</h3>
              <select className="text-xs border border-gray-300 rounded px-2 py-1">
                <option>最近6个月</option>
                <option>最近3个月</option>
                <option>最近1年</option>
              </select>
            </div>
            
            {/* 简单柱状图 */}
            <div className="relative h-48">
              <div className="absolute inset-0 flex items-end justify-between">
                {getCaseStatusChart().map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center mx-2">
                    <div 
                      className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                      style={{ height: `${item.height}%` }}
                    />
                    <div className="text-xs text-gray-500 mt-2">{item.label}</div>
                  </div>
                ))}
              </div>
              {/* Y轴刻度 */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 -ml-6">
                <span>60</span>
                <span>40</span>
                <span>20</span>
                <span>0</span>
              </div>
            </div>
            
            {/* 月度统计 */}
            <div className="mt-6 flex items-center justify-between text-xs">
              <span className="text-gray-500">本月: <span className="font-medium text-gray-900">42个</span></span>
              <span className="text-blue-600">156个累计</span>
            </div>
          </div>
        </div>

        {/* 右侧统计区域 */}
        <div className="col-span-4 space-y-4">
          {/* 案例状态分布 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">案例状态分布</h3>
            <div className="space-y-3">
              {(statusDist.length ? statusDist : [
                { label: '已完成', count: 144, percentage: 92 },
                { label: '进行中', count: 8, percentage: 5 },
                { label: '待处理', count: 3, percentage: 2 },
                { label: '已过期', count: 1, percentage: 1 },
              ]).map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium">{item.count} ({Math.round(item.percentage)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 签证类型分布 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">签证类型分布</h3>
            <div className="space-y-3">
              {(visaDist.length ? visaDist : [
                { visa_type: 'B1/B2', count: 120, percentage: 65 },
                { visa_type: 'F1', count: 20, percentage: 11 },
                { visa_type: 'H1B', count: 18, percentage: 10 },
                { visa_type: 'L1', count: 12, percentage: 7 },
                { visa_type: 'O1', count: 10, percentage: 7 },
              ]).map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{item.visa_type}</span>
                    <span className="font-medium">{item.count} ({Math.round(item.percentage)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 顾问工作进度表 */}
      <div className="px-4 pb-8">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">顾问工作进度表</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-xs text-gray-500">
                  <th className="px-6 py-3 text-left font-medium">顾问</th>
                  <th className="px-6 py-3 text-left font-medium">类型</th>
                  <th className="px-6 py-3 text-left font-medium">本月业绩</th>
                  <th className="px-6 py-3 text-left font-medium">完成率</th>
                  <th className="px-6 py-3 text-left font-medium">平均时长</th>
                  <th className="px-6 py-3 text-right font-medium">增长趋势</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.workProgress.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-gray-600">{item.type[0]}</span>
                        </div>
                        <span className="text-sm text-gray-900">{item.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{item.location}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{item.avgTime}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">{item.completionRate}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${item.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{item.changePercent}h</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn(
                        "inline-flex items-center text-xs font-medium",
                        item.status === 'up' ? "text-green-600" : 
                        item.status === 'down' ? "text-red-600" : 
                        "text-gray-600"
                      )}>
                        {item.status === 'up' ? '↑' : item.status === 'down' ? '↓' : '—'}
                        {Math.abs(item.changePercent)}%
                      </span>
                    </td>
                  </tr>
                ))}
                {/* 汇总行 */}
                <tr className="bg-gray-50 font-medium">
                  <td className="px-6 py-4 text-sm text-gray-900" colSpan={2}>合计</td>
                  <td className="px-6 py-4 text-sm text-gray-900">115</td>
                  <td className="px-6 py-4 text-sm text-gray-900">91.7%</td>
                  <td className="px-6 py-4 text-sm text-gray-900">2.5h</td>
                  <td className="px-6 py-4 text-right text-sm text-green-600">↑ 8.3%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}