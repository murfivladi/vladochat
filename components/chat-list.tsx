"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Chat } from "@/hooks/use-chat"
import { useRealtime } from "@/hooks/use-realtime"
import { formatDistanceToNow } from "date-fns"
import { it } from "date-fns/locale"
import { Users, Phone, Video } from "lucide-react"

interface ChatListProps {
  chats: Chat[]
  activeChat: Chat | null
  onChatSelect: (chat: Chat) => void
  activeView: "chats" | "groups" | "calls"
}

export function ChatList({ chats, activeChat, onChatSelect, activeView }: ChatListProps) {
  const { getTypingUsersForChat, isUserOnline, getUserLastSeen } = useRealtime()

  const filteredChats = chats.filter((chat) => {
    if (activeView === "groups") return chat.isGroup
    if (activeView === "chats") return !chat.isGroup
    return true
  })

  if (activeView === "calls") {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {filteredChats.slice(0, 3).map((chat) => (
            <div key={chat.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
              <Avatar className="h-10 w-10">
                <AvatarImage src={chat.avatar || "/placeholder.svg"} />
                <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{chat.name}</p>
                  <div className="flex space-x-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Video className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {Math.random() > 0.5 ? "Chiamata in entrata" : "Chiamata in uscita"} •{" "}
                  {formatDistanceToNow(new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24), {
                    addSuffix: true,
                    locale: it,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (filteredChats.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <div className="mb-4">
          {activeView === "groups" ? (
            <Users className="h-12 w-12 mx-auto opacity-50" />
          ) : (
            <Phone className="h-12 w-12 mx-auto opacity-50" />
          )}
        </div>
        <p>Nessun {activeView === "groups" ? "gruppo" : "chat"} ancora</p>
        <p className="text-sm">Inizia una nuova conversazione!</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {filteredChats.map((chat) => {
        const typingUsers = getTypingUsersForChat(chat.id)
        const isOnline = !chat.isGroup && isUserOnline(chat.participants.find((p) => p !== "user1") || "")
        const lastSeen = !chat.isGroup ? getUserLastSeen(chat.participants.find((p) => p !== "user1") || "") : undefined

        return (
          <div
            key={chat.id}
            className={`flex items-center space-x-3 p-3 mx-2 rounded-lg cursor-pointer transition-colors ${
              activeChat?.id === chat.id ? "bg-primary/10" : "hover:bg-muted/50"
            }`}
            onClick={() => onChatSelect(chat)}
          >
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={chat.avatar || "/placeholder.svg"} />
                <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {!chat.isGroup && isOnline && (
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
              )}
              {chat.isGroup && (
                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                  <Users className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium truncate">{chat.name}</p>
                {chat.lastMessage && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(chat.lastMessage.timestamp, { addSuffix: true, locale: it })}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground truncate">
                  {typingUsers.length > 0 ? (
                    <span className="text-primary italic">
                      {typingUsers.length === 1
                        ? `${typingUsers[0].userName} sta scrivendo...`
                        : "Qualcuno sta scrivendo..."}
                    </span>
                  ) : chat.lastMessage ? (
                    <>
                      {chat.isGroup && chat.lastMessage.senderName !== "Tu" && (
                        <span className="font-medium">{chat.lastMessage.senderName}: </span>
                      )}
                      {chat.lastMessage.text}
                    </>
                  ) : !chat.isGroup && isOnline ? (
                    "Online"
                  ) : !chat.isGroup && lastSeen ? (
                    `Visto ${formatDistanceToNow(lastSeen, { addSuffix: true, locale: it })}`
                  ) : (
                    "Nessun messaggio"
                  )}
                </p>

                {chat.unreadCount > 0 && (
                  <Badge variant="default" className="h-5 min-w-5 text-xs px-1.5">
                    {chat.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
