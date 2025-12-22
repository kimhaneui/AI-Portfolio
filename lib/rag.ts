import { supabaseAdmin } from './supabase'
import { generateEmbedding, generateChatCompletion } from './openai'

/**
 * 1단계: 키워드 매칭을 통해 명시적인 정보를 Database에서 찾기
 */
export async function keywordMatch(query: string): Promise<string | null> {
  try {
    // 키워드를 소문자로 변환하여 검색
    const normalizedQuery = query.toLowerCase().trim()
    
    // 키워드가 포함된 응답 검색
    const { data, error } = await supabaseAdmin
      .from('keyword_responses')
      .select('response')
      .ilike('keyword', `%${normalizedQuery}%`)
      .limit(1)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return data.response
  } catch (error) {
    console.error('Keyword match error:', error)
    return null
  }
}

/**
 * 2단계: 벡터 유사도 검색 (Vector Search)
 */
export async function vectorSearch(
  query: string,
  limit: number = 3
): Promise<string[]> {
  try {
    // 쿼리 임베딩 생성
    const queryEmbedding = await generateEmbedding(query)
    
    // Supabase pgvector를 사용한 코사인 유사도 검색
    // HNSW 인덱스를 활용하여 고성능 검색
    const { data, error } = await supabaseAdmin.rpc('match_resume_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit,
    })
    
    if (error) {
      console.error('Vector search error:', error)
      return []
    }
    
    // 검색된 컨텍스트 반환
    return data?.map((item: any) => item.content) || []
  } catch (error) {
    console.error('Vector search error:', error)
    return []
  }
}

/**
 * LLM을 사용하여 최종 응답 생성
 */
export async function generateResponse(
  query: string,
  context: string[]
): Promise<string> {
  const systemPrompt = `You are a helpful AI assistant that provides information about a portfolio owner based on their resume data.

Important guidelines:
- Only use the provided context to answer questions
- If the context doesn't contain relevant information, politely say you don't have that information
- Do not make up or hallucinate information
- Be concise and professional
- Answer in Korean unless asked otherwise`

  const contextText = context.length > 0
    ? `\n\nRelevant context from resume:\n${context.join('\n\n')}`
    : ''

  const userMessage = `${query}${contextText}`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userMessage },
  ]

  return await generateChatCompletion(messages, 'gpt-3.5-turbo')
}

/**
 * RAG 파이프라인: 키워드 매칭 → 벡터 검색 → LLM 응답
 */
export async function processRAGQuery(query: string): Promise<string> {
  // 1단계: 키워드 매칭 시도
  const keywordResponse = await keywordMatch(query)
  
  if (keywordResponse) {
    return keywordResponse
  }
  
  // 2단계: 벡터 검색 수행
  const contexts = await vectorSearch(query, 3)
  
  // 3단계: LLM으로 최종 응답 생성
  const response = await generateResponse(query, contexts)
  
  return response
}

