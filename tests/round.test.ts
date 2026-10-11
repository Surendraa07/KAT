import { describe, it, expect } from 'vitest';
import { resolveRound, showWinner, validateArrangement } from '../src/game/round';
import { cards } from './helpers';

const groups = (...texts: string[]) => texts.map(cards);

// Handy groups from strong to weak.
const TRIO = '7s 7h 7d';
const RUN = '4s 5h 6d';
const PAIR = '9s 9h 2d';
const PAIR_SAME = '9d 9c 2h'; // ties PAIR exactly
const HIGH = 'Ks 8h 3d';
const LOW = '2s 5h 8c';

describe('validateArrangement', () => {
  it('accepts strongest-first and equal groups', () => {
    expect(validateArrangement(groups(TRIO, RUN, PAIR))).toBeNull();
    expect(validateArrangement(groups(PAIR, PAIR_SAME, HIGH))).toBeNull();
  });

  it('rejects any other order', () => {
    expect(validateArrangement(groups(RUN, TRIO, PAIR))).not.toBeNull();
    expect(validateArrangement(groups(TRIO, PAIR, RUN))).not.toBeNull();
  });
});

describe('showWinner', () => {
  it('picks the strongest group', () => {
    expect(showWinner(groups(PAIR, TRIO, HIGH))).toBe(1);
  });

  it('voids the show when the best groups tie, even if others are weaker', () => {
    expect(showWinner(groups(PAIR, PAIR_SAME, HIGH))).toBeNull();
  });

  it('ignores ties below the best group', () => {
    expect(showWinner(groups(TRIO, PAIR, PAIR_SAME))).toBe(0);
  });
});

describe('resolveRound', () => {
  it('a player who wins shows 1 and 2 wins the round', () => {
    const r = resolveRound([groups(TRIO, RUN, LOW), groups(PAIR, PAIR_SAME, HIGH)]);
    expect(r.showWinners).toEqual([0, 0, 1]);
    expect(r.winner).toBe(0);
  });

  it('a player who wins shows 2 and 3 wins the round', () => {
    const r = resolveRound([groups(TRIO, PAIR, LOW), groups(PAIR, RUN, HIGH)]);
    expect(r.winner).toBe(1);
  });

  it('winning shows 1 and 3 only is a kitti', () => {
    const r = resolveRound([groups(TRIO, PAIR, HIGH), groups(RUN, RUN, LOW)]);
    expect(r.showWinners).toEqual([0, 1, 0]);
    expect(r.winner).toBeNull();
  });

  it('a voided show 1 still lets shows 2 and 3 decide', () => {
    const r = resolveRound([groups(PAIR, RUN, HIGH), groups(PAIR_SAME, PAIR, LOW)]);
    expect(r.showWinners).toEqual([null, 0, 0]);
    expect(r.winner).toBe(0);
  });

  it('a voided show 2 means nobody wins', () => {
    const r = resolveRound([groups(TRIO, PAIR, HIGH), groups(RUN, PAIR_SAME, LOW)]);
    expect(r.showWinners).toEqual([0, null, 0]);
    expect(r.winner).toBeNull();
  });
});
