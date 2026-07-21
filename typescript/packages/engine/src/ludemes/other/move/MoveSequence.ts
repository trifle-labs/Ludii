// @java Core/src/other/move/MoveSequence.java MoveSequence
/**
 * Represents a sequence of moves, with optional parent chain.
 *
 * Faithful 1:1 transliteration of other.move.MoveSequence.
 *
 * @author Dennis Soemers  (Java original)
 */

import type { LudiiMove } from "./LudiiMove.js";

/**
 * Persistent linked sequence of moves.  Allows appending without copying
 * the entire history by chaining to a parent sequence.
 *
 * @java other.move.MoveSequence
 */
export class MoveSequence {
  // -------- fields ---------------------------------------------------------

  /** @java MoveSequence#parent */
  protected readonly parent: MoveSequence | null;

  /** @java MoveSequence#moves */
  private readonly _moves: LudiiMove[];

  /** @java MoveSequence#isParent */
  private _isParent = false;

  /** @java MoveSequence#cumulativeParentSize */
  private readonly _cumulativeParentSize: number;

  // -------- constructors ---------------------------------------------------

  /**
   * @java MoveSequence(MoveSequence parent)
   */
  constructor(parent: MoveSequence | null);
  /**
   * @java MoveSequence(MoveSequence parent, boolean allowInvalidation)
   */
  constructor(parent: MoveSequence | null, allowInvalidation: boolean);

  constructor(parent: MoveSequence | null, allowInvalidation?: boolean) {
    this.parent = parent;
    this._moves = [];

    if (parent !== null) {
      this._cumulativeParentSize =
        parent.movesList().length + parent._cumulativeParentSize;

      if (allowInvalidation === undefined || !allowInvalidation) {
        parent._isParent = true;
      }
    } else {
      this._cumulativeParentSize = 0;
    }
  }

  // -------- add / modify ---------------------------------------------------

  /**
   * Add move to end of sequence.  Returns this or a new MoveSequence if
   * this is already a parent.
   * @java MoveSequence#add(Move)
   */
  add(move: LudiiMove): MoveSequence {
    if (this._isParent) {
      const newSeq = new MoveSequence(this);
      newSeq.add(move);
      return newSeq;
    }
    this._moves.push(move);
    return this;
  }

  /**
   * @java MoveSequence#replaceLastMove(Move)
   */
  replaceLastMove(move: LudiiMove): void {
    this._moves[this._moves.length - 1] = move;
  }

  // -------- random access --------------------------------------------------

  /**
   * @java MoveSequence#getMove(int)
   */
  getMove(idx: number): LudiiMove {
    const parents: MoveSequence[] = [];
    let nextParent: MoveSequence | null = this.parent;
    while (nextParent !== null) {
      parents.push(nextParent);
      nextParent = nextParent.parent;
    }

    let sublistIdx = idx;
    for (let i = parents.length - 1; i >= 0; --i) {
      const sublist = parents[i]!.movesList();
      if (sublistIdx < sublist.length) return sublist[sublistIdx]!;
      sublistIdx -= sublist.length;
    }
    return this._moves[sublistIdx]!;
  }

  // -------- last move helpers ----------------------------------------------

  /**
   * Remove and return the last move in this (local) sequence.
   * @java MoveSequence#removeLastMove()
   */
  removeLastMove(): LudiiMove | null {
    if (this._moves.length !== 0) {
      return this._moves.pop() ?? null;
    }
    return null;
  }

  /**
   * Return the last move in the whole chain without removing it.
   * @java MoveSequence#lastMove()
   */
  lastMove(): LudiiMove | null {
    if (this._moves.length !== 0) {
      return this._moves[this._moves.length - 1] ?? null;
    }
    if (this.parent !== null) return this.parent.lastMove();
    return null;
  }

  /**
   * Last move by a specific player.
   * @java MoveSequence#lastMove(int)
   */
  lastMoveByPlayer(pid: number): LudiiMove | null {
    for (let i = this._moves.length - 1; i >= 0; i--) {
      const m = this._moves[i]!;
      if (m.mover() === pid) return m;
    }
    if (this.parent !== null) return this.parent.lastMoveByPlayer(pid);
    return null;
  }

  // -------- size -----------------------------------------------------------

  /** @java MoveSequence#size() */
  size(): number {
    return this._moves.length + this._cumulativeParentSize;
  }

  // -------- full list generation ------------------------------------------

  /**
   * @java MoveSequence#generateCompleteMovesList()
   */
  generateCompleteMovesList(): LudiiMove[] {
    const parents: MoveSequence[] = [];
    let nextParent: MoveSequence | null = this.parent;
    while (nextParent !== null) {
      parents.push(nextParent);
      nextParent = nextParent.parent;
    }

    const complete: LudiiMove[] = [];
    for (let i = parents.length - 1; i >= 0; --i) {
      complete.push(...parents[i]!.movesList());
    }
    complete.push(...this._moves);
    return complete;
  }

  // -------- reverse iterator -----------------------------------------------

  /**
   * Returns an iterable that visits moves in reverse order.
   * @java MoveSequence#reverseMoveIterator()
   */
  *reverseMoveIterator(): IterableIterator<LudiiMove> {
    // Build stack of sequences from root to this
    const chain: MoveSequence[] = [];
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let cur: MoveSequence | null = this;
    while (cur !== null) { chain.push(cur); cur = cur.parent; }

    // Iterate deepest-first in reverse
    for (let ci = 0; ci < chain.length; ci++) {
      const seq = chain[ci]!;
      for (let i = seq._moves.length - 1; i >= 0; --i) {
        yield seq._moves[i]!;
      }
    }
  }

  // -------- protected helpers ----------------------------------------------

  /** @java MoveSequence#movesList() */
  protected movesList(): LudiiMove[] {
    return this._moves;
  }
}
