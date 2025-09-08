"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { useRealtime } from "./use-realtime"

export interface Message {
  id: string
  text: string
  senderId: string
  senderName: string
  timestamp: Date
  type: "text" | "image" | "audio" | "video" | "document" | "system"
  status: "sent" | "delivered" | "read"
  mediaUrl?: string
  mediaName?: string
  mediaSize?: number
}

export interface GroupMember {
  id: string
  name: string
  avatar?: string
  role: "admin" | "member"
  joinedAt: Date
}

export interface Chat {
  id: string
  name: string
  avatar?: string
  description?: string
  lastMessage?: Message
  unreadCount: number
  isGroup: boolean
  participants: string[]
  groupMembers?: GroupMember[]
  groupAdmins?: string[]
  createdBy?: string
  createdAt?: Date
  isOnline?: boolean
  lastSeen?: Date
  messages: Message[]
}

const mockChats: Chat[] = [
  {
    id: "1",
    name: "Marco Rossi",
    avatar: "/thoughtful-man.png",
    unreadCount: 2,
    isGroup: false,
    participants: ["user1", "marco"],
    isOnline: true,
    messages: [
      {
        id: "1",
        text: "Ciao! Come stai?",
        senderId: "marco",
        senderName: "Marco Rossi",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        type: "text",
        status: "read",
      },
      {
        id: "2",
        text: "Tutto bene, grazie! Tu?",
        senderId: "user1",
        senderName: "Tu",
        timestamp: new Date(Date.now() - 1000 * 60 * 3),
        type: "text",
        status: "delivered",
      },
    ],
  },
  {
    id: "2",
    name: "Famiglia",
    avatar: "/diverse-family-portrait.png",
    description: "Chat di famiglia per organizzare eventi e condividere momenti",
    unreadCount: 0,
    isGroup: true,
    participants: ["user1", "mamma", "papa", "sorella"],
    groupMembers: [
      { id: "user1", name: "Tu", role: "admin", joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) },
      {
        id: "mamma",
        name: "Mamma",
        avatar: "/diverse-woman-portrait.png",
        role: "admin",
        joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      },
      {
        id: "papa",
        name: "Papà",
        avatar: "/thoughtful-man.png",
        role: "member",
        joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
      },
      { id: "sorella", name: "Sorella", role: "member", joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20) },
    ],
    groupAdmins: ["user1", "mamma"],
    createdBy: "user1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    messages: [
      {
        id: "3",
        text: "Ci vediamo domenica per pranzo?",
        senderId: "mamma",
        senderName: "Mamma",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        type: "text",
        status: "read",
      },
    ],
  },
  {
    id: "3",
    name: "Giulia Bianchi",
    avatar: "/diverse-woman-portrait.png",
    unreadCount: 1,
    isGroup: false,
    participants: ["user1", "giulia"],
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 30),
    messages: [
      {
        id: "4",
        text: "Hai visto il film ieri sera?",
        senderId: "giulia",
        senderName: "Giulia Bianchi",
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        type: "text",
        status: "sent",
      },
    ],
  },
]

