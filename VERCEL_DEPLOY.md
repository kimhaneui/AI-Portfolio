# Vercel 배포 가이드

## 1. GitHub에 코드 푸시

먼저 변경사항을 GitHub에 푸시하세요:

```bash
git push origin main
```

인증 문제가 있다면:
- GitHub Personal Access Token 사용
- 또는 SSH 키 설정

## 2. Vercel 배포 단계

### 2.1 Vercel 계정 생성/로그인

1. [Vercel](https://vercel.com) 접속
2. GitHub 계정으로 로그인

### 2.2 프로젝트 가져오기

1. Vercel 대시보드에서 **"Add New Project"** 클릭
2. GitHub 저장소 목록에서 **"AI-Portfolio"** 선택
3. **"Import"** 클릭

### 2.3 프로젝트 설정

Vercel이 자동으로 Next.js를 감지합니다. 확인 사항:

- **Framework Preset**: Next.js ✅
- **Root Directory**: `./` ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `.next` ✅
- **Install Command**: `npm install` ✅

### 2.4 환경 변수 설정 (중요!)

**Settings > Environment Variables**에서 다음 변수들을 추가하세요:

#### 필수 환경 변수 (Production, Preview, Development 모두)

```env
NEXT_PUBLIC_SUPABASE_URL=https://zdpehfjfqrvfmkpnyzbz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_EDGE_FUNCTION_URL=https://zdpehfjfqrvfmkpnyzbz.supabase.co/functions/v1/ai-portfolio
```

**각 변수 추가 방법:**
1. **Key**: `NEXT_PUBLIC_SUPABASE_URL`
2. **Value**: 실제 Supabase URL 입력
3. **Environment**: Production, Preview, Development 모두 선택
4. **Save** 클릭

위 과정을 각 환경 변수마다 반복하세요.

### 2.5 배포 실행

1. **"Deploy"** 버튼 클릭
2. 배포 진행 상황 확인 (약 2-3분 소요)
3. 배포 완료 후 URL 확인 (예: `https://ai-portfolio-xxx.vercel.app`)

## 3. 배포 후 확인

### 3.1 기본 기능 테스트

1. 배포된 URL 접속
2. 메인 페이지 확인
3. 챗봇 페이지 이동
4. 질문 제안 버튼 클릭 (사전 답변 확인)
5. 직접 질문 입력 (API 응답 확인)

### 3.2 환경 변수 확인

브라우저 개발자 도구 (F12) > Console에서:

```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log(process.env.NEXT_PUBLIC_EDGE_FUNCTION_URL)
```

**주의**: `NEXT_PUBLIC_` 접두사가 없는 변수는 클라이언트에서 접근 불가능합니다.

## 4. 문제 해결

### 4.1 빌드 실패

- **원인**: 환경 변수 미설정 또는 잘못된 값
- **해결**: 환경 변수 다시 확인 및 재배포

### 4.2 챗봇 응답 실패

- **원인**: Edge Function URL 오류 또는 CORS 문제
- **해결**: 
  - `NEXT_PUBLIC_EDGE_FUNCTION_URL` 확인
  - Supabase Edge Function이 배포되어 있는지 확인
  - Edge Function CORS 설정 확인

### 4.3 환경 변수 변경 후 미적용

- **원인**: 환경 변수는 빌드 시점에 주입됨
- **해결**: 환경 변수 변경 후 **재배포** 필요

## 5. 자동 배포 설정

GitHub에 푸시할 때마다 자동 배포되도록 설정:

1. Vercel 프로젝트 설정 > **Git**
2. **Production Branch**: `main` 확인
3. **Auto-deploy**: 활성화 확인

이제 `main` 브랜치에 푸시하면 자동으로 배포됩니다.

## 6. 커스텀 도메인 설정 (선택사항)

1. Vercel 프로젝트 > **Settings** > **Domains**
2. 원하는 도메인 입력
3. DNS 설정 안내에 따라 레코드 추가
4. 인증 완료 대기 (보통 몇 분 소요)

## 7. 환경 변수 체크리스트

배포 전 확인:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정됨
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정됨
- [ ] `NEXT_PUBLIC_EDGE_FUNCTION_URL` 설정됨
- [ ] 모든 환경 변수가 Production, Preview, Development에 설정됨
- [ ] Supabase Edge Function이 배포되어 있음
- [ ] Edge Function의 GEMINI_API_KEY가 설정되어 있음

## 참고

- Vercel 무료 플랜: 무제한 프로젝트, 자동 HTTPS, 글로벌 CDN
- 빌드 시간: 보통 2-3분
- 배포 URL 형식: `https://{project-name}-{hash}.vercel.app`

