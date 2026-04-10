// Phase 5-4: 기본 이벤트 트래킹
// GA나 Mixpanel 연동 전 기본 구조

type EventName =
  | 'page_view'
  | 'seat_offer_created'
  | 'seat_offer_cancelled'
  | 'seat_request_sent'
  | 'seat_request_accepted'
  | 'seat_request_rejected'
  | 'train_selected'
  | 'station_selected'
  | 'manner_rating_given'
  | 'report_submitted'
  | 'login'
  | 'theme_changed'
  | 'zoom_used';

interface EventData {
  [key: string]: string | number | boolean | undefined;
}

// 개발 환경에서는 콘솔에 출력
function logEvent(name: EventName, data?: EventData) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${name}`, data ?? '');
  }

  // GA4 연동 (gtag가 있는 경우)
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as Record<string, unknown>).gtag('event', name, data);
  }
}

export const analytics = {
  pageView(path: string) {
    logEvent('page_view', { path });
  },
  seatOfferCreated(lineNumber: number, station: string) {
    logEvent('seat_offer_created', { line_number: lineNumber, station });
  },
  seatOfferCancelled(lineNumber: number) {
    logEvent('seat_offer_cancelled', { line_number: lineNumber });
  },
  seatRequestSent(lineNumber: number) {
    logEvent('seat_request_sent', { line_number: lineNumber });
  },
  seatRequestResponded(accepted: boolean) {
    logEvent(accepted ? 'seat_request_accepted' : 'seat_request_rejected');
  },
  trainSelected(trainNo?: string) {
    logEvent('train_selected', { train_no: trainNo });
  },
  stationSelected(name: string, lineNumber: number) {
    logEvent('station_selected', { name, line_number: lineNumber });
  },
  mannerRating(score: number) {
    logEvent('manner_rating_given', { score });
  },
  reportSubmitted(reason: string) {
    logEvent('report_submitted', { reason });
  },
  login() {
    logEvent('login');
  },
  themeChanged(theme: string) {
    logEvent('theme_changed', { theme });
  },
};
