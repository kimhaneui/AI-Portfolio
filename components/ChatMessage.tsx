'use client'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div
      className={`flex gap-3 mb-6 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center shadow-lg">
            <svg
              className="w-5 h-5 text-purple-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Message Content */}
      <div
        className={`relative max-w-[75%] rounded-3xl px-5 py-3.5 backdrop-blur-md transition-all duration-300 ${
          isUser
            ? 'bg-white/90 text-gray-800 shadow-xl border border-gray-200'
            : 'bg-purple-100/90 text-gray-800 shadow-xl border border-purple-200'
        }`}
      >
        <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
          isUser ? 'text-gray-800' : 'text-gray-800'
        }`}>
          {content}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shadow-lg">
            <svg
              className="w-5 h-5 text-gray-700"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

