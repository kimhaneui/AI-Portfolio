import React from 'react'

export function parseMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let key = 0

  // 패턴: [링크](URL), **볼드**, *이탤릭*, `코드`, 줄바꿈
  // 링크 패턴을 먼저 처리해야 함 (더 구체적인 패턴)
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g
  const otherPattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\\n)/g

  // 먼저 링크를 찾아서 처리
  const linkMatches: Array<{ index: number; length: number; text: string; url: string }> = []
  let linkMatch
  while ((linkMatch = linkPattern.exec(text)) !== null) {
    linkMatches.push({
      index: linkMatch.index,
      length: linkMatch[0].length,
      text: linkMatch[1],
      url: linkMatch[2],
    })
  }

  // 링크와 다른 패턴을 함께 처리
  const allMatches: Array<{ index: number; length: number; type: string; data: any }> = []
  
  // 링크 매칭 추가
  linkMatches.forEach(match => {
    allMatches.push({
      index: match.index,
      length: match.length,
      type: 'link',
      data: { text: match.text, url: match.url }
    })
  })

  // 다른 패턴 매칭
  let otherMatch: RegExpExecArray | null
  while ((otherMatch = otherPattern.exec(text)) !== null) {
    // 링크와 겹치지 않는 경우만 추가
    const isOverlapping = linkMatches.some(link => 
      otherMatch!.index >= link.index && 
      otherMatch!.index < link.index + link.length
    )
    if (!isOverlapping) {
      allMatches.push({
        index: otherMatch.index,
        length: otherMatch[0].length,
        type: 'other',
        data: otherMatch
      })
    }
  }

  // 인덱스 순으로 정렬
  allMatches.sort((a, b) => a.index - b.index)

  // 매칭 처리
  allMatches.forEach(match => {
    // 매칭 이전 텍스트 추가
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++}>
          {text.substring(lastIndex, match.index)}
        </span>
      )
    }

    // 매칭된 패턴 처리
    if (match.type === 'link') {
      // [링크](URL)
      parts.push(
        <a
          key={key++}
          href={match.data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 hover:text-purple-700 underline font-medium"
        >
          {match.data.text}
        </a>
      )
    } else if (match.data[2]) {
      // **볼드**
      parts.push(
        <strong key={key++} className="font-bold">
          {match.data[2]}
        </strong>
      )
    } else if (match.data[3]) {
      // *이탤릭*
      parts.push(
        <em key={key++} className="italic">
          {match.data[3]}
        </em>
      )
    } else if (match.data[4]) {
      // `코드`
      parts.push(
        <code
          key={key++}
          className="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono"
        >
          {match.data[4]}
        </code>
      )
    } else if (match.data[1] === '\\n') {
      // 줄바꿈
      parts.push(<br key={key++} />)
    }

    lastIndex = match.index + match.length
  })

  // 남은 텍스트 추가
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.substring(lastIndex)}</span>)
  }

  return parts.length > 0 ? parts : [text]
}
