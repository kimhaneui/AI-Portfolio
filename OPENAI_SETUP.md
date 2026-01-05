# OpenAI API 키 설정 가이드

## OpenAI API 키 발급 방법

### 1. OpenAI 웹사이트 접속
- [OpenAI Platform](https://platform.openai.com)에 접속하세요
- 또는 직접: https://platform.openai.com

### 2. 로그인/회원가입
- 기존 계정이 있으면 로그인
- 없으면 회원가입 (이메일 또는 Google/Microsoft 계정 사용 가능)

### 3. API 키 생성
1. 로그인 후 우측 상단의 **프로필 아이콘** 클릭
2. **"View API keys"** 또는 **"API keys"** 메뉴 선택
3. **"+ Create new secret key"** 버튼 클릭
4. 키 이름 입력 (예: "portfolio-chatbot")
5. **"Create secret key"** 클릭
6. **중요**: 생성된 키를 즉시 복사하세요! (다시 볼 수 없습니다)

### 4. 환경 변수에 설정
`.env.local` 파일을 열고 다음처럼 설정하세요:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. API 사용량 확인
- [Usage 페이지](https://platform.openai.com/usage)에서 사용량 확인
- 무료 크레딧이 제공되지만, 유료 플랜으로 업그레이드 가능

## 주의사항

⚠️ **보안 주의사항:**
- API 키는 절대 공개 저장소(GitHub 등)에 커밋하지 마세요
- `.env.local` 파일은 `.gitignore`에 포함되어 있어 안전합니다
- 키가 노출되면 즉시 삭제하고 새로 생성하세요

## 비용 정보

- GPT-3.5-turbo: 매우 저렴 (1,000 토큰당 약 $0.0015)
- text-embedding-3-small: 매우 저렴 (1,000 토큰당 약 $0.00002)
- 처음 가입 시 무료 크레딧 제공 (제한적)

## 문제 해결

### API 키가 작동하지 않는 경우
1. 키가 올바르게 복사되었는지 확인
2. `.env.local` 파일이 프로젝트 루트에 있는지 확인
3. 개발 서버를 재시작 (`npm run dev`)
4. OpenAI 대시보드에서 키가 활성화되어 있는지 확인

### 사용량 한도 초과
- [Usage Limits](https://platform.openai.com/account/limits)에서 한도 확인
- 필요시 유료 플랜으로 업그레이드

