// 可重現的種子亂數（mulberry32）。狀態只有一個整數，存在 GameState.rng。

export class Rng {
  constructor(public state: number) {}

  next(): number {
    let t = (this.state = (this.state + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** 含頭含尾的整數。 */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  weighted<T>(items: { item: T; weight: number }[]): T | undefined {
    const total = items.reduce((sum, i) => sum + Math.max(0, i.weight), 0);
    if (total <= 0) return undefined;
    let roll = this.next() * total;
    for (const i of items) {
      roll -= Math.max(0, i.weight);
      if (roll < 0) return i.item;
    }
    return items[items.length - 1].item;
  }

  /** 不重複地抽出 n 個。 */
  sample<T>(items: readonly T[], n: number): T[] {
    const pool = [...items];
    const out: T[] = [];
    while (out.length < n && pool.length > 0) {
      out.push(pool.splice(Math.floor(this.next() * pool.length), 1)[0]);
    }
    return out;
  }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
