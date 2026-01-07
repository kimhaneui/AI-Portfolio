# AI Portfolio 프로젝트 구조

## 📋 프로젝트 개요

RAG (Retrieval-Augmented Generation) 기반의 AI 챗봇 포트폴리오 웹사이트입니다.
Supabase 테이블 데이터를 벡터 DB로 변환하고, Google Gemini API를 통해 질문에 답변합니다.

## 🏗️ 기술 스택

### Frontend
- **Next.js 14** - React 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링

### Backend
- **Supabase Edge Functions** - 서버리스 함수 (Deno 런타임)
- **Supabase PostgreSQL + pgvector** - 벡터 데이터베이스
- **Google Gemini API** - AI 모델 (임베딩 + 채팅)

### 주요 라이브러리
- `@supabase/supabase-js` - Supabase 클라이언트
- `dotenv` - 환경 변수 관리

## 📁 디렉토리 구조

```
AI-Portfolio/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # 루트 레이아웃
│   ├── page.tsx                 # 홈페이지
│   ├── chat/
│   │   └── page.tsx            # 챗봇 페이지
│   └── api/
│       └── embed/
│           └── route.ts        # 임베딩 API (사용 안함, 보존용)
│
├── components/                   # React 컴포넌트
│   ├── ChatBot.tsx              # 챗봇 메인 컴포넌트 (Edge Function 호출)
│   ├── ChatMessage.tsx          # 채팅 메시지 컴포넌트
│   ├── Sidebar.tsx              # 사이드바
│   ├── MainContent.tsx          # 메인 콘텐츠
│   └── SidebarContext.tsx       # 사이드바 상태 관리
│
├── lib/                          # 유틸리티 라이브러리
│   ├── gemini.ts                # Google Gemini API 클라이언트
│   ├── supabase.ts              # Supabase 클라이언트 설정
│   ├── rag.ts                   # RAG 파이프라인 (로컬용, 사용 안함)
│   └── openai.ts                # OpenAI 클라이언트 (사용 안함, 보존용)
│
├── supabase/                     # Supabase 관련 파일
│   ├── functions/
│   │   └── ai-portfolio/        # Edge Function
│   │       ├── index.ts         # 메인 함수 (RAG 파이프라인)
│   │       ├── deno.json        # Deno 설정
│   │       └── README.md        # 배포 가이드
│   └── .temp/                   # CLI 캐시 (Git 무시)
│
├── scripts/                      # 유틸리티 스크립트
│   ├── seed-vector-db.ts        # resume.json으로 벡터 DB 생성
│   └── seed-from-tables.ts      # Supabase 테이블에서 벡터 DB 생성 ⭐
│
├── data/
│   └── resume.json              # 이력서 데이터 (참고용)
│
├── supabase-schema.sql           # Supabase DB 스키마
├── .env.local                    # 환경 변수 (로컬)
├── .env                          # 환경 변수 (백업)
├── .gitignore                    # Git 무시 파일
├── package.json                  # npm 의존성
└── tsconfig.json                 # TypeScript 설정
```

## 🗄️ Supabase 테이블 구조

### 1. `portfolio` 테이블
개인 정보를 저장하는 테이블
```sql
- name: TEXT
- email: TEXT
- phone: TEXT
- location: TEXT
- github: TEXT
- linkedin: TEXT
- summary: TEXT
```

### 2. `career` 테이블
경력 정보
```sql
- company: TEXT
- position: TEXT
- start_date: TEXT
- end_date: TEXT
- description: TEXT
- technologies: TEXT[]
```

### 3. `project` 테이블
프로젝트 정보
```sql
- project_name: TEXT
- description: TEXT
- role: TEXT
- technologies: TEXT[]
- github: TEXT
```

### 4. `skills` 테이블
기술 스택
```sql
- category: TEXT (예: frontend, backend, devops)
- skills: TEXT[]
```

### 5. `resume_embeddings` 테이블 (자동 생성)
벡터 검색용 테이블
```sql
- id: UUID
- content: TEXT
- embedding: vector(768)
- metadata: JSONB
- created_at: TIMESTAMP
```

### 6. `keyword_responses` 테이블
키워드 기반 빠른 응답
```sql
- id: UUID
- keyword: TEXT
- response: TEXT
- category: TEXT
- created_at: TIMESTAMP
```

## 🔧 환경 변수 설정

### `.env.local` / `.env`
```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://zdpehfjfqrvfmkpnyzbz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Supabase Edge Function URL
NEXT_PUBLIC_EDGE_FUNCTION_URL=https://zdpehfjfqrvfmkpnyzbz.supabase.co/functions/v1/ai-portfolio

# Google Gemini 설정
GEMINI_API_KEY=your_gemini_api_key
```

### Supabase Secrets (Edge Function용)
```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
```

## 📊 데이터 흐름

