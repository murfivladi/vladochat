"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useAuth } from "./use-auth"

export interface CallState {
  isActive: boolean
  isIncoming: boolean
  isOutgoing: boolean
  callType: "audio" | "video"
  participantId: string
  participantName: string
  participantAvatar?: string
  startTime?: Date
  duration: number
}

export interface MediaState {
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isSpeakerOn: boolean
  localStream?: MediaStream
  remoteStream?: MediaStream
}

export function useWebRTC() {
  const { user } = useAuth()
  const [callState, setCallState] = useState<CallState | null>(null)
  const [mediaState, setMediaState] = useState<MediaState>({
    isAudioEnabled: true,
    isVideoEnabled: false,
    isSpeakerOn: false,
  })
  const [connectionState, setConnectionState] = useState<"new" | "connecting" | "connected" | "disconnected">("new")

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout>()

  // Initialize WebRTC peer connection
  const initializePeerConnection = useCallback(() => {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
    }

    const peerConnection = new RTCPeerConnection(configuration)

    peerConnection.oniceconnectionstatechange = () => {
      setConnectionState(peerConnection.iceConnectionState as any)
    }

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams
      setMediaState((prev) => ({ ...prev, remoteStream }))
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream
      }
    }

    peerConnectionRef.current = peerConnection
    return peerConnection
  }, [])

  // Get user media (camera/microphone)
  const getUserMedia = useCallback(async (video = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: video ? { width: 640, height: 480 } : false,
      })

      localStreamRef.current = stream
      setMediaState((prev) => ({ ...prev, localStream: stream }))

      if (localVideoRef.current && video) {
        localVideoRef.current.srcObject = stream
      }

      return stream
    } catch (error) {
      console.error("Error accessing media devices:", error)
      throw error
    }
  }, [])

  // Start outgoing call
  const startCall = useCallback(
    async (participantId: string, participantName: string, callType: "audio" | "video", participantAvatar?: string) => {
      if (!user) return

      try {
        const stream = await getUserMedia(callType === "video")
        const peerConnection = initializePeerConnection()

        // Add local stream to peer connection
        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream)
        })

        setCallState({
          isActive: true,
          isIncoming: false,
          isOutgoing: true,
          callType,
          participantId,
          participantName,
          participantAvatar,
          startTime: new Date(),
          duration: 0,
        })

        setMediaState((prev) => ({
          ...prev,
          isVideoEnabled: callType === "video",
        }))

        // Start duration counter
        durationIntervalRef.current = setInterval(() => {
          setCallState((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null))
        }, 1000)

        // Simulate call connection after 2 seconds
        setTimeout(() => {
          setCallState((prev) => (prev ? { ...prev, isOutgoing: false } : null))
          setConnectionState("connected")
        }, 2000)
      } catch (error) {
        console.error("Error starting call:", error)
      }
    },
    [user, getUserMedia, initializePeerConnection],
  )

  // Answer incoming call
  const answerCall = useCallback(async () => {
    if (!callState?.isIncoming) return

    try {
      const stream = await getUserMedia(callState.callType === "video")
      const peerConnection = initializePeerConnection()

      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream)
      })

      setCallState((prev) => (prev ? { ...prev, isIncoming: false, startTime: new Date() } : null))
      setConnectionState("connected")

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setCallState((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null))
      }, 1000)
    } catch (error) {
      console.error("Error answering call:", error)
    }
  }, [callState, getUserMedia, initializePeerConnection])

  // End call
  const endCall = useCallback(() => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    // Clear duration interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = undefined
    }

    setCallState(null)
    setMediaState({
      isAudioEnabled: true,
      isVideoEnabled: false,
      isSpeakerOn: false,
    })
    setConnectionState("new")
  }, [])

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setMediaState((prev) => ({ ...prev, isAudioEnabled: audioTrack.enabled }))
      }
    }
  }, [])

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setMediaState((prev) => ({ ...prev, isVideoEnabled: videoTrack.enabled }))
      }
    }
  }, [])

  // Toggle speaker
  const toggleSpeaker = useCallback(() => {
    setMediaState((prev) => ({ ...prev, isSpeakerOn: !prev.isSpeakerOn }))
  }, [])

  // Simulate incoming call
  const simulateIncomingCall = useCallback(
    (participantId: string, participantName: string, callType: "audio" | "video", participantAvatar?: string) => {
      setCallState({
        isActive: true,
        isIncoming: true,
        isOutgoing: false,
        callType,
        participantId,
        participantName,
        participantAvatar,
        duration: 0,
      })
    },
    [],
  )

  // Format call duration
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall()
    }
  }, [endCall])

  return {
    callState,
    mediaState,
    connectionState,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleSpeaker,
    simulateIncomingCall,
    formatDuration,
  }
}