export function useChat() {
  const { user } = useAuth()
  const { sendMessage: sendRealtimeMessage, realtimeManager } = useRealtime()
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<Chat | null>(null)

  useEffect(() => {
    // Carica chat dal localStorage o usa mock data
    const savedChats = localStorage.getItem("vladochat-chats")
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats)
      // Converti timestamp strings back to Date objects
      const chatsWithDates = parsedChats.map((chat: any) => ({
        ...chat,
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
        lastSeen: chat.lastSeen ? new Date(chat.lastSeen) : undefined,
        createdAt: chat.createdAt ? new Date(chat.createdAt) : undefined,
        groupMembers: chat.groupMembers?.map((member: any) => ({
          ...member,
          joinedAt: new Date(member.joinedAt),
        })),
      }))
      setChats(chatsWithDates)
    } else {
      setChats(mockChats)
    }
  }, [])

  useEffect(() => {
    const handleNewMessage = (data: { message: Message; chatId: string }) => {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === data.chatId
            ? {
                ...chat,
                messages: [...chat.messages, data.message],
                lastMessage: data.message,
              }
            : chat,
        ),
      )
    }

    const handleMessageStatus = (data: { messageId: string; status: "sent" | "delivered" | "read" }) => {
      setChats((prevChats) =>
        prevChats.map((chat) => ({
          ...chat,
          messages: chat.messages.map((msg) => (msg.id === data.messageId ? { ...msg, status: data.status } : msg)),
        })),
      )
    }

    realtimeManager.on("new-message", handleNewMessage)
    realtimeManager.on("message-status", handleMessageStatus)

    return () => {
      realtimeManager.off("new-message", handleNewMessage)
      realtimeManager.off("message-status", handleMessageStatus)
    }
  }, [realtimeManager])

  useEffect(() => {
    // Salva chat nel localStorage
    if (chats.length > 0) {
      localStorage.setItem("vladochat-chats", JSON.stringify(chats))
    }
  }, [chats])

  const sendMessage = (chatId: string, text: string) => {
    if (!user) return

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      senderId: user.id,
      senderName: user.name,
      timestamp: new Date(),
      type: "text",
      status: "sent",
    }

    sendRealtimeMessage(newMessage, chatId)

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: newMessage,
            }
          : chat,
      ),
    )

    // Simula risposta automatica dopo 2 secondi
    setTimeout(() => {
      const responses = ["Interessante!", "Capisco", "Dimmi di più", "Perfetto!", "Va bene", "Ci sentiamo dopo"]

      const chat = chats.find((c) => c.id === chatId)
      if (chat && !chat.isGroup) {
        const otherParticipant = chat.participants.find((p) => p !== user.id)
        const autoReply: Message = {
          id: (Date.now() + 1).toString(),
          text: responses[Math.floor(Math.random() * responses.length)],
          senderId: otherParticipant || "bot",
          senderName: chat.name,
          timestamp: new Date(),
          type: "text",
          status: "delivered",
        }

        sendRealtimeMessage(autoReply, chatId)
      }
    }, 2000)
  }

  const sendMediaMessage = (chatId: string, file: File, mediaUrl: string) => {
    if (!user) return

    const getMessageType = (fileType: string): Message["type"] => {
      if (fileType.startsWith("image/")) return "image"
      if (fileType.startsWith("video/")) return "video"
      if (fileType.startsWith("audio/")) return "audio"
      return "document"
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      text: file.name,
      senderId: user.id,
      senderName: user.name,
      timestamp: new Date(),
      type: getMessageType(file.type),
      status: "sent",
      mediaUrl,
      mediaName: file.name,
      mediaSize: file.size,
    }

    sendRealtimeMessage(newMessage, chatId)

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: newMessage,
            }
          : chat,
      ),
    )
  }

  const sendVoiceMessage = (chatId: string, recording: any) => {
    if (!user) return

    const newMessage: Message = {
      id: Date.now().toString(),
      text: `Messaggio vocale (${Math.floor(recording.duration / 60)}:${(recording.duration % 60).toString().padStart(2, "0")})`,
      senderId: user.id,
      senderName: user.name,
      timestamp: new Date(),
      type: "audio",
      status: "sent",
      mediaUrl: recording.url,
      mediaName: `voice_${Date.now()}.webm`,
      mediaSize: recording.blob.size,
    }

    sendRealtimeMessage(newMessage, chatId)

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: newMessage,
            }
          : chat,
      ),
    )
  }

  const createNewChat = () => {
    const names = ["Alessandro", "Francesca", "Luca", "Valentina", "Matteo", "Chiara"]
    const randomName = names[Math.floor(Math.random() * names.length)]

    const newChat: Chat = {
      id: Date.now().toString(),
      name: randomName,
      avatar: `/placeholder.svg?height=40&width=40&query=${randomName}`,
      unreadCount: 0,
      isGroup: false,
      participants: [user?.id || "user1", randomName.toLowerCase()],
      isOnline: Math.random() > 0.5,
      messages: [],
    }

    setChats((prev) => [newChat, ...prev])
    setActiveChat(newChat)
  }

  const createGroup = (name: string, description: string, selectedMembers: string[]) => {
    if (!user) return

    const groupId = Date.now().toString()
    const allParticipants = [user.id, ...selectedMembers]

    const groupMembers: GroupMember[] = allParticipants.map((participantId, index) => ({
      id: participantId,
      name: participantId === user.id ? user.name : `Utente ${index}`,
      role: participantId === user.id ? "admin" : "member",
      joinedAt: new Date(),
    }))

    const systemMessage: Message = {
      id: `${groupId}-created`,
      text: `${user.name} ha creato il gruppo`,
      senderId: "system",
      senderName: "Sistema",
      timestamp: new Date(),
      type: "system",
      status: "read",
    }

    const newGroup: Chat = {
      id: groupId,
      name,
      description,
      avatar: `/placeholder.svg?height=40&width=40&query=group-${name}`,
      unreadCount: 0,
      isGroup: true,
      participants: allParticipants,
      groupMembers,
      groupAdmins: [user.id],
      createdBy: user.id,
      createdAt: new Date(),
      messages: [systemMessage],
    }

    setChats((prev) => [newGroup, ...prev])
    setActiveChat(newGroup)
  }

  const addMemberToGroup = (chatId: string, memberId: string, memberName: string) => {
    if (!user) return

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === chatId && chat.isGroup) {
          const isAlreadyMember = chat.participants.includes(memberId)
          if (isAlreadyMember) return chat

          const newMember: GroupMember = {
            id: memberId,
            name: memberName,
            role: "member",
            joinedAt: new Date(),
          }

          const systemMessage: Message = {
            id: `${Date.now()}-member-added`,
            text: `${user.name} ha aggiunto ${memberName} al gruppo`,
            senderId: "system",
            senderName: "Sistema",
            timestamp: new Date(),
            type: "system",
            status: "read",
          }

          return {
            ...chat,
            participants: [...chat.participants, memberId],
            groupMembers: [...(chat.groupMembers || []), newMember],
            messages: [...chat.messages, systemMessage],
            lastMessage: systemMessage,
          }
        }
        return chat
      }),
    )
  }

  const removeMemberFromGroup = (chatId: string, memberId: string) => {
    if (!user) return

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === chatId && chat.isGroup) {
          const member = chat.groupMembers?.find((m) => m.id === memberId)
          if (!member) return chat

          const systemMessage: Message = {
            id: `${Date.now()}-member-removed`,
            text: `${member.name} ha lasciato il gruppo`,
            senderId: "system",
            senderName: "Sistema",
            timestamp: new Date(),
            type: "system",
            status: "read",
          }

          return {
            ...chat,
            participants: chat.participants.filter((p) => p !== memberId),
            groupMembers: chat.groupMembers?.filter((m) => m.id !== memberId),
            messages: [...chat.messages, systemMessage],
            lastMessage: systemMessage,
          }
        }
        return chat
      }),
    )
  }

  const promoteToAdmin = (chatId: string, memberId: string) => {
    if (!user) return

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === chatId && chat.isGroup) {
          const member = chat.groupMembers?.find((m) => m.id === memberId)
          if (!member || member.role === "admin") return chat

          const systemMessage: Message = {
            id: `${Date.now()}-promoted`,
            text: `${member.name} è ora amministratore del gruppo`,
            senderId: "system",
            senderName: "Sistema",
            timestamp: new Date(),
            type: "system",
            status: "read",
          }

          return {
            ...chat,
            groupMembers: chat.groupMembers?.map((m) => (m.id === memberId ? { ...m, role: "admin" } : m)),
            groupAdmins: [...(chat.groupAdmins || []), memberId],
            messages: [...chat.messages, systemMessage],
            lastMessage: systemMessage,
          }
        }
        return chat
      }),
    )
  }

  const updateGroupInfo = (chatId: string, name: string, description: string) => {
    if (!user) return

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === chatId && chat.isGroup) {
          const changes = []
          if (chat.name !== name) changes.push(`nome in "${name}"`)
          if (chat.description !== description) changes.push("descrizione")

          if (changes.length > 0) {
            const systemMessage: Message = {
              id: `${Date.now()}-group-updated`,
              text: `${user.name} ha modificato ${changes.join(" e ")} del gruppo`,
              senderId: "system",
              senderName: "Sistema",
              timestamp: new Date(),
              type: "system",
              status: "read",
            }

            return {
              ...chat,
              name,
              description,
              messages: [...chat.messages, systemMessage],
              lastMessage: systemMessage,
            }
          }
        }
        return chat
      }),
    )
  }

  const isGroupAdmin = (chatId: string, userId?: string) => {
    const chat = chats.find((c) => c.id === chatId)
    return chat?.groupAdmins?.includes(userId || user?.id || "") ?? false
  }

  return {
    chats,
    activeChat,
    setActiveChat,
    sendMessage,
    sendMediaMessage,
    sendVoiceMessage,
    createNewChat,
    createGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    promoteToAdmin,
    updateGroupInfo,
    isGroupAdmin,
  }
}
