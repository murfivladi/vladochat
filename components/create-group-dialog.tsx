"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, Plus } from "lucide-react"
import { useChat } from "@/hooks/use-chat"

interface CreateGroupDialogProps {
  trigger?: React.ReactNode
}

export function CreateGroupDialog({ trigger }: CreateGroupDialogProps) {
  const { createGroup, chats } = useChat()
  const [open, setOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  // Get individual contacts (non-group chats)
  const contacts = chats.filter((chat) => !chat.isGroup)

  const handleCreateGroup = () => {
    if (groupName.trim() && selectedMembers.length > 0) {
      createGroup(groupName.trim(), groupDescription.trim(), selectedMembers)
      setOpen(false)
      setGroupName("")
      setGroupDescription("")
      setSelectedMembers([])
    }
  }

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) => (prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Nuovo Gruppo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crea Nuovo Gruppo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Nome Gruppo</Label>
            <Input
              id="group-name"
              placeholder="Inserisci nome gruppo..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-description">Descrizione (opzionale)</Label>
            <Textarea
              id="group-description"
              placeholder="Descrivi il gruppo..."
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Seleziona Membri ({selectedMembers.length} selezionati)</Label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {contacts.map((contact) => {
                const memberId = contact.participants.find((p) => p !== "user1") || contact.id
                const isSelected = selectedMembers.includes(memberId)

                return (
                  <div key={contact.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleMember(memberId)} />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={contact.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm">{contact.name}</span>
                  </div>
                )
              })}
              {contacts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun contatto disponibile. Inizia alcune chat individuali prima di creare un gruppo.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreateGroup} disabled={!groupName.trim() || selectedMembers.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Crea Gruppo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
