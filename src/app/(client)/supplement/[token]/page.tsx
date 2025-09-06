/* eslint-disable jsx-a11y/alt-text */
'use client'

import { useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Check, X, Trash2, Image, AlertTriangle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// 文件类型定义
interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'success' | 'error'
  progress: number
  url?: string
  error?: string
}

// 补充材料项类型
interface SupplementItem {
  id: string
  name: string
  type: 'required' | 'optional'
  status: 'pending' | 'completed' | 'uploaded'
  requirement: string
  originalFile?: {
    name: string
    size: string
    type: string
  }
  files: UploadedFile[]
}

// 模拟补充材料数据
const mockSupplementItems: SupplementItem[] = [
  {
    id: 'passport_page',
    name: '护照首页',
    type: 'required',
    status: 'uploaded',
    requirement: '照片模糊，无法看清护照号码，请重新拍摄，确保所有文字都清晰可读，避免反光或阴影的地方拍摄。',
    originalFile: {
      name: 'passport_blurry.jpg',
      size: '2.1MB',
      type: '原上传文件'
    },
    files: []
  },
  {
    id: 'bank_statement',
    name: '银行流水',
    type: 'required', 
    status: 'pending',
    requirement: '需要补充最新月份',
    files: []
  }
]

export default function SupplementPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<SupplementItem[]>(mockSupplementItems)

  // 统计数据
  const stats = {
    completed: items.filter(item => item.status === 'completed').length,
    pending: items.filter(item => item.status === 'pending').length,
    uploaded: items.filter(item => item.status === 'uploaded').length
  }

  // 处理文件上传
  const handleFileUpload = async (files: File[], itemId: string) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      id: `${itemId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      progress: 0
    }))

    // 更新文件列表
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, files: [...item.files, ...newFiles], status: 'uploaded' }
        : item
    ))

    // 模拟上传过程
    for (const [index, file] of files.entries()) {
      const fileId = newFiles[index].id
      
      try {
        // 模拟进度
        const progressInterval = setInterval(() => {
          setItems(prev => prev.map(item => 
            item.id === itemId 
              ? {
                  ...item,
                  files: item.files.map(f => 
                    f.id === fileId && f.progress < 100
                      ? { ...f, progress: Math.min(f.progress + 10, 100) }
                      : f
                  )
                }
              : item
          ))
        }, 200)

        // 模拟上传完成
        await new Promise(resolve => setTimeout(resolve, 2000))
        clearInterval(progressInterval)
        
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? {
                ...item,
                files: item.files.map(f => 
                  f.id === fileId
                    ? { 
                        ...f, 
                        status: 'success',
                        progress: 100,
                        url: URL.createObjectURL(file)
                      }
                    : f
                )
              }
            : item
        ))
      } catch (error) {
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? {
                ...item,
                files: item.files.map(f => 
                  f.id === fileId
                    ? { ...f, status: 'error', error: '上传失败，请重试' }
                    : f
                )
              }
            : item
        ))
      }
    }
  }

  // 删除文件
  const handleRemoveFile = (itemId: string, fileId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            files: item.files.filter(f => f.id !== fileId),
            status: item.files.filter(f => f.id !== fileId).length === 0 ? 'pending' : 'uploaded'
          }
        : item
    ))
  }

  // 创建文件上传区域
  const FileUploadArea = ({ item }: { item: SupplementItem }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleFileUpload(acceptedFiles, item.id)
      }
    }, [item.id])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        'image/*': ['.jpg', '.jpeg', '.png'],
        'application/pdf': ['.pdf']
      },
      maxSize: 10 * 1024 * 1024, // 10MB
      multiple: true
    })

    const hasFiles = item.files.length > 0
    const isCompleted = item.files.some(f => f.status === 'success')
    console.log('Completion status:', isCompleted) // 临时保留变量

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
              {item.type === 'required' && (
                <span className="ml-2 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">必须处理</span>
              )}
            </div>
            <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
              <strong>问题反馈：</strong><br/>
              {item.requirement}
            </div>
            {item.originalFile && (
              <div className="mt-3 flex items-center text-xs text-gray-500">
                <Image className="w-4 h-4 mr-1" />
                <span>原护照 原上传文件</span>
                <span className="ml-2">{item.originalFile.name} · {item.originalFile.size}</span>
              </div>
            )}
          </div>
          <span className={cn(
            "text-xs px-2 py-1 rounded ml-4",
            item.status === 'completed' ? "bg-green-100 text-green-600" :
            item.status === 'uploaded' ? "bg-blue-100 text-blue-600" :
            "bg-orange-100 text-orange-600"
          )}>
            {item.status === 'completed' ? '已完成' :
             item.status === 'uploaded' ? '重新上传' : 
             '需补充'}
          </span>
        </div>

        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            {isDragActive ? '释放文件以上传' : `点击重新上传${item.name}`}
          </p>
          <p className="text-xs text-gray-500">
            要求：清晰、完整、光线充足
          </p>
          <div className="flex justify-center space-x-2 mt-3">
            <button className="px-3 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-800">
              拍照
            </button>
            <button className="px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50">
              选择文件
            </button>
          </div>
        </div>

        {/* 已上传文件列表 */}
        {hasFiles && (
          <div className="mt-4 space-y-2">
            {item.files.map(file => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  {file.type.startsWith('image/') ? (
                    <Image className="w-5 h-5 text-gray-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-gray-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {file.status === 'uploading' && (
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-200"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{file.progress}%</span>
                    </div>
                  )}
                  {file.status === 'success' && (
                    <Check className="w-5 h-5 text-green-600" />
                  )}
                  {file.status === 'error' && (
                    <div className="flex items-center space-x-2">
                      <X className="w-5 h-5 text-red-600" />
                      <span className="text-xs text-red-600">{file.error}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(item.id, file.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const handleSubmit = async () => {
    const pendingItems = items.filter(item => item.type === 'required' && item.status !== 'completed' && item.files.length === 0)
    
    if (pendingItems.length > 0) {
      toast.error('请完成所有必需的材料补充')
      return
    }

    setIsLoading(true)
    try {
      // 这里调用后端API提交补充材料
      toast.success('补充材料提交成功！')
      router.push(`/fill/${token}/success` as any)
    } catch (error) {
      toast.error('提交失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LS</span>
              </div>
              <div>
                <h1 className="text-lg font-medium">材料补充通知</h1>
                <p className="text-sm text-gray-500">案例 #PV202401001</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">剩余时间</p>
              <div className="flex items-center text-orange-600">
                <Clock className="w-4 h-4 mr-1" />
                <span className="font-medium">48小时</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 提醒信息 */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-900">您的材料需要补充</p>
              <p className="text-sm text-orange-700 mt-1">
                我们需要通过审核后续步骤材料，关联以下 {items.filter(i => i.type === 'required').length} 项 需要更新补充，请在48小时内完成上传。
              </p>
            </div>
          </div>
        </div>

        {/* 材料状态总览 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">材料状态总览</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-sm text-gray-500">已通过</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
              <p className="text-sm text-gray-500">需补充</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">{stats.uploaded}</div>
              <p className="text-sm text-gray-500">可选</p>
            </div>
          </div>
        </div>

        {/* 需要补充的材料 */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">需要补充的材料</h2>
          {items.map(item => (
            <FileUploadArea key={item.id} item={item} />
          ))}
        </div>

        {/* 提交按钮 */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-8 py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? '提交中...' : '提交补充材料'}
          </button>
        </div>
      </div>
    </div>
  )
}