'use client'

export default function Loading() {
  return (
    <div className="p-6">
      <div className="inline-flex items-center space-x-2 text-gray-500">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        <span className="text-sm">加载案例...</span>
      </div>
    </div>
  )
}


