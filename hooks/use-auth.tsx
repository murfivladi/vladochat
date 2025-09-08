"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  isOnline: boolean
  lastSeen: Date
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem("vladochat_user")
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      setUser({ ...userData, isOnline: true, lastSeen: new Date() })
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    const users = JSON.parse(localStorage.getItem("vladochat_users") || "[]")
    const existingUser = users.find((u: any) => u.email === email && u.password === password)

    if (existingUser) {
      const userData: User = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        avatar: existingUser.avatar,
        isOnline: true,
        lastSeen: new Date(),
      }
      setUser(userData)
      localStorage.setItem("vladochat_user", JSON.stringify(userData))
      return true
    }
    return false
  }

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    // Simulate API call
    const users = JSON.parse(localStorage.getItem("vladochat_users") || "[]")
    const existingUser = users.find((u: any) => u.email === email)

    if (existingUser) {
      return false // User already exists
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password, // In production, this would be hashed
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      createdAt: new Date(),
    }

    users.push(newUser)
    localStorage.setItem("vladochat_users", JSON.stringify(users))

    const userData: User = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      avatar: newUser.avatar,
      isOnline: true,
      lastSeen: new Date(),
    }
    setUser(userData)
    localStorage.setItem("vladochat_user", JSON.stringify(userData))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("vladochat_user")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
