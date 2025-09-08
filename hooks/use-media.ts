"use client"

import { useState, useRef, useCallback } from "react"
import { useAuth } from "./use-auth"

export interface MediaFile {
  id: string
  name: string
  type: "image" | "video" | "audio" | "document"
  url: string
  size: number
  uploadedAt: Date
  uploadedBy: string
}

export interface VoiceRecording {
  id: string
  blob: Blob
  duration: number
  url: string
}

export function useMedia() {
  const { user } = useAuth()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout>()
  const audioChunksRef = useRef<Blob[]>([])

  // Start voice recording
  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      audioChunksRef.current = []
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingDuration(0)

      // Update duration every second
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error starting voice recording:", error)
    }
  }, [])

  // Stop voice recording
  const stopVoiceRecording = useCallback((): Promise<VoiceRecording | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null)
        return
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const audioUrl = URL.createObjectURL(audioBlob)

        const recording: VoiceRecording = {
          id: Date.now().toString(),
          blob: audioBlob,
          duration: recordingDuration,
          url: audioUrl,
        }

        // Stop all tracks
        if (mediaRecorderRef.current?.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
        }

        resolve(recording)
      }

      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    })
  }, [isRecording, recordingDuration])

  // Cancel voice recording
  const cancelVoiceRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()

      // Stop all tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      }
    }

    setIsRecording(false)
    setRecordingDuration(0)

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
    }
  }, [isRecording])

  // Upload file
  const uploadFile = useCallback(
    async (file: File): Promise<MediaFile> => {
      const fileId = Date.now().toString()

      // Simulate upload progress
      setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }))

      return new Promise((resolve) => {
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            const currentProgress = prev[fileId] || 0
            const newProgress = Math.min(currentProgress + 10, 100)

            if (newProgress === 100) {
              clearInterval(interval)

              // Create object URL for the file
              const fileUrl = URL.createObjectURL(file)

              const mediaFile: MediaFile = {
                id: fileId,
                name: file.name,
                type: getFileType(file.type),
                url: fileUrl,
                size: file.size,
                uploadedAt: new Date(),
                uploadedBy: user?.id || "unknown",
              }

              // Remove from progress tracking
              setUploadProgress((prev) => {
                const { [fileId]: _, ...rest } = prev
                return rest
              })

              resolve(mediaFile)
            }

            return { ...prev, [fileId]: newProgress }
          })
        }, 200)
      })
    },
    [user],
  )

  // Get file type from MIME type
  const getFileType = (mimeType: string): MediaFile["type"] => {
    if (mimeType.startsWith("image/")) return "image"
    if (mimeType.startsWith("video/")) return "video"
    if (mimeType.startsWith("audio/")) return "audio"
    return "document"
  }

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }, [])

  // Format recording duration
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }, [])

  return {
    isRecording,
    recordingDuration,
    uploadProgress,
    startVoiceRecording,
    stopVoiceRecording,
    cancelVoiceRecording,
    uploadFile,
    formatFileSize,
    formatDuration,
  }
}
