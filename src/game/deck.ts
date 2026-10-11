import { SETTINGS } from '../settings';
import { RANKS, SUITS, type Card } from './card';

/** A fresh, ordered 52-card deck. */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

/**
 * Fisher–Yates shuffle. Returns a new array; the input is not changed.
 * `random` must return a number in [0, 1), like Math.random. Tests pass a fake one.
 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  // Walk backwards; swap each position with a random position at or before it.
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)); // 0..i inclusive
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface DealResult {
  hands: Card[][]; // hands[0] is player 0's cards, and so on
  rest: Card[]; // undealt cards
}

/** Give each player `cardsPerPlayer` cards from the top of the deck. */
export function deal(
  deck: readonly Card[],
  playerCount: number,
  cardsPerPlayer: number = SETTINGS.cardsPerPlayer,
): DealResult {
  const needed = playerCount * cardsPerPlayer;
  if (playerCount < 1 || needed > deck.length) {
    throw new Error(`Cannot deal ${cardsPerPlayer} cards to ${playerCount} players from ${deck.length} cards`);
  }

  // Taking consecutive slices is fine because the deck is already shuffled.
  const hands: Card[][] = [];
  for (let p = 0; p < playerCount; p++) {
    hands.push(deck.slice(p * cardsPerPlayer, (p + 1) * cardsPerPlayer));
  }
  return { hands, rest: deck.slice(needed) };
}
