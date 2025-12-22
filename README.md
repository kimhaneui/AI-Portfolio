# AI 포트폴리오 웹사이트

RAG(Retrieval-Augmented Generation) 기반 AI 챗봇을 활용한 포트폴리오 웹사이트입니다.

## 기술 스택

- **프론트엔드**: Next.js 14, React, TypeScript, Tailwind CSS
- **백엔드**: Next.js Serverless Functions
- **데이터베이스**: Supabase (PostgreSQL + pgvector)
- **AI 모델**: OpenAI (GPT-3.5-turbo, text-embedding-3-small)
- **벡터 검색**: HNSW 인덱스 기반 고성능 유사도 검색

## 시스템 아키텍처

본 포트폴리오의 AI 채팅 시스템은 Serverless Functions 기반으로 한 RAG(검색 증강 생성) 및 Vector Search를 이용하여 구현하였습니다.

사용자가 질문을 하게 되면 다음과 같은 흐름으로 답변을 호출합니다:

1. **1단계 키워드 매칭**: 명시적인 정보를 Database에서 찾고, 명시적 검색결과가 없을 경우
2. **2단계 벡터 검색**: OpenAI 임베딩 모델(text-embedding-3-small, 768차원)을 활용한 벡터 유사도 검색(Vector Search)을 진행합니다.
3. **응답 생성**: HNSW 인덱스를 적용한 고성능 벡터 DB에서 의미적으로 가장 유사한 이력서 데이터를 찾아내어, GPT-3.5-turbo에게 최적의 컨텍스트를 제공함으로써 Hallucination가 발생하지 않는 정확한 답변을 생성합니다.

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

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

이력서 데이터를 벡터 DB에 삽입합니다:

```bash
npm run seed
```

### 6. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
app/
  ├── page.tsx                 # 메인 페이지
  ├── chat/
  │   └── page.tsx            # 챗봇 페이지
  ├── layout.tsx              # 루트 레이아웃 (사이드바 포함)
  └── api/
      ├── chat/route.ts       # 챗봇 API (RAG 처리)
      └── embed/route.ts      # 임베딩 생성 API
components/
  ├── Sidebar.tsx             # 사이드바 네비게이션
  ├── ChatBot.tsx             # 챗봇 UI 컴포넌트
  └── ChatMessage.tsx         # 채팅 메시지 컴포넌트
lib/
  ├── supabase.ts             # Supabase 클라이언트
  ├── openai.ts               # OpenAI 클라이언트
  └── rag.ts                  # RAG 로직 (키워드 매칭 + 벡터 검색)
data/
  └── resume.json             # 이력서 데이터 (초기 데이터)
scripts/
  └── seed-vector-db.ts       # 벡터 DB 초기화 스크립트
```

## 사용 방법

1. 메인 페이지에서 포트폴리오 소개를 확인하세요.
2. 사이드바의 "챗봇" 메뉴를 클릭하여 AI 챗봇 페이지로 이동하세요.
3. 챗봇에게 포트폴리오에 대한 질문을 자유롭게 물어보세요.

## 배포

Vercel에 배포하는 경우:

1. GitHub 저장소에 코드를 푸시합니다.
2. Vercel에 프로젝트를 연결합니다.
3. 환경 변수를 설정합니다.
4. 배포를 완료합니다.

## 라이선스

MIT

