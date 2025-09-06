'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Briefcase, 
  Link as LinkIcon, 
  Users, 
  BarChart3, 
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface User {
  id: string
  username: string
  full_name: string
  email: string
  role: string
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { href: '/cases', label: '案例管理', icon: Briefcase },
  { href: '/links', label: '链接管理', icon: LinkIcon },
  { href: '/clients', label: '客户管理', icon: Users },
  { href: '/analytics', label: '数据分析', icon: BarChart3 },
  { href: '/settings', label: '设置', icon: Settings },
]

export default function ConsultantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    // 获取用户信息
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    } else {
      // 未登录，跳转到登录页
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    toast.success('已退出登录')
    router.push('/login')
  }

  if (!user) {
    return null // 或者显示加载状态
  }

  // 统一使用带导航的布局，仪表盘也纳入壳层，确保与设计稿一致

  // 其他页面使用带导航栏的布局
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 左侧Logo和导航 */}
            <div className="flex items-center">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">流</span>
                </div>
                <span className="hidden md:block text-lg font-semibold text-gray-900">流水签</span>
              </Link>

              {/* 桌面端导航 */}
              <nav className="hidden lg:flex items-center space-x-1 ml-10">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || 
                    (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href as any}
                      className={cn(
                        'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* 右侧操作区 */}
            <div className="flex items-center space-x-4">
              {/* 通知按钮 */}
              <Link 
                href="/notifications"
                className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Link>

              {/* 用户菜单 */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-500">{user.role === 'admin' ? '管理员' : '顾问'}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {/* 下拉菜单 */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      href="/settings/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      个人设置
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      退出登录
                    </button>
                  </div>
                )}
              </div>

              {/* 移动端菜单按钮 */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* 移动端导航菜单 */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-200">
            <nav className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.href}
                    href={item.href as any}
                    className={cn(
                      'flex items-center px-3 py-2 text-base font-medium rounded-md',
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </header>

      {/* 主内容区 */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}