# AI 포트폴리오 웹사이트

RAG(Retrieval-Augmented Generation) 기반 AI 챗봇을 활용한 포트폴리오 웹사이트입니다.

## ✨ 주요 기능

- 🤖 **AI 챗봇**: 포트폴리오 정보에 대한 자연어 질문 답변
- ⚡ **즉시 응답**: 자주 묻는 질문에 대한 사전 준비된 답변
- 🔍 **벡터 검색**: 의미론적 검색을 통한 정확한 정보 제공
- 📝 **마크다운 지원**: 코드 블록, 리스트 등 풍부한 형식 지원
- 🎨 **모던 UI**: Tailwind CSS 기반의 반응형 디자인

## 기술 스택

- **프론트엔드**: Next.js 16, React, TypeScript, Tailwind CSS
- **백엔드**: Supabase Edge Functions (Deno 런타임)
- **데이터베이스**: Supabase (PostgreSQL + pgvector)
- **AI 모델**: Google Gemini (gemini-2.5-flash, text-embedding-004)
- **벡터 검색**: HNSW 인덱스 기반 고성능 유사도 검색

## 시스템 아키텍처

본 포트폴리오의 AI 채팅 시스템은 Supabase Edge Functions 기반의 RAG(검색 증강 생성) 및 Vector Search를 이용하여 구현하였습니다.

### 응답 흐름

사용자가 질문을 하게 되면 다음과 같은 4단계 파이프라인으로 답변을 생성합니다:

1. **0단계: 사전 답변 체크** ⚡
   - 자주 묻는 질문에 대한 사전 준비된 답변을 즉시 제공
   - API 호출 없이 빠른 응답 (예: "어떤 기술 스택을 사용하세요?")

2. **1단계: 키워드 매칭**
   - `keyword_responses` 테이블에서 명시적인 키워드 매칭
   - 빠른 응답을 위한 캐시된 답변 제공

3. **2단계: 벡터 검색**
   - Google Gemini `text-embedding-004` 모델(768차원)을 활용한 벡터 유사도 검색
   - 질문을 카테고리별로 분류하여 필요한 데이터만 검색 (토큰 최적화)
   - HNSW 인덱스를 활용한 고성능 검색

4. **3단계: LLM 응답 생성**
   - Gemini 2.5 Flash 모델을 사용하여 컨텍스트 기반 답변 생성
   - Hallucination 방지를 위한 정확한 정보 제공

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Supabase Edge Function URL
NEXT_PUBLIC_EDGE_FUNCTION_URL=https://your-project-ref.supabase.co/functions/v1/ai-portfolio

# Google Gemini API (Edge Function에서 사용)
GEMINI_API_KEY=your_gemini_api_key
```

**참고**: 
- `NEXT_PUBLIC_*` 변수는 클라이언트 사이드에서도 접근 가능합니다.
- `GEMINI_API_KEY`는 Supabase Edge Function의 Secrets로도 설정해야 합니다.

### 3. Supabase 데이터베이스 설정

Supabase 프로젝트에서 다음 SQL을 실행하여 테이블과 함수를 생성하세요:

```sql
-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 키워드 응답 테이블
CREATE TABLE IF NOT EXISTS keyword_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT UNIQUE NOT NULL,
  response TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 벡터 임베딩 테이블
