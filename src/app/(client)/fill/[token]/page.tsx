'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Shield, Clock } from 'lucide-react'
import { clientService, type TokenValidation } from '@/services/client.service'
import { toast } from 'sonner'

export default function ClientWelcomePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [loading, setLoading] = useState(true)
  const [validation, setValidation] = useState<TokenValidation | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  useEffect(() => {
    validateToken()
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (validation?.expires_at) {
      const timer = setInterval(() => {
        const now = new Date().getTime()
        const expiry = new Date(validation.expires_at!).getTime()
        const remaining = expiry - now

        if (remaining <= 0) {
          setTimeRemaining('已过期')
          clearInterval(timer)
        } else {
          const hours = Math.floor(remaining / (1000 * 60 * 60))
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
          setTimeRemaining(`${hours}小时${minutes}分钟`)
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [validation])

  const validateToken = async () => {
    try {
      const result = await clientService.validateToken(token)
      if (result.valid) {
        setValidation(result)
      } else {
        setValidation(null)
      }
    } catch (error) {
      console.error('Token validation failed:', error)
      setValidation(null)
      toast.error('链接验证失败，请联系您的顾问')
    } finally {
      setLoading(false)
    }
  }

  const handleStart = () => {
    if (validation?.case_id) {
      sessionStorage.setItem('client_token', token)
      sessionStorage.setItem('case_id', validation.case_id)
      router.push(`/fill/${token}/basic-info`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!validation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">链接验证失败</h1>
          <p className="text-gray-600 mb-6">链接无效或已过期</p>
          <p className="text-sm text-gray-500">
            如有疑问，请联系您的顾问<br />
            王明 · 138****5678
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部品牌栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">LS</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">流水签</h1>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">欢迎！</h1>
          <p className="text-lg text-gray-600">让我们开始您的美国签证申请之旅</p>
        </div>

        {/* 申请人信息卡片 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-gray-700">
                {validation.applicant_name?.[0]}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                申请人：{validation.applicant_name}
              </h2>
              <p className="text-sm text-gray-500">{validation.visa_type}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            您的顾问 王明 已为您创建了申请档案
          </p>
        </div>

        {/* 流程步骤 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-6">接下来的步骤</h3>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-medium">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">填写个人信息</h4>
                <p className="text-sm text-gray-600 mt-1">
                  包括基本信息、护照信息、工作信息等
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-600 text-sm font-medium">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">上传所需文件</h4>
                <p className="text-sm text-gray-600 mt-1">
                  护照、照片、在职证明等材料
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-600 text-sm font-medium">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">确认并提交</h4>
                <p className="text-sm text-gray-600 mt-1">
                  检查信息无误后提交给顾问
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 预计时间和提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                预计需要 15-20 分钟完成
              </p>
              <p className="text-sm text-blue-700 mt-1">
                您可以随时保存进度，稍后继续
              </p>
              {timeRemaining && (
                <p className="text-sm text-blue-700 mt-1">
                  链接有效期剩余：{timeRemaining}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 开始按钮 */}
        <button
          onClick={handleStart}
          className="w-full py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-lg"
        >
          开始填写
        </button>

        {/* 联系信息 */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            如有疑问，请联系您的顾问<br />
            王明 · 138****5678
          </p>
        </div>

        {/* 隐私提示 */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>您的信息将被加密传输和存储</span>
          </div>
        </div>
      </div>
    </div>
  )
}