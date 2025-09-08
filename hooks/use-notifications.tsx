"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useAuth } from "./use-auth"
import { toast } from "@/hooks/use-toast"

interface NotificationContextType {
  permission: NotificationPermission
  requestPermission: () => Promise<NotificationPermission>
  showNotification: (title: string, options?: NotificationOptions) => void
  isSupported: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported("Notification" in window)

    if ("Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return "denied"

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === "granted") {
        toast({
          title: "Notifiche attivate",
          description: "Riceverai notifiche per i nuovi messaggi",
        })
      }

      return result
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      return "denied"
    }
  }, [isSupported])

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== "granted") return

      try {
        const notification = new Notification(title, {
          icon: "/icon-192x192.png",
          badge: "/icon-96x96.png",
          tag: "vladochat-message",
          renotify: true,
          requireInteraction: false,
          silent: false,
          ...options,
        })

        // Auto close after 5 seconds
        setTimeout(() => {
          notification.close()
        }, 5000)

        // Handle click to focus window
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      } catch (error) {
        console.error("Error showing notification:", error)
      }
    },
    [isSupported, permission],
  )

  // Auto-request permission when user logs in
  useEffect(() => {
    if (user && isSupported && permission === "default") {
      // Show a toast asking for permission
      toast({
        title: "Attiva le notifiche",
        description: "Ricevi notifiche per i nuovi messaggi",
        action: {
          altText: "Attiva",
          onClick: requestPermission,
        },
      })
    }
  }, [user, isSupported, permission, requestPermission])

  return (
    <NotificationContext.Provider value={{ permission, requestPermission, showNotification, isSupported }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
