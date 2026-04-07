# Metro-Seat (메트로시트)

지하철 좌석 공유 PWA 서비스 - 한국 지하철 이용자를 위한 빈자리 공유 플랫폼

## 개요

자리 제공자가 하차 예정 역과 좌석 위치를 등록하면, 자리가 필요한 이용자가 해당 좌석을 사전에 확인하고 이동할 수 있는 모바일 웹앱입니다.

## 기술 스택

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Realtime + Auth)
- **외부 API**: 서울 열린데이터 광장 실시간 지하철 도착정보 API
- **배포 대상**: 모바일 웹 / PWA

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
```

### 데이터베이스 설정

Supabase 프로젝트 생성 후 `supabase/migrations/001_initial.sql`을 실행하세요.

## 프로젝트 구조

```
src/
├── app/           # 페이지 (App Router)
│   ├── provide/   # 자리 제공 플로우
│   ├── seek/      # 자리 찾기 플로우
│   ├── my/        # 내 현황
│   ├── auth/      # 인증
│   └── api/       # API Routes (지하철 API 프록시)
├── components/    # UI 컴포넌트 (TrainCar, SeatMap 등)
├── data/          # 정적 데이터 (역 목록, 좌석 템플릿)
├── hooks/         # React Hooks (Realtime 구독, 도착정보)
├── lib/           # 유틸리티 (Supabase, API, 상수)
└── types/         # TypeScript 타입
```
