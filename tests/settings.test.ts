import { describe, it, expect } from 'vitest';
import { SETTINGS } from '../src/settings';

describe('settings', () => {
  it('deals exactly 3 groups of 3', () => {
    expect(SETTINGS.cardsPerPlayer).toBe(SETTINGS.groupSize * 3);
  });

  it('lets a new player afford at least one ante', () => {
    expect(SETTINGS.ante).toBeGreaterThan(0);
    expect(SETTINGS.startingBalance).toBeGreaterThanOrEqual(SETTINGS.ante);
  });

  it('has enough cards in a 52-card deck for the maximum table', () => {
    const maxPlayers = SETTINGS.maxBots + 1; // bots + the human
    expect(maxPlayers * SETTINGS.cardsPerPlayer).toBeLessThanOrEqual(52);
  });
});
