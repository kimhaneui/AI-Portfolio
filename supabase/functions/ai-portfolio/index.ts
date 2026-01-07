import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // CORS preflight - 가장 먼저 처리
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  // POST 요청만 처리
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    // 환경 변수
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!GEMINI_API_KEY || !supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const GEMINI_CHAT_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`

    // 요청 본문 파싱
    const { message } = await req.json()

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    async function generateChatCompletion(systemPrompt: string, userMessage: string): Promise<string> {
      const response = await fetch(GEMINI_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n사용자 질문: ${userMessage}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(`Gemini Chat error: ${JSON.stringify(data)}`)
      return data.candidates[0]?.content?.parts[0]?.text || ''
    }

    async function keywordMatch(query: string): Promise<string | null> {
      try {
        const { data } = await supabaseAdmin
          .from('keyword_responses')
          .select('response')
          .ilike('keyword', `%${query.toLowerCase().trim()}%`)
          .limit(1)
          .maybeSingle()
        return data?.response || null
      } catch (error) {
        console.error('Keyword match error:', error)
        return null
      }
    }

    async function getRelevantData(categories: string[]): Promise<string[]> {
      try {
        const contexts: string[] = []

        // Skills 가져오기
        if (categories.length === 0 || categories.includes('skills')) {
          const { data: skills } = await supabaseAdmin.from('skills').select('*')
          if (skills) {
            skills.forEach(skill => {
              const proficiencyText = skill.proficiency ? ` (숙련도: ${skill.proficiency})` : ''
              const descriptionText = skill.description ? `\n${skill.description}` : ''
              contexts.push(`기술: ${skill.skill_name}${proficiencyText}\n카테고리: ${skill.category}${descriptionText}`)
            })
          }
        }

        // Projects 가져오기
        if (categories.length === 0 || categories.includes('projects')) {
          const { data: projects } = await supabaseAdmin.from('project').select('*')
          if (projects) {
            projects.forEach(project => {
              const techStack = project.technologies ? `\n사용 기술: ${project.technologies.join(', ')}` : ''
              contexts.push(`"${project.project_name}" 프로젝트 (${project.role})\n${project.description}${techStack}`)
            })
          }
        }

        // Personal info 가져오기
        if (categories.length === 0 || categories.includes('personal')) {
          const { data: personal } = await supabaseAdmin.from('personal').select('*').single()
          if (personal) {
            contexts.push(`이름: ${personal.name}\n이메일: ${personal.email}${personal.github ? `\nGitHub: ${personal.github}` : ''}`)
          }
        }

        return contexts
      } catch (error) {
        console.error('Data fetch error:', error)
        return []
      }
    }

    async function generateResponse(query: string, context: string[], categories: string[]): Promise<string> {
      const systemPrompt = `당신은 개발자 김하늬를 대신해서 친근하고 자연스럽게 대화하는 AI 어시스턴트입니다.

**중요: 절대 규칙**
- 아래 제공된 "김하늬 이력서 정보"는 Supabase 데이터베이스의 personal, skills, career, project 테이블에서 직접 가져온 실제 데이터입니다
- **무조건 이 Supabase 테이블 데이터만을 기반으로 답변하세요**
- 제공된 정보에 명시된 내용만 사용하세요
- 제공된 정보에 없는 기술, 경력, 프로젝트는 절대 언급하지 마세요. 일반적인 기술을 추측하거나 상상해서 말하지 마세요.
- 당신의 일반적인 개발자 지식을 사용하지 말고, 오직 제공된 Supabase 테이블 정보만 사용하세요
- 정보가 불충분하면 "제 이력서에 그 부분이 없네요"라고 솔직하게 말하세요

답변 가이드라인:
- 친근하고 편안한 말투로 대화하듯이 답변하세요
- 1인칭 시점으로 답변하세요 ("저는...", "제가...")
- 김하늬의 관점에서 답변하세요
- 한국어로 답변하세요
- 기술 스택을 물어보면 제공된 정보의 모든 기술을 빠짐없이 나열하세요
- "가장 최근 프로젝트" 또는 "최근에 한 일"을 물어보면 TeamRemited(현재 회사)에서 작업한 내용을 자세히 설명하세요
- 기술명, 프로젝트명, 회사명 등 중요한 단어는 **볼드**로 강조하세요 (예: **TypeScript**, **React Native**, **영끌 App**)
- 따옴표("")를 사용하지 말고, 대신 볼드 처리를 사용하세요
${categories.length > 0 ? `- 이 질문은 다음 주제에 관한 것입니다: ${categories.join(', ')}` : ''}`
      const contextText = context.length > 0 ? `\n\n===김하늬 이력서 정보 (이것만 사용하세요)===\n${context.join('\n\n')}` : ''
      return await generateChatCompletion(systemPrompt, `${query}${contextText}`)
    }

    // RAG Pipeline
    const keywordResponse = await keywordMatch(message)
    if (keywordResponse) {
      return new Response(
        JSON.stringify({ response: keywordResponse }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 인사말 간단 체크
    const greetings = ['안녕', '안녕하세요', '하이', '헬로', 'hello', 'hi']
    if (greetings.some(g => message.toLowerCase().includes(g))) {
      return new Response(
        JSON.stringify({ response: '안녕하세요! 저는 개발자 김하늬입니다 😊 제 포트폴리오에 대해 궁금한 게 있으시면 편하게 물어보세요. 경력이나 프로젝트, 기술 스택 뭐든지 좋아요!' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 상세한 키워드 기반 카테고리 매칭
    function detectCategories(query: string): string[] {
      const lowerQuery = query.toLowerCase()
      const categories = new Set<string>()

      // Skills 관련 키워드
      const skillsKeywords = [
        '기술', '스택', '기술스택', '다룰 수 있', '사용 가능', '할 줄 아', '사용해',
        '언어', '프레임워크', 'react', 'next', 'typescript', 'javascript', 'vue', 'node',
        '개발 도구', '툴', 'tool', 'skill', '능력', '역량'
      ]
      if (skillsKeywords.some(kw => lowerQuery.includes(kw))) {
        categories.add('skills')
      }

      // Projects 관련 키워드
      const projectsKeywords = [
        '프로젝트', '만든', '개발한', '작업한', '진행한', '참여한',
        '포트폴리오', '작품', 'project', '구현', '제작'
      ]
      if (projectsKeywords.some(kw => lowerQuery.includes(kw))) {
        // "최근 프로젝트"는 현재 회사 경력을 의미
        if (lowerQuery.includes('최근') || lowerQuery.includes('요즘') || lowerQuery.includes('현재')) {
          categories.add('experience')
        } else {
          categories.add('projects')
        }
      }
      // Personal 관련 키워드
      const personalKeywords = [
        '이름', '연락처', '이메일', '전화', '메일', '깃허브', 'github', '나이', '생년월일', '소개',
        '링크드인', 'linkedin', '위치', '거주', '소개'
      ]
      if (personalKeywords.some(kw => lowerQuery.includes(kw))) {
        categories.add('personal')
      }

      return Array.from(categories)
    }

    const searchCategories = detectCategories(message)
    console.log('🔍 Detected categories:', searchCategories)

    // 카테고리에 따라 관련 데이터 가져오기
    const contexts = await getRelevantData(searchCategories)
    console.log('📦 Found contexts:', contexts.length)
    console.log('📝 Context preview:', contexts.map(c => c.substring(0, 80)))

    const response = await generateResponse(message, contexts, searchCategories)

    return new Response(
      JSON.stringify({ response }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
