import OpenAI from 'openai'

const openaiApiKey = process.env.OPENAI_API_KEY || ''

if (!openaiApiKey) {
  console.warn('OPENAI_API_KEY is not set')
}

// API 키가 없을 때도 클라이언트는 생성하되, 실제 호출 시 에러가 발생하도록 함
export const openai = openaiApiKey 
  ? new OpenAI({ apiKey: openaiApiKey })
  : null as any // 타입 체크를 우회하지만, 실제 사용 시 에러 발생

// Generate embedding using text-embedding-3-small (768 dimensions)
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not set. Please configure it in .env.local')
  }
  
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 768,
  })
  
  return response.data[0].embedding
}

// Generate chat completion using GPT
export async function generateChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model: 'gpt-4' | 'gpt-3.5-turbo' = 'gpt-3.5-turbo'
): Promise<string> {
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not set. Please configure it in .env.local')
  }
  
  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 1000,
  })
  
  return response.choices[0]?.message?.content || ''
}

