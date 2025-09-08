"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Info, Edit, MoreVertical, UserPlus, Crown, UserMinus, Save, X } from "lucide-react"
import type { Chat } from "@/hooks/use-chat"
import { useChat } from "@/hooks/use-chat"
import { useAuth } from "@/hooks/use-auth"
import { formatDistanceToNow } from "date-fns"
import { it } from "date-fns/locale"

interface GroupInfoDialogProps {
  chat: Chat
  trigger?: React.ReactNode
}

export function GroupInfoDialog({ chat, trigger }: GroupInfoDialogProps) {
  const { user } = useAuth()
  const { updateGroupInfo, addMemberToGroup, removeMemberFromGroup, promoteToAdmin, isGroupAdmin } = useChat()
  const [open, setOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(chat.name)
  const [editDescription, setEditDescription] = useState(chat.description || "")

  const isAdmin = isGroupAdmin(chat.id)
  const currentUserIsAdmin = isGroupAdmin(chat.id, user?.id)

  const handleSaveChanges = () => {
    updateGroupInfo(chat.id, editName, editDescription)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditName(chat.name)
    setEditDescription(chat.description || "")
    setIsEditing(false)
  }

  const handleAddMember = () => {
    // Simulate adding a random member
    const names = ["Alessandro", "Francesca", "Luca", "Valentina", "Matteo", "Chiara"]
    const randomName = names[Math.floor(Math.random() * names.length)]
    addMemberToGroup(chat.id, randomName.toLowerCase(), randomName)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Info className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Info Gruppo</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Avatar and Basic Info */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={chat.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">{chat.name.charAt(0)}</AvatarFallback>
            </Avatar>

            {isEditing ? (
              <div className="w-full space-y-3">
                <div>
                  <Label htmlFor="edit-name">Nome Gruppo</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-center"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Descrizione</Label>
                  <Textarea
                    id="edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-center space-x-2">
                  <Button size="sm" onClick={handleSaveChanges}>
                    <Save className="h-4 w-4 mr-2" />
                    Salva
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 mr-2" />
                    Annulla
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <h3 className="text-xl font-semibold">{chat.name}</h3>
                  {currentUserIsAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {chat.description && <p className="text-muted-foreground">{chat.description}</p>}
                <p className="text-sm text-muted-foreground">
                  Creato {chat.createdAt && formatDistanceToNow(chat.createdAt, { addSuffix: true, locale: it })}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Members Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Membri ({chat.groupMembers?.length || 0})</h4>
              {currentUserIsAdmin && (
                <Button variant="outline" size="sm" onClick={handleAddMember}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Aggiungi
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {chat.groupMembers?.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{member.name}</span>
                        {member.role === "admin" && (
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Entrato {formatDistanceToNow(member.joinedAt, { addSuffix: true, locale: it })}
                      </p>
                    </div>
                  </div>

                  {currentUserIsAdmin && member.id !== user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.role === "member" && (
                          <DropdownMenuItem onClick={() => promoteToAdmin(chat.id, member.id)}>
                            <Crown className="h-4 w-4 mr-2" />
                            Promuovi Admin
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => removeMemberFromGroup(chat.id, member.id)}
                          className="text-red-600"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Rimuovi dal Gruppo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
