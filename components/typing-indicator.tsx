"use client"

import type { TypingUser } from "@/hooks/use-realtime"

interface TypingIndicatorProps {
  users: TypingUser[]
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].userName} sta scrivendo...`
    } else if (users.length === 2) {
      return `${users[0].userName} e ${users[1].userName} stanno scrivendo...`
    } else {
      return `${users[0].userName} e altri ${users.length - 1} stanno scrivendo...`
    }
  }

  return (
    <div className="flex items-center space-x-2 px-4 py-2">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span className="text-sm text-muted-foreground italic">{getTypingText()}</span>
    </div>
  )
}
