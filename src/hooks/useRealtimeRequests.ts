'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SeatRequest } from '@/types';

interface UseRealtimeRequestsOptions {
  offerId?: string;
  enabled?: boolean;
}

export function useRealtimeRequests({
  offerId,
  enabled = true,
}: UseRealtimeRequestsOptions) {
  const [requests, setRequests] = useState<SeatRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !offerId) return;

    const supabase = createClient();

    async function loadRequests() {
      setLoading(true);
      const { data } = await supabase
        .from('seat_requests')
        .select('*')
        .eq('offer_id', offerId!)
        .eq('status', 'pending');

      if (data) setRequests(data as SeatRequest[]);
      setLoading(false);
    }

    loadRequests();

    const channel = supabase
      .channel(`requests-${offerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seat_requests',
          filter: `offer_id=eq.${offerId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRequests((prev) => [...prev, payload.new as SeatRequest]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as SeatRequest;
            setRequests((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r))
            );
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            setRequests((prev) => prev.filter((r) => r.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [offerId, enabled]);

  // 요청 수락/거절
  const respondToRequest = useCallback(
    async (requestId: string, accept: boolean) => {
      const supabase = createClient();
      await supabase
        .from('seat_requests')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', requestId);

      if (accept && offerId) {
        await supabase
          .from('seat_offers')
          .update({ status: 'reserved', someone_in_front: true })
          .eq('id', offerId);
      }
    },
    [offerId]
  );

  return { requests, loading, respondToRequest };
}
