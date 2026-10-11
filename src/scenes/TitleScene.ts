import Phaser from 'phaser';
import { SETTINGS } from '../settings';
import { loadBalance, saveBalance } from '../game/table';
import { makeButton } from '../ui/button';
import { sounds } from '../ui/sound';

// A Scene is one "screen" of the game (title, table, game over...).
// Phaser calls its lifecycle methods for us: preload -> create -> update (every frame).
// This one is also the settings screen: pick how many bots to play against.
export class TitleScene extends Phaser.Scene {
  private botCount = 2;

  constructor() {
    super('TitleScene'); // the key we use to start/switch to this scene later
  }

  // create() runs once when the scene starts: build what's on screen here.
  create(): void {
    const { width, height } = this.scale;
    const text = { fontFamily: 'Arial', color: '#ffffff' };
    const balance = loadBalance();

    this.add
      .text(width / 2, 110, 'KITTI', { ...text, fontSize: '96px', color: '#ffd166' })
      .setOrigin(0.5); // origin 0.5 = position the text by its centre, not its top-left corner

    this.add
      .text(
        width / 2,
        230,
        'Arrange 9 cards into 3 groups, strongest first. Win two shows in a row to take the pot.\n' +
          'Three of a kind > pure run > run > flush > pair > high card.',
        { ...text, fontSize: '20px', align: 'center', color: '#dddddd' },
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, 320, `Your coins: ${balance}    Ante: ${SETTINGS.ante}`, { ...text, fontSize: '28px' })
      .setOrigin(0.5);

    // Bot count picker: [-]  2 bots  [+]
    const countText = this.add.text(width / 2, 400, '', { ...text, fontSize: '30px' }).setOrigin(0.5);
    const showCount = () => countText.setText(`${this.botCount} bot${this.botCount > 1 ? 's' : ''}`);
    const change = (delta: number) => {
      this.botCount = Phaser.Math.Clamp(this.botCount + delta, SETTINGS.minBots, SETTINGS.maxBots);
      sounds.select();
      showCount();
    };
    makeButton(this, width / 2 - 150, 400, '-', () => change(-1), 60);
    makeButton(this, width / 2 + 150, 400, '+', () => change(1), 60);
    showCount();

    const canPlay = balance >= SETTINGS.ante;
    const play = makeButton(this, width / 2, 490, 'Play', () => this.scene.start('GameScene', { botCount: this.botCount }));
    play.setEnabled(canPlay);

    if (!canPlay) {
      makeButton(
        this,
        width / 2,
        560,
        `Reset coins to ${SETTINGS.startingBalance}`,
        () => {
          saveBalance(SETTINGS.startingBalance);
          this.scene.restart();
        },
        320,
      );
    }

    this.add
      .text(width / 2, height - 30, 'Your coins are saved in this browser.', { ...text, fontSize: '16px', color: '#aaaaaa' })
      .setOrigin(0.5);
  }
}
