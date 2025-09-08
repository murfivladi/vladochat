"use client"

import { useEffect, useState } from "react"
import { useNotifications } from "./use-notifications"
import type { Message } from "./use-chat"

export interface TypingUser {
  userId: string
  userName: string
  chatId: string
}

export interface OnlineStatus {
  userId: string
  isOnline: boolean
  lastSeen?: Date
}

// Simulated real-time events system
class RealtimeManager {
  private listeners: Map<string, Set<Function>> = new Map()
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map()

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback)
  }

  emit(event: string, data: any) {
    // Simulate network delay
    setTimeout(
      () => {
        this.listeners.get(event)?.forEach((callback) => callback(data))
      },
      Math.random() * 100 + 50,
    )
  }

  // Simulate typing with auto-stop after 3 seconds
  startTyping(userId: string, userName: string, chatId: string) {
    const key = `${userId}-${chatId}`

    // Clear existing timeout
    if (this.typingTimeouts.has(key)) {
      clearTimeout(this.typingTimeouts.get(key)!)
    }

    this.emit("user-typing", { userId, userName, chatId, isTyping: true })

    // Auto-stop typing after 3 seconds
    const timeout = setTimeout(() => {
      this.emit("user-typing", { userId, userName, chatId, isTyping: false })
      this.typingTimeouts.delete(key)
    }, 3000)

    this.typingTimeouts.set(key, timeout)
  }

  stopTyping(userId: string, userName: string, chatId: string) {
    const key = `${userId}-${chatId}`

    if (this.typingTimeouts.has(key)) {
      clearTimeout(this.typingTimeouts.get(key)!)
      this.typingTimeouts.delete(key)
    }

    this.emit("user-typing", { userId, userName, chatId, isTyping: false })
  }

  updateOnlineStatus(userId: string, isOnline: boolean) {
    this.emit("user-status", { userId, isOnline, lastSeen: isOnline ? undefined : new Date() })
  }

  sendMessage(message: Message, chatId: string) {
    this.emit("new-message", { message, chatId })

    // Simulate message status updates
    setTimeout(() => {
      this.emit("message-status", { messageId: message.id, status: "delivered" })
    }, 1000)

    setTimeout(
      () => {
        this.emit("message-status", { messageId: message.id, status: "read" })
      },
      2000 + Math.random() * 3000,
    )
  }
}

const realtimeManager = new RealtimeManager()

export function useRealtime() {
  const { showNotification, permission } = useNotifications()
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineStatus>>(new Map())
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connected")

  useEffect(() => {
    // Listen for typing events
    const handleTyping = (data: { userId: string; userName: string; chatId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        if (data.isTyping) {
          // Add or update typing user
          const filtered = prev.filter((user) => !(user.userId === data.userId && user.chatId === data.chatId))
          return [...filtered, { userId: data.userId, userName: data.userName, chatId: data.chatId }]
        } else {
          // Remove typing user
          return prev.filter((user) => !(user.userId === data.userId && user.chatId === data.chatId))
        }
      })
    }

    // Listen for online status changes
    const handleStatusChange = (data: OnlineStatus) => {
      setOnlineUsers((prev) => {
        const newMap = new Map(prev)
        newMap.set(data.userId, data)
        return newMap
      })
    }

    const handleNewMessage = (data: { message: Message; chatId: string }) => {
      // Show notification if page is not visible and user is not the sender
      if (document.hidden && data.message.senderId !== "user1" && permission === "granted") {
        showNotification(`Nuovo messaggio da ${data.message.senderName}`, {
          body: data.message.text,
          tag: `chat-${data.chatId}`,
        })
      }
    }

    realtimeManager.on("user-typing", handleTyping)
    realtimeManager.on("user-status", handleStatusChange)
    realtimeManager.on("new-message", handleNewMessage)

    // Simulate connection status changes
    const statusInterval = setInterval(() => {
      const statuses: Array<"connected" | "connecting" | "disconnected"> = [
        "connected",
        "connected",
        "connected",
        "connecting",
      ]
      setConnectionStatus(statuses[Math.floor(Math.random() * statuses.length)])
    }, 30000)

    return () => {
      realtimeManager.off("user-typing", handleTyping)
      realtimeManager.off("user-status", handleStatusChange)
      realtimeManager.off("new-message", handleNewMessage)
      clearInterval(statusInterval)
    }
  }, [showNotification, permission])

  const startTyping = (userId: string, userName: string, chatId: string) => {
    realtimeManager.startTyping(userId, userName, chatId)
  }

  const stopTyping = (userId: string, userName: string, chatId: string) => {
    realtimeManager.stopTyping(userId, userName, chatId)
  }

  const updateOnlineStatus = (userId: string, isOnline: boolean) => {
    realtimeManager.updateOnlineStatus(userId, isOnline)
  }

  const sendMessage = (message: Message, chatId: string) => {
    realtimeManager.sendMessage(message, chatId)
  }

  const getTypingUsersForChat = (chatId: string) => {
    return typingUsers.filter((user) => user.chatId === chatId)
  }

  const isUserOnline = (userId: string) => {
    return onlineUsers.get(userId)?.isOnline ?? false
  }

  const getUserLastSeen = (userId: string) => {
    return onlineUsers.get(userId)?.lastSeen
  }

  return {
    typingUsers,
    onlineUsers,
    connectionStatus,
    startTyping,
    stopTyping,
    updateOnlineStatus,
    sendMessage,
    getTypingUsersForChat,
    isUserOnline,
    getUserLastSeen,
    realtimeManager,
  }
}
