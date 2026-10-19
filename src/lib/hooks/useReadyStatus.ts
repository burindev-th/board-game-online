/**
 * Custom Hook: useReadyStatus
 * Real-time updates สำหรับสถานะ "พร้อม" ของผู้เล่นในหน้า levelComplete
 */

import { useEffect, useState } from 'react';
import { onSnapshot, Timestamp } from 'firebase/firestore';
import { sessionSubcollectionRef } from '@/lib/firebase/refs';
import type { ItoReadyStatus } from '@/types/ito';

interface UseReadyStatusResult {
  readyPlayers: ItoReadyStatus[];
  readyCount: number;
  loading: boolean;
}

export function useReadyStatus(sessionId: string): UseReadyStatusResult {
  const [readyPlayers, setReadyPlayers] = useState<ItoReadyStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const readyRef = sessionSubcollectionRef(sessionId, 'ready_status');

    const unsubscribe = onSnapshot(
      readyRef,
      (snapshot) => {
        const players: ItoReadyStatus[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          players.push({
            playerId: data.playerId,
            playerName: data.playerName,
            readyAt: data.readyAt ? (data.readyAt as Timestamp).toDate() : new Date(),
          });
        });

        setReadyPlayers(players);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  return {
    readyPlayers,
    readyCount: readyPlayers.length,
    loading,
  };
}
