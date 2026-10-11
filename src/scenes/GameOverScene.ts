import Phaser from 'phaser';
import { SETTINGS } from '../settings';
import type { GameStatus } from '../game/table';
import { saveBalance } from '../game/table';
import { makeButton } from '../ui/button';

export class GameOverScene extends Phaser.Scene {
  private status: GameStatus = 'humanOut';
  private balance = 0;

  constructor() {
    super('GameOverScene');
  }

  init(data: { status: GameStatus; balance: number }): void {
    this.status = data.status;
    this.balance = data.balance;
  }

  create(): void {
    const { width, height } = this.scale;
    const won = this.status === 'humanWon';

    this.add
      .text(width / 2, height / 2 - 110, won ? 'YOU CLEANED OUT THE TABLE!' : 'OUT OF COINS', {
        fontFamily: 'Arial',
        fontSize: '52px',
        color: won ? '#ffd166' : '#ff6b6b',
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height / 2 - 30,
        won
          ? `Every bot is out. You finish with ${this.balance} coins.`
          : `You can't afford the ${SETTINGS.ante}-coin ante.`,
        { fontFamily: 'Arial', fontSize: '26px', color: '#ffffff' },
      )
      .setOrigin(0.5);

    if (won) {
      makeButton(this, width / 2, height / 2 + 60, 'New table', () => this.scene.start('TitleScene'), 260);
    } else {
      makeButton(
        this,
        width / 2,
        height / 2 + 60,
        `Start over (${SETTINGS.startingBalance})`,
        () => {
          saveBalance(SETTINGS.startingBalance);
          this.scene.start('TitleScene');
        },
        260,
      );
    }
  }
}
