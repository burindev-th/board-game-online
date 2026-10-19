/**
 * Custom Hook: useGames
 * ดึงรายการเกมทั้งหมดจาก games collection
 * Listen แบบ real-time จาก Firestore
 */

'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Game } from '@/types';

interface UseGamesResult {
  games: Game[];
  loading: boolean;
  error: string | null;
}

/**
 * Convert Firestore data to Game type
 */
function toGame(id: string, data: DocumentData): Game {
  return {
    id,
    name: data.name || 'ไม่มีชื่อเกม',
    minPlayer: data.minPlayer || 2,
    maxPlayer: data.maxPlayer || 8,
    description: data.description,
    imageUrl: data.imageUrl,
    defaultTimeMinutes: data.defaultTimeMinutes,
    enableCustomTime: data.enableCustomTime,
    isActive: data.isActive !== undefined ? data.isActive : true, // Default to true if not set
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  };
}

/**
 * Subscribe รายการเกมเรียงตามชื่อ
 * @param includeInactive true = รวมเกมที่ปิดอยู่ (สำหรับ Admin)
 */
export function useGameList(includeInactive: boolean): UseGamesResult {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Query: order by name (ascending)
    const q = query(collection(db, 'games'), orderBy('name', 'asc'));

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const gamesData = snapshot.docs
          .map((doc) => toGame(doc.id, doc.data()))
          .filter((game) => includeInactive || game.isActive);

        setGames(gamesData);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to games:', err);
        setError('ไม่สามารถโหลดรายการเกมได้');
        setLoading(false);
      }
    );

    // Cleanup: unsubscribe on unmount
    return () => {
      unsubscribe();
    };
  }, [includeInactive]);

  return { games, loading, error };
}

/**
 * เฉพาะเกมที่ active (สำหรับผู้เล่น)
 */
export function useGames(): UseGamesResult {
  return useGameList(false);
}
