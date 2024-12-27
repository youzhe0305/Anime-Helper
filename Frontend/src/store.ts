import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { registerUser, searchUser, login, updatePassword } from '@/api/auth'

// Anime 相關的 interfaces
interface Anime {
  id: number
  Name: string
  Score: number
  Category: string[]
  Description: string
  Type: string
  Episodes: number
  AirDate: string
  EndDate?: string
  Image_URL: string
}
interface SearchState {
  animeIds: number[]
  searchKeyword: string
  sortMethod: string
  setSearchResults: (animeIds: number[], keyword: string, sort: string) => void
  clearSearchResults: () => void
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      animeIds: [],
      searchKeyword: "",
      sortMethod: "score_desc",
      setSearchResults: (animeIds, keyword, sort) => 
        set({ animeIds, searchKeyword: keyword, sortMethod: sort }),
      clearSearchResults: () => 
        set({ animeIds: [], searchKeyword: "", sortMethod: "score_desc" }),
    }),
    {
      name: 'anime-search-storage',
    }
  )
)

// Auth 相關的 interfaces
interface User {
  user_id: string
  username: string
  email: string
  token: string
}

interface AuthState {
  user: User | null
  isLoggedIn: boolean
  login: (username: string, password: string) => Promise<void | "error">
  logout: () => void
  register: (username: string, email: string, password: string) => Promise<void>
  updatePassword: (oldPW: string, newPW: string) => Promise<void>
}

type UserResponse = {
  id: string
  username: string
  email: string
  token: string
}

// 使用 persist 中間件來持久化存儲 AuthStore
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      login: async (username, password) => {
        try {
          const data = await login(username, password)
          if (data.error) {
            console.error('Login error:', data.error)
            return "error"
          }

          const result: UserResponse = await searchUser(username)
          
          set({
            user: {
              user_id: result.id,
              username: result.username,
              email: result.email,
              token: result.token,
            },
            isLoggedIn: true,
          })
        } catch (error) {
          console.error('Login failed:', error)
          return "error"
        }
      },
      
      logout: () => {
        set({
          user: null,
          isLoggedIn: false,
        })
        // 可以在這裡清除其他 store 的數據
        useSearchStore.getState().clearSearchResults()
      },

      register: async (username, email, password) => {
        try {
          const data = await registerUser(username, email, password)
          if (data.error) {
            throw new Error(data.error)
          }
          
          const { user } = data
          set({
            user: {
              user_id: user.id,
              username: user.username,
              email: user.email,
              token: user.token || '', // 如果 API 返回 token 的話
            },
            isLoggedIn: true, // 註冊成功後直接登入
          })
        } catch (error) {
          console.error('Registration failed:', error)
          throw error
        }
      },

      updatePassword: async (oldPW, newPW) => {
        try {
          const data = await updatePassword(oldPW, newPW)
          if (data.error) {
            throw new Error(data.error)
          }
          
          // 密碼更新成功，但不需要在前端存儲密碼
          // 可以選擇是否要更新 token
          set((state) => ({
            user: state.user ? {
              ...state.user,
              // 如果 API 返回新的 token，可以在這裡更新
              // token: data.newToken
            } : null
          }))
        } catch (error) {
          console.error('Password update failed:', error)
          throw error
        }
      },
    }),
    {
      name: 'auth-storage', // localStorage 的 key
      storage: createJSONStorage(() => localStorage),
      // 可以選擇只持久化某些字段
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
)