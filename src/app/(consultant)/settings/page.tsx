'use client'

import { useState } from 'react'
import { 
  Building, Users, CreditCard, FileText, 
  Plus, Edit, Trash2, Crown, Shield
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// 团队成员类型
interface TeamMember {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Admin' | 'Member'
  joinedAt: string
  casesThisMonth: number
  avatar?: string
  status: 'active' | 'invited' | 'inactive'
}

// 套餐信息
interface PlanInfo {
  name: string
  expiryDate: string
  caseLimit: number
  usedCases: number
  memberLimit: number
  usedMembers: number
  storageLimit: number
  usedStorage: number
}

// 模拟组织信息
const mockOrgInfo = {
  name: '北京签证咨询中心',
  code: 'ORG-BJ-001',
  createdAt: '2023-06-15',
  admin: '李总'
}

// 模拟套餐信息
const mockPlanInfo: PlanInfo = {
  name: '专业版',
  expiryDate: '2024-06-14',
  caseLimit: 50,
  usedCases: 42,
  memberLimit: 5,
  usedMembers: 4,
  storageLimit: 100,
  usedStorage: 32
}

// 模拟团队成员
const mockMembers: TeamMember[] = [
  {
    id: '1',
    name: '李总',
    email: 'lizhong@visa-center.cn',
    role: 'Owner',
    joinedAt: '2023-06-15',
    casesThisMonth: 15,
    status: 'active'
  },
  {
    id: '2',
    name: '王明',
    email: 'wangming@visa-center.cn',
    role: 'Admin',
    joinedAt: '2023-07-02',
    casesThisMonth: 12,
    status: 'active'
  },
  {
    id: '3',
    name: '张颖',
    email: 'zhangying@visa-center.cn',
    role: 'Member',
    joinedAt: '2023-08-15',
    casesThisMonth: 8,
    status: 'active'
  },
  {
    id: '4',
    name: '刘强',
    email: 'liuqiang@visa-center.cn',
    role: 'Member',
    joinedAt: '2023-09-01',
    casesThisMonth: 7,
    status: 'invited'
  }
]

// 侧边栏菜单项
const sidebarItems = [
  { key: 'organization', label: '组织信息', icon: Building },
  { key: 'team', label: '团队成员', icon: Users },
  { key: 'usage', label: '用量统计', icon: FileText },
  { key: 'billing', label: '套餐与计费', icon: CreditCard }
]

export default function OrganizationSettings() {
  const [activeTab, setActiveTab] = useState('organization')
  const [members, setMembers] = useState<TeamMember[]>(mockMembers)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Member'>('Member')

  // 邀请成员
  const handleInviteMember = () => {
    if (!inviteEmail) {
      toast.error('请输入邮箱地址')
      return
    }

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      joinedAt: new Date().toISOString().split('T')[0],
      casesThisMonth: 0,
      status: 'invited'
    }

    setMembers(prev => [...prev, newMember])
    setShowInviteModal(false)
    setInviteEmail('')
    toast.success('邀请已发送')
  }

  // 移除成员
  const handleRemoveMember = (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    if (member?.role === 'Owner') {
      toast.error('无法移除组织所有者')
      return
    }

    setMembers(prev => prev.filter(m => m.id !== memberId))
    toast.success('已移除团队成员')
  }

  // 角色徽章
  const RoleBadge = ({ role }: { role: string }) => {
    const roleConfig = {
      Owner: { color: 'bg-purple-100 text-purple-600', icon: Crown },
      Admin: { color: 'bg-blue-100 text-blue-600', icon: Shield },
      Member: { color: 'bg-gray-100 text-gray-600', icon: null }
    }

    const config = roleConfig[role as keyof typeof roleConfig]
    const Icon = config?.icon

    return (
      <span className={cn('inline-flex items-center px-2 py-1 text-xs font-medium rounded', config.color)}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {role}
      </span>
    )
  }

  // 进度条组件
  const ProgressBar = ({ used, total, label, unit = '' }: { used: number; total: number; label: string; unit?: string }) => {
    const percentage = (used / total) * 100
    
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">{label}</span>
          <span className="text-sm font-medium">{used} / {total} {unit}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              percentage > 80 ? "bg-red-500" : 
              percentage > 60 ? "bg-yellow-500" : "bg-black"
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {percentage > 80 ? `剩余${total - used}${unit}` : `剩余${(total * (100 - percentage) / 100).toFixed(0)}${unit}`}
        </p>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'organization':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">组织信息</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-1">组织名称</label>
                <p className="text-base text-gray-900">{mockOrgInfo.name}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">组织代码</label>
                <p className="text-base text-gray-900">{mockOrgInfo.code}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">创建时间</label>
                <p className="text-base text-gray-900">{mockOrgInfo.createdAt}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">管理员</label>
                <p className="text-base text-gray-900">{mockOrgInfo.admin}</p>
              </div>
            </div>
          </div>
        )

      case 'team':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">团队成员</h2>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                邀请成员
              </button>
            </div>

            <div className="overflow-hidden bg-white rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      成员
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      角色
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      加入时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      本月案例
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map(member => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-gray-600">{member.name[0]}</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RoleBadge role={member.role} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.joinedAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.casesThisMonth}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {member.role === 'Owner' ? (
                          <span className="text-gray-400">不可操作</span>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'usage':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">当前套餐</h2>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{mockPlanInfo.name}</h3>
                  <p className="text-sm text-gray-500">有效期至 {mockPlanInfo.expiryDate}</p>
                </div>
                <button className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
                  升级套餐
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ProgressBar 
                  used={mockPlanInfo.usedCases} 
                  total={mockPlanInfo.caseLimit} 
                  label="本月案例配额"
                />
                <ProgressBar 
                  used={mockPlanInfo.usedMembers} 
                  total={mockPlanInfo.memberLimit} 
                  label="团队成员数量"
                  unit="位"
                />
                <ProgressBar 
                  used={mockPlanInfo.usedStorage} 
                  total={mockPlanInfo.storageLimit} 
                  label="存储空间"
                  unit="GB"
                />
              </div>
            </div>
          </div>
        )

      case 'billing':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">套餐与计费</h2>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">计费管理</h3>
                <p className="text-gray-600 mb-6">管理您的套餐订阅和付费账单</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">基础版</h4>
                    <p className="text-2xl font-bold text-gray-900 mb-2">¥299<span className="text-sm font-normal text-gray-500">/月</span></p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 最多20个案例</li>
                      <li>• 3个团队成员</li>
                      <li>• 基础AI服务</li>
                      <li>• 邮件支持</li>
                    </ul>
                  </div>
                  
                  <div className="border-2 border-black rounded-lg p-4 relative">
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-black text-white px-3 py-1 text-xs font-medium rounded-full">当前套餐</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">专业版</h4>
                    <p className="text-2xl font-bold text-gray-900 mb-2">¥899<span className="text-sm font-normal text-gray-500">/月</span></p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 最多100个案例</li>
                      <li>• 10个团队成员</li>
                      <li>• 高级AI服务</li>
                      <li>• 优先客服支持</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">企业版</h4>
                    <p className="text-2xl font-bold text-gray-900 mb-2">¥2999<span className="text-sm font-normal text-gray-500">/月</span></p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 无限案例数量</li>
                      <li>• 无限团队成员</li>
                      <li>• 定制AI服务</li>
                      <li>• 专属客户经理</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-8">
                  <button className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors mr-3">
                    升级套餐
                  </button>
                  <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    查看账单历史
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* 左侧导航 */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h1 className="text-lg font-semibold text-gray-900">设置</h1>
          </div>
          <nav className="px-4">
            {sidebarItems.map(item => {
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={cn(
                    'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors mb-1',
                    activeTab === item.key
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 p-8">
          {renderContent()}
        </div>
      </div>

      {/* 邀请成员弹窗 */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">邀请新成员</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱地址
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="member@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  角色权限
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'Admin' | 'Member')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Member">成员</option>
                  <option value="Admin">管理员</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleInviteMember}
                className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800"
              >
                发送邀请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}