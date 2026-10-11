import Phaser from 'phaser';
import { SETTINGS } from '../settings';
import type { Card } from '../game/card';
import { createDeck, deal, shuffle } from '../game/deck';
import { describeGroup, handName } from '../game/hand';
import { resolveRound, toGroups, validateArrangement, type Arrangement } from '../game/round';
import { botArrange } from '../game/bot';
import {
  canAfford,
  collectAntes,
  createTable,
  gameStatus,
  loadBalance,
  payout,
  saveBalance,
  type Table,
} from '../game/table';
import { CARD_H, CARD_W, CardView } from '../ui/CardView';
import { makeButton, type Button } from '../ui/button';
import { sounds } from '../ui/sound';

// The table screen. One round goes:
//   ante -> deal -> human arranges (bots arrange instantly) -> reveal shows 1-3 -> payout
// All the rules come from src/game/; this file only draws things and reacts to clicks.

type Phase = 'arranging' | 'revealing' | 'roundOver';

const TEXT = { fontFamily: 'Arial', color: '#ffffff' };
const BOT_SCALE = 0.55;
const BOT_OVERLAP = 20; // each bot card is shifted this far right of the one before
const HUMAN_Y = 515;
const BOT_CARDS_Y = 100;
const GROUP_GAP = 50;

export class GameScene extends Phaser.Scene {
  private table!: Table;
  private roundNumber = 0;
  private phase: Phase = 'arranging';

  private inRound: number[] = []; // table indexes of players in this round
  private arrangements = new Map<number, Arrangement>(); // bots' groups, by player index
  private humanCards: Card[] = []; // 9 cards; positions 0-2 = group 1, 3-5 = group 2, 6-8 = group 3
  private selected: number | null = null;

  // Everything drawn for the current round goes in this layer, so we can clear it in one go.
  private roundLayer!: Phaser.GameObjects.Container;
  private humanViews: CardView[] = [];
  private botViews = new Map<number, CardView[][]>(); // [group][card]
  private humanLabels: Phaser.GameObjects.Text[] = [];

  private playerTexts: Phaser.GameObjects.Text[] = [];
  private potText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private showTexts: Phaser.GameObjects.Text[] = [];
  private autoButton!: Button;
  private confirmButton!: Button;
  private nextButton!: Button;

  constructor() {
    super('GameScene');
  }

  // init() receives the data passed to scene.start('GameScene', data).
  init(data: { botCount: number }): void {
    this.table = createTable(loadBalance(), data.botCount);
    this.roundNumber = 0;
  }

  create(): void {
    const { width } = this.scale;
    this.roundLayer = this.add.container(0, 0);

    // Name + balance for each bot along the top, and for the human above their cards.
    this.playerTexts = this.table.players.map((p, i) =>
      p.isHuman
        ? this.add.text(width / 2, 392, '', { ...TEXT, fontSize: '22px' }).setOrigin(0.5)
        : this.add.text(this.botSlotX(i), 28, '', { ...TEXT, fontSize: '20px' }).setOrigin(0.5),
    );

    this.potText = this.add.text(width / 2, 200, '', { ...TEXT, fontSize: '26px', color: '#ffd166' }).setOrigin(0.5);
    this.infoText = this.add
      .text(width / 2, 238, '', { ...TEXT, fontSize: '20px', align: 'center' })
      .setOrigin(0.5);
    this.showTexts = [0, 1, 2].map((i) =>
      this.add.text(width / 2, 275 + i * 26, '', { ...TEXT, fontSize: '18px' }).setOrigin(0.5),
    );

    this.autoButton = makeButton(this, width / 2 - 230, 650, 'Auto-arrange', () => this.autoArrange(), 210);
    this.confirmButton = makeButton(this, width / 2, 650, 'Confirm', () => this.confirm(), 210);
    this.nextButton = makeButton(this, width / 2 + 230, 650, 'Next round', () => this.next(), 210);
    makeButton(this, 70, 690, 'Menu', () => this.scene.start('TitleScene'), 110);

    this.startRound();
  }

  // ---------- Round flow ----------

