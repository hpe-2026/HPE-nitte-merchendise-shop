import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api/v1'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser(user) {
        set({ user })
      },

      setToken(token) {
        set({ token })
      },

      signup: async (email, password, name) => {
        set({ isLoading: true, error: null })
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
            email,
            password,
            name
          })

          const { data, tokens } = response.data
          const userData = {
            userId: data.user_id,
            email: data.email,
            name: data.name,
            role: data.role || 'user'
          }

          set({
            user: userData,
            token: tokens.access_token,
            refreshToken: tokens.refresh_token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })

          return { success: true, user: userData }
        } catch (err) {
          const errorMessage = err.response?.data?.message || 'Signup failed'
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false
          })
          return { success: false, error: errorMessage }
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email,
            password
          })

          const { data, tokens } = response.data
          const userData = {
            userId: data.user_id,
            email: data.email,
            name: data.name,
            role: data.role || 'user'
          }

          set({
            user: userData,
            token: tokens.access_token,
            refreshToken: tokens.refresh_token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })

          return { success: true, user: userData }
        } catch (err) {
          const errorMessage = err.response?.data?.message || 'Login failed'
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false
          })
          return { success: false, error: errorMessage }
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null
        })
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get()
        if (!refreshToken) {
          set({ isAuthenticated: false })
          return false
        }

        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken
          })

          set({ token: response.data.tokens.access_token })
          return true
        } catch (err) {
          set({ isAuthenticated: false, token: null, refreshToken: null })
          return false
        }
      },

      // For testing: restore from localStorage on init
      restoreSession: async () => {
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')

        if (token && userData) {
          try {
            const user = JSON.parse(userData)
            set({
              user,
              token,
              isAuthenticated: true
            })
            return true
          } catch (err) {
            set({ isAuthenticated: false })
            return false
          }
        }
        return false
      }
    }),
    {
      name: 'auth-store',
      // Optional: customize which fields to persist
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
