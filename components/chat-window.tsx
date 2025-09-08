"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type Chat, useChat } from "@/hooks/use-chat"
import { Phone, Video, MoreVertical, Send, Mic, Smile, Wifi, WifiOff, Users } from "lucide-react"
import { MessageBubble } from "@/components/message-bubble"
import { useAuth } from "@/hooks/use-auth"
import { useRealtime } from "@/hooks/use-realtime"
import { TypingIndicator } from "@/components/typing-indicator"
import { GroupInfoDialog } from "@/components/group-info-dialog"
import { useWebRTC } from "@/hooks/use-webrtc"
import { MediaAttachmentMenu } from "@/components/media-attachment-menu"
import { VoiceRecorder } from "@/components/voice-recorder"
import { useMedia } from "@/hooks/use-media"

interface ChatWindowProps {
  chat: Chat
}

export function ChatWindow({ chat }: ChatWindowProps) {
  const { user } = useAuth()
  const { sendMessage, sendMediaMessage, sendVoiceMessage } = useChat()
  const { startTyping, stopTyping, getTypingUsersForChat, connectionStatus } = useRealtime()
  const { startCall } = useWebRTC()
  const { uploadFile } = useMedia()
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chat.messages])

  const handleSendMessage = () => {
    if (message.trim()) {
      if (isTyping && user) {
        stopTyping(user.id, user.name, chat.id)
        setIsTyping(false)
      }

      sendMessage(chat.id, message.trim())
      setMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessage(value)

    if (!user) return

    if (value.trim() && !isTyping) {
      setIsTyping(true)
      startTyping(user.id, user.name, chat.id)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false)
        stopTyping(user.id, user.name, chat.id)
      }
    }, 1000)

    if (!value.trim() && isTyping) {
      setIsTyping(false)
      stopTyping(user.id, user.name, chat.id)
    }
  }

  const handleAudioCall = () => {
    if (!chat.isGroup) {
      const participantId = chat.participants.find((p) => p !== user?.id) || ""
      startCall(participantId, chat.name, "audio", chat.avatar)
    }
  }

  const handleVideoCall = () => {
    if (!chat.isGroup) {
      const participantId = chat.participants.find((p) => p !== user?.id) || ""
      startCall(participantId, chat.name, "video", chat.avatar)
    }
  }

  const handleFileSelect = async (file: File) => {
    try {
      const mediaFile = await uploadFile(file)
      sendMediaMessage(chat.id, file, mediaFile.url)
    } catch (error) {
      console.error("Error sending media:", error)
    }
  }

  const handleVoiceRecording = (recording: any) => {
    sendVoiceMessage(chat.id, recording)
    setShowVoiceRecorder(false)
  }

  const handleStartVoiceRecording = () => {
    setShowVoiceRecorder(true)
  }

  const handleCancelVoiceRecording = () => {
    setShowVoiceRecorder(false)
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (isTyping && user) {
        stopTyping(user.id, user.name, chat.id)
      }
    }
  }, [])

  const typingUsers = getTypingUsersForChat(chat.id).filter((u) => u.userId !== user?.id)

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={chat.avatar || "/placeholder.svg"} />
            <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold">{chat.name}</h3>
              {chat.isGroup && <Users className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">
                {chat.isGroup ? `${chat.participants.length} partecipanti` : chat.isOnline ? "Online" : "Offline"}
              </p>
              <div className="flex items-center">
                {connectionStatus === "connected" ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : connectionStatus === "connecting" ? (
                  <Wifi className="h-3 w-3 text-yellow-500 animate-pulse" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAudioCall}
            disabled={chat.isGroup}
            title={chat.isGroup ? "Chiamate non disponibili nei gruppi" : "Chiamata audio"}
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVideoCall}
            disabled={chat.isGroup}
            title={chat.isGroup ? "Videochiamate non disponibili nei gruppi" : "Videochiamata"}
          >
            <Video className="h-4 w-4" />
          </Button>
          {chat.isGroup ? (
            <GroupInfoDialog chat={chat} />
          ) : (
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chat.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === user?.id} showSender={chat.isGroup} />
        ))}

        {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-background/95 backdrop-blur relative">
        {showVoiceRecorder && (
          <VoiceRecorder onSendRecording={handleVoiceRecording} onCancel={handleCancelVoiceRecording} />
        )}

        <div className="flex items-end space-x-2">
          <MediaAttachmentMenu onFileSelect={handleFileSelect} onVoiceRecording={handleVoiceRecording} />

          <div className="flex-1 relative">
            <Input
              placeholder="Scrivi un messaggio..."
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="pr-10"
            />
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8">
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          {message.trim() ? (
            <Button onClick={handleSendMessage} size="icon" className="mb-1">
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className={`mb-1 ${isRecording ? "text-red-500" : ""}`}
              onClick={handleStartVoiceRecording}
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
