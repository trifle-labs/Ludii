// @java Core/src/game/functions/ints/value/piece/ValuePiece.java

/**
 * Returns the value of a component.
 *
 * @java game/functions/ints/value/piece/ValuePiece.java
 * @author Eric Piette
 * @remarks For any game with a value associated with a component.
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";
import type { JavaIntFunction } from "../../IntFunction.js";
import type { SiteType } from "../../../../../../ludemes/other/action/SiteType.js";
import { GameType } from "../../../../types/state/GameType.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;
/** Java parity: Constants.NOBODY = 0 */
const NOBODY = 0;
/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Returns the value of a component.
 *
 * @java game/functions/ints/value/piece/ValuePiece.java
 */
export class ValuePiece extends BaseIntFunction {
  /** @java ValuePiece.loc — Which location. */
  private readonly loc: JavaIntFunction;

  /** @java ValuePiece.level — Which level (for a stacking game). */
  private readonly level: JavaIntFunction;

  /** @java ValuePiece.type — Cell/Edge/Vertex. */
  private type: SiteType | null;

  /**
   * @param type  The graph element type [default SiteType of the board].
   * @param at    The location to check.
   * @param level The level to check.
   * @java ValuePiece(SiteType, IntFunction, IntFunction)
   */
  public constructor(
    type: SiteType | null,
    at: JavaIntFunction,
    level: JavaIntFunction | null,
  ) {
    super();
    this.loc = at;
    // Java: level == null ? new IntConstant(Constants.UNDEFINED) : level
    this.level = level ?? {
      eval(_ctx: Context): number { return UNDEFINED; },
      exceeds(ctx: Context, other: JavaIntFunction): boolean { return UNDEFINED > other.eval(ctx); },
      isHint(): boolean { return false; },
      isHand(): boolean { return false; },
      concepts(_g: unknown): Set<number> { return new Set(); },
      readsEvalContextRecursive(): Set<number> { return new Set(); },
      writesEvalContextRecursive(): Set<number> { return new Set(); },
      missingRequirement(_g: unknown): boolean { return false; },
      willCrash(_g: unknown): boolean { return false; },
      toEnglish(_g: unknown): string { return String(UNDEFINED); },
    };
    this.type = type;
  }

  /**
   * @java ValuePiece.eval(Context)
   */
  public override eval(context: Context): number {
    const location = this.loc.eval(context);
    if (location === OFF) return NOBODY;

    // Engine path: the working State keeps the piece-value channel in
    // valueAt[site] (Java ContainerState.value(site, type)). The Java-shaped
    // context methods below are absent on the engine Context.
    if (typeof (context as unknown as { containerId?: unknown }).containerId !== "function") {
      const st = context.state as unknown as {
        valueAt?: readonly number[];
        value?: (s: number) => number;
        valueAtLevel?: (s: number, level: number) => number;
        valueTop?: (s: number) => number;
      };
      if (typeof st.value === "function") return st.value(location);
      // @java ContainerState.value(site, level, type) vs value(site, type) —
      // Java's stacking container always resolves an unspecified level to the
      // TOP of the site's chunk stack (there is only one per-site value
      // channel). The engine's flat State keeps a SEPARATE per-level
      // `valueStacks` channel that stacking moves (ActionMove's stack=true
      // branch, action-move.ts) write via withValueStackRow — once a site's
      // stack is materialized, `valueAt[site]` is never resynced and goes
      // stale. Reading the raw flat array here desynced from that write,
      // so `(value Piece at:(last To))` returned 0 for a freshly-landed
      // stacked piece whose value the move itself had already carried,
      // making MensaSpiel's "Captured" macro fire on a non-capture (ply 7 of
      // board/war/replacement/eliminate/all/MensaSpiel). valueTop()/
      // valueAtLevel() already fall back to the flat channel when no
      // per-level array is materialized, so this is a strict superset of the
      // old read for non-stacking games.
      const levelVal = this.level.eval(context);
      if (levelVal !== UNDEFINED && typeof st.valueAtLevel === "function") {
        return st.valueAtLevel(location, levelVal);
      }
      if (typeof st.valueTop === "function") return st.valueTop(location);
      return st.valueAt?.[location] ?? UNDEFINED;
    }

    const containerIds = (context as unknown as { containerId(): number[] }).containerId();
    const containerId: number = containerIds[location] ?? 0;

    const gameFlags = (context.game as unknown as { gameFlags(): bigint }).gameFlags();

    if ((gameFlags & GameType.Stacking) !== BigInt(0)) {
      // Is stacking game
      const containerStates = (context.state as unknown as { containerStates(): unknown[] }).containerStates();
      const state: unknown = containerStates[containerId];
      const stackingState = state as unknown as {
        value(site: number, type: SiteType | null): number;
        valueWithLevel(site: number, level: number, type: SiteType | null): number;
      };
      const levelVal = this.level.eval(context);
      if (levelVal === -1) {
        return stackingState.value(this.loc.eval(context), this.type);
      } else {
        return stackingState.valueWithLevel(this.loc.eval(context), levelVal, this.type);
      }
    }

    const containerStates = (context.state as unknown as { containerStates(): unknown[] }).containerStates();
    const cs: unknown = containerStates[containerId];
    return (cs as unknown as { value(site: number, type: SiteType | null): number }).value(this.loc.eval(context), this.type);
  }

