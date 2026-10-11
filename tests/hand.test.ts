import { describe, it, expect } from 'vitest';
import { compareGroups, evaluateGroup } from '../src/game/hand';
import { cards } from './helpers';

const type = (text: string) => evaluateGroup(cards(text)).type;
const beats = (a: string, b: string) => compareGroups(cards(a), cards(b)) > 0;
const ties = (a: string, b: string) => compareGroups(cards(a), cards(b)) === 0;

describe('evaluateGroup', () => {
  it('recognises every hand type', () => {
    expect(type('7s 7h 7d')).toBe('trio');
    expect(type('5h 6h 7h')).toBe('pureRun');
    expect(type('5h 6s 7h')).toBe('run');
    expect(type('2h 9h Kh')).toBe('flush');
    expect(type('9s 9h 4d')).toBe('pair');
    expect(type('2s 9h Kd')).toBe('high');
  });

  it('treats A-2-3 and Q-K-A as runs but not K-A-2', () => {
    expect(type('As 2h 3d')).toBe('run');
    expect(type('Qs Kh Ad')).toBe('run');
    expect(type('Ks Ah 2d')).toBe('high');
  });

  it('rejects groups that are not 3 cards', () => {
    expect(() => evaluateGroup(cards('As Kh'))).toThrow();
  });
});

describe('compareGroups', () => {
  it('ranks types: trio > pure run > run > flush > pair > high card', () => {
    const order = ['2s 2h 2d', '2h 3h 4h', '2h 3s 4h', '2h 5h 9h', '2s 2h 3d', 'As Kh 9d'];
    for (let i = 0; i < order.length - 1; i++) expect(beats(order[i], order[i + 1])).toBe(true);
  });

  it('orders runs Q-K-A, A-2-3, J-Q-K ... 2-3-4', () => {
    expect(beats('Qs Kh Ad', 'As 2h 3d')).toBe(true);
    expect(beats('As 2h 3d', 'Js Qh Kd')).toBe(true);
    expect(beats('Js Qh Kd', '10s Jh Qd')).toBe(true);
    expect(beats('3s 4h 5d', '2s 3h 4d')).toBe(true);
  });

  it('compares pairs by pair rank, then the third card', () => {
    expect(beats('As Ah 2d', 'Ks Kh Qd')).toBe(true);
    expect(beats('9s 9h 5d', '9d 9c 4h')).toBe(true);
  });

  it('treats ace as high outside runs', () => {
    expect(beats('As 7h 9d', 'Ks Qh 9d')).toBe(true);
    expect(beats('As Ah Ad', 'Ks Kh Kd')).toBe(true);
  });

  it('never uses suits to break ties', () => {
    expect(ties('As Kh 9d', 'Ad Kc 9s')).toBe(true);
    expect(ties('2h 5h 9h', '2s 5s 9s')).toBe(true);
  });
});
