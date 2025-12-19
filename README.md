# Servier SY Web

pinkroom-web과 동일한 환경으로 구성된 Next.js 프로젝트입니다.

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# JWT Secret for admin authentication
AUTH_JWT_SECRET=your-secret-key-here-change-in-production

# Admin password
AUTH_PASSWORD=your-admin-password-here

# Cookie domain (optional, for production)
# AUTH_COOKIE_DOMAIN=.yourdomain.com

# NextAuth Secret (for user authentication if needed)
NEXTAUTH_SECRET=your-nextauth-secret-here

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

- `pages/` - Next.js 페이지 라우팅
  - `admin/login.tsx` - 관리자 로그인 페이지
  - `admin/index.tsx` - 관리자 대시보드 (로그인 후 랜딩 화면)
  - `api/auth/` - 인증 관련 API
- `components/` - React 컴포넌트
  - `AdminLayout.tsx` - 관리자 레이아웃
  - `Sidebar.tsx` - 사이드바 네비게이션
- `libs/` - 공통 라이브러리
  - `server/` - 서버 사이드 유틸리티
  - `client/` - 클라이언트 사이드 유틸리티 및 훅
- `middleware.ts` - Next.js 미들웨어 (인증 처리)

## 주요 기능

- **관리자 로그인**: 비밀번호 기반 JWT 인증
- **API 호출**: `useApiMutation`, `useApiQuery` 훅 사용
- **라우팅**: Next.js Pages Router 방식
- **스타일링**: Tailwind CSS v4

## 로그인 방법

1. `/admin/login` 페이지로 이동
2. 환경 변수에 설정한 `AUTH_PASSWORD`를 입력
3. 로그인 성공 시 `/admin` 페이지로 리다이렉트됩니다.

