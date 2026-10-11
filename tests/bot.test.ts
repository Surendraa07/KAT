import { describe, it, expect } from 'vitest';
import { allSplits, botArrange, groupStrength, winChance } from '../src/game/bot';
import { createDeck, deal, shuffle } from '../src/game/deck';
import { validateArrangement } from '../src/game/round';
import { cards } from './helpers';

describe('bot', () => {
  it('finds all 280 ways to split 9 cards into 3 groups', () => {
    expect(allSplits(cards('2s 3s 4s 5s 6s 7s 8s 9s 10s'))).toHaveLength(280);
  });

  it('rates the best and worst groups at the ends of the scale', () => {
    // Not exactly 1 and 0: equal groups (same cards, other suits) count as half a win.
    expect(groupStrength(cards('As Ah Ad'))).toBeGreaterThan(0.999);
    expect(groupStrength(cards('2s 3h 5d'))).toBeLessThan(0.01);
  });

  it('always makes a legal arrangement that uses all 9 cards', () => {
    for (let i = 0; i < 20; i++) {
      const hand = deal(shuffle(createDeck()), 1).hands[0];
      const groups = botArrange(hand);
      expect(validateArrangement(groups)).toBeNull();
      expect(groups.flat()).toHaveLength(9);
      expect(new Set(groups.flat())).toEqual(new Set(hand));
    }
  });

  it('makes three trios when it can', () => {
    const groups = botArrange(cards('Qs Ah Kd As Qh Kh Ad Ks Qd'));
    expect(groups.map((g) => g.map((c) => c.rank))).toEqual([[14, 14, 14], [13, 13, 13], [12, 12, 12]]);
  });

  it('prefers winning two shows over one huge group', () => {
    // A trio of aces wins only show 1; A-2-3 plus a pair of aces can win shows 1 and 2.
    const hand = cards('As Ah Ad 2c 3d 7h 9s Jc 5h');
    const trioFirst = [cards('As Ah Ad'), cards('Jc 9s 7h'), cards('5h 3d 2c')];
    expect(winChance(botArrange(hand))).toBeGreaterThan(winChance(trioFirst));
  });
});
