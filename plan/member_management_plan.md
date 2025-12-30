# 회원관리 체계 구축 계획 (Member Management System Plan)

## 1. 개요 및 목표
현재 누구나 데이터를 보고 수정할 수 있는 "단일 사용자(또는 공개)" 모델에서, **사용자별로 개인화된 데이터(관심 상품, 메모, 알림 설정)를 관리**하는 시스템으로 전환합니다.
**Supabase Auth**를 핵심 인증 솔루션으로 사용하여 안정적이고 빠른 구축을 지향합니다.

## 2. 아키텍처 변화
- **Current**: Frontend -> API (No Auth) -> DB (RLS: Allow All)
- **Target**: Frontend (Auth Token) -> API (Verify Token) -> DB (RLS: Per User)

---

## 3. 상세 구현 계획

### Phase 1: 데이터베이스 스키마 및 보안 정책 (Supabase)
> **목표**: 데이터의 소유권을 명확히 하고, 본인 데이터만 접근하도록 제한합니다.

1.  **테이블 수정**:
    - `subscriptions` 테이블에 `user_id` 컬럼 추가 (FK: `auth.users.id`).
    - (Option) `profiles` 테이블 생성 (닉네임, 아바타 등 관리).

2.  **RLS (Row Level Security) 정책 강화**:
    - 기존 `Allow All Access` 정책 제거.
    - **Subscriptions**: `auth.uid() = user_id` 조건으로 SELECT, INSERT, UPDATE, DELETE 제한.
    - **Products/Product Links**:
        - 공용 데이터(상품 정보, 가격 이력)는 누구나 읽기 가능(SELECT True).
        - 쓰기(INSERT/UPDATE)는 인증된 사용자(Authenticated)만 가능.

### Phase 2: 백엔드 인증 미들웨어 (Express)
> **목표**: API 요청 시 유효한 사용자인지 검증합니다.

1.  **Auth Middleware 구현**:
    - 요청 헤더(`Authorization: Bearer <token>`)에서 JWT 토큰 추출.
    - Supabase Client(`getUser`)를 통해 토큰 유효성 및 사용자 ID 식별.
    - `req.user` 객체 생성.

2.  **API 엔드포인트 수정**:
    - `GET /api/subscriptions`: `req.user.id`에 해당하는 데이터만 반환하도록 쿼리 수정.
    - `POST /api/subscriptions`: 생성 시 `user_id`를 자동으로 주입.

### Phase 3: 프론트엔드 인증 연동 (React)
> **목표**: 사용자가 로그인/가입을 하고 자신의 상태를 유지할 수 있어야 합니다.

1.  **Auth Context 구축**:
    - `AuthProvider`를 통해 전역 로그인 상태(Session, User) 관리.
    - 새로고침 시 세션 유지 (Supabase 자동 처리 활용).

2.  **UI 구현**:
    - **로그인/회원가입 페이지**: 이메일/비밀번호 기반 심플 UI.
    - **헤더 프로필 영역**: 비로그인 시 '로그인' 버튼, 로그인 시 '프로필/로그아웃' 메뉴 노출.
    - **보호된 라우트(Protected Route)**: 로그인 안 된 사용자가 '내 관심 상품' 접근 시 로그인 페이지로 리다이렉트.

---

## 4. 단계별 실행 순서 (Task List)

### Step 1: DB 마이그레이션 & 정책 설정
- [ ] `subscriptions` 테이블 `user_id` 컬럼 추가 (SQL).
- [ ] 기존 데이터 처리 (기본 계정으로 귀속시키거나 초기화).
- [ ] RLS 정책 스크립트 작성 및 적용.

### Step 2: 백엔드 API 보안 적용
- [ ] `middleware/auth.js` 작성.
- [ ] `routes/subscription.js` 로직에 `user_id` 필터링 적용.

### Step 3: 프론트엔드 인증 UI
- [ ] Supabase Auth 컴포넌트 연동 (또는 커스텀 UI).
- [ ] 로그인/회원가입 페이지 구현.
- [ ] 헤더 UI 변경 (로그인 상태 반영).

### Step 4: 통합 테스트
- [ ] 신규 가입 -> 상품 검색 -> 관심 상품 등록 -> 로그아웃 -> 재로그인 -> 데이터 확인.
- [ ] 다른 계정으로 로그인 시 이전 계정 데이터가 보이지 않는지 검증.
