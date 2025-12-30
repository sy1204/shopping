# 회원관리 체계(Auth) 구현 워크스루

이 문서는 **Phase 2: 회원관리 체계 구축** 작업을 통해 변경된 주요 아키텍처와 파일 내역을 설명합니다.

## 1. 아키텍처 변경 요약
- **인증 방식**: Supabase Auth (JWT) 기반 인증 도입.
- **데이터 보안**: RLS(Row Level Security)를 통해 본인 데이터만 접근 가능하도록 제한.
- **프론트엔드 구조**: 단일 페이지(`App.jsx`)에서 라우터 기반(`Dashboard`, `Login`, `Signup`) 구조로 리팩토링.

## 2. 백엔드 변경 사항 (`price-tracker-server/`)

### 2.1 데이터베이스 마이그레이션 (`migrations/01_auth_setup.sql`)
- `subscriptions` 테이블에 `user_id` 컬럼 추가 (필수).
- RLS 정책을 활성화하여 `user_id`가 일치하는 사용자만 데이터를 조회/수정할 수 있도록 설정.

### 2.2 인증 미들웨어 (`middleware/auth.js`)
- API 요청 헤더의 `Authorization: Bearer <token>`을 파싱.
- Supabase Client를 통해 토큰 유효성을 검증하고 `req.user`에 사용자 정보를 저장.

### 2.3 API 라우트 (`index.js`)
- `/api/subscriptions` (GET/POST): `authMiddleware`가 적용됨.
- 이제 관심 상품 목록은 **로그인한 사용자의 것만** 필터링되어 반환됩니다.

## 3. 프론트엔드 변경 사항 (`price-tracker/`)

### 3.1 라우팅 및 리팩토링
- **`App.jsx`**: 전체 애플리케이션의 엔트리 포인트. `AuthContext`와 `Router`를 설정.
- **`Dashboard.jsx`**: 기존 `App.jsx`의 메인 로직을 이동시킴. 로그인 후 보여지는 메인 화면.
- **`components/ProtectedRoute.jsx`**: 비로그인 사용자가 대시보드 접근 시 로그인 페이지로 강제 이동.

### 3.2 인증 페이지
- **`pages/Login.jsx`**: 이메일/비밀번호 로그인 폼.
- **`pages/Signup.jsx`**: 간편 회원가입 폼.

### 3.3 인증 상태 관리 (`contexts/AuthContext.jsx`)
- 앱 전역에서 로그인 상태(`user`, `session`)를 공유.
- 새로고침 해도 로그인이 유지되도록 Supabase 세션 리스너 등록.

---

## 4. 실행 및 테스트 방법

### Step 1: Supabase 설정 (필수)
`price-tracker/.env` 파일을 생성하고 아래 내용을 입력해야 합니다.
```env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### Step 2: DB 업데이트
Supabase 대시보드 SQL Editor에서 `migrations/01_auth_setup.sql` 내용을 복사하여 실행합니다.

### Step 3: 서버 재시작
```bash
# 백엔드
cd price-tracker-server
npm install
node index.js

# 프론트엔드
cd price-tracker
npm install
npm run dev
```
