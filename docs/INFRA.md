# 자리요 — 인프라 체크리스트

> Sprint 0(출시 준비) 범위. 프로덕션 준비도 25% → 90%+로 끌어올리기 위한 실행 목록.

---

## 1. 배포 (Deployment)

### Vercel 배포
- [ ] Vercel 계정·팀 생성
- [ ] GitHub 레포 연결
- [ ] 환경변수 등록 (Production/Preview 분리)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server only, RLS 우회)
  - `SEOUL_API_KEY`
  - `NEXT_PUBLIC_GA_ID`
  - `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_SENTRY_DSN`
  - `NEXT_PUBLIC_SITE_URL=https://jariyo.app`
- [ ] 프로덕션 브랜치 = `master`, 프리뷰 브랜치 = `develop` 또는 PR
- [ ] `/api/*` 엣지 런타임 검토 (외부 API 프록시 latency)

### 도메인
- [ ] `jariyo.app` 구매 (Porkbun·Cloudflare 기준 연 $14 내외)
- [ ] `jariyo.kr` 구매 (선택, 신뢰감) → jariyo.app 리다이렉트
- [ ] Vercel DNS 또는 Cloudflare 프록시 연결
- [ ] SSL 자동 발급 확인
- [ ] `www.jariyo.app` → `jariyo.app` 301

### 캐시·CDN
- [ ] 실시간 도착정보 API는 Vercel KV 또는 Supabase `api_cache` 테이블 사용 (현 코드 확인 필요)
- [ ] 정적 이미지·SVG `Cache-Control: public, max-age=31536000, immutable`

---

## 2. 관측 (Observability)

### 에러 추적 — Sentry
- [ ] `@sentry/nextjs` 설치 + `sentry.client.config.ts`, `sentry.server.config.ts`
- [ ] Source map 업로드 자동화 (vercel 빌드 시)
- [ ] `beforeSend`로 PII 필터 (닉네임·좌표 제거)
- [ ] Release = git sha

### 분석 — Google Analytics 4
- [ ] GA4 속성 생성 → `G-XXXXXXXXXX`
- [ ] `src/lib/analytics.ts` 실제 gtag 연결
- [ ] 핵심 이벤트 5개 연동:
  - `offer_created`, `offer_cancelled`, `request_sent`, `match_succeeded`, `match_failed`
- [ ] 퍼널 리포트 (home → provide → active → matched) 설정

### 로깅 — Supabase
- [ ] `seat_events` 테이블 (id, user_id, event_type, payload, created_at)
- [ ] 주요 상태 전이 시 insert (서버 쪽만)
- [ ] Materialized view로 일일 매칭율 자동 집계

### 업타임 — UptimeRobot 또는 BetterStack
- [ ] `/api/healthz` 엔드포인트 생성 (Supabase 연결 ping)
- [ ] 5분 간격 체크

---

## 2.5 Supabase 필수 대시보드 설정

**프로덕션 배포 전 반드시 확인** — 누락 시 사용자는 "인증 확인 필요" 에러로 자리 등록 불가.

- [ ] **Authentication > Providers > Anonymous sign-ins 활성화** (기본값 비활성)
- [ ] Authentication > URL Configuration > Site URL에 `https://jariyo.app` 추가
- [ ] Authentication > Rate Limits에서 익명 로그인 한도 확인 (남용 방지)
- [ ] Database > Replication > `seat_offers`, `seat_requests`, `profiles` Realtime 활성
- [ ] RLS 정책: 익명 사용자가 본인 offer·request는 insert/update 가능, 타인 데이터는 select만 가능

## 3. 보안·프라이버시