CREATE TABLE IF NOT EXISTS resume_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HNSW 인덱스 생성
CREATE INDEX IF NOT EXISTS resume_embeddings_embedding_idx 
ON resume_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- 벡터 검색 함수 생성
CREATE OR REPLACE FUNCTION match_resume_embeddings(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    resume_embeddings.id,
    resume_embeddings.content,
    resume_embeddings.metadata,
    1 - (resume_embeddings.embedding <=> query_embedding) AS similarity
  FROM resume_embeddings
  WHERE 1 - (resume_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY resume_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 4. 키워드 데이터 초기화 (선택사항)

Supabase 대시보드에서 `keyword_responses` 테이블에 샘플 데이터를 추가할 수 있습니다:

```sql
INSERT INTO keyword_responses (keyword, response, category) VALUES
('안녕', '안녕하세요! 포트폴리오에 대해 궁금한 것이 있으시면 언제든 물어보세요.', 'greeting'),
('이름', '제 이름은 홍길동입니다.', 'personal');
```

### 5. 벡터 DB 초기화

Supabase 테이블 데이터를 벡터 DB에 삽입합니다:

```bash
# Supabase 테이블에서 벡터 DB 생성 (권장)
npm run seed-tables

# 또는 resume.json 파일로 벡터 DB 생성
npm run seed
```

### 6. Supabase Edge Function 배포

```bash
# Supabase CLI 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref your-project-ref

# 환경 변수 설정 (Secrets)
supabase secrets set GEMINI_API_KEY=your_gemini_api_key

# Edge Function 배포
supabase functions deploy ai-portfolio --no-verify-jwt
```

자세한 배포 방법은 [supabase/functions/ai-portfolio/README.md](./supabase/functions/ai-portfolio/README.md)를 참고하세요.

### 7. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
app/
  ├── page.tsx                 # 메인 페이지
  ├── layout.tsx               # 루트 레이아웃 (사이드바 포함)
  ├── globals.css              # 전역 스타일
  ├── chat/
  │   └── page.tsx            # 챗봇 페이지
  └── api/
      └── embed/
          └── route.ts         # 임베딩 API (보존용)

components/
  ├── ChatBot.tsx             # 챗봇 메인 컴포넌트 (사전 답변 지원)
  ├── ChatMessage.tsx         # 채팅 메시지 컴포넌트 (마크다운 렌더링)
  ├── Sidebar.tsx             # 사이드바 네비게이션
  ├── MainContent.tsx         # 메인 콘텐츠 영역
  └── SidebarContext.tsx     # 사이드바 상태 관리

lib/
  ├── supabase.ts             # Supabase 클라이언트
  ├── gemini.ts               # Google Gemini API 클라이언트
  ├── markdown.tsx            # 마크다운 렌더링
  ├── question-matcher.ts    # 질문 매칭 및 분류
  ├── template-engine.ts     # 템플릿 엔진
  ├── analytics.ts            # 분석 및 통계
  ├── rag.ts                  # RAG 로직 (로컬용, 사용 안함)
  └── openai.ts               # OpenAI 클라이언트 (보존용)

supabase/
  └── functions/
      └── ai-portfolio/        # Edge Function
          ├── index.ts         # 메인 RAG 파이프라인
          ├── deno.json        # Deno 설정
          └── README.md        # 배포 가이드

data/
  ├── resume.json             # 이력서 데이터 (참고용)
  └── predefined-answers.ts  # 사전 준비된 질문 답변 ⭐

scripts/
  ├── seed-vector-db.ts       # resume.json으로 벡터 DB 생성
  ├── seed-from-tables.ts    # Supabase 테이블로 벡터 DB 생성 ⭐
  └── test-chatbot.ts        # 챗봇 테스트 스크립트
```

자세한 구조는 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)를 참고하세요.

## 사용 방법

1. **메인 페이지**: 포트폴리오 소개 및 프로젝트 정보 확인
2. **챗봇 페이지**: 사이드바의 "챗봇" 메뉴 클릭
3. **질문하기**:
   - 제안된 질문 버튼 클릭 (즉시 답변 제공) ⚡
   - 또는 직접 질문 입력 (AI가 벡터 검색 후 답변 생성)
4. **답변 확인**: 마크다운 형식으로 포맷된 답변 확인

### 예시 질문

- "어떤 기술 스택을 사용하세요?"
- "가장 최근에 진행한 프로젝트는 무엇인가요?"
- "현재 회사에서 무엇을 하나요?"
- "React 경험이 있나요?"
- "경력은 몇 년인가요?"

## 배포

### Vercel 배포 (권장)

Next.js 프로젝트는 Vercel에 배포하는 것이 가장 간단합니다.

1. GitHub 저장소에 코드를 푸시합니다.
2. [Vercel](https://vercel.com)에 프로젝트를 연결합니다.
3. 환경 변수를 설정합니다:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_EDGE_FUNCTION_URL`
4. 배포를 완료합니다.

자세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참고하세요.

### Supabase Edge Function 배포

Edge Function은 별도로 배포해야 합니다:

```bash
supabase functions deploy ai-portfolio --no-verify-jwt
```

자세한 내용은 [supabase/functions/ai-portfolio/README.md](./supabase/functions/ai-portfolio/README.md)를 참고하세요.

## 주요 특징

### ⚡ 즉시 응답 시스템
- 자주 묻는 질문에 대한 사전 준비된 답변
- API 호출 없이 즉시 응답 제공
- 빠른 사용자 경험

### 🔍 지능형 검색
- 의미론적 벡터 검색으로 정확한 정보 제공
- 질문 분류를 통한 토큰 최적화
- HNSW 인덱스로 고성능 검색

### 📝 풍부한 형식 지원
- 마크다운 렌더링
- 코드 블록 하이라이팅
- 리스트 및 강조 표시

### 🎨 모던 UI/UX
- 반응형 디자인
- 부드러운 애니메이션
- 직관적인 인터페이스

## 관련 문서

- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - 상세한 프로젝트 구조 설명
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 배포 가이드
- [SETUP.md](./SETUP.md) - 초기 설정 가이드
- [supabase/functions/ai-portfolio/README.md](./supabase/functions/ai-portfolio/README.md) - Edge Function 배포 가이드

## 라이선스

MIT

---

**Made with ❤️ using Next.js, Supabase, and Google Gemini**

