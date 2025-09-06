import { redirect } from 'next/navigation'

export default function Home() {
  // 首页重定向到登录页
  redirect('/login')
}