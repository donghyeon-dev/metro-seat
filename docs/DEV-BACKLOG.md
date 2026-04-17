# 자리요 — 개발 백로그

> 현 코드베이스(프로덕션 준비도 25%) 기준, 3개월 MVP 증명에 필요한 개발 항목.
> 스프린트 매핑은 `ROADMAP.md` 참조. 상세 전략은 `docs/STRATEGY.md`.

---

## 우선순위 범례
- 🔴 P0 — 없으면 Sprint 0 출시 불가
- 🟠 P1 — Sprint 1~2 필수
- 🟡 P2 — Sprint 3 이후
- ⚪ P3 — 검증 후 결정

---

## 1. 브랜드·표기

| # | 항목 | 우선 | 위치 |
|---|------|------|------|
| B-1 | `public/manifest.json` name/short_name "자리요" | 🔴 | public/manifest.json |
| B-2 | `src/app/layout.tsx` metadata title·description | 🔴 | src/app/layout.tsx:10-16 |
| B-3 | 홈 헤더 "메트로시트" → "자리요" | 🔴 | src/app/page.tsx:51 |
| B-4 | favicon·app-icon SVG 교체 | 🔴 | public/favicon.svg, public/icons/* |
| B-5 | `localStorage` 키 `metro-seat:*` → 호환 유지하되 신규는 `jariyo:*` | 🟡 | LoginNudge, provide draft 등 |
| B-6 | Open Graph 이미지 (`public/og.png` 1200x630) | 🟠 | 브랜드 컬러+태그라인 |
| B-7 | Twitter Card meta | 🟠 | layout.tsx |

## 2. 배포·관측 (Sprint 0)

| # | 항목 | 우선 |
|---|------|------|
| D-1 | Sentry Next.js 통합 (`@sentry/nextjs`) | 🔴 |
| D-2 | GA4 gtag script + 5 이벤트 | 🔴 |
| D-3 | `/api/healthz` 엔드포인트 | 🟠 |
| D-4 | `next.config.js` CSP·보안 헤더 | 🔴 |
| D-5 | `robots.txt`, `sitemap.xml` | 🟠 |
| D-6 | 이용약관·개인정보·disclaimer 3페이지 | 🔴 |
| D-7 | `.github/workflows/ci.yml` lint+build | 🟠 |

## 3. Provider 동기 실험 (Sprint 1)

| # | 항목 | 우선 | 메모 |
|---|------|------|------|
| P-1 | 홈 "지금 내리는 중" 플로팅 버튼 | 🟠 | 최근 사용 호선·역 기준 1탭 등록 |
| P-2 | 매칭 성공 애니메이션 + 뱃지 카운터 | 🟠 | Lottie 대신 CSS keyframes로 경량화 |
| P-3 | Provider 공개 프로필 (익명) | 🟠 | 누적 양도 N회, 최근 활동 |
| P-4 | A/B 플래그 시스템 | 🟠 | 간이 구현: localStorage 버킷팅 + GA4 dimension |
| P-5 | 세션 종료 후 "오늘도 자리요?" 푸시 (PWA) | 🟡 | 동의 기반, Notification API |

## 4. Seeker 실망 완화 (Sprint 2)

| # | 항목 | 우선 |
|---|------|------|
| S-1 | 좌석맵에 "최근 매칭 성공률 %" 뱃지 | 🟠 |
| S-2 | 매칭 실패 후 "다음 열차에서 다시" 재탐색 CTA | 🟠 |
| S-3 | 양방 템플릿 메시지 (5개 고정 옵션) | 🟠 |
| S-4 | Seeker "도착했어요" 버튼 → Provider 확인 루프 | 🟠 |
| S-5 | "다른 사람이 앉았어요" 자동 취소 | 🟠 |

## 5. 신뢰·안전

| # | 항목 | 우선 | 메모 |
|---|------|------|------|
| T-1 | 신고 UI 연결 (DB는 있음) | 🟠 | 1탭 신고, 사유 3종 |
| T-2 | 좌석 거래·판매 키워드 자동 차단 | 🔴 | 메시지·닉네임 필터 |
| T-3 | 트롤 탐지: 동일 IP 반복 허위 등록 | 🟡 | Edge Function |
| T-4 | 익명 계정 레이트 리밋 | 🟠 | 10req/min/ip |
| T-5 | 블록 기능 (상대 차단) | 🟡 | profile block_list |

## 6. 리팩터·정리

| # | 항목 | 우선 | 메모 |
|---|------|------|------|
| R-1 | `src/lib/analytics.ts` 실연동 + 타입 정리 | 🔴 | 현재 placeholder |
| R-2 | Supabase client singleton 점검 | 🟠 | SSR/CSR 구분 |
| R-3 | `useSupabase` hook 에러 상태 노출 일관성 | 🟡 | |
| R-4 | 좌석 SVG 템플릿 lazy import | 🟡 | 번들 -30KB 예상 |
| R-5 | unused icons (`file.svg`, `globe.svg`, `window.svg`, `next.svg`) 제거 | 🟡 | |
| R-6 | `SEOUL_API_KEY` 서버 전용 강제 (client 유출 방지) | 🔴 | |

## 7. 테스트

| # | 항목 | 우선 |
|---|------|------|
| X-1 | Vitest 기본 셋업 + util 단위 테스트 3건 | 🟡 |
| X-2 | Playwright `provide 플로우` e2e 1건 | 🟡 |
| X-3 | Playwright `seek 플로우` e2e 1건 | ⚪ |
| X-4 | Supabase RLS 정책 계약 테스트 | 🟡 |

## 8. 접근성·UX 디테일

| # | 항목 | 우선 |
|---|------|------|
| A-1 | 좌석맵 키보드 내비게이션 (Tab + Enter) | ⚪ |
| A-2 | 스크린리더 좌석 라벨 (`aria-label="3번째 좌석, 비어있음"`) | ⚪ |
| A-3 | 터치 타겟 최소 44x44 감사 | 🟡 |
| A-4 | 다크모드 대비 WCAG AA | 🟡 |
| A-5 | 오프라인 상태 배너 문구 손봄 | ⚪ |

## 9. 데이터·분석

| # | 항목 | 우선 |
|---|------|------|
| Q-1 | `seat_events` 테이블 + 주요 전이 insert | 🟠 |
| Q-2 | 일일 매칭 성공률 materialized view | 🟠 |
| Q-3 | 구간별 Provider 분포 뷰 (호선·역) | 🟡 |
| Q-4 | 인터뷰 로그 구조화 노트 (Notion/Obsidian) | 🟡 |

## 10. 미루는 것 (명시적 Non-Goals)

- Firebase/FCM 푸시 (PWA Notification API만)
- 카카오페이·토스 결제
- 소셜 로그인
- 비수도권 노선 확장
- AI 기반 좌석 예측

---

## 빠른 실행 체크 (Sprint 0 끝나기까지)

- [ ] B-1 ~ B-4 (브랜드 전환)
- [ ] D-1 ~ D-6 (관측·약관)
- [ ] R-1 (analytics 실연동)
- [ ] R-6 (API 키 서버 전용)
- [ ] T-2 (거래 키워드 자동 차단 초안)
