'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5分钟
            gcTime: 10 * 60 * 1000, // 10分钟
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: true,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster 
        position="top-center"
        richColors
        closeButton
        duration={4000}
        className="font-sans"
      />
      {/* React Query DevTools - 仅在开发环境显示 */}
    </QueryClientProvider>
  )
}