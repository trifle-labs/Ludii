// @java Core/src/game/functions/booleans/BooleanConstant.java

/**
 * Constant boolean value.
 *
 * @java game.functions.booleans.BooleanConstant
 */

import type { Context } from "../../../../context.js";
import { BaseBooleanFunction } from "./BaseBooleanFunction.js";

/**
 * A boolean function that always returns a fixed constant value.
 * @java game.functions.booleans.BooleanConstant
 */
export class BooleanConstant extends BaseBooleanFunction {
  /** The constant boolean value. @java BooleanConstant.a */
  private readonly a: boolean;

  /** @java BooleanConstant(boolean) */
  public constructor(a: boolean) {
    super();
    this.a = a;
  }

  /** @java BooleanConstant.eval(Context) */
  public override eval(_context: Context): boolean {
    return this.a;
  }

  /** @java BooleanConstant.isStatic() — always true */
  public override isStatic(): boolean {
    return true;
  }

  /** @java BooleanConstant.gameFlags(Game) — returns 0 */
  public override gameFlags(_game: unknown): number {
    return 0;
  }

  /** @java BooleanConstant.preprocess(Game) — nothing to do */
  public override preprocess(_game: unknown): void {
    // nothing to do
  }

  /** @java BooleanConstant.toString() */
  public override toString(): string {
    return String(this.a);
  }

  /** @java BooleanConstant.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return this.toString();
  }
}

// ---------------------------------------------------------------------------
// Inner static classes
// ---------------------------------------------------------------------------

/**
 * Constant boolean function returning True.
 * @java game.functions.booleans.BooleanConstant.TrueConstant
 */
export class TrueConstant extends BaseBooleanFunction {
  public constructor() {
    super();
  }

  public override eval(_context: Context): boolean {
    return true;
  }

  public override isStatic(): boolean {
    return true;
  }

  public override gameFlags(_game: unknown): number {
    return 0;
  }

  public override preprocess(_game: unknown): void {
    // nothing to do
  }

  public override toString(): string {
    return "True";
  }

  public override toEnglish(_game: unknown): string {
    return "true";
  }
}

/**
 * Constant boolean function returning False.
 * @java game.functions.booleans.BooleanConstant.FalseConstant
 */
export class FalseConstant extends BaseBooleanFunction {
  public constructor() {
    super();
  }

  public override eval(_context: Context): boolean {
    return false;
  }

  public override isStatic(): boolean {
    return true;
  }

  public override gameFlags(_game: unknown): number {
    return 0;
  }

  public override preprocess(_game: unknown): void {
    // nothing to do
  }

  public override toString(): string {
    return "False";
  }

  public override toEnglish(_game: unknown): string {
    return "false";
  }
}
