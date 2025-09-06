'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { api, apiClient } from '@/lib/api'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// 表单验证schema
const loginSchema = z.object({
  email: z.string().min(1, '请输入邮箱').email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码').min(6, '密码至少6位'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    
    // 使用封装的 api.post，便于测试 mock
    try {
      const response = await api.post<{
        access_token: string
        refresh_token: string
        token_type: string
        user: {
          id: string
          email: string
          role: string
        }
      }>('/auth/login', {
        username: data.email,
        password: data.password,
      })

      // 保存认证信息
      localStorage.setItem('access_token', (response as any).access_token)
      localStorage.setItem('refresh_token', (response as any).refresh_token)
      localStorage.setItem('user', JSON.stringify((response as any).user))

      // 如果勾选了记住我，将信息存储更长时间
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true')
      }

      toast.success('登录成功')
      
      // 根据角色跳转
      if ((response as any).user.role === 'consultant' || (response as any).user.role === 'admin') {
        router.push('/dashboard')
      } else {
        router.push('/dashboard') // 暂时都跳转到dashboard
      }
    } catch (error: any) {
      console.error('Login error:', error)
      // 真实的错误处理，不使用Mock回退
      const errorMessage = error?.message || error?.response?.data?.detail || '登录失败，请检查用户名和密码'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Logo和品牌 */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">LS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PipelineVisa 流水签</h1>
        </div>
        <p className="mt-2 text-center text-sm text-gray-600">
          登录到您的账户
        </p>
      </div>

      {/* 登录卡片 */}
      <div className="w-full max-w-md">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8">
          <form className="space-y-6" noValidate onSubmit={handleSubmit(onSubmit)}>
            {/* 邮箱输入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                className={cn(
                  'appearance-none relative block w-full px-3 py-2.5 border rounded-md',
                  'placeholder-gray-400 text-gray-900',
                  'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent',
                  'transition duration-150 ease-in-out',
                  errors.email 
                    ? 'border-red-300 text-red-900 focus:ring-red-500' 
                    : 'border-gray-300'
                )}
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                {...register('password')}
                id="password"
                type="password"
                autoComplete="current-password"
                className={cn(
                  'appearance-none relative block w-full px-3 py-2.5 border rounded-md',
                  'placeholder-gray-400 text-gray-900',
                  'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent',
                  'transition duration-150 ease-in-out',
                  errors.password 
                    ? 'border-red-300 text-red-900 focus:ring-red-500' 
                    : 'border-gray-300'
                )}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* 记住我和忘记密码 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  记住我
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-gray-600 hover:text-gray-900">
                  忘记密码？
                </a>
              </div>
            </div>

            {/* 登录按钮 */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full flex justify-center items-center px-4 py-2.5',
                  'border border-transparent rounded-md shadow-sm',
                  'text-sm font-medium text-white bg-gray-900',
                  'hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition duration-150 ease-in-out'
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </button>
            </div>
          </form>

          {/* 注册链接 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              还没有账户？{' '}
              <Link href="#" className="font-medium text-gray-900 hover:text-gray-700">
                联系销售
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          © 2024 流水签. All rights reserved.
        </p>
      </div>
    </div>
  )
}