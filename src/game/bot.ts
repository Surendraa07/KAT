import type { Card } from './card';
import { createDeck, deal, shuffle } from './deck';
import { compareValues, evaluateGroup, type GroupValue } from './hand';
import type { Arrangement } from './round';

// How a bot arranges its 9 cards:
// 1. Try every way to split 9 cards into 3 groups (only 280 ways).
// 2. Put each split in strongest-first order, so it is always legal.
// 3. Estimate the chance each group wins its show, combine those into a chance of winning
//    two shows in a row, and keep the split with the best chance.
//
// "Chance of winning a show" needs to know what opponents usually put in that show.
// We learn that once, by letting a simple bot arrange a few hundred random hands.

/** Every way to split the cards into 3 unordered groups of 3. */
export function allSplits(cards: readonly Card[]): Arrangement[] {
  const splits: Arrangement[] = [];
  const [first, ...rest] = cards; // fixing the first card in group A avoids counting the same split twice
  for (let i = 0; i < rest.length; i++)
    for (let j = i + 1; j < rest.length; j++) {
      const a = [first, rest[i], rest[j]];
      const left = rest.filter((_, idx) => idx !== i && idx !== j);
      const [second, ...rest2] = left;
      for (let k = 0; k < rest2.length; k++)
        for (let l = k + 1; l < rest2.length; l++) {
          const b = [second, rest2[k], rest2[l]];
          const c = rest2.filter((_, idx) => idx !== k && idx !== l);
          splits.push([a, b, c]);
        }
    }
  return splits;
}

/** Order groups strongest first, so the arrangement is always legal. */
export function sortGroups(groups: Arrangement): Arrangement {
  return [...groups].sort((x, y) => compareValues(evaluateGroup(y), evaluateGroup(x)));
}

/** Fraction of `sorted` (weakest first) that `v` beats; ties count as half. */
function fractionBeaten(v: GroupValue, sorted: readonly GroupValue[]): number {
  const below = lowerBound(sorted, v, (c) => c < 0);
  const notAbove = lowerBound(sorted, v, (c) => c <= 0);
  return (below + (notAbove - below) / 2) / sorted.length;
}

// Binary search: how many items at the start of `sorted` satisfy test(compare(item, v)).
function lowerBound(sorted: readonly GroupValue[], v: GroupValue, test: (cmp: number) => boolean): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (test(compareValues(sorted[mid], v))) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// --- Step A: strength against any random 3-card group (used to build step B) ---

let allGroups: GroupValue[] | null = null;

function randomGroupValues(): GroupValue[] {
  if (allGroups) return allGroups;
  const deck = createDeck();
  const values: GroupValue[] = [];
  for (let i = 0; i < deck.length; i++)
    for (let j = i + 1; j < deck.length; j++)
      for (let k = j + 1; k < deck.length; k++) values.push(evaluateGroup([deck[i], deck[j], deck[k]]));
  return (allGroups = values.sort(compareValues));
}

/** 0..1: how often this group beats a random 3-card group. */
export function groupStrength(cards: readonly Card[]): number {
  return fractionBeaten(evaluateGroup(cards), randomGroupValues());
}

function simpleArrange(cards: readonly Card[]): Arrangement {
  return bestSplit(cards, strengthSum);
}

// --- Step B: what opponents typically play in shows 1, 2 and 3 ---

let showSamples: GroupValue[][] | null = null;

function opponentShows(): GroupValue[][] {
  if (showSamples) return showSamples;
  // A fixed, seeded "random" so every game learns the same thing.
  let seed = 12345;
  const random = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const samples: GroupValue[][] = [[], [], []];
  for (let n = 0; n < 300; n++) {
    const hand = deal(shuffle(createDeck(), random), 1).hands[0];
    simpleArrange(hand).forEach((g, i) => samples[i].push(evaluateGroup(g)));
  }
  return (showSamples = samples.map((s) => s.sort(compareValues)));
}

/** Rough chance of winning the round with these groups against `opponents` bots. */
export function winChance(groups: Arrangement, opponents = 1): number {
  const shows = opponentShows();
  // To win a show you must beat every opponent's group in it.
  const [p1, p2, p3] = groups.map((g, i) => fractionBeaten(evaluateGroup(g), shows[i]) ** opponents);
  return p1 * p2 + p2 * p3 - p1 * p2 * p3; // win shows 1+2 or 2+3 (don't count 1+2+3 twice)
}

function bestSplit(cards: readonly Card[], score: (groups: Arrangement) => number): Arrangement {
  let best: Arrangement | null = null;
  let bestScore = -Infinity;
  for (const split of allSplits(cards)) {
    const ordered = sortGroups(split);
    const s = score(ordered);
    if (s > bestScore) {
      best = ordered;
      bestScore = s;
    }
  }
  return best!;
}

export function botArrange(cards: readonly Card[], opponents = 1): Arrangement {
  // The tiny second term only breaks ties between equally good splits: prefer stronger groups.
  return bestSplit(cards, (groups) => winChance(groups, opponents) + 0.001 * strengthSum(groups));
}

function strengthSum(groups: Arrangement): number {
  return groups.reduce((sum, g) => sum + groupStrength(g), 0);
}
