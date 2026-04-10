-- =============================================
-- Phase 3-4: 자동 만료 처리
-- =============================================

-- seat_offers에 자동 만료를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_seat_offers_expires_at
  ON seat_offers(expires_at)
  WHERE status = 'available' AND expires_at IS NOT NULL;

-- 생성 후 2시간 지난 제공을 자동 만료하는 함수
CREATE OR REPLACE FUNCTION expire_stale_offers() RETURNS void AS $$
BEGIN
  -- expires_at이 설정된 경우 해당 시간 기준
  UPDATE seat_offers
  SET status = 'completed'
  WHERE status = 'available'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

  -- expires_at이 없는 경우 생성 후 2시간 기준 자동 만료
  UPDATE seat_offers
  SET status = 'completed'
  WHERE status = 'available'
    AND expires_at IS NULL
    AND created_at < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3분 이상 미응답 요청 자동 만료
CREATE OR REPLACE FUNCTION expire_stale_requests() RETURNS void AS $$
BEGIN
  UPDATE seat_requests
  SET status = 'cancelled'
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '3 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- pg_cron이 있는 경우 (Supabase Pro 등):
-- SELECT cron.schedule('expire-offers', '*/5 * * * *', 'SELECT expire_stale_offers()');
-- SELECT cron.schedule('expire-requests', '* * * * *', 'SELECT expire_stale_requests()');

-- =============================================
-- Phase 5-2: 매너 평가 시스템
-- =============================================

-- 프로필에 매너 점수 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS manner_score NUMERIC(3,1) DEFAULT 3.0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_provides INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_seeks INT DEFAULT 0;

-- 매너 평가 테이블
CREATE TABLE IF NOT EXISTS manner_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES seat_offers(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(rater_id, offer_id)  -- 한 제공당 한 번만 평가
);

-- 매너 점수 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_manner_score() RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET manner_score = (
    SELECT COALESCE(ROUND(AVG(score)::numeric, 1), 3.0)
    FROM manner_ratings
    WHERE rated_id = NEW.rated_id
  )
  WHERE id = NEW.rated_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_manner_score ON manner_ratings;
CREATE TRIGGER trg_update_manner_score
  AFTER INSERT OR UPDATE ON manner_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_manner_score();

-- =============================================
-- Phase 5-2: 신고 시스템
-- =============================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES seat_offers(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN ('no_show', 'fake_offer', 'harassment', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE manner_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- manner_ratings: 누구나 읽기, 본인만 작성
CREATE POLICY "manner_ratings_read" ON manner_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "manner_ratings_insert" ON manner_ratings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = rater_id);

-- reports: 본인 신고만 작성 가능, 관리자만 조회/수정 (일반 유저는 본인 것만 조회)
CREATE POLICY "reports_insert" ON reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_read_own" ON reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_manner_ratings_rated ON manner_ratings(rated_id);
CREATE INDEX IF NOT EXISTS idx_manner_ratings_offer ON manner_ratings(offer_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- 제공 완료 시 자동 카운트 업데이트 트리거
CREATE OR REPLACE FUNCTION update_provide_count() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE profiles
    SET total_provides = total_provides + 1
    WHERE id = NEW.provider_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_provide_count ON seat_offers;
CREATE TRIGGER trg_update_provide_count
  AFTER UPDATE ON seat_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_provide_count();
