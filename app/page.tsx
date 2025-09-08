"use client"
import { AuthForm } from "@/components/auth-form"
import { ChatApp } from "@/components/chat-app"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useAuth } from "@/hooks/use-auth"

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return <div className="min-h-screen bg-background">{user ? <ChatApp /> : <AuthForm />}</div>
}
