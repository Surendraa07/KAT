import Phaser from 'phaser';
import { SETTINGS } from '../settings';

// A Scene is one "screen" of the game (title, table, game over...).
// Phaser calls its lifecycle methods for us: preload -> create -> update (every frame).
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene'); // the key we use to start/switch to this scene later
  }

  // create() runs once when the scene starts: build what's on screen here.
  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 40, 'KITTI', { fontSize: '72px', color: '#ffd166' })
      .setOrigin(0.5); // origin 0.5 = position the text by its centre, not its top-left corner

    this.add
      .text(width / 2, height / 2 + 40, `Ante: ${SETTINGS.ante} coins`, {
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }
}
