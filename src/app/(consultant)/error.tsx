'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">出错了</h2>
        <p className="text-sm text-gray-600 mb-4">{error?.message || '页面加载失败，请稍后重试'}</p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  )
}


