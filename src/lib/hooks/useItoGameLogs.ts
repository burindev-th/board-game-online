import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface ItoGameLog {
  id: string;
  questionId: string;
  ageRange: string | null;
  number: number;
  answer: string;
  isEdited: boolean;
  previousAnswer: string | null;
  isTest: boolean;
  createdAt: Timestamp | null;
}

/**
 * @param enabled ส่ง true เมื่อ admin login แล้ว (ito_game_logs อ่านได้เฉพาะ admin)
 */
export function useItoGameLogs(enabled: boolean) {
  const [logs, setLogs] = useState<ItoGameLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    const logsRef = collection(db, 'ito_game_logs');
    const q = query(logsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ItoGameLog[];

      setLogs(logsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [enabled]);

  return { logs, loading };
}

// Hook สำหรับดึง questions ทั้งหมดเพื่อ map questionId -> questionText
export function useItoQuestions() {
  const [questions, setQuestions] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const questionsRef = collection(db, 'ito_questions');
        const snapshot = await getDocs(questionsRef);

        const questionsMap: { [id: string]: string } = {};
        snapshot.docs.forEach((doc) => {
          questionsMap[doc.id] = doc.data().questionsTH || 'ไม่มีโจทย์';
        });

        setQuestions(questionsMap);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching questions:', error);
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  return { questions, loading };
}
