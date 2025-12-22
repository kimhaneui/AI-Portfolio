import OpenAI from 'openai'

const openaiApiKey = process.env.OPENAI_API_KEY || ''

if (!openaiApiKey) {
  console.warn('OPENAI_API_KEY is not set')
}

export const openai = new OpenAI({
  apiKey: openaiApiKey,
})

// Generate embedding using text-embedding-3-small (768 dimensions)
export async function generateEmbedding(text: string): Promise<number[]> {
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
  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 1000,
  })
  
  return response.choices[0]?.message?.content || ''
}

