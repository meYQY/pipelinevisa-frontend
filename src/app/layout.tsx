import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { cn } from '@/lib/utils'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'production' ? 'https://liushuiqian.com' : 'http://localhost:3001'),
  title: {
    default: '流水签 - 专业签证申请管理系统',
    template: '%s | 流水签',
  },
  description: '为签证咨询机构量身打造的智能化签证申请管理平台，通过AI诊断和标准化流程，显著提升签证申请效率和成功率。',
  keywords: ['签证申请', '签证管理', 'B2B SaaS', '美国签证', 'DS-160'],
  authors: [{ name: '流水签团队' }],
  creator: '流水签',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://pipelinevisa.com',
    siteName: '流水签',
    title: '流水签 - 专业签证申请管理系统',
    description: '智能化签证申请管理平台',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PipelineVisa',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '流水签',
    description: '智能化签证申请管理平台',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={cn(inter.variable, 'font-sans')} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={cn('min-h-screen bg-background antialiased')}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}