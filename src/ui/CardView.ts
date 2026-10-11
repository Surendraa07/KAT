import Phaser from 'phaser';
import { cardLabel, type Card } from '../game/card';

export const CARD_W = 80;
export const CARD_H = 112;

const RED_SUITS = new Set(['hearts', 'diamonds']);

/**
 * One card on screen: placeholder art made of a rectangle and some text.
 * A Container groups several game objects so they move and scale together.
 * Pass `null` to draw the card face down.
 */
export class CardView extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly normalStroke: number;

  constructor(scene: Phaser.Scene, x: number, y: number, card: Card | null, scale = 1) {
    super(scene, x, y);
    this.normalStroke = card ? 0x333333 : 0xf1f1f1;
    this.bg = scene.add
      .rectangle(0, 0, CARD_W, CARD_H, card ? 0xfdfcf6 : 0x8b1e3f)
      .setStrokeStyle(2, this.normalStroke);
    this.add(this.bg);

    if (card) {
      const label = cardLabel(card);
      const color = RED_SUITS.has(card.suit) ? '#c1121f' : '#111111';
      const corner = scene.add.text(-CARD_W / 2 + 6, -CARD_H / 2 + 4, label, {
        fontFamily: 'Arial',
        fontSize: '20px',
        fontStyle: 'bold',
        color,
      });
      const pip = scene.add
        .text(0, 10, label.slice(-1), { fontFamily: 'Arial', fontSize: '40px', color })
        .setOrigin(0.5);
      this.add([corner, pip]);
    } else {
      // A simple pattern for the card back.
      this.add(scene.add.rectangle(0, 0, CARD_W - 14, CARD_H - 14).setStrokeStyle(2, 0xf1c0cc));
    }

    this.setScale(scale);
    scene.add.existing(this); // put the container in the scene's display list
  }

  /** Make the card clickable. The rectangle is the hit area. */
  onClick(handler: () => void): this {
    this.bg.setInteractive({ useHandCursor: true }).on('pointerdown', handler);
    return this;
  }

  setHighlight(on: boolean, color = 0xffd166): this {
    this.bg.setStrokeStyle(on ? 5 : 2, on ? color : this.normalStroke);
    return this;
  }
}
