/**
 * 질문 매칭 유틸리티
 * 사용자 질문을 하드코딩된 질문 패턴과 매칭
 */

interface QuestionPattern {
  id: number
  patterns: string[]
  keywords: string[]
  category: string
  response_type: 'template' | 'static'
  template: string
  match_type: 'exact' | 'keyword' | 'similarity'
}

/**
 * 질문 정규화 (대소문자, 공백, 특수문자 제거)
 */
export function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .trim()
    .replace(/[^\w\s가-힣]/g, '') // 특수문자 제거
    .replace(/\s+/g, ' ') // 여러 공백을 하나로
}

/**
 * 질문에서 키워드 추출
 */
export function extractKeywords(question: string): string[] {
  const normalized = normalizeQuestion(question)
  // 간단한 키워드 추출 (실제로는 형태소 분석기를 사용하는 것이 좋음)
  return normalized.split(/\s+/).filter(word => word.length > 1)
}

/**
 * 질문 유사도 계산 (Jaccard similarity)
 */
export function calculateSimilarity(q1: string, q2: string): number {
  const normalize = (s: string) => {
    const words = normalizeQuestion(s).split(/\s+/).filter(w => w.length > 1)
    return new Set(words)
  }
  
  const set1 = normalize(q1)
  const set2 = normalize(q2)
  
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  
  if (union.size === 0) return 0
  
  return intersection.size / union.size
}

/**
 * 정확 매칭
 */
export function exactMatch(
  question: string,
  patterns: QuestionPattern[]
): QuestionPattern | null {
  const normalized = normalizeQuestion(question)
  
  for (const pattern of patterns) {
    for (const p of pattern.patterns) {
      if (normalizeQuestion(p) === normalized) {
        return pattern
      }
    }
  }
  
  return null
}

/**
 * 키워드 매칭
 */
export function keywordMatch(
  question: string,
  patterns: QuestionPattern[],
  threshold: number = 0.3
): QuestionPattern | null {
  const normalized = normalizeQuestion(question)
  const questionKeywords = extractKeywords(question)
  
  let bestMatch: QuestionPattern | null = null
  let bestScore = 0
  
  for (const pattern of patterns) {
    if (pattern.match_type !== 'keyword' && pattern.match_type !== 'similarity') {
      continue
    }
    
    // 패턴 키워드와 질문 키워드의 교집합 비율 계산
    const patternKeywords = pattern.keywords.map(k => k.toLowerCase())
    const matchedKeywords = questionKeywords.filter(qk => 
      patternKeywords.some(pk => qk.includes(pk) || pk.includes(qk))
    )
    
    const score = matchedKeywords.length / Math.max(patternKeywords.length, questionKeywords.length)
    
    if (score >= threshold && score > bestScore) {
      bestScore = score
      bestMatch = pattern
    }
  }
  
  return bestMatch
}

/**
 * 유사도 매칭
 */
export function similarityMatch(
  question: string,
  patterns: QuestionPattern[],
  threshold: number = 0.5
): QuestionPattern | null {
  let bestMatch: QuestionPattern | null = null
  let bestScore = 0
  
  for (const pattern of patterns) {
    if (pattern.match_type !== 'similarity') {
      continue
    }
    
    // 각 패턴과의 유사도 계산
    for (const p of pattern.patterns) {
      const similarity = calculateSimilarity(question, p)
      if (similarity >= threshold && similarity > bestScore) {
        bestScore = similarity
        bestMatch = pattern
      }
    }
  }
  
  return bestMatch
}

/**
 * 질문 매칭 (우선순위: 정확 > 키워드 > 유사도)
 */
export function matchQuestion(
  question: string,
  patterns: QuestionPattern[]
): QuestionPattern | null {
  // 1. 정확 매칭 시도
  const exact = exactMatch(question, patterns)
  if (exact) {
    return exact
  }
  
  // 2. 키워드 매칭 시도
  const keyword = keywordMatch(question, patterns, 0.3)
  if (keyword) {
    return keyword
  }
  
  // 3. 유사도 매칭 시도
  const similarity = similarityMatch(question, patterns, 0.5)
  if (similarity) {
    return similarity
  }
  
  return null
}

