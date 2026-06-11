// @java Core/src/game/rules/play/moves/nonDecision/operators/foreach/piece/ForEachPiece.java

/**
 * Iterates through the pieces, generating moves based on their positions.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/piece/ForEachPiece.java
 * @author mrraow and cambolbro and Eric.Piette
 *
 * @remarks To generate a set of legal moves by type of piece. If some specific
 *          moves are described in this ludeme, they are applied to all the
 *          pieces described on that ludeme, if not the moves of each component
 *          are used.
 */

import { applyPostStateThen } from "../../../effect/Then.js";
import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { BooleanFunction, IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { BaseMoves } from "../../../../BaseMoves.js";
import { Operator } from "../../../../nonDecision/operator/Operator.js";
import type { ThenLike } from "../../../../Moves.js";

/** RoleType string values mirroring Java's RoleType enum */
type RoleTypeStr = "Mover" | "Next" | "Prev" | "All" | "Each" | "Shared" | "Team" | "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | string;

/**
 * Iterates through the pieces, generating moves based on their positions.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/piece/ForEachPiece.java
 */
export class ForEachPiece extends Operator {
  /** @java ForEachPiece.specificMoves */
  protected readonly specificMoves: MovesFunction | null;

  /** @java ForEachPiece.items */
  protected readonly items: readonly string[];

  /** @java ForEachPiece.player — the IntFunction giving the player index */
  protected readonly player: IntFunction;

  /** @java ForEachPiece.containerId — container index function */
  protected readonly containerId: unknown;

  /** @java ForEachPiece.topFn */
  protected readonly topFn: BooleanFunction;

  /** @java ForEachPiece.topValueSet */
  protected readonly topValueSet: BooleanFunction | null;

  /** @java ForEachPiece.type — SiteType (Cell/Edge/Vertex) */
  protected type: string | null;

  /** @java ForEachPiece.role */
  protected readonly role: RoleTypeStr | null;

  /**
   * Precomputed per-player component indices.
   * @java ForEachPiece.compIndicesPerPlayer
   */
  protected compIndicesPerPlayer: number[][] | null = null;

  /** The "then" consequent */
  private readonly _then: ThenLike | null;

  /**
   * @java ForEachPiece constructor
   *
   * @param on            Type of graph element.
   * @param item          The name of the piece (single).
   * @param items         The names of the pieces (multiple).
   * @param container     The index of the container (IntFunction).
   * @param containerName The name of the container (string).
   * @param specificMoves The specific moves to apply to the pieces.
   * @param player        The owner of the piece [(player (mover))].
   * @param role          RoleType of the owner of the piece [Mover].
   * @param top           To apply the move only to the top piece in case of a stack [False].
   * @param then          The moves applied after that move is applied.
   */
  public constructor(
    on: string | null,
    item: string | null,
    items: readonly string[] | null,
    container: IntFunction | null,
    _containerName: string | null,
    specificMoves: MovesFunction | null,
    player: IntFunction | null,
    role: RoleTypeStr | null,
    top: BooleanFunction | null,
    then: ThenLike | null = null,
  ) {
    super();

    // @java if (items != null) this.items = items; else this.items = (item == null) ? new String[0] : new String[]{ item };
    if (items !== null) {
      this.items = items;
    } else {
      this.items = item === null ? [] : [item];
    }

    this.specificMoves = specificMoves;

    // @java this.player = (player == null) ? ((role == null) ? new Mover() : RoleType.toIntFunction(role)) : player.index();
    if (player !== null) {
      this.player = player;
    } else if (role !== null) {
      this.player = roleToIntFunction(role);
    } else {
      // Default to mover
      this.player = { eval: (ctx: Context) => ctx.state.mover };
    }

    this.containerId = container;
    this.topValueSet = top;
    // @java topFn = (top == null) ? new BooleanConstant(false) : top;
    // (raw-boolean trap: compileTerminal hands BooleanFunction slots raw booleans)
    this.topFn = typeof (top as unknown) === "boolean"
      ? { eval: () => top as unknown as boolean }
      : (top ?? { eval: () => false });
    this.type = on;
    this.role = role;
    this._then = then;
  }

  /**
   * @java ForEachPiece.then()
   */
  protected then(): ThenLike | null {
    return this._then;
  }

  /**
   * @java ForEachPiece.eval(Context)
   *
   * Iterates over pieces belonging to the specific player and generates moves.
   */
  public override eval(context: Context): Move[] {
    const moves = new BaseMoves(this._then);

    // @java final int specificPlayer = player.eval(context);
    const specificPlayer = this.player.eval(context);

    // @java final Owned owned = context.state().owned();
    const owned = (context.state as unknown as {
      owned?: {
        positions(pid: number): { length: number; [i: number]: { site(): number; level(): number; siteType(): string } }[];
        mapCompIndex(pid: number, compId: number): number;
      }
    }).owned;

    // @java final Component[] components = context.components();
    const components = (context as unknown as {
      components?(): { length: number; [i: number]: { owner?: number; generate?(ctx: Context): { moves(): Move[] }; generator?: MovesFunction } }
    }).components?.();

    // @java final int cont = containerId.eval(context);
    const cont = this.containerId !== null
      ? (this.containerId as IntFunction).eval(context)
      : 0;

    // @java final ContainerState cs = context.containerState(cont);
    const cs = (context as unknown as { containerState(i: number): unknown }).containerState?.(cont);

    // @java final SiteType realType = (type != null) ? type : context.game().board().defaultSite();
    const realType: string = this.type
      ?? (context as unknown as { board?(): { defaultSite(): string } }).board?.()?.defaultSite()
      ?? "Cell";

    // @java final int minIndex = cs == null ? 0 : context.game().equipment().sitesFrom()[cont];
    const sitesFrom: readonly number[] = (context as unknown as {
      game: { equipment?: { sitesFrom?: readonly number[] } }
    }).game?.equipment?.sitesFrom ?? [];
    const minIndex = cs === undefined || cs === null ? 0 : (sitesFrom[cont] ?? 0);

    // @java final int maxIndex = cs == null ? 0 : minIndex + ((cont != 0) ? context.containers()[cont].numSites() : context.topology().getGraphElements(realType).size());
    let maxIndex = 0;
    if (cs !== undefined && cs !== null) {
      if (cont !== 0) {
        const containers = (context as unknown as { containers?(): { numSites?: number }[] }).containers?.();
        maxIndex = minIndex + (containers?.[cont]?.numSites ?? 0);
      } else {
        const topology = (context as unknown as { topology?(): { getGraphElements(t: string): { size(): number } } }).topology?.();
        maxIndex = minIndex + (topology?.getGraphElements(realType).size() ?? context.state.cells.length);
      }
    }
    if (maxIndex === 0) maxIndex = context.state.cells.length;

    // @java final boolean top = topFn.eval(context);
    const top = this.topFn.eval(context);

    // Determine which component indices to use for this player.
    // @java final int[] moverCompIndices = compIndicesPerPlayer[specificPlayer];
    let moverCompIndices: number[] = [];
    if (this.compIndicesPerPlayer !== null) {
      moverCompIndices = this.compIndicesPerPlayer[specificPlayer] ?? [];
    } else if (components) {
      // Build on the fly if not preprocessed
      moverCompIndices = buildCompIndices(components, specificPlayer, this.items, this.role);
    }

    const allPlayers = (this.role === "All" || this.role === "Each");

    // @java while (it.hasNext()) moves.moves().add(it.next());
    // We inline the movesIterator logic here for faithfulness.
    for (const componentId of moverCompIndices) {
      if (!components || !components[componentId]) continue;
      const component = components[componentId]!;

      // @java List<? extends Location> positions = null;
      let positions: { site(): number; level(): number; siteType(): string }[] | null = null;

      if (owned) {
        if (!allPlayers) {
          // @java positions = ownedComponents[owned.mapCompIndex(specificPlayer, componentId)];
          const ownedComponents = owned.positions(specificPlayer);
          const compIdx = owned.mapCompIndex(specificPlayer, componentId);
          positions = compIdx >= 0 && compIdx < ownedComponents.length
            ? Array.from({ length: ownedComponents[compIdx]?.length ?? 0 }, (_, i) => ownedComponents[compIdx]![i]!)
            : [];
        } else {
          // @java final int ownerComponent = context.components()[componentId].owner();
          const ownerComponent = component.owner ?? 0;
          const ownedCurrentComponent = owned.positions(ownerComponent);
          const compIdx = owned.mapCompIndex(ownerComponent, componentId);
          positions = compIdx >= 0 && compIdx < ownedCurrentComponent.length
            ? Array.from({ length: ownedCurrentComponent[compIdx]?.length ?? 0 }, (_, i) => ownedCurrentComponent[compIdx]![i]!)
            : [];
        }
      }

      if (positions === null || positions.length === 0) {
        positions = scanPositions(context, componentId, specificPlayer, allPlayers, realType);
      }

      if (positions === null || positions.length === 0) continue;

      // Filter by type if specified
      // @java if (type != null && !positions.isEmpty()) { filteredPositions = ... }
      let correctPositions = positions;
      if (this.type !== null) {
        correctPositions = positions.filter(loc =>
          (loc.siteType?.() ?? "Cell") === this.type
        );
      }

      for (const loc of correctPositions) {
        const location = loc.site();
        if (location < minIndex || location >= maxIndex) continue;

        const level = loc.level();

        // @java if (top) { final BaseContainerStateStacking css = ...; if (css.sizeStack(location, realType) != (level + 1)) continue; }
        if (top && cs) {
          const stackSize = (cs as unknown as { sizeStack(s: number, t: string): number }).sizeStack?.(location, realType) ?? 0;
          if (stackSize !== level + 1) continue;
        }

        // @java final int origFrom = context.from(); context.setFrom(location); context.setLevel(level);
        const origFrom = context._evalFrom;
        const origLevel = (context as unknown as { _evalLevel?: number })._evalLevel ?? 0;
        const state = context.state;

        context._evalFrom = location;
        (context as unknown as { setLevel?(l: number): void }).setLevel?.(level);
        (context as unknown as { _evalLevel?: number })._evalLevel = level;

        let pieceMoves: Move[];

        if (this.specificMoves === null) {
          // @java pieceMoves = component.generate(context)
          if (specificPlayer === state.mover
              || specificPlayer > context.game.numPlayers
              || specificPlayer === 0) {
            pieceMoves = component.generate?.(context)?.moves() ?? [];
          } else {
            // @java modify context state for non-mover player
            const stateM = state as unknown as {
              setPrev?(p: number): void; setMover?(p: number): void; setNext?(p: number): void;
              prev?: number;
            };
            const oldPrev = stateM.prev ?? state.mover;
            const oldMover = state.mover;
            const oldNext = state.next;
            stateM.setPrev?.(oldMover);
            stateM.setMover?.(specificPlayer);
            stateM.setNext?.(oldMover);
            pieceMoves = component.generate?.(context)?.moves() ?? [];
            stateM.setPrev?.(oldPrev);
            stateM.setMover?.(oldMover);
            stateM.setNext?.(oldNext);
          }
        } else {
          // @java pieceMoves = specificMoves.eval(context)
          if (specificPlayer === state.mover
              || specificPlayer > context.game.numPlayers
              || specificPlayer === 0) {
            pieceMoves = this.specificMoves.eval(context);
          } else {
            const stateM = state as unknown as {
              setPrev?(p: number): void; setMover?(p: number): void; setNext?(p: number): void;
              prev?: number;
            };
            const oldPrev = stateM.prev ?? state.mover;
            const oldMover = state.mover;
            const oldNext = state.next;
            stateM.setPrev?.(oldMover);
            stateM.setMover?.(specificPlayer);
            stateM.setNext?.(oldMover);
            pieceMoves = this.specificMoves.eval(context);
            stateM.setPrev?.(oldPrev);
            stateM.setMover?.(oldMover);
            stateM.setNext?.(oldNext);
          }
        }

        // @java context.setFrom(origFrom); context.setLevel(origLevel);
        context._evalFrom = origFrom;
        (context as unknown as { setLevel?(l: number): void }).setLevel?.(origLevel);
        (context as unknown as { _evalLevel?: number })._evalLevel = origLevel;

        for (const m of pieceMoves) {
          // @java if (then() != null) ret.then().add(then().moves());
          // Java evaluates the then AFTER the move applies — applyPostStateThen bakes the
          // post-state consequence actions in (the old code pushed into the FROZEN
          // Move.then array, throwing as soon as a forEach-Piece carried a then —
          // International Draughts' promote-or-replay chain).
          const withThen = this._then !== null ? applyPostStateThen(this._then, context, m) : m;
          // @java ret.setMover(context.state().mover())
          (withThen as unknown as { mover?: number }).mover = context.state.mover;
          moves.moves().push(withThen);
        }
      }
    }

    return moves.moves();
  }

  /**
   * @java ForEachPiece.isStatic()
   */
  public isStatic(): boolean {
    return false;
  }

  /**
   * @java ForEachPiece.preprocess(Game)
   */
  public preprocess(): void {
    if (this.specificMoves !== null) {
      (this.specificMoves as unknown as { preprocess?(): void }).preprocess?.();
    }
  }
}

/**
 * Convert a RoleType string to an IntFunction.
 * @java RoleType.toIntFunction(RoleType)
 */
function roleToIntFunction(role: RoleTypeStr): IntFunction {
  // Concrete player roles P1..P16
  const playerMatch = /^P(\d+)$/.exec(role);
  if (playerMatch) {
    const pid = parseInt(playerMatch[1]!, 10);
    return { eval: () => pid };
  }
  // Dynamic roles
  return {
    eval: (ctx: Context): number => {
      switch (role) {
        case "Mover": return ctx.state.mover;
        case "Next": return ctx.state.next ?? ctx.state.mover;
        case "Prev": return (ctx.state as unknown as { prev?: number }).prev ?? ctx.state.mover;
        case "All": return ctx.game.numPlayers + 1; // convention: all-players sentinel
        case "Each": return ctx.game.numPlayers + 1;
        default: return ctx.state.mover;
      }
    }
  };
}

/**
 * Build component indices for a given player on the fly (when not preprocessed).
 * @java ForEachPiece.preprocess — compIndicesPerPlayer building
 */
function buildCompIndices(
  components: { length: number; [i: number]: { owner?: number; generator?: MovesFunction } },
  specificPlayer: number,
  items: readonly string[],
  role: RoleTypeStr | null,
): number[] {
  const allPlayers = (role === "All" || role === "Each");
  const result: number[] = [];
  for (let e = 1; e < components.length; e++) {
    const comp = components[e];
    if (!comp) continue;
    const owner = comp.owner ?? 0;
    if (owner === specificPlayer || allPlayers) {
      if (items.length === 0) {
        result.push(e);
      } else {
        // Item name matching — use escape hatch for getNameWithoutNumber
        const name = (comp as unknown as { getNameWithoutNumber?(): string | null; name?: string }).getNameWithoutNumber?.()
          ?? (comp as unknown as { name?: string }).name;
        if (name !== null && name !== undefined && items.includes(name)) {
          result.push(e);
        }
      }
    }
  }
  return result;
}

function scanPositions(
  context: Context,
  componentId: number,
  specificPlayer: number,
  allPlayers: boolean,
  realType: string,
): { site(): number; level(): number; siteType(): string }[] {
  // @java ContainerState accessors — the real State, no narrowing cast.
  const state = context.state;
  const out: { site(): number; level(): number; siteType(): string }[] = [];
  const boardSites = (context.game as unknown as { equipment?: { board?: { numSites?: number } } }).equipment?.board?.numSites
    ?? state.cells.length;
  for (let site = 0; site < boardSites; site++) {
    const owner = state.who(site);
    if (!allPlayers && owner !== specificPlayer) continue;
    const what = state.what(site);
    if (what !== componentId) continue;
    out.push({
      site: () => site,
      level: () => 0,
      siteType: () => realType,
    });
  }
  // @java per-type ContainerStates — pieces living on a NON-play element type
  // (Guerrilla Checkers' Cell counters on a Vertex-play board) are tracked in
  // State.typedSites; scan those channels too, tagging each hit with its type.
  const typed = (state as unknown as { typedSites?: ReadonlyMap<string, { who: readonly number[]; what: readonly number[] }> }).typedSites;
  if (typed) {
    for (const [chType, ch] of typed) {
      if (chType === realType) continue;
      for (let site = 0; site < ch.who.length; site++) {
        const owner = ch.who[site] ?? 0;
        if (!allPlayers && owner !== specificPlayer) continue;
        if ((ch.what[site] ?? 0) !== componentId) continue;
        out.push({
          site: () => site,
          level: () => 0,
          siteType: () => chType,
        });
      }
    }
  }
  return out;
}
