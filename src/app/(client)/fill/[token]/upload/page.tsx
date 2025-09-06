'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { ChevronLeft, Save, Upload, FileText, Check, X, Trash2, Image, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ds160Service } from '@/services/ds160.service'

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
  filename?: string
  uploaded_at?: string
}

// 必需文件类型
const requiredDocuments = [
  {
    id: 'passport',
    name: '护照信息页',
    description: '护照个人信息页的清晰扫描件或照片',
    accept: '.jpg,.jpeg,.png,.pdf',
    maxSize: 5 * 1024 * 1024, // 5MB
    required: true
  },
  {
    id: 'photo',
    name: '证件照片',
    description: '白底彩色证件照，51mm x 51mm，近6个月内拍摄',
    accept: '.jpg,.jpeg,.png',
    maxSize: 2 * 1024 * 1024, // 2MB
    required: true
  },
  {
    id: 'employment',
    name: '在职证明',
    description: '公司出具的在职证明，需包含职位、薪资、入职时间等信息',
    accept: '.jpg,.jpeg,.png,.pdf',
    maxSize: 5 * 1024 * 1024, // 5MB
    required: true
  },
  {
    id: 'financial',
    name: '银行流水',
    description: '近6个月的银行流水，余额建议5万元以上',
    accept: '.jpg,.jpeg,.png,.pdf',
    maxSize: 10 * 1024 * 1024, // 10MB
    required: true
  },
  {
    id: 'other',
    name: '其他材料',
    description: '其他补充材料（选填）',
    accept: '.jpg,.jpeg,.png,.pdf',
    maxSize: 10 * 1024 * 1024, // 10MB
    required: false,
    multiple: true
  }
]

// 进度步骤配置
// 进度步骤配置
const steps = [
  { id: 1, label: '基本信息', path: 'basic-info' },
  { id: 2, label: '个人详情', path: 'personal-info-2' },
  { id: 3, label: '地址电话', path: 'address-phone' },
  { id: 4, label: '工作信息', path: 'work-info' },
  { id: 5, label: '家庭信息', path: 'family-info' },
  { id: 6, label: '旅行信息', path: 'travel-info' },
  { id: 7, label: '旅行同伴', path: 'travel-companions' },
  { id: 8, label: '美国历史', path: 'previous-us-travel' },
  { id: 9, label: '美国联系人', path: 'us-contact' },
  { id: 10, label: '上传文件', path: 'upload' },
]

