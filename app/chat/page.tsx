import ChatBot from '@/components/ChatBot'

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-0px)] flex flex-col relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100" />

      {/* Chat Container */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <ChatBot />
      </div>
    </div>
  )
}

