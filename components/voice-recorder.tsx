"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Square, Send, X } from "lucide-react"
import { useMedia } from "@/hooks/use-media"

interface VoiceRecorderProps {
  onSendRecording: (recording: any) => void
  onCancel: () => void
}

export function VoiceRecorder({ onSendRecording, onCancel }: VoiceRecorderProps) {
  const {
    isRecording,
    recordingDuration,
    startVoiceRecording,
    stopVoiceRecording,
    cancelVoiceRecording,
    formatDuration,
  } = useMedia()
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    if (!hasStarted) {
      startVoiceRecording()
      setHasStarted(true)
    }
  }, [hasStarted, startVoiceRecording])

  const handleSend = async () => {
    const recording = await stopVoiceRecording()
    if (recording) {
      onSendRecording(recording)
    }
  }

  const handleCancel = () => {
    cancelVoiceRecording()
    onCancel()
  }

  return (
    <Card className="absolute bottom-full left-0 right-0 mb-2 p-4 bg-background/95 backdrop-blur">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 flex-1">
          <div className={`w-3 h-3 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-gray-400"}`} />
          <span className="text-sm font-medium">{isRecording ? "Registrando..." : "Registrazione completata"}</span>
          <span className="text-sm text-muted-foreground">{formatDuration(recordingDuration)}</span>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>

          {isRecording ? (
            <Button variant="destructive" size="icon" onClick={stopVoiceRecording}>
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
