# AI Portfolio Edge Function

이 Edge Function은 RAG(Retrieval-Augmented Generation) 파이프라인을 사용하여 포트폴리오 관련 질문에 답변합니다.

## 기능

- 키워드 기반 매칭으로 빠른 응답
- pgvector를 활용한 벡터 유사도 검색
- OpenAI GPT를 사용한 자연어 응답 생성

## 배포 방법

### 1. Supabase CLI 설치

```bash
# Mac (Homebrew)
brew install supabase/tap/supabase

# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# NPM (모든 플랫폼)
npm install -g supabase
```

### 2. Supabase CLI 로그인

```bash
supabase login
```

브라우저에서 인증을 완료합니다.

### 3. 프로젝트에 연결

```bash
# 프로젝트 루트 디렉토리에서 실행
supabase link --project-ref zdpehfjfqrvfmkpnyzbz
```

### 4. 환경 변수 설정

Supabase Dashboard에서 Edge Function의 환경 변수를 설정합니다:

**Settings > Edge Functions > Configuration**

필요한 환경 변수:
- `OPENAI_API_KEY`: OpenAI API 키
- `SUPABASE_URL`: Supabase 프로젝트 URL (자동 설정됨)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role 키 (자동 설정됨)

또는 CLI로 설정:

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

### 5. Edge Function 배포

```bash
# 특정 함수만 배포
supabase functions deploy ai-portfolio

# 또는 모든 함수 배포
supabase functions deploy
```

배포 완료 후 다음과 같은 URL에서 접근 가능합니다:
```
https://zdpehfjfqrvfmkpnyzbz.supabase.co/functions/v1/ai-portfolio
```

## 로컬 테스트

### 1. 로컬에서 Edge Function 실행

```bash
# Supabase 로컬 환경 시작
supabase start

# Edge Function 로컬 실행
supabase functions serve ai-portfolio --env-file .env.local
```

### 2. 로컬 테스트 요청

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/ai-portfolio' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"message":"안녕하세요"}'
```

## API 사용법

### 요청 형식

```
POST https://zdpehfjfqrvfmkpnyzbz.supabase.co/functions/v1/ai-portfolio
```

**Headers:**
```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

**Body:**
```json
{
  "message": "사용자의 질문"
}
```

### 응답 형식

**성공 (200):**
```json
{
  "response": "AI의 응답 텍스트"
}
```

**에러 (400/500):**
```json
{
  "error": "에러 메시지",
  "details": "상세 에러 정보 (개발 환경에서만)"
}
```

## 모니터링

### 로그 확인

```bash
# 실시간 로그 스트리밍
supabase functions logs ai-portfolio --tail

# 특정 개수의 로그만 보기
supabase functions logs ai-portfolio --limit 100
```

### Supabase Dashboard

**Functions > ai-portfolio > Logs** 에서 웹 UI로 로그를 확인할 수 있습니다.

## 문제 해결

### Edge Function이 배포되지 않는 경우

1. Supabase CLI가 최신 버전인지 확인:
   ```bash
   supabase --version
   supabase update
   ```

2. 프로젝트 연결 상태 확인:
   ```bash
   supabase projects list
   ```

### 환경 변수가 작동하지 않는 경우

1. Supabase Dashboard에서 환경 변수가 올바르게 설정되었는지 확인
2. Edge Function을 재배포:
   ```bash
   supabase functions deploy ai-portfolio --no-verify-jwt
   ```

### CORS 에러가 발생하는 경우

Edge Function 코드에 이미 CORS 헤더가 포함되어 있습니다. 프론트엔드에서 올바른 Authorization 헤더를 포함하고 있는지 확인하세요.

## 관련 파일

- `/supabase/functions/ai-portfolio/index.ts` - Edge Function 메인 코드
- `/components/ChatBot.tsx` - 프론트엔드에서 Edge Function 호출
- `/.env.local` - 환경 변수 설정

## 참고 자료

- [Supabase Edge Functions 문서](https://supabase.com/docs/guides/functions)
- [Deno Deploy 문서](https://deno.com/deploy/docs)
