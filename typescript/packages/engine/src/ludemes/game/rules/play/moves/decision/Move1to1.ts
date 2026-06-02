/**
 * Move1to1.ts
 *
 * @java game/rules/play/moves/decision/Move.java
 *
 * The polymorphic decision-move dispatcher. In Java, Move.construct() is a
 * static factory with many overloads that delegates to the appropriate effect
 * ludeme (Add, Hop, Step, Slide, FromTo, Remove, Select, etc.) based on the
 * move type marker (MoveStepType, MoveHopType, MoveSiteType, etc.).
 *
 * In the 1:1 path, the dispatch is handled entirely by the inline
 * compileMoves1to1Impl switch in compiler1to1.ts (the "(move ...)") branches.
 * This class file is a structural coverage port only — it represents the
 * Java class hierarchy without re-implementing the full dispatch or registering
 * any keys (which would clobber the working inline logic).
 *
 * Java:
 *   public final class Move extends Decision
 *   public static Moves construct(...) { ... }  // many overloads
 *   public Moves eval(Context context) { ... }   // delegates to sub-ludeme
 *
 * @java game/rules/play/moves/decision/Move.java — eval(Context)
 */

import type { Context } from "../../../../../../context.js";
import type { Move } from "../../../../../../move.js";
import { Decision1to1 } from "./Decision1to1.js";

/**
 * @java game/rules/play/moves/decision/Move.java
 *
 * Structural marker class for the polymorphic decision-move dispatcher.
 * The actual dispatch is performed by the inline compiler.
 *
 * This class is NOT registered — the inline compileMoves1to1Impl handles
 * all (move ...) patterns directly.
 */
export class Move1to1 extends Decision1to1 {
  /**
   * The compiled sub-move generator (the delegated effect ludeme).
   * @java Move.java — the resolved ludeme (Add, Step, Hop, Slide, etc.)
   */
  private readonly delegate: { eval(ctx: Context): Move[] };

  /**
   * @java game/rules/play/moves/decision/Move.java — constructor
   * @param delegate The compiled effect ludeme to delegate eval() to.
   */
  public constructor(delegate: { eval(ctx: Context): Move[] }) {
    super();
    this.delegate = delegate;
  }

  /**
   * @java game/rules/play/moves/decision/Move.java — eval(Context)
   *
   * Delegates to the resolved effect ludeme.
   */
  public override eval(ctx: Context): Move[] {
    return this.delegate.eval(ctx);
  }
}
