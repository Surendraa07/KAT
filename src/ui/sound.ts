// Tiny sound effects made with the browser's Web Audio API, so we need no sound files.
// An oscillator makes a tone; a gain node fades it out so it doesn't click.

let ctx: AudioContext | null = null;

export function beep(frequency = 440, ms = 90, volume = 0.05): void {
  try {
    ctx ??= new AudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + ms / 1000);
  } catch {
    // No audio available: the game works fine without sound.
  }
}

export const sounds = {
  select: () => beep(660, 60),
  swap: () => beep(520, 80),
  error: () => beep(160, 200),
  flip: () => beep(380, 70),
  showWin: () => beep(880, 140),
  roundWin: () => [523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 160), i * 120)),
  kitti: () => [400, 300].forEach((f, i) => setTimeout(() => beep(f, 180), i * 150)),
};
