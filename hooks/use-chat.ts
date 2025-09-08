"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "./use-auth"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface Message {
  id: string
  content: string
  sender_id: string
  chat_id: string
  type: "text" | "image" | "audio" | "video" | "document" | "system"
  file_url?: string
  file_name?: string
  file_size?: number
  reply_to?: string
  created_at: string
  updated_at: string
  sender?: {
    id: string
    display_name: string
    avatar_url?: string
  }
}

export interface Chat {
  id: string
  name?: string
  type: "direct" | "group"
  avatar_url?: string
  created_by: string
  created_at: string
  updated_at: string
  participants: Array<{
    id: string
    user_id: string
    role: "admin" | "member"
    joined_at: string
    user: {
      id: string
      display_name: string
      avatar_url?: string
      status: string
    }
  }>
  messages?: Message[]
  unread_count?: number
}

export function useChat() {
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(true)
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const loadChats = async () => {
      try {
        const { data: chatParticipants, error } = await supabase
          .from("chat_participants")
          .select(`
            chat_id,
            role,
            joined_at,
            chats!inner (
              id,
              name,
              type,
              avatar_url,
              created_by,
              created_at,
              updated_at
            )
          `)
          .eq("user_id", user.id)
          .order("joined_at", { ascending: false })

        if (error) throw error

        // Get full chat details with participants
        const chatIds = chatParticipants?.map((cp) => cp.chat_id) || []
        if (chatIds.length === 0) {
          setChats([])
          setLoading(false)
          return
        }

        const { data: fullChats, error: chatsError } = await supabase
          .from("chats")
          .select(`
            *,
            participants:chat_participants (
              id,
              user_id,
              role,
              joined_at,
              user:profiles (
                id,
                display_name,
                avatar_url,
                status
              )
            )
          `)
          .in("id", chatIds)
          .order("updated_at", { ascending: false })

        if (chatsError) throw chatsError

        setChats(fullChats || [])
      } catch (error) {
        console.error("Error loading chats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadChats()
  }, [user, supabase])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("chat-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as Message
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === newMessage.chat_id ? { ...chat, messages: [...(chat.messages || []), newMessage] } : chat,
            ),
          )
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chats",
        },
        (payload) => {
          const updatedChat = payload.new as any
          setChats((prevChats) =>
            prevChats.map((chat) => (chat.id === updatedChat.id ? { ...chat, ...updatedChat } : chat)),
          )
        },
      )
      .subscribe()

    setRealtimeChannel(channel)

    return () => {
      channel.unsubscribe()
    }
  }, [user, supabase])

  useEffect(() => {
    if (!activeChat) return

    const loadMessages = async () => {
      try {
        const { data: messages, error } = await supabase
          .from("messages")
          .select(`
            *,
            sender:profiles (
              id,
              display_name,
              avatar_url
            )
          `)
          .eq("chat_id", activeChat.id)
          .order("created_at", { ascending: true })

        if (error) throw error

        setActiveChat((prev) => (prev ? { ...prev, messages: messages || [] } : null))
      } catch (error) {
        console.error("Error loading messages:", error)
      }
    }

    loadMessages()
  }, [activeChat, supabase])

  const sendMessage = async (chatId: string, content: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("messages").insert({
        chat_id: chatId,
        sender_id: user.id,
        content,
        type: "text",
      })

      if (error) throw error
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const sendMediaMessage = async (chatId: string, file: File, fileUrl: string) => {
    if (!user) return

    const getMessageType = (fileType: string): Message["type"] => {
      if (fileType.startsWith("image/")) return "image"
      if (fileType.startsWith("video/")) return "video"
      if (fileType.startsWith("audio/")) return "audio"
      return "document"
    }

    try {
      const { error } = await supabase.from("messages").insert({
        chat_id: chatId,
        sender_id: user.id,
        content: file.name,
        type: getMessageType(file.type),
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
      })

      if (error) throw error
    } catch (error) {
      console.error("Error sending media message:", error)
    }
  }

  const sendVoiceMessage = async (chatId: string, recording: any) => {
    if (!user) return

    try {
      const { error } = await supabase.from("messages").insert({
        chat_id: chatId,
        sender_id: user.id,
        content: `Messaggio vocale (${Math.floor(recording.duration / 60)}:${(recording.duration % 60).toString().padStart(2, "0")})`,
        type: "audio",
        file_url: recording.url,
        file_name: `voice_${Date.now()}.webm`,
        file_size: recording.blob.size,
      })

      if (error) throw error
    } catch (error) {
      console.error("Error sending voice message:", error)
    }
  }

  const createNewChat = async () => {
    if (!user) return

    // For demo purposes, create a chat with a random user
    // In a real app, you'd select from available users
    const demoUsers = [
      { id: "demo1", name: "Alessandro Demo" },
      { id: "demo2", name: "Francesca Demo" },
      { id: "demo3", name: "Luca Demo" },
    ]

    const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)]

    try {
      // Use the create_direct_chat function
      const { data, error } = await supabase.rpc("create_direct_chat", {
        other_user_id: randomUser.id,
      })

      if (error) throw error

      // Reload chats to show the new one
      window.location.reload()
    } catch (error) {
      console.error("Error creating chat:", error)
    }
  }

  const createGroup = async (name: string, description: string, selectedMembers: string[]) => {
    if (!user) return

    try {
      // Create the group chat
      const { data: chat, error: chatError } = await supabase
        .from("chats")
        .insert({
          name,
          type: "group",
          created_by: user.id,
        })
        .select()
        .single()

      if (chatError) throw chatError

      // Add creator as admin
      const participants = [
        { chat_id: chat.id, user_id: user.id, role: "admin" },
        ...selectedMembers.map((memberId) => ({
          chat_id: chat.id,
          user_id: memberId,
          role: "member" as const,
        })),
      ]

      const { error: participantsError } = await supabase.from("chat_participants").insert(participants)

      if (participantsError) throw participantsError

      // Add system message
      const { error: messageError } = await supabase.from("messages").insert({
        chat_id: chat.id,
        sender_id: user.id,
        content: `${user.display_name} ha creato il gruppo`,
        type: "system",
      })

      if (messageError) throw messageError

      // Reload chats
      window.location.reload()
    } catch (error) {
      console.error("Error creating group:", error)
    }
  }

  const addMemberToGroup = async (chatId: string, memberId: string, memberName: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("chat_participants").insert({
        chat_id: chatId,
        user_id: memberId,
        role: "member",
      })

      if (error) throw error

      // Add system message
      await supabase.from("messages").insert({
        chat_id: chatId,
        sender_id: user.id,
        content: `${user.display_name} ha aggiunto ${memberName} al gruppo`,
        type: "system",
      })
    } catch (error) {
      console.error("Error adding member:", error)
    }
  }

  const removeMemberFromGroup = async (chatId: string, memberId: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("chat_participants").delete().eq("chat_id", chatId).eq("user_id", memberId)

      if (error) throw error
    } catch (error) {
      console.error("Error removing member:", error)
    }
  }

  const promoteToAdmin = async (chatId: string, memberId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("chat_participants")
        .update({ role: "admin" })
        .eq("chat_id", chatId)
        .eq("user_id", memberId)

      if (error) throw error
    } catch (error) {
      console.error("Error promoting member:", error)
    }
  }

  const updateGroupInfo = async (chatId: string, name: string, description?: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("chats").update({ name }).eq("id", chatId)

      if (error) throw error
    } catch (error) {
      console.error("Error updating group:", error)
    }
  }

  const isGroupAdmin = (chatId: string, userId?: string) => {
    const chat = chats.find((c) => c.id === chatId)
    const participant = chat?.participants.find((p) => p.user_id === (userId || user?.id))
    return participant?.role === "admin"
  }

  return {
    chats,
    activeChat,
    setActiveChat,
    loading,
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
