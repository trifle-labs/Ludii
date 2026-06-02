// @java Core/src/other/playout/PlayoutAddToEmpty.java PlayoutAddToEmpty
/**
 * Faithful 1:1 transliteration of other.playout.PlayoutAddToEmpty.
 *
 * Optimised playout for games where the only legal moves are placing a
 * piece on any empty site. Maintains a Sites set and a move cache for
 * efficiency.
 *
 * Deferrals (full implementation needs these absent subsystems):
 *  - Sites class (other.Sites): represented as a minimal inline Sites stub.
 *  - ActionAdd constructor: represented as an opaque action factory.
 *  - SiteType enum: represented as a string union type.
 *  - Swap-move generation (MoveSwapType/SwapPlayersType): deferred — the
 *    probSwap end-of-playout swap is structurally present but the
 *    move-generation call is deferred.
 *  - context.state().setStalemated(): deferred (interface not imported).
 *  - context.state().swapPlayerOrder(): deferred.
 *
 * Java parity: other/playout/PlayoutAddToEmpty.java
 */

import type { Playout } from "./Playout.js";
import { PlayoutMoveSelector, type IContext } from "./PlayoutMoveSelector.js";
import type { IAI, ITrial, IMove } from "../context/Context.js";

/** @java game.types.board.SiteType */
export type SiteType = "Cell" | "Vertex" | "Edge";

/** Minimal Sites helper (mirrors other.Sites) */
class Sites {
  private _sites: number[];

  constructor(sites: number[]) { this._sites = [...sites]; }

  count():   number { return this._sites.length; }
  nthValue(n: number): number { return this._sites[n] ?? -1; }

  remove(site: number): void {
    const idx = this._sites.indexOf(site);
    if (idx >= 0) this._sites.splice(idx, 1);
  }

  removeNth(n: number): void { this._sites.splice(n, 1); }
}

/** Opaque move-cache entry */
interface CachedMove extends IMove {
  readonly _site: number;
  readonly _mover: number;
}

function makeAddMove(type: SiteType, site: number, mover: number): CachedMove {
  void type; // structural (SiteType used for Edge special-casing below)
  return {
    _site:           site,
    _mover:          mover,
    mover:           () => mover,
    isPass:          () => false,
    fromNonDecision: () => site,
    actions:         () => [],
  };
}

export class PlayoutAddToEmpty implements Playout {

  // @java private Move[][] moveCache = null;
  private _moveCache: (CachedMove | null)[][] | null = null;

  // @java private final SiteType type;
  private readonly _type: SiteType;

  // -------------------------------------------------------------------------

  constructor(type: SiteType) {
    this._type = type;
  }

  // -------------------------------------------------------------------------

