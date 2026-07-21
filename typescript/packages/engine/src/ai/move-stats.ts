/**
 * Java parity:
 * - AI/src/search/mcts/playout/MAST.java
 * - AI/src/search/mcts/playout/NST.java
 *
 * Move-Average Sampling Technique (MAST) keeps a running mean of the
 * playout reward observed every time a given move was played, indexed by
 * Move.hash(). N-gram Sampling Technique (NST) does the same for n-grams
 * of consecutive moves (n=2 here — bigrams keyed by previous-move hash).
 */

import type { Move } from "../move.js";

interface Stat {
  visits: number;
  totalReward: number;
}

export class MoveStats {
  private readonly table = new Map<number, Stat>();

  public update(move: Move, reward: number): void {
    const key = move.hash();
    const cur = this.table.get(key);
    if (cur === undefined) {
      this.table.set(key, { visits: 1, totalReward: reward });
    } else {
      cur.visits += 1;
      cur.totalReward += reward;
    }
  }

  public mean(move: Move): number {
    const cur = this.table.get(move.hash());
    if (!cur || cur.visits === 0) return 0;
    return cur.totalReward / cur.visits;
  }

  public visits(move: Move): number {
    return this.table.get(move.hash())?.visits ?? 0;
  }

  public size(): number {
    return this.table.size;
  }

  public clear(): void {
    this.table.clear();
  }
}

/**
 * Bigram stats keyed by (prev-move-hash, current-move-hash). For the
 * first ply of a playout the prev key is 0.
 */
export class BigramStats {
  private readonly table = new Map<string, Stat>();

  private static key(prev: number, current: number): string {
    return `${prev}:${current}`;
  }

  public update(prevHash: number, move: Move, reward: number): void {
    const key = BigramStats.key(prevHash, move.hash());
    const cur = this.table.get(key);
    if (cur === undefined) {
      this.table.set(key, { visits: 1, totalReward: reward });
    } else {
      cur.visits += 1;
      cur.totalReward += reward;
    }
  }

  public mean(prevHash: number, move: Move): number {
    const cur = this.table.get(BigramStats.key(prevHash, move.hash()));
    if (!cur || cur.visits === 0) return 0;
    return cur.totalReward / cur.visits;
  }

  public visits(prevHash: number, move: Move): number {
    return this.table.get(BigramStats.key(prevHash, move.hash()))?.visits ?? 0;
  }

  public size(): number {
    return this.table.size;
  }

  public clear(): void {
    this.table.clear();
  }
}
