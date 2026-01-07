import React from 'react'

export function parseMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let key = 0

  // 패턴: **볼드**, *이탤릭*, `코드`, 줄바꿈
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\\n)/g

  let match
  while ((match = pattern.exec(text)) !== null) {
    // 매칭 이전 텍스트 추가
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++}>
          {text.substring(lastIndex, match.index)}
        </span>
      )
    }

    // 매칭된 패턴 처리
    if (match[2]) {
      // **볼드**
      parts.push(
        <strong key={key++} className="font-bold">
          {match[2]}
        </strong>
      )
    } else if (match[3]) {
      // *이탤릭*
      parts.push(
        <em key={key++} className="italic">
          {match[3]}
        </em>
      )
    } else if (match[4]) {
      // `코드`
      parts.push(
        <code
          key={key++}
          className="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono"
        >
          {match[4]}
        </code>
      )
    } else if (match[1] === '\\n') {
      // 줄바꿈
      parts.push(<br key={key++} />)
    }

    lastIndex = pattern.lastIndex
  }

  // 남은 텍스트 추가
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.substring(lastIndex)}</span>)
  }

  return parts.length > 0 ? parts : [text]
}
