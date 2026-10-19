/**
 * Firestore References
 * รวม path ของ collection/document ที่ใช้ซ้ำหลายที่ไว้จุดเดียว
 */

import { collection, doc } from 'firebase/firestore';
import { db } from './config';

export type SessionSubcollection = 'player_answers' | 'votes' | 'ready_status';

export function roomRef(roomId: string) {
  return doc(db, 'rooms', roomId);
}

export function roomPlayersRef(roomId: string) {
  return collection(db, `rooms/${roomId}/players`);
}

export function roomPlayerRef(roomId: string, playerId: string) {
  return doc(roomPlayersRef(roomId), playerId);
}

export function gameRef(gameId: string) {
  return doc(db, 'games', gameId);
}

export function gameSessionRef(sessionId: string) {
  return doc(db, 'game_sessions', sessionId);
}

export function sessionSubcollectionRef(sessionId: string, name: SessionSubcollection) {
  return collection(db, `game_sessions/${sessionId}/${name}`);
}

export function sessionSubdocRef(sessionId: string, name: SessionSubcollection, docId: string) {
  return doc(sessionSubcollectionRef(sessionId, name), docId);
}
