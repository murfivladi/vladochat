"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Play, Pause, Download, FileText, ImageIcon, Volume2 } from "lucide-react"
import type { MediaFile } from "@/hooks/use-media"
import { useMedia } from "@/hooks/use-media"

interface MediaMessageProps {
  media: MediaFile
  isOwn: boolean
}

export function MediaMessage({ media, isOwn }: MediaMessageProps) {
  const { formatFileSize } = useMedia()
  const [isPlaying, setIsPlaying] = useState(false)

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = media.url
    link.download = media.name
    link.click()
  }

  const renderMediaContent = () => {
    switch (media.type) {
      case "image":
        return (
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative cursor-pointer group">
                <img
                  src={media.url || "/placeholder.svg"}
                  alt={media.name}
                  className="max-w-xs max-h-64 rounded-lg object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <img src={media.url || "/placeholder.svg"} alt={media.name} className="w-full h-auto" />
            </DialogContent>
          </Dialog>
        )

      case "video":
        return (
          <div className="relative max-w-xs">
            <video src={media.url} controls className="w-full rounded-lg" style={{ maxHeight: "300px" }} />
          </div>
        )

      case "audio":
        return (
          <Card className="p-3 max-w-xs">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Messaggio vocale</span>
                </div>
                <audio src={media.url} controls className="w-full mt-2" style={{ height: "32px" }} />
              </div>
            </div>
          </Card>
        )

      case "document":
        return (
          <Card className="p-3 max-w-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-muted rounded-lg">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{media.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(media.size)}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[70%]">
        {renderMediaContent()}
        <div className="mt-1 text-xs text-muted-foreground">
          {new Date(media.uploadedAt).toLocaleTimeString("it-IT", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  )
}
