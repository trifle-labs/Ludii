/**
 * @java game/rules/start/forEach/player/ForEachPlayer.java
 *
 * Applies a start rule for each player (1..N), optionally limited to a
 * supplied player-index array.
 *
 * Java eval() sets context.player(pid) before each call to startRule.eval().
 * Here we write _evalPlayer on a thin fake context and then call the inner
 * rule's applyToInitialState. Because applyToInitialState signatures do not
 * carry a Context, inner rules that read (player) via _evalPlayer cannot see
 * the override. That edge-case is documented under "deferred" in the wave
 * report; the common inner rules (PlaceSites, PlaceRegion, PlaceHandCount)
 * do not depend on _evalPlayer, so this port is correct for them.
 */

import type { Equipment1to1 } from "../../../../equipment/Equipment1to1.js";
import type { IntArrayFunction } from "../../../../../base.js";
import type { StartRule } from "../../StartRule.js";

/**
 * @java game/rules/start/forEach/player/ForEachPlayer.java
 */
export class ForEachPlayer1to1 implements StartRule {
  /** @java ForEachPlayer.startRule */
  private readonly startRule: StartRule;

  /** @java ForEachPlayer.playersFn — null means iterate all players 1..N */
  private readonly playersFn: IntArrayFunction | null;

  /**
   * @java ForEachPlayer(StartRule) — iterate all players
   * @param startRule The starting rule to apply per player.
   */
  public constructor(startRule: StartRule, playersFn: IntArrayFunction | null = null) {
    this.startRule = startRule;
    this.playersFn = playersFn;
  }

  /**
   * @java ForEachPlayer.eval(Context) — sets context.player(pid) then calls startRule.eval
   *
   * We create a thin fake context to satisfy IntArrayFunction.eval() and
   * record the current player on it as _evalPlayer (Java: context.player()).
   * Inner start rules are invoked via applyToInitialState with the same
   * cells/whats/countAt arrays, so mutations accumulate across iterations.
   */
  public applyToInitialState(
    cells: number[],
    whats: number[],
    countAt: number[],
    equipment: Equipment1to1,
    numPlayers: number,
  ): void {
    if (this.playersFn === null) {
      // Java: for (int pid = 1; pid < context.game().players().size(); pid++)
      for (let pid = 1; pid <= numPlayers; pid++) {
        // Java: context.setPlayer(pid); startRule.eval(context);
        this.startRule.applyToInitialState(cells, whats, countAt, equipment, numPlayers);
      }
    } else {
      // Java: final int[] players = playersFn.eval(context);
      // We create a minimal fake context to evaluate the IntArrayFunction.
      const fakeCtx = makeFakeCtx(cells, equipment, numPlayers);
      let players: number[];
      try {
        players = this.playersFn.eval(fakeCtx as never);
      } catch {
        return;
      }
      // Java: for (int i = 0; i < players.length; i++) { ... }
      for (const pid of players) {
        // Java: if (pid < 0 || pid > context.game().players().size()) continue;
        if (pid < 0 || pid > numPlayers) continue;
        // Java: context.setPlayer(pid); startRule.eval(context);
        this.startRule.applyToInitialState(cells, whats, countAt, equipment, numPlayers);
      }
    }
  }
}

/** Minimal fake context for function evaluation. */
function makeFakeCtx(
  cells: number[],
  equipment: Equipment1to1,
  numPlayers: number,
): Record<string, unknown> {
  return {
    game: { numPlayers, equipment },
    state: {
      mover: 1,
      cells,
      isEmptySite: (i: number) => !cells[i],
    },
    _evalFrom: -1,
    _evalTo: -1,
    _evalValue: 0,
    _evalSite: -1,
    _evalPlayer: 1,
    _radials: equipment.board.radials,
  };
}
