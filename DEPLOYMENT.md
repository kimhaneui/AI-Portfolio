# 배포 가이드

이 프로젝트를 배포하는 방법을 안내합니다.

## 배포 플랫폼

Next.js 프로젝트는 **Vercel**에 배포하는 것이 가장 간단하고 권장됩니다.

## 1. Vercel 배포 방법

### 1.1 GitHub에 코드 푸시

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

### 1.2 Vercel에 프로젝트 연결

1. [Vercel](https://vercel.com)에 로그인
2. "Add New Project" 클릭
3. GitHub 저장소 선택
4. 프로젝트 설정:
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (자동 설정됨)
   - **Output Directory**: `.next` (자동 설정됨)

### 1.3 환경 변수 설정

Vercel 대시보드에서 **Settings > Environment Variables**로 이동하여 다음 환경 변수를 추가하세요:

#### 필수 환경 변수

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://zdpehfjfqrvfmkpnyzbz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Edge Function URL
NEXT_PUBLIC_EDGE_FUNCTION_URL=https://zdpehfjfqrvfmkpnyzbz.supabase.co/functions/v1/ai-portfolio
```

#### 선택적 환경 변수 (서버 사이드에서만 사용)

```env
# Supabase Service Role Key (서버 사이드 API에서만 사용)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI API Key (서버 사이드에서만 사용)
OPENAI_API_KEY=your_openai_api_key
```

**참고**: 
- `NEXT_PUBLIC_` 접두사가 붙은 변수는 클라이언트 사이드에서도 접근 가능합니다.
- 환경 변수는 **Production**, **Preview**, **Development** 환경별로 설정할 수 있습니다.

### 1.4 배포

1. "Deploy" 버튼 클릭
2. 배포가 완료되면 자동으로 URL이 생성됩니다 (예: `https://your-project.vercel.app`)

## 2. 환경별 URL 설정

### 2.1 Edge Function URL 확인

Supabase Edge Function이 배포되어 있다면, 다음 형식의 URL을 사용합니다:

```
https://{project-ref}.supabase.co/functions/v1/ai-portfolio
```

`{project-ref}`는 Supabase 프로젝트의 참조 ID입니다.

### 2.2 환경 변수로 URL 관리

현재 `ChatBot.tsx`에서는 다음과 같이 환경 변수를 사용합니다:

```typescript
const edgeFunctionUrl =
  process.env.NEXT_PUBLIC_EDGE_FUNCTION_URL ||
  "https://zdpehfjfqrvfmkpnyzbz.supabase.co/functions/v1/ai-portfolio";
```

**배포 시**:
- Vercel 환경 변수에 `NEXT_PUBLIC_EDGE_FUNCTION_URL`을 설정하면 해당 값이 사용됩니다.
- 설정하지 않으면 기본값(하드코딩된 URL)이 사용됩니다.

## 3. 다른 배포 플랫폼

### 3.1 Netlify

1. [Netlify](https://www.netlify.com)에 로그인
2. "Add new site" > "Import an existing project"
3. GitHub 저장소 연결
4. 빌드 설정:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. 환경 변수 설정 (Vercel과 동일)

### 3.2 자체 서버 (Node.js)

```bash
# 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

환경 변수는 `.env.production` 파일 또는 서버 환경 변수로 설정하세요.

## 4. 배포 후 확인 사항

### 4.1 챗봇 기능 테스트

1. 배포된 URL로 접속
2. 챗봇 페이지로 이동
3. 질문 제안 버튼 클릭하여 사전 답변이 표시되는지 확인
4. 직접 질문 입력하여 API 응답 확인

### 4.2 환경 변수 확인

브라우저 개발자 도구 콘솔에서 환경 변수가 올바르게 로드되었는지 확인:

```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log(process.env.NEXT_PUBLIC_EDGE_FUNCTION_URL)
```

**주의**: `NEXT_PUBLIC_` 접두사가 없는 환경 변수는 클라이언트에서 접근할 수 없습니다.

## 5. 문제 해결

### 5.1 CORS 오류

Supabase Edge Function에서 CORS 헤더가 올바르게 설정되어 있는지 확인하세요.

### 5.2 환경 변수 미적용

- Vercel에서 환경 변수 변경 후 **재배포**가 필요합니다.
- 빌드 시점에 환경 변수가 주입되므로, 변경 후 새로 빌드해야 합니다.

### 5.3 Edge Function 연결 실패

- Supabase Edge Function이 배포되어 있는지 확인
- Edge Function URL이 올바른지 확인
- Supabase 프로젝트의 CORS 설정 확인

## 6. CI/CD 자동 배포

GitHub Actions를 사용하여 자동 배포를 설정할 수도 있습니다:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 7. 커스텀 도메인 설정

Vercel에서:
1. 프로젝트 설정 > Domains
2. 원하는 도메인 추가
3. DNS 설정 안내에 따라 DNS 레코드 추가

## 참고 자료

- [Vercel 배포 가이드](https://vercel.com/docs)
- [Next.js 배포 문서](https://nextjs.org/docs/deployment)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

