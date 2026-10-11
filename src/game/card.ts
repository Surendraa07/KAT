// Pure game data: no Phaser imports in src/game/, so tests can use it directly.

export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;

// Ranks are numbers so they compare with < and >. Jack=11, Queen=12, King=13, Ace=14.
export const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;

// `typeof SUITS[number]` means "any one item of the SUITS array",
// so Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'.
export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];

export interface Card {
  readonly rank: Rank;
  readonly suit: Suit;
}

const RANK_LABELS: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

/** Human-readable name, e.g. "A♠" or "10♥". */
export function cardLabel(card: Card): string {
  const rank = RANK_LABELS[card.rank] ?? String(card.rank);
  return rank + SUIT_SYMBOLS[card.suit];
}
