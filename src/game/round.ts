import type { Card } from './card';
import { compareGroups } from './hand';

// One player's arrangement: three groups of three cards, strongest first.
export type Arrangement = Card[][];

/** Split 9 cards into 3 groups in the order they are given. */
export function toGroups(cards: readonly Card[]): Arrangement {
  return [cards.slice(0, 3), cards.slice(3, 6), cards.slice(6, 9)];
}

/** Returns an error message, or null if group 1 ≥ group 2 ≥ group 3. */
export function validateArrangement(groups: Arrangement): string | null {
  if (groups.length !== 3 || groups.some((g) => g.length !== 3)) {
    return 'You need 3 groups of 3 cards.';
  }
  if (compareGroups(groups[0], groups[1]) < 0) return 'Group 1 must be at least as strong as group 2.';
  if (compareGroups(groups[1], groups[2]) < 0) return 'Group 2 must be at least as strong as group 3.';
  return null;
}

/**
 * Who wins one show. `groups[p]` is player p's group at this position.
 * Returns the winning player index, or null if the best group is tied (show voided).
 */
export function showWinner(groups: readonly (readonly Card[])[]): number | null {
  let best = 0;
  let tied = false;
  for (let p = 1; p < groups.length; p++) {
    const cmp = compareGroups(groups[p], groups[best]);
    if (cmp > 0) {
      best = p;
      tied = false;
    } else if (cmp === 0) {
      tied = true;
    }
  }
  return tied ? null : best;
}

export interface RoundResult {
  showWinners: (number | null)[]; // one entry per show; null = voided
  winner: number | null; // null = kitti (pot carries over)
}

/** Play out all three shows. A player must win two consecutive shows (1-2 or 2-3). */
export function resolveRound(arrangements: readonly Arrangement[]): RoundResult {
  const showWinners = [0, 1, 2].map((show) => showWinner(arrangements.map((a) => a[show])));
  const [s1, s2, s3] = showWinners;

  let winner: number | null = null;
  if (s2 !== null && (s1 === s2 || s2 === s3)) winner = s2; // show 2 is part of both winning pairs
  return { showWinners, winner };
}
