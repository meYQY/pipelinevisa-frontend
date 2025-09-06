import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import LoginPage from '@/app/(auth)/login/page'
import { api } from '@/lib/api'
import { toast } from 'sonner'

// Mock modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/api', () => ({
  api: {
    post: jest.fn(),
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('LoginPage', () => {
  const mockPush = jest.fn()
  const mockRouter = {
    push: mockPush,
  }

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter)
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('renders login form correctly', () => {
    render(<LoginPage />)
    
    // Check for main elements
    expect(screen.getByText('PipelineVisa 流水签')).toBeInTheDocument()
    expect(screen.getByText('登录到您的账户')).toBeInTheDocument()
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument()
    expect(screen.getByLabelText('密码')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument()
    expect(screen.getByText('记住我')).toBeInTheDocument()
    expect(screen.getByText('忘记密码？')).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const submitButton = screen.getByRole('button', { name: '登录' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('请输入邮箱')).toBeInTheDocument()
      expect(screen.getByText('请输入密码')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('邮箱')
    await user.type(emailInput, 'invalid-email')
    
    const submitButton = screen.getByRole('button', { name: '登录' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('请输入有效的邮箱地址')).toBeInTheDocument()
    })
  })

  it('shows validation error for short password', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('邮箱')
    const passwordInput = screen.getByLabelText('密码')
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, '123')
    
    const submitButton = screen.getByRole('button', { name: '登录' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('密码至少6位')).toBeInTheDocument()
    })
  })

  it('handles successful login for consultant', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'Bearer',
      user: {
        id: '1',
        username: 'consultant@example.com',
        email: 'consultant@example.com',
        full_name: 'Test Consultant',
        role: 'consultant',
      },
    }
    
    ;(api.post as jest.Mock).mockResolvedValueOnce(mockResponse)
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('邮箱')
    const passwordInput = screen.getByLabelText('密码')
    const rememberMeCheckbox = screen.getByRole('checkbox', { name: '记住我' })
    
    await user.type(emailInput, 'consultant@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(rememberMeCheckbox)
    
    const submitButton = screen.getByRole('button', { name: '登录' })
    await user.click(submitButton)
    
    await waitFor(() => {
      // Check API was called correctly
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        username: 'consultant@example.com',
        password: 'password123',
      })
      
      // Check tokens were saved
      expect(localStorage.getItem('access_token')).toBe('mock-access-token')
      expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token')
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.user))
      expect(localStorage.getItem('remember_me')).toBe('true')
      
      // Check success toast
      expect(toast.success).toHaveBeenCalledWith('登录成功')
      
      // Check navigation
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles successful login for admin', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'Bearer',
      user: {
        id: '1',
        username: 'admin@example.com',
        email: 'admin@example.com',
        full_name: 'Test Admin',
        role: 'admin',
      },
    }
    
    ;(api.post as jest.Mock).mockResolvedValueOnce(mockResponse)
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('邮箱')
    const passwordInput = screen.getByLabelText('密码')
    
    await user.type(emailInput, 'admin@example.com')
    await user.type(passwordInput, 'password123')
    
    const submitButton = screen.getByRole('button', { name: '登录' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles login error', async () => {
    const user = userEvent.setup()
    const mockError = new Error('Invalid credentials')
    
    ;(api.post as jest.Mock).mockRejectedValueOnce(mockError)
    
    // Mock console.error to avoid noise in test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('邮箱')
    const passwordInput = screen.getByLabelText('密码')
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    
    const submitButton = screen.getByRole('button', { name: '登录' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Login error:', mockError)
      expect(mockPush).not.toHaveBeenCalled()
    })
    
    consoleErrorSpy.mockRestore()
  })

  it('shows loading state during login', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response
    ;(api.post as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('邮箱')
    const passwordInput = screen.getByLabelText('密码')
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    
    const submitButton = screen.getByRole('button', { name: '登录' })
    await user.click(submitButton)
    
    // Check loading state
    expect(screen.getByText('登录中...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('remember me checkbox works correctly', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const rememberMeCheckbox = screen.getByRole('checkbox', { name: '记住我' })
    
    expect(rememberMeCheckbox).not.toBeChecked()
    
    await user.click(rememberMeCheckbox)
    expect(rememberMeCheckbox).toBeChecked()
    
    await user.click(rememberMeCheckbox)
    expect(rememberMeCheckbox).not.toBeChecked()
  })
})