"use client"

import { useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from "lucide-react"
import { useWebRTC } from "@/hooks/use-webrtc"

export function CallInterface() {
  const {
    callState,
    mediaState,
    connectionState,
    localVideoRef,
    remoteVideoRef,
    answerCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleSpeaker,
    formatDuration,
  } = useWebRTC()

  // Auto-play audio for incoming calls
  useEffect(() => {
    if (callState?.isIncoming) {
      // Play ringtone sound (simulated)
      console.log("[v0] Playing ringtone for incoming call")
    }
  }, [callState?.isIncoming])

  if (!callState) return null

  const isVideoCall = callState.callType === "video"
  const isConnected = connectionState === "connected"

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-2xl mx-4 bg-background/95 backdrop-blur">
        {/* Call Header */}
        <div className="p-6 text-center border-b">
          <Avatar className="h-20 w-20 mx-auto mb-4">
            <AvatarImage src={callState.participantAvatar || "/placeholder.svg"} />
            <AvatarFallback className="text-2xl">{callState.participantName.charAt(0)}</AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold mb-2">{callState.participantName}</h2>
          <div className="flex items-center justify-center space-x-2">
            <Badge variant={isConnected ? "default" : "secondary"}>
              {callState.isIncoming
                ? "Chiamata in arrivo"
                : callState.isOutgoing
                  ? "Chiamando..."
                  : isConnected
                    ? formatDuration(callState.duration)
                    : "Connessione..."}
            </Badge>
            {isVideoCall && <Badge variant="outline">Video</Badge>}
          </div>
        </div>

        {/* Video Area */}
        {isVideoCall && (
          <div className="relative aspect-video bg-muted">
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              style={{ display: mediaState.remoteStream ? "block" : "none" }}
            />

            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute top-4 right-4 w-32 h-24 bg-muted rounded-lg overflow-hidden border-2 border-background">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: mediaState.isVideoEnabled ? "block" : "none" }}
              />
              {!mediaState.isVideoEnabled && (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <VideoOff className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Connection Status Overlay */}
            {!isConnected && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Connessione in corso...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Call Controls */}
        <div className="p-6">
          <div className="flex items-center justify-center space-x-4">
            {/* Answer Call (only for incoming) */}
            {callState.isIncoming && (
              <Button size="lg" className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600" onClick={answerCall}>
                <Phone className="h-6 w-6" />
              </Button>
            )}

            {/* Audio Toggle */}
            {isConnected && (
              <Button
                variant={mediaState.isAudioEnabled ? "outline" : "destructive"}
                size="lg"
                className="rounded-full h-12 w-12"
                onClick={toggleAudio}
              >
                {mediaState.isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
            )}

            {/* Video Toggle (only for video calls) */}
            {isVideoCall && isConnected && (
              <Button
                variant={mediaState.isVideoEnabled ? "outline" : "destructive"}
                size="lg"
                className="rounded-full h-12 w-12"
                onClick={toggleVideo}
              >
                {mediaState.isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
            )}

            {/* Speaker Toggle */}
            {isConnected && (
              <Button
                variant={mediaState.isSpeakerOn ? "default" : "outline"}
                size="lg"
                className="rounded-full h-12 w-12"
                onClick={toggleSpeaker}
              >
                {mediaState.isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
            )}

            {/* End Call */}
            <Button size="lg" className="rounded-full h-14 w-14 bg-red-500 hover:bg-red-600" onClick={endCall}>
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>

          {/* Call Status */}
          <div className="text-center mt-4 text-sm text-muted-foreground">
            {connectionState === "connecting" && "Connessione in corso..."}
            {connectionState === "connected" && "Chiamata attiva"}
            {connectionState === "disconnected" && "Chiamata terminata"}
          </div>
        </div>
      </Card>
    </div>
  )
}