```
사용자 질문
    ↓
프론트엔드 (ChatBot.tsx)
    ↓
Edge Function (supabase/functions/ai-portfolio/index.ts)
    ↓
1. 키워드 매칭 (keyword_responses 테이블)
    ↓ (실패 시)
2. 질문 분류 (Gemini API)
    ↓
3. 카테고리별 벡터 검색 (resume_embeddings 테이블)
    ↓
4. 컨텍스트 기반 답변 생성 (Gemini API)
    ↓
프론트엔드에 응답 반환
```

## 🎯 주요 기능

### 1. **질문 분류 시스템** (토큰 최적화)
- 질문을 8개 카테고리로 자동 분류
- `personal`, `summary`, `experience`, `education`, `skills`, `projects`, `certifications`, `languages`, `greeting`
- 필요한 카테고리의 데이터만 검색하여 토큰 절약

### 2. **3단계 RAG 파이프라인**
```
1단계: 키워드 매칭 (빠른 응답)
   ↓ (실패)
2단계: 벡터 검색 (의미론적 검색)
   ↓
3단계: LLM 생성 (최종 응답)
```

### 3. **벡터 검색**
- Google Gemini `text-embedding-004` 모델 (768 dimensions)
- PostgreSQL pgvector 확장
- HNSW 인덱스로 고성능 검색
- 코사인 유사도 기반 매칭 (threshold: 0.7)

### 4. **Google Gemini API 통합**
- **임베딩**: `text-embedding-004`
- **채팅**: `gemini-1.5-flash`
- 한국어 응답 최적화

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. Supabase 테이블 생성
Supabase Dashboard > SQL Editor에서 `supabase-schema.sql` 실행

### 3. Supabase 테이블 데이터 입력
- `portfolio`, `career`, `project`, `skills` 테이블에 데이터 입력
- Supabase Dashboard > Table Editor에서 직접 입력

### 4. 벡터 DB 생성
```bash
npm run seed-tables
```
→ Supabase 테이블에서 데이터를 읽어 `resume_embeddings` 테이블 생성

### 5. Edge Function 배포
```bash
# Supabase 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref zdpehfjfqrvfmkpnyzbz

# 환경 변수 설정
supabase secrets set GEMINI_API_KEY=your_gemini_api_key

# 배포
supabase functions deploy ai-portfolio --no-verify-jwt
```

### 6. 로컬 개발 서버 실행
```bash
npm run dev
```
→ http://localhost:3000

## 📦 npm 스크립트

```json
{
  "dev": "next dev",                                    // 개발 서버 실행
  "build": "next build",                                // 프로덕션 빌드
  "start": "next start",                                // 프로덕션 서버
  "lint": "next lint",                                  // 린트
  "seed": "tsx -r dotenv/config scripts/seed-vector-db.ts",         // resume.json으로 시드
  "seed-tables": "tsx -r dotenv/config scripts/seed-from-tables.ts" // Supabase 테이블로 시드 ⭐
}
```

## 🔐 보안 주의사항

### Git에 커밋되면 안 되는 파일 (`.gitignore` 설정됨)
- `.env.local`
- `.env`
- `node_modules/`
- `.next/`
- `supabase/.temp/`

### 민감한 정보
- `SUPABASE_SERVICE_ROLE_KEY` - 절대 프론트엔드에서 사용 금지
- `GEMINI_API_KEY` - Edge Function에서만 사용
- `NEXT_PUBLIC_*` 변수만 프론트엔드에 노출됨

## 🐛 문제 해결

### Edge Function CORS 에러
- OPTIONS 요청이 try 블록 밖에서 먼저 처리되어야 함
- `status: 204`로 응답

### 벡터 DB 생성 실패
- Supabase 테이블에 데이터가 있는지 확인
- `resume_embeddings` 테이블이 생성되었는지 확인
- `match_resume_embeddings` 함수가 생성되었는지 확인

### Edge Function 배포 실패
- `supabase link` 실행했는지 확인
- `supabase secrets set GEMINI_API_KEY` 설정했는지 확인
- 홈 디렉토리(`~/supabase`)에 충돌하는 설정이 없는지 확인

## 📝 추가 개선 사항

### 현재 구현됨
- ✅ Google Gemini API 통합
- ✅ 질문 분류 시스템 (토큰 최적화)
- ✅ 카테고리별 벡터 검색
- ✅ Supabase Edge Function
- ✅ Supabase 테이블 기반 데이터

### 향후 개선 가능
- [ ] 대화 히스토리 저장
- [ ] 다국어 지원 (영어, 일본어 등)
- [ ] 사용자 피드백 수집
- [ ] 응답 캐싱으로 성능 개선
- [ ] 실시간 스트리밍 응답
- [ ] 이미지/파일 첨부 지원

## 📧 문의

프로젝트 관련 문의사항은 GitHub Issues로 남겨주세요.
