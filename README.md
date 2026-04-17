# 자리요 (jariyo)

> **지금 앉을래요?** — 하차 예정자의 자리를 호의로 이어받는 지하철 PWA.

**자리요는 좌석을 사고팔지 않습니다. 호의의 교환을 돕습니다.**

## 개요

자리 제공자가 하차 예정 역과 좌석 위치를 등록하면, 자리가 필요한 이용자가 해당 좌석을 사전에 확인하고 이동할 수 있는 모바일 웹앱입니다. 결제·거래 기능은 없으며, 감사·양보라는 사회적 상호작용에 초점을 둡니다.

- 서비스명: 자리요
- 레포명: `metro-seat` (코드·DB 호환성 유지)
- 도메인: jariyo.app (예정)
- 포지셔닝: 서서 가는 사람에게 "가능성"을 띄우는 앱

## 기술 스택

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Backend/DB**: Supabase (PostgreSQL + Realtime + Auth)
- **외부 API**: 서울 열린데이터 광장 실시간 지하철 도착정보 API
- **배포 대상**: Vercel + PWA

## 시작하기

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

### 환경변수 설정

`.env.local.example`을 `.env.local`로 복사하고 값을 입력하세요:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SEOUL_API_KEY=your-seoul-opendata-api-key
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_SITE_URL=https://jariyo.app
```

### 데이터베이스 설정

Supabase 프로젝트 생성 후 `supabase/migrations/001_initial.sql`을 실행하세요.

## 프로젝트 구조

```
src/
├── app/           # 페이지 (App Router)
│   ├── provide/   # 자리 제공 플로우
│   ├── seek/      # 자리 찾기 플로우
│   ├── session/   # 실시간 세션 화면
│   ├── my/        # 내 현황
│   ├── auth/      # 인증
│   └── api/       # API Routes (지하철 API 프록시)
├── components/    # UI 컴포넌트 (TrainCar, SeatMap 등)
├── data/          # 정적 데이터 (역 목록, 좌석 템플릿)
├── hooks/         # React Hooks (Realtime 구독, 도착정보)
├── lib/           # 유틸리티 (Supabase, API, 상수)
└── types/         # TypeScript 타입
```

## 문서

| 문서 | 내용 |
|------|------|
| [`ROADMAP.md`](./ROADMAP.md) | Sprint 0-4 실행 로드맵 (3개월) |
| [`docs/STRATEGY.md`](./docs/STRATEGY.md) | SWOT·포지셔닝·수익화 전략 |
| [`docs/INFRA.md`](./docs/INFRA.md) | 배포·관측·보안·CI/CD 체크리스트 |
| [`docs/DEV-BACKLOG.md`](./docs/DEV-BACKLOG.md) | 우선순위별 개발 백로그 |

## 원칙

- 최소 마찰: 앱을 열면 0초 안에 사용 가능
- 조용한 상호작용: 낯선 사람 사이의 호의에 맞는 톤
- Provider 부담 최소: 하차 직전 한 탭 등록이 목표
- "판매·거래·구매" 표현 금지

## 라이선스

미정 (사이드 프로젝트 단계)
