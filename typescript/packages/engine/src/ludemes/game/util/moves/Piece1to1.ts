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
  private readonly nameComponentValue: string | null;

  /**
   * @java Piece.names — the names of the components.
   */
  private readonly nameComponentsValue: string[] | null;

  /**
   * @java game/util/moves/Piece.java — constructor
   *
   * Exactly one of nameComponent, componentFn, nameComponents, componentsFn
   * must be non-null (Java enforces this with an assertion).
   */
  public constructor(
    nameComponent: string | { nameComponent?: string | null; componentFn?: IntFunction | null; nameComponents?: string[] | null; componentsFn?: IntFunction[] | null; stateFn?: IntFunction | null } | null,
    component?: IntFunction | null,
    nameComponents?: string[] | null,
    components?: IntFunction[] | null,
    state?: IntFunction | null
  ) {
    if (typeof nameComponent === "object" && nameComponent !== null && !("eval" in nameComponent)) {
      this.nameComponentValue = nameComponent.nameComponent ?? null;
      this.componentFn = nameComponent.componentFn ?? null;
      this.nameComponentsValue = nameComponent.nameComponents ?? null;
      this.componentsFn = nameComponent.componentsFn ?? null;
      this.stateFn = nameComponent.stateFn ?? null;
      return;
    }
    this.nameComponentValue = typeof nameComponent === "string" ? nameComponent : null;
    this.componentFn = component ?? null;
    this.nameComponentsValue = nameComponents ?? null;
    this.componentsFn = components ?? null;
    this.stateFn = state ?? null;
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
    return this.nameComponentValue;
  }

  /** @java Piece.nameComponent() */
  public nameComponent(): string | null {
    return this.nameComponentValue;
  }

  /** @java Piece.nameComponents() */
  public getNames(): string[] | null {
    return this.nameComponentsValue;
  }

  /** @java Piece.nameComponents() */
  public nameComponents(): string[] | null {
    return this.nameComponentsValue;
  }
}
