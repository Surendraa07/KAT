import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';

// The Game object owns the canvas and runs the game loop

new Phaser.Game({
  type: Phaser.AUTO, // use WebGL if the browser supports it, otherwise Canvas
  parent: 'game', // the <div id="game"> in index.html
  width: 1280,
  height: 720,
  backgroundColor: '#0b6e4f', // card-table green
  scale: {
    mode: Phaser.Scale.FIT, // shrink/grow to fit the window, keeping 16:9
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [TitleScene, GameScene, GameOverScene], // the first scene in the list starts automatically
});