  playout(
    context: IContext,
    ais: (IAI | null)[] | null,
    thinkingTime: number,
    playoutMoveSelector: import("./PlayoutMoveSelector.js").PlayoutMoveSelector | null,
    maxNumBiasedActions: number,
    maxNumPlayoutActions: number,
    random: { nextInt(bound: number): number; nextDouble?(): number }
  ): ITrial {
    const currentGame = context.game();
    const type = this._type;

    // Initialise move cache
    if (this._moveCache === null) {
      const numPlayers = currentGame.players().count();
      const topology = (currentGame.board() as unknown as { topology(): { numSites(t: SiteType): number } }).topology();
      const numSites = topology.numSites(type);
      this._moveCache = new Array(numPlayers + 1)
        .fill(null)
        .map(() => new Array<CachedMove | null>(numSites).fill(null));
    }

    // Get empty region as a Sites object
    const emptyRegion = (context.state()?.containerStates() as unknown as Array<{ emptyRegion(t: SiteType): { sites(): number[] } }>)[0]?.emptyRegion(type);
    const sites = new Sites(emptyRegion?.sites() ?? []);

    const startPhase = currentGame.rules().phases()[
      (context.state() as unknown as { currentPhase(m: number): number }).currentPhase(
        (context.state() as unknown as { mover(): number }).mover()
      )
    ];

    let numActionsApplied = 0;
    let probSwap = 0;

    const trial: ITrial = context.trial();

    while (!trial.over() && (maxNumPlayoutActions < 0 || maxNumPlayoutActions > numActionsApplied)) {
      const remaining = sites.count();
      const mover = (context.state() as unknown as { mover(): number }).mover();

      const currPhase = currentGame.rules().phases()[
        (context.state() as unknown as { currentPhase(m: number): number }).currentPhase(mover)
      ];

      if (currPhase !== startPhase) return trial; // phase switch

      if (remaining < 1) {
        // No moves — auto pass
        if (context.active?.()) {
          (context.state() as unknown as { setStalemated?(m: number, v: boolean): void }).setStalemated?.(mover, true);
        }
        // DEFERRED: createPassMove — skip
        numActionsApplied++;
        continue;
      } else {
        if (context.active?.()) {
          (context.state() as unknown as { setStalemated?(m: number, v: boolean): void }).setStalemated?.(mover, false);
        }
      }

      // Swap probability
      const canSwap = (currentGame as unknown as { metaRules?(): { usesSwapRule(): boolean } })
        .metaRules?.()?.usesSwapRule() &&
        trial.moveNumber() === currentGame.players().count() - 1;

      if (canSwap) {
        probSwap = 1.0 / (remaining + 1);
      }

      let ai: IAI | null = null;
      if (ais !== null) {
        ai = ais[(context.state() as unknown as { playerToAgent(m: number): number }).playerToAgent(mover)] ?? null;
      }

      let move: IMove;

      if (ai !== null) {
        move = ai.selectAction(currentGame, ai.copyContext(context), thinkingTime, -1, -1);
        if (!(move as unknown as { isSwap?(): boolean }).isSwap?.()) {
          sites.remove((move as unknown as { from?: unknown }).from as number ?? 0);
        }
      } else {
        const playerMoveCache = this._moveCache[mover]!;

        if (
          playoutMoveSelector === null ||
          (maxNumBiasedActions >= 0 && maxNumBiasedActions < numActionsApplied) ||
          playoutMoveSelector.wantsPlayUniformRandomMove()
        ) {
          // Uniform random
          const n = random.nextInt(remaining);
          const site = sites.nthValue(n);

          if ((playerMoveCache[site] ?? null) === null) {
            const m = makeAddMove(type, site, mover);
            playerMoveCache[site] = m;
          }
          move = playerMoveCache[site]!;
          sites.removeNth(n);
        } else {
          // Build full move list for move selector
          const legalMoves: IMove[] = [];
          for (let i = 0; i < remaining; i++) {
            const site = sites.nthValue(i);
            if ((playerMoveCache[site] ?? null) === null) {
              playerMoveCache[site] = makeAddMove(type, site, mover);
            }
            legalMoves.push(playerMoveCache[site]!);
          }

          // DEFERRED: swap move insertion
          const selected = playoutMoveSelector.selectMove(context, legalMoves, mover, { checkMove: () => true });
          if (selected === null) { numActionsApplied++; continue; }

          if ((selected as unknown as { isSwap?(): boolean }).isSwap?.()) {
            probSwap = 0;
          } else {
            sites.remove((selected as unknown as { _site?: number })._site ?? 0);
          }
          move = selected;
        }
      }

      currentGame.apply(context, move);
      numActionsApplied++;
    }

    // End-of-playout swap
    if ((random.nextDouble?.() ?? Math.random()) < probSwap) {
      // DEFERRED: context.state().swapPlayerOrder(1, 2)
      (context.state() as unknown as { swapPlayerOrder?(a: number, b: number): void }).swapPlayerOrder?.(1, 2);
    }

    return trial;
  }

  callsGameMoves(): boolean { return false; }
}