  private startRound(): void {
    if (gameStatus(this.table) !== 'playing') {
      this.scene.start('GameOverScene', { status: gameStatus(this.table), balance: this.human.balance });
      return;
    }

    this.roundNumber++;
    this.inRound = collectAntes(this.table);
    saveBalance(this.human.balance);

    const { hands } = deal(shuffle(createDeck()), this.inRound.length);
    this.arrangements.clear();
    this.inRound.forEach((player, i) => {
      if (player === 0) this.humanCards = hands[i];
      else this.arrangements.set(player, botArrange(hands[i], this.inRound.length - 1));
    });
    this.selected = null;

    this.roundLayer.removeAll(true); // true = destroy the old cards too
    this.botViews.clear();
    this.showTexts.forEach((t) => t.setText(''));
    this.drawBots();
    this.drawHuman();
    this.updateHud();

    this.infoText.setText(
      `Round ${this.roundNumber}: everyone antes ${SETTINGS.ante}.\n` +
        'Click two cards to swap them. Strongest group on the left.',
    );
    this.setPhase('arranging');
  }

  private setPhase(phase: Phase): void {
    this.phase = phase;
    this.autoButton.setEnabled(phase === 'arranging');
    this.confirmButton.setEnabled(phase === 'arranging');
    this.nextButton.container.setVisible(phase === 'roundOver');
  }

  private confirm(): void {
    const groups = toGroups(this.humanCards);
    const error = validateArrangement(groups);
    if (error) {
      sounds.error();
      this.infoText.setText(error);
      this.tweens.add({ targets: this.infoText, x: '+=8', duration: 50, yoyo: true, repeat: 3 });
      return;
    }
    this.arrangements.set(0, groups);
    this.selectCard(null);
    this.setPhase('revealing');
    this.reveal();
  }

  /** Reveal shows 1, 2, 3 one after another, then settle the pot. */
  private reveal(): void {
    // resolveRound works on a plain list, so map list positions back to table indexes.
    const players = this.inRound;
    const result = resolveRound(players.map((p) => this.arrangements.get(p)!));
    this.infoText.setText('Revealing...');

    result.showWinners.forEach((winnerPos, show) => {
      this.time.delayedCall(700 + show * 1400, () => {
        this.revealShow(show, winnerPos === null ? null : players[winnerPos]);
      });
    });

    this.time.delayedCall(700 + 3 * 1400, () => {
      const winner = result.winner === null ? null : players[result.winner];
      const won = payout(this.table, winner);
      saveBalance(this.human.balance);
      if (winner === null) {
        sounds.kitti();
        this.infoText.setText(`KITTI! Nobody won two shows in a row.\nThe pot of ${this.table.pot} carries over.`);
      } else {
        sounds.roundWin();
        const who = winner === 0 ? 'You win' : `${this.table.players[winner].name} wins`;
        this.infoText.setText(`${who} the pot of ${won} coins!`);
      }
      this.updateHud();
      this.nextButton.setLabel(gameStatus(this.table) === 'playing' ? 'Next round' : 'Continue');
      this.setPhase('roundOver');
    });
  }

  private revealShow(show: number, winner: number | null): void {
    sounds.flip();
    // Flip every bot's group for this show face up.
    for (const player of this.inRound) {
      if (player === 0) continue;
      const group = this.arrangements.get(player)![show];
      const views = this.botViews.get(player)![show];
      views.forEach((old, k) => {
        const view = new CardView(this, old.x, old.y, group[k], BOT_SCALE);
        this.roundLayer.add(view);
        old.destroy();
        views[k] = view;
      });
      this.roundLayer.add(
        this.add
          .text(this.botGroupCenterX(player, show), 150, handName(group), { ...TEXT, fontSize: '13px' })
          .setOrigin(0.5),
      );
    }

    const label = `Show ${show + 1}: `;
    if (winner === null) {
      this.showTexts[show].setText(label + 'tie for best group - show voided').setColor('#bbbbbb');
      return;
    }
    sounds.showWin();
    const name = winner === 0 ? 'You' : this.table.players[winner].name;
    const group = this.arrangements.get(winner)![show];
    this.showTexts[show].setText(`${label}${name} - ${describeGroup(group)}`).setColor('#ffd166');

    const views = winner === 0 ? this.humanViews.slice(show * 3, show * 3 + 3) : this.botViews.get(winner)![show];
    views.forEach((v) => v.setHighlight(true));
    this.tweens.add({ targets: views, y: '-=10', duration: 150, yoyo: true });
  }

