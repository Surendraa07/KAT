import Phaser from 'phaser';

export interface Button {
  container: Phaser.GameObjects.Container;
  setEnabled(enabled: boolean): void;
  setLabel(text: string): void;
}

/** A clickable rectangle with a label. */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  width = 200,
): Button {
  const bg = scene.add.rectangle(0, 0, width, 48, 0x2a9d8f).setStrokeStyle(2, 0xffffff);
  const text = scene.add
    .text(0, 0, label, { fontFamily: 'Arial', fontSize: '22px', color: '#ffffff' })
    .setOrigin(0.5);
  const container = scene.add.container(x, y, [bg, text]);
  let enabled = true;

  bg.setInteractive({ useHandCursor: true })
    .on('pointerover', () => enabled && bg.setFillStyle(0x38b2a3))
    .on('pointerout', () => enabled && bg.setFillStyle(0x2a9d8f))
    .on('pointerdown', () => enabled && onClick());

  return {
    container,
    setEnabled(on) {
      enabled = on;
      bg.setFillStyle(on ? 0x2a9d8f : 0x555555);
      text.setAlpha(on ? 1 : 0.6);
    },
    setLabel(t) {
      text.setText(t);
    },
  };
}
