"use client"

import type { Message } from "@/hooks/use-chat"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, CheckCheck, Info } from "lucide-react"
import { MediaMessage } from "@/components/media-message"
import { formatDistanceToNow } from "date-fns"
import { it } from "date-fns/locale"

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showSender?: boolean
}

export function MessageBubble({ message, isOwn, showSender }: MessageBubbleProps) {
  if (message.type === "system") {
    return (
      <div className="flex justify-center my-4">
        <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1 rounded-full">
          <Info className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{message.text}</span>
        </div>
      </div>
    )
  }

  if (message.type !== "text" && message.mediaUrl) {
    const mediaFile = {
      id: message.id,
      name: message.mediaName || message.text,
      type: message.type as "image" | "video" | "audio" | "document",
      url: message.mediaUrl,
      size: message.mediaSize || 0,
      uploadedAt: message.timestamp,
      uploadedBy: message.senderId,
    }

    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}>
        <div className={`flex items-end space-x-2 max-w-[70%] ${isOwn ? "flex-row-reverse space-x-reverse" : ""}`}>
          {!isOwn && showSender && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={`/abstract-geometric-shapes.png?height=32&width=32&query=${message.senderName}`} />
              <AvatarFallback className="text-xs">{message.senderName.charAt(0)}</AvatarFallback>
            </Avatar>
          )}

          <div className="space-y-1">
            {showSender && !isOwn && <p className="text-xs font-medium text-primary px-2">{message.senderName}</p>}

            <MediaMessage media={mediaFile} isOwn={isOwn} />

            <div
              className={`flex items-center justify-end space-x-1 px-2 ${
                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}
            >
              <span className="text-xs">{formatDistanceToNow(message.timestamp, { addSuffix: true, locale: it })}</span>
              {isOwn && (
                <div className="flex">
                  {message.status === "sent" && <Check className="h-3 w-3" />}
                  {message.status === "delivered" && <CheckCheck className="h-3 w-3" />}
                  {message.status === "read" && <CheckCheck className="h-3 w-3 text-blue-500" />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}>
      <div className={`flex items-end space-x-2 max-w-[70%] ${isOwn ? "flex-row-reverse space-x-reverse" : ""}`}>
        {!isOwn && showSender && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={`/abstract-geometric-shapes.png?height=32&width=32&query=${message.senderName}`} />
            <AvatarFallback className="text-xs">{message.senderName.charAt(0)}</AvatarFallback>
          </Avatar>
        )}

        <div
          className={`relative px-4 py-2 rounded-2xl ${
            isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
          }`}
        >
          {showSender && !isOwn && <p className="text-xs font-medium mb-1 text-primary">{message.senderName}</p>}

          <p className="text-sm leading-relaxed">{message.text}</p>

          <div
            className={`flex items-center justify-end space-x-1 mt-1 ${
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
            }`}
          >
            <span className="text-xs">{formatDistanceToNow(message.timestamp, { addSuffix: true, locale: it })}</span>
            {isOwn && (
              <div className="flex">
                {message.status === "sent" && <Check className="h-3 w-3" />}
                {message.status === "delivered" && <CheckCheck className="h-3 w-3" />}
                {message.status === "read" && <CheckCheck className="h-3 w-3 text-blue-500" />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
