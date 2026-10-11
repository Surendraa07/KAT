import type { Card, Rank, Suit } from '../src/game/card';

const RANK_CODES: Record<string, Rank> = { J: 11, Q: 12, K: 13, A: 14 };
const SUIT_CODES: Record<string, Suit> = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };

/** Write cards compactly in tests: cards('As Kh 10d') */
export function cards(text: string): Card[] {
  return text.split(/\s+/).map((code) => {
    const rankText = code.slice(0, -1);
    const rank = RANK_CODES[rankText] ?? (Number(rankText) as Rank);
    return { rank, suit: SUIT_CODES[code.slice(-1)] };
  });
}
