-- 프로필 테이블
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 차량 좌석 레이아웃 템플릿
CREATE TABLE IF NOT EXISTS train_templates (
  id TEXT PRIMARY KEY,
  line_number INT NOT NULL,
  car_type TEXT NOT NULL CHECK (car_type IN ('old', 'new')),
  total_cars INT NOT NULL DEFAULT 10,
  seats_per_car JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 좌석 제공 (활성 상태)
CREATE TABLE IF NOT EXISTS seat_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  line_number INT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
  train_destination TEXT NOT NULL,
  train_number TEXT,
  car_number INT NOT NULL,
  seat_id TEXT NOT NULL,
  template_id TEXT REFERENCES train_templates(id),
  exit_station TEXT NOT NULL,
  exit_station_code TEXT NOT NULL,
  boarding_station TEXT NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'completed', 'cancelled')),
  someone_in_front BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- 좌석 예약 요청
CREATE TABLE IF NOT EXISTS seat_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES seat_offers(id) ON DELETE CASCADE,
  seeker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_seat_offers_status ON seat_offers(status);
CREATE INDEX IF NOT EXISTS idx_seat_offers_line_direction ON seat_offers(line_number, direction, train_destination);
CREATE INDEX IF NOT EXISTS idx_seat_offers_provider ON seat_offers(provider_id);
CREATE INDEX IF NOT EXISTS idx_seat_requests_offer ON seat_requests(offer_id);
CREATE INDEX IF NOT EXISTS idx_seat_requests_seeker ON seat_requests(seeker_id);

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE train_templates ENABLE ROW LEVEL SECURITY;

-- train_templates: 누구나 읽기 가능
CREATE POLICY "train_templates_read" ON train_templates FOR SELECT TO authenticated, anon USING (true);

-- profiles: 자기 프로필만 수정 가능, 누구나 읽기 가능
CREATE POLICY "profiles_read" ON profiles FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- seat_offers: 누구나 읽기 가능, 본인만 생성/수정 가능
CREATE POLICY "seat_offers_read" ON seat_offers FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "seat_offers_insert" ON seat_offers FOR INSERT TO authenticated WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "seat_offers_update" ON seat_offers FOR UPDATE TO authenticated USING (auth.uid() = provider_id);

-- seat_requests: 관련자만 읽기 가능, 본인만 생성 가능
CREATE POLICY "seat_requests_read" ON seat_requests FOR SELECT TO authenticated
  USING (
    auth.uid() = seeker_id OR
    auth.uid() IN (SELECT provider_id FROM seat_offers WHERE id = offer_id)
  );
CREATE POLICY "seat_requests_insert" ON seat_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = seeker_id);
CREATE POLICY "seat_requests_update" ON seat_requests FOR UPDATE TO authenticated
  USING (
    auth.uid() = seeker_id OR
    auth.uid() IN (SELECT provider_id FROM seat_offers WHERE id = offer_id)
  );

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE seat_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE seat_requests;
