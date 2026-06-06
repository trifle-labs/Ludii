// @java Manager/src/tournament/TournamentUtil.java

import type { Context } from "../../../../context.js";

/**
 * Escape-hatch for manager.Manager — avoids circular import.
 * @java manager.Manager
 */
type ManagerShape = {
  tournament(): {
    storeResults(game: { name: string; players: { count(): number } }, ranking: number[]): void;
    startNextTournamentGame(manager: ManagerShape): void;
  } | null;
};

/**
 * Ludii Tournament util functions.
 *
 * @java tournament.TournamentUtil
 * @author Dennis Soemers and Matthew Stephenson
 */
export class TournamentUtil {

  /**
   * If Tournament is running then need to save the results of this game.
   *
   * @java TournamentUtil.saveTournamentResults(Manager, Context)
   */
  public static saveTournamentResults(manager: ManagerShape, context: Context): void {
    const tournament = manager.tournament();
    if (tournament !== null) {
      console.log("SAVING RESULTS");

      // Escape-hatch: context.game() is typed as Game in the engine; we
      // access name and players via the shape known here.
      const game = context.game as unknown as { name: string; players: { count(): number } };
      tournament.storeResults(game, [...context.trial.ranking] as number[]);

      // Java: new java.util.Timer().schedule(task, 5000L)
      // TS equivalent: setTimeout
      setTimeout(() => {
        // Java: EventQueue.invokeLater(() -> { ... })
        // TS: microtask / direct call
        console.log("LOADING NEXT GAME");
        tournament.startNextTournamentGame(manager);
      }, 5000);
    }
  }

  // -------------------------------------------------------------------------
}