### 필수
- [ ] Supabase RLS 정책 전면 감사 (특히 `seat_offers`, `seat_requests`, `profiles`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY`는 클라이언트 번들에서 빠졌는지 확인
- [ ] CSP 헤더 (`next.config.js`): `default-src 'self'`, 필요한 외부만 whitelist
- [ ] `strict-transport-security`, `x-content-type-options`, `referrer-policy`
- [ ] Rate limit (Supabase Edge Function 또는 Vercel Middleware)
  - 익명 사용자가 초당 N회 offer 생성 방지

### 사용자 데이터
- [ ] 좌표·정확한 역 도착시간은 가능한 한 클라이언트에서 처리
- [ ] 신고·차단 시 IP 기록 (24시간 내 삭제, 법적 요청 시만 보관)
- [ ] 계정 삭제 API (익명 계정도 UUID 폐기)

---

## 4. 법·약관

- [ ] `/terms` 이용약관
- [ ] `/privacy` 개인정보처리방침
- [ ] `/disclaimer` 주의사항 — "자리요는 좌석을 사고팔지 않으며, 양도는 호의에 기반합니다" 명시
- [ ] 좌석 거래·판매 시도 탐지 트리거 (키워드 모니터링 후 자동 경고)
- [ ] 임산부·교통약자 좌석 양도 분리 처리 (법적·윤리적 리스크)
- [ ] 14세 미만 가입 금지 문구

---

## 5. CI/CD

### GitHub Actions — Sprint 0 최소 버전
- [ ] `.github/workflows/ci.yml`
  - `pnpm install --frozen-lockfile`
  - `next lint`
  - `next build`
- [ ] PR 머지 전 CI 통과 필수
- [ ] Preview 배포는 Vercel이 자동

### Dependabot
- [ ] `.github/dependabot.yml` 주간 PR (npm·GitHub Actions)

---

## 6. DB 운영

- [ ] Supabase daily 백업 확인 (무료 티어 7일)
- [ ] 주요 테이블 마이그레이션 버저닝 (`supabase/migrations/` 순번 유지)
- [ ] `seat_offers`·`seat_requests` 자동 만료 트리거 동작 확인 (pg_cron 또는 edge cron)
- [ ] 인덱스: `(line, direction, train_no, created_at)` 복합 인덱스 확인

---

## 7. 성능

- [ ] Lighthouse 모바일 ≥ 90 (홈·좌석맵)
- [ ] LCP < 2.5s, CLS < 0.1
- [ ] `next build` 번들 분석 (`@next/bundle-analyzer`) → 좌석 SVG lazy import
- [ ] 이미지 없음 확인 (SVG만 사용 중 → 유지)

---

## 8. 커뮤니케이션 채널

- [ ] 피드백 수집: Google Form 또는 Tally 임베드
- [ ] 이슈 트래커: GitHub Issues (공개) + 비공개 Linear(선택)
- [ ] 사용자 공지: 인앱 토스트 or 홈 상단 배너 (env 기반 on/off)

---

## 9. 비용 가이드 (월 예상)

| 항목 | 무료 한도 | 예상 |
|------|----------|------|
| Vercel Hobby | 100GB bandwidth | 0원 |
| Supabase Free | 500MB DB + 2GB storage | 0원 |
| 도메인 | — | 약 1,500원 (연 $14 / 12) |
| Sentry Developer | 5K events/mo | 0원 |
| GA4 | 무제한 | 0원 |
| Cloudflare DNS | — | 0원 |
| **합계** | | **월 ~1,500원** |

MVP 단계에서 유료 전환 트리거:
- Vercel Pro: 트래픽 > 100GB/월
- Supabase Pro: 동시 연결 > 200 또는 DB > 500MB

---

## 10. Sprint 0 체크리스트 요약 (1주 실행)

- [ ] 배포: Vercel + 도메인 (Day 1-2)
- [ ] 환경변수·RLS 점검 (Day 2)
- [ ] GA4·Sentry 연동 (Day 3)
- [ ] 약관 3종 + disclaimer (Day 4)
- [ ] CI 최소 설정 + Dependabot (Day 5)
- [ ] 브랜드 전환 완료 (manifest·favicon·metadata) (Day 5)
- [ ] 헬스체크·업타임 (Day 6)
- [ ] 런칭 공지 문구 초안 (Day 7)
