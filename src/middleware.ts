import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// API响应追踪中间件
export function middleware(request: NextRequest) {
  // 仅在开发环境启用
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.next()
  }

  // 记录请求开始时间
  const startTime = Date.now()
  
  // 获取请求信息
  const { pathname } = request.nextUrl
  const method = request.method
  
  // 创建响应
  const response = NextResponse.next()
  
  // 添加响应时间头
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
  
  // 记录API调用
  if (pathname.startsWith('/api/')) {
    console.log(`[API] ${method} ${pathname} - ${Date.now() - startTime}ms`)
  }
  
  return response
}

// 配置中间件匹配路径
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * 1. /_next (Next.js 内部)
     * 2. /static (静态文件)
     * 3. /favicon.ico, /robots.txt (公共文件)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
}