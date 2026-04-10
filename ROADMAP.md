# Metro-Seat 로드맵

## 현재 상태: MVP v0.1 (완료)

### 완료된 기능
- [x] Next.js 16 + TypeScript + Tailwind CSS 프로젝트 설정
- [x] Supabase 연동 (클라이언트/서버/미들웨어)
- [x] SVG 기반 열차 칸 좌석 시각화 (구형/신형 템플릿)
- [x] 서울 지하철 실시간 도착정보 API 프록시 (Mock 포함)
- [x] 자리 제공 플로우 (6단계 위저드)
- [x] 자리 찾기 플로우 (경로 → 도착정보 → 좌석맵 → 요청)
- [x] Supabase Realtime 구독 (좌석 상태, 요청 알림)
- [x] 익명 인증 + 내 현황 페이지
- [x] 1~8호선 역 데이터 + DB 마이그레이션(RLS)
- [x] PWA manifest

---

## Phase 2: 실서비스 준비 (완료)

### 2-1. 인프라 셋업
- [x] Supabase 프로젝트 생성 및 `.env.local` 설정
- [x] DB 마이그레이션 실행 (`001_initial.sql`)
- [x] 서울 열린데이터 광장 API 키 발급 (`SEOUL_API_KEY`)
- [x] Vercel 또는 기타 호스팅 배포
- [ ] 커스텀 도메인 연결

### 2-2. 실제 API 연결 및 검증
- [x] Mock 데이터 제거, 서울 지하철 API 실 연동 테스트
- [x] API 응답 필드 매핑 검증 (`btrainNo`, `updnLine`, `bstatnNm` 등)
- [x] 에러 핸들링 강화 (API 다운, 심야시간, 네트워크 오류)
- [x] API 호출 rate limit 대응 (인메모리 캐싱 전략)

### 2-3. 좌석 템플릿 정확도 개선
- [x] 우선석/임산부석 정확한 위치 매핑
- [x] 6호선 등 차량 편성 수가 다른 노선 처리 (8량 등)
- [ ] 실제 지하철 칸 좌석 배치 현장 검증 (구형/신형 차이)
- [ ] 호선별 차량 사진 기반 좌석 좌표 미세 조정

### 2-4. Supabase → 실제 데이터 연동
- [x] `provide` 플로우에서 Supabase `seat_offers` INSERT 연결
- [x] `seek` 플로우에서 실제 `seat_offers` 데이터 조회 (Mock 제거)
- [x] `seat_requests` 생성/업데이트 연결
- [ ] Realtime 구독 실 테스트 (2개 브라우저 탭 동시 테스트)

---

## Phase 3: 사용성 개선 (완료)

### 3-1. 열차 매칭 고도화
- [x] 도착시간 + 행선지 + 방향 조합 매칭 알고리즘 구현
- [x] 열차번호 직접 입력 시 exact match 우선 적용
- [ ] 열차 위치 API 연동하여 현재 어디쯤인지 표시
- [ ] 같은 열차 식별 정확도 측정 및 개선

### 3-2. UX 개선
- [x] 제공 플로우 진행 상태 로컬 저장 (중간 이탈 복구)
- [x] 좌석 선택 시 확대(zoom) 기능 (작은 화면 대응)
- [x] 진동/소리 알림 (요청 도착 시)
- [x] 다크모드 지원
- [x] 스켈레톤 로딩 UI
- [x] 오프라인 시 안내 메시지

### 3-3. 추가 역 데이터
- [x] 1~9호선 전체 역 데이터 완성
- [x] 환승역 처리 (같은 역이지만 다른 호선)
- [x] 최근 이용역 기록
- [ ] 역 즐겨찾기 기능 (훅은 구현됨, UI 연결 필요)

### 3-4. 자동 만료 처리
- [x] Supabase DB 함수로 만료 처리 (`expire_stale_offers`, `expire_stale_requests`)
- [x] 3분 이상 미응답 요청 자동 만료
- [ ] pg_cron 스케줄 설정 (Supabase Pro 필요)
- [ ] 하차역 도착 예상 시간 계산 (역간 소요시간 데이터 활용)

---

## ~~Phase 4: 수익화 & 포인트 시스템~~ (제외)

---

## Phase 5: 확장 (진행 중)

### 5-1. 추가 노선 지원
- [x] 9호선 추가
- [ ] 신분당선, 경의중앙선, 수인분당선 등
- [ ] KRIC API 연동 (비수도권 노선)

### 5-2. 소셜 기능
- [x] 매너 평가 시스템 (DB 테이블 + 트리거)
- [x] 신고 기능 (DB 테이블 + RLS)
- [ ] 카카오/구글 소셜 로그인
- [ ] 매너 평가 UI 연결
- [ ] 신고 UI 연결

### 5-3. 푸시 알림
- [x] Service Worker 기반 구축
- [x] 푸시 알림 수신/표시 핸들러
- [ ] Firebase Cloud Messaging 연동 (VAPID 키 설정)
- [ ] 요청 도착, 수락/거절 알림

### 5-4. 분석 & 모니터링
- [x] 이벤트 트래킹 유틸리티 (`analytics.ts`)
- [ ] Google Analytics / Mixpanel 연동
- [ ] 좌석 제공/요청 통계 대시보드
- [ ] 에러 모니터링 (Sentry)

---

## 기술 부채 & 개선사항

- [ ] 테스트 코드 작성 (Jest + React Testing Library)
- [ ] E2E 테스트 (Playwright)
- [ ] CI/CD 파이프라인 구축 (GitHub Actions)
- [ ] 접근성(a11y) 개선 (ARIA, 키보드 내비게이션)
- [ ] i18n 다국어 지원 (영어 등)
- [ ] 성능 최적화 (번들 사이즈, 이미지 최적화)
- [ ] Service Worker 고도화 (오프라인 캐싱 전략 개선)

---

## 핵심 의존성 & API 키 목록

| 서비스 | 용도 | 발급처 |
|--------|------|--------|
| Supabase | DB, Auth, Realtime | https://supabase.com |
| 서울 열린데이터 광장 | 실시간 도착정보 API | https://data.seoul.go.kr |
| SK OpenAPI (선택) | 칸별 혼잡도 | https://openapi.sk.com |
| Firebase (Phase 5) | 푸시 알림 | https://firebase.google.com |
