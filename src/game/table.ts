import { SETTINGS } from '../settings';

// Money rules: wallets, the pot, antes and payouts. No cards in here.

export interface Player {
  name: string;
  balance: number;
  isHuman: boolean;
}

export interface Table {
  players: Player[];
  pot: number; // includes any carry-over from previous kittis
}

export function createTable(humanBalance: number, botCount: number, startingBalance = SETTINGS.startingBalance): Table {
  const players: Player[] = [{ name: 'You', balance: humanBalance, isHuman: true }];
  for (let i = 1; i <= botCount; i++) {
    players.push({ name: `Bot ${i}`, balance: startingBalance, isHuman: false });
  }
  return { players, pot: 0 };
}

export function canAfford(player: Player, ante = SETTINGS.ante): boolean {
  return player.balance >= ante;
}

/**
 * Everyone who can afford it pays the ante. Returns the indexes of the players in this
 * round (players who can't pay sit out — they are out of the game).
 */
export function collectAntes(table: Table, ante = SETTINGS.ante): number[] {
  const inRound: number[] = [];
  table.players.forEach((p, i) => {
    if (canAfford(p, ante)) {
      p.balance -= ante;
      table.pot += ante;
      inRound.push(i);
    }
  });
  return inRound;
}

/** Winner takes the whole pot. A null winner is a kitti: the pot stays for next round. */
export function payout(table: Table, winner: number | null): number {
  if (winner === null) return 0;
  const won = table.pot;
  table.players[winner].balance += won;
  table.pot = 0;
  return won;
}

export type GameStatus = 'playing' | 'humanOut' | 'humanWon';

export function gameStatus(table: Table, ante = SETTINGS.ante): GameStatus {
  const human = table.players.find((p) => p.isHuman)!;
  // A kitti pot still on the table can come back to the human, so only count them out
  // when they can't ante.
  if (!canAfford(human, ante)) return 'humanOut';
  if (table.players.every((p) => p.isHuman || !canAfford(p, ante))) return 'humanWon';
  return 'playing';
}

// The human's balance is kept in the browser. `storage` is a parameter so tests can
// pass a fake one, and so a blocked localStorage doesn't crash the game.
const BALANCE_KEY = 'kitti.balance';

export function loadBalance(storage: Pick<Storage, 'getItem'> | null = safeStorage()): number {
  const raw = storage?.getItem(BALANCE_KEY);
  const saved = raw == null ? NaN : Number(raw);
  return Number.isFinite(saved) && saved >= 0 ? saved : SETTINGS.startingBalance;
}

export function saveBalance(balance: number, storage: Pick<Storage, 'setItem'> | null = safeStorage()): void {
  try {
    storage?.setItem(BALANCE_KEY, String(balance));
  } catch {
    // Saving is a nice-to-have; ignore quota/privacy errors.
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
