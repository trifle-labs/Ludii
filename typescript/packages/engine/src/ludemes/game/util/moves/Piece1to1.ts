/**
 * Piece1to1.ts
 * @java game/util/moves/Piece.java
 *
 * Parameter holder for the ``what'' (piece) clause of move generators.
 * Specifies the component index/name and optional state.
 *
 * This is a data class — no eval(ctx). Move generators read component()
 * and state() to determine which piece to place/move.
 *
 * NOTE: The compilation logic for resolving piece names to index functions
 * already lives in compiler1to1.ts :: compilePieceArg1to1(). This class
 * is the faithful 1:1 data-holder counterpart to Java's Piece.java; it
 * does NOT conflict with compilePieceArg1to1.
 */

import type { IntFunction } from "../../../base.js";

/**
 * Specifies operations based on the ``what'' data.
 * @java game/util/moves/Piece.java
 */
export class Piece1to1 {
  /**
   * @java Piece.component — the index of the component (IntFunction).
   * When constructed from a name, this wraps an Id lookup.
   */
  private readonly componentFn: IntFunction | null;

  /**
   * @java Piece.components — multiple component index functions.
   */
  private readonly componentsFn: IntFunction[] | null;

  /**
   * @java Piece.state — the local state of the site of the component.
   */
  private readonly stateFn: IntFunction | null;

  /**
   * @java Piece.name — the name of the component (string, before Id resolution).
   */
  private readonly nameComponent: string | null;

  /**
   * @java Piece.names — the names of the components.
   */
  private readonly nameComponents: string[] | null;

  /**
   * @java game/util/moves/Piece.java — constructor
   *
   * Exactly one of nameComponent, componentFn, nameComponents, componentsFn
   * must be non-null (Java enforces this with an assertion).
   */
  public constructor(opts: {
    nameComponent?: string | null;
    componentFn?: IntFunction | null;
    nameComponents?: string[] | null;
    componentsFn?: IntFunction[] | null;
    stateFn?: IntFunction | null;
  }) {
    this.nameComponent = opts.nameComponent ?? null;
    this.componentFn = opts.componentFn ?? null;
    this.nameComponents = opts.nameComponents ?? null;
    this.componentsFn = opts.componentsFn ?? null;
    this.stateFn = opts.stateFn ?? null;
  }

  /** @java Piece.component() */
  public component(): IntFunction | null {
    return this.componentFn;
  }

  /** @java Piece.components() */
  public components(): IntFunction[] | null {
    return this.componentsFn;
  }

  /** @java Piece.state() */
  public state(): IntFunction | null {
    return this.stateFn;
  }

  /** @java Piece.nameComponent() */
  public getName(): string | null {
    return this.nameComponent;
  }

  /** @java Piece.nameComponents() */
  public getNames(): string[] | null {
    return this.nameComponents;
  }
}
