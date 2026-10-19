/**
 * Custom Hook: useAdminAuth
 * ตรวจสอบการ login ของหน้า Admin: ถ้ายังไม่ login จะพาไปหน้า /admin/login
 * และเริ่มจับเวลา auto logout (useAdminActivity)
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAdminActivity } from './useAdminActivity';

/**
 * @param onSignedIn เรียกเมื่อ login แล้ว ถ้าคืน Promise จะรอให้เสร็จก่อนปิด loading
 */
export function useAdminAuth(onSignedIn?: (user: User) => void | Promise<void>) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const onSignedInRef = useRef(onSignedIn);
  onSignedInRef.current = onSignedIn;

  useAdminActivity();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const pending = onSignedInRef.current?.(currentUser);
        if (pending) await pending;
      } else {
        router.push('/admin/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, [router]);

  return { user, loading, logout };
}
