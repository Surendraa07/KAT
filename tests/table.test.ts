import { describe, it, expect } from 'vitest';
import { collectAntes, createTable, gameStatus, loadBalance, payout, saveBalance } from '../src/game/table';

describe('table', () => {
  it('collects the ante from everyone who can pay', () => {
    const table = createTable(500, 2);
    table.players[2].balance = 5; // can't afford 10
    expect(collectAntes(table, 10)).toEqual([0, 1]);
    expect(table.pot).toBe(20);
    expect(table.players.map((p) => p.balance)).toEqual([490, 490, 5]);
  });

  it('pays the whole pot to the winner', () => {
    const table = createTable(500, 1);
    collectAntes(table, 10);
    expect(payout(table, 1)).toBe(20);
    expect(table.pot).toBe(0);
    expect(table.players[1].balance).toBe(510);
  });

  it('carries the pot over on a kitti', () => {
    const table = createTable(500, 1);
    collectAntes(table, 10);
    payout(table, null);
    collectAntes(table, 10);
    expect(table.pot).toBe(40);
    expect(payout(table, 0)).toBe(40);
  });

  it('reports when the game is over', () => {
    const table = createTable(500, 2);
    expect(gameStatus(table, 10)).toBe('playing');
    table.players[1].balance = 0;
    table.players[2].balance = 9;
    expect(gameStatus(table, 10)).toBe('humanWon');
    table.players[0].balance = 3;
    expect(gameStatus(table, 10)).toBe('humanOut');
  });
});

describe('saved balance', () => {
  it('round-trips through storage and defaults when nothing is saved', () => {
    const data = new Map<string, string>();
    const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
    expect(loadBalance(storage)).toBe(500);
    saveBalance(320, storage);
    expect(loadBalance(storage)).toBe(320);
    saveBalance(0, storage);
    expect(loadBalance(storage)).toBe(0);
  });
});
