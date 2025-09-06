import { api } from '../api'
import { toast } from 'sonner'

// Mock fetch
global.fetch = jest.fn()

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}))

// Mock router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('request method', () => {
    it('makes a successful GET request', async () => {
      const mockResponse = { data: 'test' }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await api.get('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/test',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('adds authorization header when token exists', async () => {
      localStorage.setItem('access_token', 'test-token')
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
      })

      await api.get('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      )
    })

    it('handles 401 unauthorized error', async () => {
      localStorage.setItem('access_token', 'expired-token')
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      })

      await expect(api.get('/test')).rejects.toThrow('Unauthorized')
      
      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
      expect(toast.error).toHaveBeenCalledWith('登录已过期，请重新登录')
    })

    it('handles 400 bad request error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Bad request' }),
      })

      await expect(api.post('/test', { invalid: 'data' })).rejects.toThrow('Bad request')
      
      expect(toast.error).toHaveBeenCalledWith('Bad request')
    })

    it('handles 500 server error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' }),
      })

      await expect(api.get('/test')).rejects.toThrow('Internal server error')
      
      expect(toast.error).toHaveBeenCalledWith('服务器错误，请稍后重试')
    })

    it('handles network error', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(api.get('/test')).rejects.toThrow('Network error')
      
      expect(toast.error).toHaveBeenCalledWith('网络错误，请检查网络连接')
    })
  })

  describe('HTTP methods', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })
    })

    it('makes POST request with data', async () => {
      const data = { name: 'test' }
      await api.post('/test', data)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        })
      )
    })

    it('makes PUT request with data', async () => {
      const data = { name: 'updated' }
      await api.put('/test/1', data)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(data),
        })
      )
    })

    it('makes PATCH request with data', async () => {
      const data = { status: 'active' }
      await api.patch('/test/1', data)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(data),
        })
      )
    })

    it('makes DELETE request', async () => {
      await api.delete('/test/1')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('handles query parameters in GET request', async () => {
      await api.get('/test', { params: { page: 1, limit: 10 } })

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/test?page=1&limit=10',
        expect.any(Object)
      )
    })
  })

  describe('Response handling', () => {
    it('returns null for 204 No Content', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      const result = await api.delete('/test/1')
      expect(result).toBeNull()
    })

    it('parses error details correctly', async () => {
      const errorDetails = [
        { loc: ['body', 'email'], msg: 'Invalid email' },
        { loc: ['body', 'password'], msg: 'Too short' },
      ]
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ detail: errorDetails }),
      })

      await expect(api.post('/test', {})).rejects.toThrow('Invalid email, Too short')
      
      expect(toast.error).toHaveBeenCalledWith('Invalid email, Too short')
    })
  })
})