  private next(): void {
    if (gameStatus(this.table) !== 'playing') {
      this.scene.start('GameOverScene', { status: gameStatus(this.table), balance: this.human.balance });
    } else {
      this.startRound();
    }
  }

  // ---------- Human arranging ----------

  private clickCard(index: number): void {
    if (this.phase !== 'arranging') return;
    if (this.selected === null) {
      sounds.select();
      this.selectCard(index);
    } else if (this.selected === index) {
      this.selectCard(null);
    } else {
      sounds.swap();
      const cards = this.humanCards;
      [cards[this.selected], cards[index]] = [cards[index], cards[this.selected]];
      this.selected = null;
      this.drawHuman();
    }
  }

  private selectCard(index: number | null): void {
    this.selected = index;
    this.humanViews.forEach((v, i) => {
      v.setHighlight(i === index);
      v.y = HUMAN_Y - (i === index ? 14 : 0);
    });
  }

  private autoArrange(): void {
    sounds.swap();
    this.humanCards = botArrange(this.humanCards, this.inRound.length - 1).flat();
    this.selected = null;
    this.drawHuman();
  }

  // ---------- Drawing ----------

  private get human() {
    return this.table.players[0];
  }

  private botSlotX(player: number): number {
    const bots = this.table.players.length - 1;
    return (this.scale.width * (player - 0.5)) / bots;
  }

  private botGroupCenterX(player: number, group: number): number {
    const groupW = CARD_W * BOT_SCALE + 2 * BOT_OVERLAP;
    return this.botSlotX(player) + (group - 1) * (groupW + 12);
  }

  private drawBots(): void {
    for (let player = 1; player < this.table.players.length; player++) {
      if (!this.inRound.includes(player)) {
        this.roundLayer.add(
          this.add
            .text(this.botSlotX(player), BOT_CARDS_Y, 'OUT', { ...TEXT, fontSize: '28px', color: '#888888' })
            .setOrigin(0.5),
        );
        continue;
      }
      const groups = [0, 1, 2].map((g) =>
        [0, 1, 2].map((k) => {
          const view = new CardView(this, this.botGroupCenterX(player, g) + (k - 1) * BOT_OVERLAP, BOT_CARDS_Y, null, BOT_SCALE);
          this.roundLayer.add(view);
          return view;
        }),
      );
      this.botViews.set(player, groups);
    }
  }

  private humanCardX(index: number): number {
    const groupW = 3 * CARD_W + 2 * 6;
    const totalW = 3 * groupW + 2 * GROUP_GAP;
    const group = Math.floor(index / 3);
    const left = this.scale.width / 2 - totalW / 2 + group * (groupW + GROUP_GAP);
    return left + CARD_W / 2 + (index % 3) * (CARD_W + 6);
  }

  /** Redraw the human's 9 cards and the label above each group. */
  private drawHuman(): void {
    this.humanViews.forEach((v) => v.destroy());
    this.humanLabels.forEach((t) => t.destroy());

    this.humanViews = this.humanCards.map((card, i) => {
      const view = new CardView(this, this.humanCardX(i), HUMAN_Y, card).onClick(() => this.clickCard(i));
      this.roundLayer.add(view);
      return view;
    });

    // Label each group, and colour it red if it breaks the group 1 >= 2 >= 3 rule.
    const groups = toGroups(this.humanCards);
    const error = validateArrangement(groups);
    const badGroup = error?.startsWith('Group 1') ? 1 : error?.startsWith('Group 2') ? 2 : -1;
    this.humanLabels = groups.map((g, i) => {
      const text = this.add
        .text(this.humanCardX(i * 3 + 1), HUMAN_Y - CARD_H / 2 - 24, `Show ${i + 1}: ${handName(g)}`, {
          ...TEXT,
          fontSize: '18px',
          color: i === badGroup ? '#ff6b6b' : '#b7f0c0',
        })
        .setOrigin(0.5);
      this.roundLayer.add(text);
      return text;
    });
  }

  private updateHud(): void {
    this.table.players.forEach((p, i) => {
      const out = !canAfford(p) && !this.inRound.includes(i);
      this.playerTexts[i].setText(out ? `${p.name}: out` : `${p.name}: ${p.balance} coins`);
    });
    this.potText.setText(`Pot: ${this.table.pot}`);
  }
}
