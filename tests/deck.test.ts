import { describe, it, expect } from 'vitest';
import { cardLabel, type Card } from '../src/game/card';
import { createDeck, deal, shuffle } from '../src/game/deck';

// Turn a card into a string so we can put cards in a Set and spot duplicates.
const key = (c: Card) => `${c.rank}-${c.suit}`;

describe('cardLabel', () => {
  it('shows face cards as letters and numbers as numbers', () => {
    expect(cardLabel({ rank: 14, suit: 'spades' })).toBe('A♠');
    expect(cardLabel({ rank: 12, suit: 'hearts' })).toBe('Q♥');
    expect(cardLabel({ rank: 10, suit: 'clubs' })).toBe('10♣');
  });
});

describe('createDeck', () => {
  it('has 52 different cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map(key)).size).toBe(52);
  });

  it('has 13 cards of each suit', () => {
    const deck = createDeck();
    for (const suit of ['spades', 'hearts', 'diamonds', 'clubs'] as const) {
      expect(deck.filter((c) => c.suit === suit)).toHaveLength(13);
    }
  });
});

describe('shuffle', () => {
  it('does not change the original array', () => {
    const deck = createDeck();
    const copy = [...deck];
    shuffle(deck);
    expect(deck).toEqual(copy);
  });

  it('keeps exactly the same cards', () => {
    const shuffled = shuffle(createDeck());
    expect(shuffled.map(key).sort()).toEqual(createDeck().map(key).sort());
  });

  it('is predictable when we control the random numbers', () => {
    // With random() always 0, every step swaps position i with position 0:
    // [a,b,c] -> swap 2,0 -> [c,b,a] -> swap 1,0 -> [b,c,a]
    expect(shuffle(['a', 'b', 'c'], () => 0)).toEqual(['b', 'c', 'a']);
  });
});

describe('deal', () => {
  it('gives each player 9 cards with no card dealt twice', () => {
    const { hands, rest } = deal(shuffle(createDeck()), 5);
    expect(hands).toHaveLength(5);
    hands.forEach((hand) => expect(hand).toHaveLength(9));
    expect(rest).toHaveLength(52 - 45);

    const all = [...hands.flat(), ...rest].map(key);
    expect(new Set(all).size).toBe(52);
  });

  it('refuses to deal more cards than the deck has', () => {
    expect(() => deal(createDeck(), 6)).toThrow(); // 6 x 9 = 54 > 52
  });

  it('refuses zero players', () => {
    expect(() => deal(createDeck(), 0)).toThrow();
  });
});
