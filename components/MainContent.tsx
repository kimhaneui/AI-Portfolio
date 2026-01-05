'use client'

import { useSidebar } from './SidebarContext'

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar()

  return (
    <main
      className={`flex-1 transition-all duration-300 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 ${
        isOpen ? 'ml-80' : 'ml-0'
      }`}
    >
      {children}
    </main>
  )
}

