# ARCH.md — 잔재미 굿즈샵 아키텍처

## 디렉토리 구조

```
vibecoding_web/
├── index.html          상품 목록 + 결제 시작
├── auth.html           로그인 / 회원가입
├── orders.html         내 주문 내역
├── admin.html          관리자 전체 주문
├── success.html        Toss 결제 성공 처리
├── fail.html           Toss 결제 실패 안내
├── js/
│   └── config.js       Supabase 클라이언트 초기화 + 공용 유틸
├── css/
│   └── style.css       라이트 테마 스타일 시스템
├── supabase/
│   └── functions/
│       └── confirm-payment/
│           └── index.ts  Toss 결제 확인 Edge Function
├── CLAUDE.md           프로젝트 핵심 정보 (Claude 지침)
└── ARCH.md             이 파일
```

---

## 기술 스택

| 계층 | 기술 |
|---|---|
| 프론트엔드 | HTML / CSS / Vanilla JS (빌드 도구 없음) |
| 인증 | Supabase Auth (이메일/비밀번호, 이메일 인증 비활성) |
| 데이터베이스 | PostgreSQL (Supabase 관리) |
| 서버리스 | Supabase Edge Function (Deno) |
| 결제 | Toss Payments v1 SDK (테스트 모드) |
| 호스팅 | GitHub Pages (main 브랜치 루트) |

---

## DB 스키마

### `products` 테이블
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
name        TEXT NOT NULL
description TEXT
price       INTEGER NOT NULL          -- 원(₩) 단위 정수
image_url   TEXT
stock       INTEGER DEFAULT 99
active      BOOLEAN DEFAULT true      -- false면 상점 미노출
created_at  TIMESTAMPTZ DEFAULT now()
```

### `orders` 테이블
```sql
id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id          UUID REFERENCES auth.users(id) NOT NULL
product_id       UUID REFERENCES products(id) NOT NULL
product_name     TEXT NOT NULL         -- 주문 시점 상품명 스냅샷
product_image    TEXT
quantity         INTEGER DEFAULT 1
amount           INTEGER NOT NULL      -- 실제 결제 금액
status           TEXT DEFAULT 'pending'
                 -- pending | paid | failed | cancelled
toss_payment_key TEXT                  -- 결제 완료 후 채워짐
toss_order_id    TEXT UNIQUE           -- 고유 주문 ID
created_at       TIMESTAMPTZ DEFAULT now()
```

---

## RLS 정책 요약

| 테이블 | 작업 | 조건 |
|---|---|---|
| products | SELECT | 누구나 (공개) |
| products | ALL | `app_metadata.role = 'admin'` |
| orders | SELECT | 본인(`user_id`) 또는 관리자 |
| orders | INSERT | 본인만 |
| orders | UPDATE | 본인 또는 관리자 |

---

## 인증 방식

- **클라이언트:** `supabase.auth.signInWithPassword()` / `signUp()`
- **이메일 인증:** 비활성화 (Supabase Dashboard → Auth → Settings)
- **관리자 판별:** `session.user.app_metadata.role === 'admin'`
- **관리자 role 부여 (SQL):**
  ```sql
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
  WHERE email = 'admin@admin.com';
  ```

---

## 결제 흐름

```
1. [index.html] 사용자 상품 선택 → openModal()
2. [index.html] pay() 호출:
   a. Supabase INSERT orders { status: 'pending', toss_order_id }
   b. TossPayments.requestPayment('카드', { ... })
3. [Toss] 사용자 결제 수행
4. [success.html] 리다이렉트: ?paymentKey=...&orderId=...&amount=...
5. [success.html] POST confirm-payment { paymentKey, orderId, amount }
6. [confirm-payment Edge Function]:
   a. DB에서 toss_order_id로 주문 조회
   b. amount 일치 검증 (변조 방지)
   c. POST https://api.tosspayments.com/v1/payments/confirm
   d. orders UPDATE { status: 'paid', toss_payment_key }
7. [success.html] 결과 표시
```

---

## Edge Function: `confirm-payment`

- **위치:** `supabase/functions/confirm-payment/index.ts`
- **verify_jwt:** false (anon key 헤더로 접근 가능)
- **환경변수:**
  - `SUPABASE_URL` — 자동 주입
  - `SUPABASE_SERVICE_ROLE_KEY` — 자동 주입
  - `TOSS_SECRET_KEY` — 수동 설정 필요

---

## `js/config.js` 공용 함수

| 함수 | 설명 |
|---|---|
| `getSession()` | 현재 Supabase 세션 반환 |
| `requireAuth()` | 미로그인 시 auth.html로 이동 |
| `requireAdmin()` | 비관리자 시 index.html로 이동 |
| `signOut()` | 로그아웃 후 index.html로 이동 |
| `formatPrice(won)` | `₩12,000` 형식 변환 |
| `formatDate(iso)` | 한국어 날짜/시각 형식 변환 |
| `statusBadge(status)` | 상태 뱃지 HTML 반환 |
| `updateNav()` | 로그인 상태에 따라 네비 업데이트 |

---

## 로컬 개발

```powershell
python -m http.server 3000
# http://localhost:3000 접속
```

GitHub Pages 배포: `main` 브랜치에 push하면 자동 반영.
- URL: `https://dycmqk02-hub.github.io/willremove/`
