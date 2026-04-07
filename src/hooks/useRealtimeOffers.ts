'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SeatOffer, LineNumber, Direction } from '@/types';

interface UseRealtimeOffersOptions {
  lineNumber?: LineNumber;
  direction?: Direction;
  trainDestination?: string;
  enabled?: boolean;
}

export function useRealtimeOffers({
  lineNumber,
  direction,
  trainDestination,
  enabled = true,
}: UseRealtimeOffersOptions) {
  const [offers, setOffers] = useState<SeatOffer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !lineNumber) return;

    const supabase = createClient();

    // 초기 데이터 로드
    async function loadOffers() {
      setLoading(true);
      let query = supabase
        .from('seat_offers')
        .select('*')
        .eq('status', 'available')
        .eq('line_number', lineNumber!);

      if (direction) {
        query = query.eq('direction', direction);
      }
      if (trainDestination) {
        query = query.eq('train_destination', trainDestination);
      }

      const { data } = await query;
      if (data) setOffers(data as SeatOffer[]);
      setLoading(false);
    }

    loadOffers();

    // Realtime 구독
    const channel = supabase
      .channel(`offers-${lineNumber}-${direction}-${trainDestination}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seat_offers',
          filter: `line_number=eq.${lineNumber}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOffer = payload.new as SeatOffer;
            if (newOffer.status === 'available') {
              setOffers((prev) => [...prev, newOffer]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as SeatOffer;
            setOffers((prev) =>
              prev
                .map((o) => (o.id === updated.id ? updated : o))
                .filter((o) => o.status === 'available')
            );
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            setOffers((prev) => prev.filter((o) => o.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lineNumber, direction, trainDestination, enabled]);

  return { offers, loading };
}
