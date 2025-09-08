"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { MessageCircle, Users, Phone, LogOut, Search, Plus, MoreVertical } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ChatList } from "@/components/chat-list"
import { ChatWindow } from "@/components/chat-window"
import { CreateGroupDialog } from "@/components/create-group-dialog"
import { CallInterface } from "@/components/call-interface"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useChat } from "@/hooks/use-chat"
import { useWebRTC } from "@/hooks/use-webrtc"
import { useNotifications } from "@/hooks/use-notifications"

export function ChatApp() {
  const { user, signOut } = useAuth()
  const { chats, activeChat, setActiveChat, createNewChat, loading } = useChat()
  const { simulateIncomingCall } = useWebRTC()
  const { requestPermission, permission } = useNotifications()
  const [activeView, setActiveView] = useState<"chats" | "groups" | "calls">("chats")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (user && permission === "default") {
      setTimeout(() => {
        requestPermission()
      }, 2000)
    }
  }, [user, permission, requestPermission])

  const filteredChats = chats.filter((chat) => {
    const chatName =
      chat.name ||
      (chat.type === "direct"
        ? chat.participants.find((p) => p.user_id !== user?.id)?.user.display_name || "Chat"
        : "Gruppo")
    return chatName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleDemoIncomingCall = () => {
    const randomChat = chats.find((chat) => chat.type === "direct")
    if (randomChat) {
      const otherParticipant = randomChat.participants.find((p) => p.user_id !== user?.id)
      if (otherParticipant) {
        simulateIncomingCall(
          otherParticipant.user_id,
          otherParticipant.user.display_name,
          "video",
          otherParticipant.user.avatar_url,
        )
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Caricamento VladoChat...</h2>
            <p className="text-muted-foreground">Connessione al database...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Call Interface Overlay */}
      <CallInterface />

      {/* Sidebar */}
      <div className="w-full md:w-80 border-r border-border flex flex-col md:flex">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>
                  {user?.user_metadata?.display_name?.charAt(0) || user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <h2 className="font-semibold">{user?.user_metadata?.display_name || user?.email}</h2>
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {activeView === "groups" ? (
                <CreateGroupDialog
                  trigger={
                    <Button variant="ghost" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                />
              ) : (
                <Button variant="ghost" size="icon" onClick={createNewChat}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleDemoIncomingCall} title="Simula chiamata in arrivo">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4">
          <div className="flex space-x-1 bg-muted rounded-lg p-1">
            <Button
              variant={activeView === "chats" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setActiveView("chats")}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Chat</span>
            </Button>
            <Button
              variant={activeView === "groups" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setActiveView("groups")}
            >
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Gruppi</span>
            </Button>
            <Button
              variant={activeView === "calls" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setActiveView("calls")}
            >
              <Phone className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Chiamate</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          <ChatList
            chats={filteredChats}
            activeChat={activeChat}
            onChatSelect={setActiveChat}
            activeView={activeView}
          />
        </div>
      </div>

      {/* Main Chat Area - Hidden on mobile when no chat selected */}
      <div className={`flex-1 flex-col ${activeChat ? "flex" : "hidden md:flex"}`}>
        {activeChat ? (
          <ChatWindow chat={activeChat} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Benvenuto in VladoChat</h3>
              <p className="text-muted-foreground">Seleziona una chat per iniziare a messaggiare</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
