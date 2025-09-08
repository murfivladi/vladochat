"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Paperclip, ImageIcon, FileText, Camera } from "lucide-react"
import { useMedia } from "@/hooks/use-media"

interface MediaAttachmentMenuProps {
  onFileSelect: (file: File) => void
  onVoiceRecording: (recording: any) => void
}

export function MediaAttachmentMenu({ onFileSelect, onVoiceRecording }: MediaAttachmentMenuProps) {
  const { uploadFile, uploadProgress } = useMedia()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    if (!file) return

    setIsUploading(true)
    try {
      const mediaFile = await uploadFile(file)
      onFileSelect(file)
    } catch (error) {
      console.error("Error uploading file:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageSelect = () => {
    imageInputRef.current?.click()
  }

  const handleDocumentSelect = () => {
    fileInputRef.current?.click()
  }

  const handleCameraCapture = () => {
    // Simulate camera capture by opening image input with camera
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.capture = "environment"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) handleFileUpload(file)
    }
    input.click()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="mb-1" disabled={isUploading}>
            <Paperclip className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={handleImageSelect}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Foto e Video
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCameraCapture}>
            <Camera className="h-4 w-4 mr-2" />
            Fotocamera
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDocumentSelect}>
            <FileText className="h-4 w-4 mr-2" />
            Documento
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || [])
          files.forEach(handleFileUpload)
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || [])
          files.forEach(handleFileUpload)
        }}
      />

      {/* Upload Progress */}
      {isUploading && Object.keys(uploadProgress).length > 0 && (
        <Card className="absolute bottom-full left-0 mb-2 p-3 w-64">
          <div className="space-y-2">
            {Object.entries(uploadProgress).map(([fileId, progress]) => (
              <div key={fileId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Caricamento...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}
