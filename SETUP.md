# 설치 가이드

## npm 캐시 권한 문제 해결

터미널에서 다음 명령어를 실행하여 npm 캐시 권한을 수정하세요:

```bash
sudo chown -R $(whoami) ~/.npm
```

또는

```bash
sudo chown -R 501:20 "/Users/kimhaneui/.npm"
```

## 의존성 설치

권한 문제를 해결한 후, 다음 명령어로 의존성을 설치하세요:

```bash
npm install --legacy-peer-deps
```

## 대안: yarn 사용

npm에 계속 문제가 있다면 yarn을 사용할 수 있습니다:

```bash
# yarn 설치 (없는 경우)
npm install -g yarn

# 의존성 설치
yarn install
```

## 개발 서버 실행

설치가 완료되면:

```bash
npm run dev
# 또는 yarn dev
```

