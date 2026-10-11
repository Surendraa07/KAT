import { cardLabel, type Card } from './card';

// Hand types, best first. The numbers are used for comparing: bigger wins.
export const HAND_TYPES = {
  trio: 5,
  pureRun: 4,
  run: 3,
  flush: 2,
  pair: 1,
  high: 0,
} as const;

export type HandType = keyof typeof HAND_TYPES;

const HAND_NAMES: Record<HandType, string> = {
  trio: 'Three of a kind',
  pureRun: 'Pure run',
  run: 'Run',
  flush: 'Flush',
  pair: 'Pair',
  high: 'High card',
};

export interface GroupValue {
  type: HandType;
  // Numbers compared left to right: first the type, then tie-breakers.
  // Two groups with equal `score` arrays are an exact tie.
  score: number[];
}

/**
 * Where a run sits in the run order. Bigger is better:
 * Q-K-A = 15, A-2-3 = 14, J-Q-K = 13, 10-J-Q = 12 ... 2-3-4 = 4.
 * Returns null if the three ranks are not a run (K-A-2 is not a run).
 */
function runValue(ranksDesc: number[]): number | null {
  const [a, b, c] = ranksDesc;
  if (a === 14 && b === 13 && c === 12) return 15; // Q-K-A
  if (a === 14 && b === 3 && c === 2) return 14; // A-2-3
  if (a - b === 1 && b - c === 1) return a; // ordinary run, valued by its top card
  return null;
}

/** Classify a 3-card group and give it a comparable score. */
export function evaluateGroup(cards: readonly Card[]): GroupValue {
  if (cards.length !== 3) throw new Error('A group must have exactly 3 cards');

  const ranks = cards.map((c) => c.rank).sort((x, y) => y - x); // highest first
  const sameSuit = cards.every((c) => c.suit === cards[0].suit);
  const run = runValue(ranks);

  if (ranks[0] === ranks[2]) return make('trio', [ranks[0]]);
  if (run !== null && sameSuit) return make('pureRun', [run]);
  if (run !== null) return make('run', [run]);
  if (sameSuit) return make('flush', ranks);
  if (ranks[0] === ranks[1]) return make('pair', [ranks[0], ranks[2]]); // pair rank, then the odd card
  if (ranks[1] === ranks[2]) return make('pair', [ranks[1], ranks[0]]);
  return make('high', ranks);
}

function make(type: HandType, tieBreakers: number[]): GroupValue {
  return { type, score: [HAND_TYPES[type], ...tieBreakers] };
}

/** Positive if a beats b, negative if b beats a, 0 for an exact tie. */
export function compareValues(a: GroupValue, b: GroupValue): number {
  for (let i = 0; i < Math.max(a.score.length, b.score.length); i++) {
    const diff = (a.score[i] ?? 0) - (b.score[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function compareGroups(a: readonly Card[], b: readonly Card[]): number {
  return compareValues(evaluateGroup(a), evaluateGroup(b));
}

/** e.g. "Pair (K♠ K♥ 4♦)", cards listed high to low */
export function describeGroup(cards: readonly Card[]): string {
  const sorted = [...cards].sort((a, b) => b.rank - a.rank);
  return `${HAND_NAMES[evaluateGroup(cards).type]} (${sorted.map(cardLabel).join(' ')})`;
}

export function handName(cards: readonly Card[]): string {
  return HAND_NAMES[evaluateGroup(cards).type];
}
