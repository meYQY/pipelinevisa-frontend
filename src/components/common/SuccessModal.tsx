'use client'

import { CheckCircle, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  caseNumber?: string
  link?: string
  linkExpiry?: string
  onViewCase?: () => void
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  caseNumber,
  link,
  linkExpiry,
  onViewCase
}: SuccessModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    if (!link) return
    
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('链接已复制到剪贴板')
      
      // 2秒后重置复制状态
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('复制失败，请手动复制')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* 模态框 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 内容 */}
          <div className="px-6 py-8 text-center">
            {/* 成功图标 */}
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            {/* 标题 */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>

            {/* 案例编号 */}
            {caseNumber && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">案例编号</p>
                <p className="text-base font-medium text-gray-900">{caseNumber}</p>
              </div>
            )}

            {/* 采集链接 */}
            {link && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">采集链接</p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 truncate">
                    {link}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded transition-colors",
                      copied 
                        ? "bg-green-600 text-white" 
                        : "bg-black text-white hover:bg-gray-800"
                    )}
                  >
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
                {linkExpiry && (
                  <p className="text-xs text-gray-500 mt-2">
                    链接有效期：{linkExpiry}
                  </p>
                )}
              </div>
            )}

            {/* 底部按钮 */}
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                关闭
              </button>
              {onViewCase && (
                <button
                  onClick={onViewCase}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
                >
                  查看案例
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}