# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## 프로젝트: 잔재미코딩 굿즈샵

**기술 스택:** HTML/CSS/Vanilla JS + Supabase + Toss Payments (테스트 모드)
**호스팅:** GitHub Pages (`https://dycmqk02-hub.github.io/vibecoding_web/`)

### 개발 방법
빌드 없음. 파일을 직접 브라우저에서 열거나 로컬 서버 실행:
```powershell
python -m http.server 3000
# 브라우저에서 http://localhost:3000 접속
```

### 주요 설정값 위치
- Supabase URL / Anon Key / Toss Client Key → `js/config.js`
- Toss Secret Key → Supabase Edge Function 시크릿 (`TOSS_SECRET_KEY`)
- 공통 스타일 → `css/style.css`

### 관리자 계정
- ID: `admin@admin.com` / PW: `superadmin`
- 관리자 판별: `session.user.app_metadata.role === 'admin'` (JWT에서 확인)

### Supabase 프로젝트
- Project ID: `jofpwwcoxpkphgdyvole`
- Edge Function: `confirm-payment` (Toss 결제 확인, verify_jwt: false)

### 페이지 구성
| 파일 | 역할 |
|---|---|
| `index.html` | 상품 목록 + 결제 시작 |
| `auth.html` | 로그인 / 회원가입 |
| `orders.html` | 내 주문 내역 (로그인 필요) |
| `admin.html` | 전체 주문 관리 (관리자 전용) |
| `success.html` | Toss 결제 성공 리다이렉트 |
| `fail.html` | Toss 결제 실패 리다이렉트 |

### 결제 흐름 요약
1. 상품 선택 → DB에 `status: 'pending'` 주문 생성
2. Toss SDK `requestPayment()` 호출
3. 결제 완료 → `success.html?paymentKey=...&orderId=...&amount=...` 리다이렉트
4. `success.html` → Edge Function `confirm-payment` 호출
5. Edge Function → Toss API 확인 → DB `status: 'paid'` 업데이트