export default function UploadPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile[]>>({})
  const [existingFiles, setExistingFiles] = useState<UploadedFile[]>([])

  // 加载已上传的文件
  useEffect(() => {
    loadExistingFiles()
    loadProgress()
  }, [])

  const loadExistingFiles = async () => {
    try {
      const files = await ds160Service.getUploadedFiles(token)
      setExistingFiles(files.map(file => ({
        id: file.id,
        name: file.filename,
        size: file.size,
        type: file.type,
        status: 'success' as const,
        progress: 100,
        url: file.url,
        filename: file.filename,
        uploaded_at: file.uploaded_at
      })))
      
      // 按类型分组现有文件
      const groupedFiles = files.reduce((acc, file) => {
        const type = file.type as keyof typeof acc
        if (!acc[type]) acc[type] = []
        acc[type].push({
          id: file.id,
          name: file.filename,
          size: file.size,
          type: file.type,
          status: 'success' as const,
          progress: 100,
          url: file.url,
          filename: file.filename,
          uploaded_at: file.uploaded_at
        })
        return acc
      }, {} as Record<string, UploadedFile[]>)
      
      setUploadedFiles(groupedFiles)
    } catch (error) {
      console.error('Failed to load existing files:', error)
    }
  }

  const loadProgress = async () => {
    try {
      const progress = await ds160Service.getFormProgress(token)
      setCompletedSteps(progress.completed_steps || [])
    } catch (error) {
      console.error('Failed to load progress:', error)
    }
  }

  // 处理文件上传
  const handleFileUpload = async (files: File[], documentId: string) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      id: `${documentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      progress: 0
    }))

    // 更新文件列表
    setUploadedFiles(prev => ({
      ...prev,
      [documentId]: [...(prev[documentId] || []), ...newFiles]
    }))

    // 上传文件
    for (const [index, file] of files.entries()) {
      const fileId = newFiles[index].id
      
      try {
        const result = await ds160Service.uploadFile(token, file, documentId as any)
        
        // 上传成功
        setUploadedFiles(prev => {
          const files = prev[documentId] || []
          const fileIndex = files.findIndex(f => f.id === fileId)
          if (fileIndex === -1) return prev

          const updatedFiles = [...files]
          updatedFiles[fileIndex] = {
            ...updatedFiles[fileIndex],
            id: result.id,
            status: 'success',
            progress: 100,
            url: result.url,
            filename: result.filename
          }

          return {
            ...prev,
            [documentId]: updatedFiles
          }
        })

        toast.success(`${file.name} 上传成功`)
      } catch (error) {
        // 上传失败
        setUploadedFiles(prev => {
          const files = prev[documentId] || []
          const fileIndex = files.findIndex(f => f.id === fileId)
          if (fileIndex === -1) return prev

          const updatedFiles = [...files]
          updatedFiles[fileIndex] = {
            ...updatedFiles[fileIndex],
            status: 'error',
            error: '上传失败，请重试'
          }

          return {
            ...prev,
            [documentId]: updatedFiles
          }
        })

        toast.error(`${file.name} 上传失败`)
        console.error('Upload error:', error)
      }
    }
  }

  // 删除文件
  const handleRemoveFile = async (documentId: string, fileId: string) => {
    try {
      // 如果是已上传的文件，从服务器删除
      const file = (uploadedFiles[documentId] || []).find(f => f.id === fileId)
      if (file && file.status === 'success' && file.id) {
        await ds160Service.deleteFile(token, file.id)
      }

      // 从本地状态移除
      setUploadedFiles(prev => ({
        ...prev,
        [documentId]: (prev[documentId] || []).filter(f => f.id !== fileId)
      }))

      toast.success('文件删除成功')
    } catch (error) {
      toast.error('删除文件失败')
      console.error('Delete error:', error)
    }
  }

  // 创建文件上传区域
  const FileUploadArea = ({ document }: { document: typeof requiredDocuments[0] }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
      // 验证文件
      const validFiles = acceptedFiles.filter(file => {
        if (file.size > document.maxSize) {
          toast.error(`${file.name} 文件大小超过限制`)
          return false
        }
        return true
      })

      if (validFiles.length > 0) {
        handleFileUpload(validFiles, document.id)
      }
    }, [document])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: document.accept.split(',').reduce((acc, ext) => {
        const mimeType = ext === '.pdf' ? 'application/pdf' : `image/${ext.replace('.', '')}`
        return {
          ...acc,
          [mimeType]: [ext]
        }
      }, {}),
      maxSize: document.maxSize,
      multiple: document.multiple
    })

    const files = uploadedFiles[document.id] || []
    const hasFiles = files.length > 0
    const isComplete = files.some(f => f.status === 'success')

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {document.name}
              {document.required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{document.description}</p>
          </div>
          {isComplete && (
            <div className="flex items-center text-green-600">
              <Check className="w-5 h-5" />
              <span className="text-xs ml-1">已上传</span>
            </div>
          )}
        </div>

        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
            hasFiles && "p-4"
          )}
        >
          <input {...getInputProps()} />
          {!hasFiles ? (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">
                {isDragActive ? '释放文件以上传' : '点击或拖拽文件到此处上传'}
              </p>
              <p className="text-xs text-gray-500">
                支持格式：{document.accept}，最大 {document.maxSize / 1024 / 1024}MB
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-500">
              + 继续添加文件
            </p>
          )}
        </div>

        {/* 已上传文件列表 */}
        {hasFiles && (
          <div className="mt-4 space-y-2">
            {files.map(file => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  {file.type.startsWith('image/') ? (
                    <Image className="w-5 h-5 text-gray-500" alt="" />
                  ) : (
                    <FileText className="w-5 h-5 text-gray-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                      {file.uploaded_at && (
                        <span className="ml-2">
                          {new Date(file.uploaded_at).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {file.status === 'uploading' && (
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
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
                    onClick={() => handleRemoveFile(document.id, file.id)}
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
    // 验证必需文件
    const missingDocuments = requiredDocuments
      .filter(doc => doc.required)
      .filter(doc => {
        const files = uploadedFiles[doc.id] || []
        return !files.some(f => f.status === 'success')
      })

    if (missingDocuments.length > 0) {
      toast.error(`请上传所有必需文件：${missingDocuments.map(d => d.name).join('、')}`)
      return
    }

    setIsLoading(true)
    try {
      // 提交表单
      await ds160Service.submitForm(token)
      toast.success('所有信息提交成功！')
      router.push(`/fill/${token}/success`)
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('提交失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 保存草稿（实际上文件已经实时上传了）
  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      // 文件上传是实时的，这里只是提供用户反馈
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success('文件已实时保存')
    } catch (error) {
      toast.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/fill/${token}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LS</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">DS-160表单填写</h1>
                  <p className="text-xs text-gray-500">美国非移民签证申请</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? '保存中...' : '保存草稿'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200"></div>
            <div className="absolute top-5 left-0 h-0.5 bg-blue-600" style={{ width: '100%' }}></div>
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center z-10",
                    index === 9 ? "bg-blue-600 text-white" :
                    completedSteps.includes(step.id) ? "bg-green-500 text-white" :
                    "bg-gray-200 text-gray-600"
                  )}>
                    {completedSteps.includes(step.id) ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <span className="mt-2 text-xs text-gray-600">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">第五步：上传文件</h2>
          
          {/* 提示信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">文件上传须知</p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• 请确保所有文件清晰可读，不要有遮挡或模糊</li>
                  <li>• 护照和身份证需要完整拍摄，包含所有信息</li>
                  <li>• 证件照片需符合美国签证照片要求</li>
                  <li>• 文件格式支持 JPG、PNG、PDF</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 文件上传区域 */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">必需文件</h3>
            {requiredDocuments
              .filter(doc => doc.required)
              .map(document => (
                <FileUploadArea key={document.id} document={document} />
              ))}

            <h3 className="text-lg font-medium text-gray-900 mt-10">可选文件</h3>
            {requiredDocuments
              .filter(doc => !doc.required)
              .map(document => (
                <FileUploadArea key={document.id} document={document} />
              ))}
          </div>

          {/* 按钮组 */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => router.push(`/fill/${token}/us-contact` as any)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              返回
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? '提交中...' : '提交申请'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}