  /** @java ValuePiece.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /**
   * @java ValuePiece.gameFlags(Game)
   * Returns loc.gameFlags(game) | level.gameFlags(game) | GameType.Value | SiteType.gameFlags(type).
   */
  public gameFlags(game: unknown): bigint {
    const locFlags = (this.loc as unknown as { gameFlags?(g: unknown): bigint }).gameFlags?.(game) ?? BigInt(0);
    const levelFlags = (this.level as unknown as { gameFlags?(g: unknown): bigint }).gameFlags?.(game) ?? BigInt(0);
    return locFlags | levelFlags | GameType.Value;
  }

  /** @java ValuePiece.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    const locConcepts = this.loc.concepts(game);
    for (const c of locConcepts) concepts.add(c);
    const levelConcepts = this.level.concepts(game);
    for (const c of levelConcepts) concepts.add(c);
    // Java: concepts.set(Concept.PieceValue.id(), true)
    return concepts;
  }

  /** @java ValuePiece.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const writeEvalContext = new Set<number>();
    const locWrites = this.loc.writesEvalContextRecursive();
    for (const v of locWrites) writeEvalContext.add(v);
    const levelWrites = this.level.writesEvalContextRecursive();
    for (const v of levelWrites) writeEvalContext.add(v);
    return writeEvalContext;
  }

  /** @java ValuePiece.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const readEvalContext = new Set<number>();
    const locReads = this.loc.readsEvalContextRecursive();
    for (const v of locReads) readEvalContext.add(v);
    const levelReads = this.level.readsEvalContextRecursive();
    for (const v of levelReads) readEvalContext.add(v);
    return readEvalContext;
  }

  /** @java ValuePiece.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missingRequirement = false;
    missingRequirement = missingRequirement || this.loc.missingRequirement(game);
    missingRequirement = missingRequirement || this.level.missingRequirement(game);
    return missingRequirement;
  }

  /** @java ValuePiece.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let willCrash = false;
    willCrash = willCrash || this.loc.willCrash(game);
    willCrash = willCrash || this.level.willCrash(game);
    return willCrash;
  }

  /** @java ValuePiece.preprocess(Game) */
  public preprocess(game: unknown): void {
    // Java: type = SiteType.use(type, game);
    this.type = (this.type as unknown as SiteType | null) ??
      (game as unknown as { board?(): { defaultSite?(): SiteType } }).board?.()?.defaultSite?.() ?? null;
    (this.loc as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    (this.level as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
  }

  /** @java ValuePiece.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    const levelStr = this.level !== null
      ? " at level " + (this.level as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game)
      : "";
    const typeName = this.type !== null
      ? (this.type as string).toLowerCase()
      : (game as unknown as { board?(): { defaultSite?(): { name(): string } } }).board?.()?.defaultSite?.()?.name().toLowerCase() ?? "cell";
    return "the level of the piece on " + typeName + " " +
      (this.loc as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) + levelStr;
  }
}
