'use client'

import { redirect } from 'next/navigation'

export default function ClientPortalPage() {
  // 客户端门户首页，重定向到登录页
  redirect('/login')
}