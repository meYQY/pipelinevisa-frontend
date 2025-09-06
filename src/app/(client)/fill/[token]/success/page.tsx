'use client'

import { CheckCircle, Download, MessageCircle, Clock, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function SuccessPage() {
  const [formData, setFormData] = useState<any>(null)

  useEffect(() => {
    // 获取保存的表单数据
    const savedData = sessionStorage.getItem('ds160_form')
    if (savedData) {
      setFormData(JSON.parse(savedData))
    }
  }, [])

  const handleDownload = () => {
    // 生成确认文件
    if (formData) {
      const dataStr = JSON.stringify(formData, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const exportFileDefaultName = `visa_application_${new Date().getTime()}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    }
  }

  const handleContactConsultant = () => {
    // 跳转到联系顾问页面或打开聊天窗口
    toast.info('顾问会尽快与您联系')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LS</span>
              </div>
              <span className="text-lg font-medium">流水签</span>
            </div>
          </div>
        </div>
      </div>

      {/* 成功消息 */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            申请提交成功！
          </h1>
          
          <p className="text-lg text-gray-600 mb-2">
            您的签证申请材料已成功提交
          </p>
          
          <p className="text-sm text-gray-500">
            申请编号：#2024{Math.floor(Math.random() * 100000)}
          </p>
        </div>

        {/* 下一步流程 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">接下来的流程</h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">1</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">材料审核</h3>
                <p className="text-sm text-gray-600">
                  您的顾问将在24小时内审核您提交的材料，确保所有信息准确无误
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>预计用时：1-2个工作日</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-semibold">2</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">材料补充</h3>
                <p className="text-sm text-gray-600">
                  如需补充材料，顾问会通过邮件或电话与您联系
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>如需补充：1-3个工作日</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-semibold">3</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">翻译与填表</h3>
                <p className="text-sm text-gray-600">
                  专业团队将您的材料翻译成英文，并填写DS-160表格
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>预计用时：2-3个工作日</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-semibold">4</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">预约面签</h3>
                <p className="text-sm text-gray-600">
                  为您预约最早的面签时间，并提供面签指导
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>预计用时：1-2个工作日</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 重要提示 */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
          <h3 className="font-medium text-amber-900 mb-3">重要提示</h3>
          <ul className="space-y-2 text-sm text-amber-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>请保持电话畅通，顾问可能会与您联系确认信息</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>请定期查看邮箱，重要通知会通过邮件发送</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>如有紧急问题，可随时联系您的专属顾问</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>请妥善保管您的申请编号，便于查询进度</span>
            </li>
          </ul>
        </div>

        {/* 行动按钮 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>下载申请确认</span>
          </button>
          
          <button
            onClick={handleContactConsultant}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span>联系顾问</span>
          </button>
        </div>

        {/* 顾问信息 */}
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-600 mb-2">您的专属顾问</p>
          <div className="flex items-center justify-center space-x-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-gray-700">王</span>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">王明</p>
              <p className="text-sm text-gray-500">高级签证顾问</p>
              <p className="text-sm text-gray-500">138****5678</p>
            </div>
          </div>
        </div>

        {/* 返回首页 */}
        <div className="text-center mt-12">
          <a
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            返回首页
            <ArrowRight className="w-4 h-4 ml-1" />
          </a>
        </div>
      </div>
    </div>
  )
}

// 添加toast导入
import { toast } from 'sonner'