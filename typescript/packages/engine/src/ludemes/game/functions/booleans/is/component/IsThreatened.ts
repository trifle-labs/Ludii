// @java Core/src/game/functions/booleans/is/component/IsThreatened.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction, MovesFunction, RegionFunction } from "../../../../../base.js";
import { BaseBooleanFunction } from "../../BaseBooleanFunction.js";

let active = false;

/**
 * Returns true if a location is under threat for one specific player.
 *
 * @java game/functions/booleans/is/component/IsThreatened.java
 */
export class IsThreatened extends BaseBooleanFunction {
  public constructor(
    private readonly what: IntFunction | null,
    private readonly type: string | null,
    private readonly site: IntFunction | null,
    private readonly sites: RegionFunction | null,
    private readonly specificMoves: MovesFunction | null,
  ) {
    super();
  }

  /** @java IsThreatened.eval(Context) */
  public override eval(context: Context): boolean {
    void this.type;
    if (active) return false;

    const targets = this.targetSites(context);
    if (targets.length === 0) return false;

    const owner = this.what !== null ? this.ownerOfWhat(context, this.what.eval(context)) : context.state.mover;
    active = true;
    // @java IsThreatened.java:133 `new TempContext(context)` — Java runs the whole
    // threat simulation on an ISOLATED context copy, so nothing it mutates leaks
    // back to the caller. TS mutates the live context in place (cheaper), so we
    // must snapshot the one piece of shared mutable state that `game.moves()`
    // writes: `state.stalemated` is a CACHE mutated in place (Game.ts:801-802
    // `flags[mover] = generated.length === 0`). The enemy loop calls
    // `game.moves()` with `mover = enemy`, and the enemy set includes the real
    // Mover, so without this restore the checkmate/check eval would poison
    // `stalemated[Mover]` and the subsequent end-rule `(no Moves Mover)` would
    // read a bogus flag (observed: Phase Chess trial0's ply-238 draw vanished).
    const stalematedRef = context.state.stalemated as boolean[] | undefined;
    const originalStalemated = stalematedRef ? [...stalematedRef] : null;
    try {
      const numPlayers =
        typeof (context.game as unknown as { numPlayers?: unknown }).numPlayers === "function"
          ? (context.game as unknown as { numPlayers(): number }).numPlayers()
          : Number((context.game as unknown as { numPlayers?: number }).numPlayers ?? 2);
      const originalMover = context.state.mover;
      const originalPrev = (context.state as unknown as { prev: number }).prev;
      for (let enemy = 1; enemy <= numPlayers; enemy += 1) {
        if (enemy === owner) continue;
        (context.state as unknown as { mover: number }).mover = enemy;
        // @java IsThreatened.java:135 newContext.state().setPrev(ownerWhat) —
        // prev is the OWNER of the checked piece (a real player), NOT the temp
        // mover and NOT the just-moved player. Since the enemy mover != owner,
        // "SameTurn" (`(is Prev Mover)`) reads false, so the threat sim uses the
        // normal move branch (not chain/promote). Using 0 here instead tripped
        // IsPrev's pre-first-advance fallback (it read the just-applied move's
        // mover, flipping SameTurn true and disabling checkmate detection in
        // Chess/Shogi variants); owner is >0 so that fallback never fires.
        (context.state as unknown as { prev: number }).prev = owner;
        try {
          const moves = this.specificMoves?.eval(context) ?? context.game.moves(context);
          for (const move of moves) {
            const to = typeof move.to === "function" ? move.to() : undefined;
            if (to !== undefined && targets.includes(to)) return true;
          }
        } finally {
          (context.state as unknown as { mover: number }).mover = originalMover;
          (context.state as unknown as { prev: number }).prev = originalPrev;
        }
      }
    } finally {
      if (stalematedRef && originalStalemated) {
        for (let i = 0; i < originalStalemated.length; i += 1) stalematedRef[i] = originalStalemated[i]!;
      }
      active = false;
    }
    return false;
  }

  private targetSites(context: Context): number[] {
    if (this.site !== null) {
      const site = this.site.eval(context);
      return site >= 0 ? [site] : [];
    }
    if (this.sites !== null) return this.sites.eval(context);
    if (this.what !== null) {
      const what = this.what.eval(context);
      if (what < 1) return [];
      const out: number[] = [];
      for (let site = 0; site < context.state.whats.length; site += 1) {
        if (context.state.whats[site] === what) out.push(site);
      }
      return out;
    }
    const out: number[] = [];
    for (let site = 0; site < context.state.whats.length; site += 1) {
      if ((context.state.whats[site] ?? 0) !== 0) out.push(site);
    }
    return out;
  }

  private ownerOfWhat(context: Context, what: number): number {
    const equipment = (context.game as unknown as {
      equipment?: { componentAt?(id: number): { owner?: number } | undefined };
    }).equipment;
    return equipment?.componentAt?.(what)?.owner ?? context.state.mover;
  }

  public override isStatic(): boolean {
    return false;
  }

  public override gameFlags(_game: unknown): number {
    return 0;
  }

  public override concepts(_game: unknown): Set<number> {
    return new Set();
  }

  public override writesEvalContextRecursive(): Set<number> {
    return new Set();
  }

  public override readsEvalContextRecursive(): Set<number> {
    return new Set();
  }

  public override missingRequirement(_game: unknown): boolean {
    return false;
  }

  public override willCrash(_game: unknown): boolean {
    return false;
  }

  public override preprocess(_game: unknown): void {
    // Nothing to do.
  }
}
