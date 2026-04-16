// 호선 번호
export type LineNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// 방향
export type Direction = 'up' | 'down';

// 차량 타입
export type CarType = 'old' | 'new';

// 좌석 상태
export type SeatOfferStatus = 'available' | 'reserved' | 'completed' | 'cancelled';

// 요청 상태
export type SeatRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

// 좌석 타입
export type SeatType = 'normal' | 'priority' | 'pregnant';

// 역 정보
export interface Station {
  code: string;
  name: string;
  lineNumber: LineNumber;
  nameEn?: string;
}

// 좌석 위치 (템플릿 내)
export interface SeatPosition {
  id: string;           // e.g. "S1-L1" (Section1-Left1)
  section: number;      // 문과 문 사이 구역 (1~4)
  side: 'left' | 'right';
  position: number;     // 구역 내 순서
  type: SeatType;
  x: number;
  y: number;
}

// 문 위치
export interface DoorPosition {
  id: string;
  x: number;
  y: number;
  width: number;
}

// 차량 좌석 레이아웃 템플릿
export interface SeatTemplate {
  id: string;
  lineNumber: LineNumber;
  carType: CarType;
  description: string;
  totalSeatsPerCar: number;
  seats: SeatPosition[];
  doors: DoorPosition[];
  carWidth: number;
  carHeight: number;
}

// 좌석 제공 (DB row)
export interface SeatOffer {
  id: string;
  provider_id: string;
  line_number: LineNumber;
  direction: Direction;
  train_destination: string;
  train_number: string | null;
  car_number: number;
  seat_id: string;
  template_id: string;
  exit_station: string;
  exit_station_code: string;
  boarding_station: string;
  status: SeatOfferStatus;
  someone_in_front: boolean;
  created_at: string;
  expires_at: string | null;
}

// 좌석 요청 (DB row)
export interface SeatRequest {
  id: string;
  offer_id: string;
  seeker_id: string;
  status: SeatRequestStatus;
  created_at: string;
}

// 실시간 도착 정보 (서울 열린데이터 API 응답)
export interface ArrivalInfo {
  subwayId: string;        // 호선 ID
  statnNm: string;         // 역명
  trainLineNm: string;     // 행선지 방면
  bstatnNm: string;        // 종착역
  arvlMsg2: string;        // 도착 메시지 ("3분 후 도착" 등)
  arvlMsg3: string;        // 도착 메시지 상세
  arvlCd: string;          // 도착 코드
  updnLine: Direction;     // 상행/하행
  btrainNo?: string;       // 열차번호
  recptnDt: string;        // 데이터 수신 시각
  btrainSttus?: string;    // 열차 상태
  ordkey: string;          // 정렬 키
}

// 프로필
export interface Profile {
  id: string;
  nickname: string;
  manner_score: number;
  total_provides: number;
  total_seeks: number;
  created_at: string;
}

// 매너 평가
export interface MannerRating {
  id: string;
  rater_id: string;
  rated_id: string;
  offer_id: string;
  score: number; // 1~5
  comment?: string;
  created_at: string;
}

// 신고
export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  offer_id?: string;
  reason: 'no_show' | 'fake_offer' | 'harassment' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
}
