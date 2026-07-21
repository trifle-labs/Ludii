// @java Player/src/app/utils/UpdateTabMessages.java

import type { Context, ITrial } from "../../../../ViewController/src/../../../ludemes/other/context/Context.js";
import type { IStatus } from "../../../../../ludemes/other/trial/Trial.js";
import type { Move } from "../../../../../move.js";

// Re-export IStatus so callers can reference it
export type { IStatus };

/**
 * Minimal structural interface for app.PlayerApp (not yet ported in this batch).
 * @java app.PlayerApp
 */
interface PlayerApp {
  manager(): {
    ref(): { context(): Context; };
    settingsNetwork(): {
      activePlayers(): boolean[];
      getActiveGameId(): number;
    };
    aiSelected(): Array<{ name(): string; } | null | undefined>;
    playerToAgent(player: number): number;
    databaseFunctionsPublic(): {
      sendGameRankings(manager: unknown, tempRanking: number[]): void;
    };
  };
  contextSnapshot(): {
    getContext(app: PlayerApp): Context;
  };
  setTemporaryMessage(msg: string): void;
  addTextToStatusPanel(text: string): void;
}

// -------------------------------------------------------------------------

/**
 * Utilities for updating the status/tab messages after a move.
 *
 * Faithful 1:1 port of app.utils.UpdateTabMessages.
 *
 * @java app.utils.UpdateTabMessages
 */
export class UpdateTabMessages {

  // -------------------------------------------------------------------------

  /**
   * @java UpdateTabMessages#postMoveUpdateStatusTab(PlayerApp)
   */
  static postMoveUpdateStatusTab(app: PlayerApp): void {
    const context = app.manager().ref().context();
    const trial = context.trial();
    const game = context.game();

    const moveNumber = trial.numMoves() - 1;
    // trial.getMove uses the full Trial class which has getMove(int)
    const getMove = (trial as unknown as { getMove(idx: number): Move }).getMove.bind(trial);
    const lastMove: Move | null = (moveNumber >= 0) ? getMove(moveNumber) : null;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let nextMover = context.state()!.mover();
    if (trial.numMoves() > moveNumber + 1) {
      nextMover = getMove(moveNumber + 1).mover;
    }

    let statusString = "";

    // Display check message
    const isDeductionPuzzle = (game as unknown as { isDeductionPuzzle(): boolean }).isDeductionPuzzle;
    if (isDeductionPuzzle && !isDeductionPuzzle()) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const indexMover = context.state()!.mover();
      const board = (context as unknown as { board(): { topology(): { getAllGraphElements(): Array<{ index(): number; elementType(): unknown }> } } }).board();
      for (const element of board.topology().getAllGraphElements()) {
        const cs = (context as unknown as { containerState(n: number): { what(index: number, elemType: unknown): number } }).containerState(0);
        const indexPiece = cs.what(element.index(), element.elementType());
        if (indexPiece !== 0) {
          const components = (context as unknown as { components(): Array<{ name(): string } | null> }).components();
          const component = components[indexPiece];
          if (component !== null && component !== undefined) {
            const graphicsMeta = (game as unknown as { metadata(): { graphics(): { checkUsed(ctx: Context, mover: number, name: string): boolean } } }).metadata().graphics();
            if (graphicsMeta.checkUsed(context, indexMover, component.name())) {
              // IsThreatened is not yet ported — escape-hatch
              const checkFn = (game as unknown as { isThreatened?(pidx: number, eType: unknown, eIdx: number, ctx: Context): boolean }).isThreatened;
              const check = checkFn ? checkFn(indexPiece, element.elementType(), element.index(), context) : false;
              if (check) {
                app.setTemporaryMessage("Check.");
              }
            }
          }
        }
      }
    }

    // Display Note action message
    if (lastMove !== null && lastMove.actions !== undefined) {
      for (const action of lastMove.actions) {
        const msg = action.message();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (msg !== null && action.who() === context.state()!.mover()) {
          statusString += "Note for Player " + action.who() + ": " + msg + ".\n";
        }
      }
    }

    if (lastMove !== null && lastMove.isSwap()) {
      app.setTemporaryMessage("Player " + lastMove.mover + " made a swap move.");
    }

    // Check if any player has just lost or won
    const playerCount = game.players().count();
    for (let i = 1; i <= playerCount; i++) {
      // Network
      const activePlayers = app.manager().settingsNetwork().activePlayers();
      const contextActive = (context as unknown as { active(who: number): boolean }).active;
      const isActive = contextActive ? contextActive.call(context, i) : true;
      if (!isActive && activePlayers[i]) {
        activePlayers[i] = false;

        if (app.manager().settingsNetwork().getActiveGameId() !== 0) {
          const ranking = trial.ranking();
          const tempRanking = new Array<number>(ranking.length).fill(0);
          for (let j = 0; j < ranking.length; j++) {
            tempRanking[j] = ranking[j] ?? 0;
          }
          for (let player = 1; player < ranking.length; player++) {
            if ((ranking[player] ?? 0) === 0.0) {
              tempRanking[player] = 1000;
            }
          }
          app.manager().databaseFunctionsPublic().sendGameRankings(app.manager(), tempRanking);
        }
      }

      // Local
      const snapshotContext = app.contextSnapshot().getContext(app);
      const snapActive = (snapshotContext as unknown as { active(who: number): boolean }).active;
      const isSnapActive = snapActive ? snapActive.call(snapshotContext, i) : true;
      if (!trial.over() && !isActive && isSnapActive) {
        const ranking = trial.ranking();
        const computeNextDrawRank = (context as unknown as { computeNextDrawRank(): number }).computeNextDrawRank;
        const nextDrawRank = computeNextDrawRank ? computeNextDrawRank.call(context) : 0;
        const playerRank = ranking[i] ?? 0;
        const getPlayerName = (context as unknown as { getPlayerName(i: number): string }).getPlayerName;
        const playerName = getPlayerName ? getPlayerName.call(context, i) : "Player " + i;
        if (nextDrawRank > playerRank) {
          statusString += playerName + " has achieved a win.\n";
        } else if (nextDrawRank < playerRank) {
          statusString += playerName + " has suffered a loss.\n";
        } else {
          statusString += playerName + " has been given a draw.\n";
        }
      }
    }

    // Show next player to move
    const aiSelected = app.manager().aiSelected();
    const agentIndex = app.manager().playerToAgent(nextMover);
    const agentEntry = aiSelected[agentIndex];
    if (!trial.over() && nextMover < game.players().size() && agentEntry != null) {
      statusString += agentEntry.name() + " to move.\n";
    }

    app.addTextToStatusPanel(statusString);
  }

  // -------------------------------------------------------------------------

  /**
   * @java UpdateTabMessages#gameOverMessage(Context, Trial)
   */
  static gameOverMessage(
    context: Context,
    trial: ITrial & { status(): IStatus | null; ranking(): number[]; numMoves(): number },
  ): string {
    const game = context.game();

    const status = trial.status() as IStatus | null;
    const winner = status !== null ? status.winner() : 0;

    const nbPlayers = game.players().count();

    let str = "";
    if (winner === 0) { // DRAW
      const ranks = trial.ranking();
      let allWin = true;
      for (let i = 1; i < ranks.length; i++) {
        if ((ranks[i] ?? 0) !== 1.0) allWin = false;
      }

      if (nbPlayers === 1 && allWin) {
        str += "Congratulations, puzzle solved!\n";
      } else if (nbPlayers === 1) {
        str += "Game Over, you lose!\n";
      } else {
        str += "Game won by no one" + ".\n";
      }

      const checkMaxTurns = (game as unknown as { checkMaxTurns(ctx: Context): boolean }).checkMaxTurns;
      if (checkMaxTurns && checkMaxTurns(context)) {
        str += "Maximum number of moves reached" + ".\n";
      }

    } else if (winner === -1) { // ABORT
      str += "Game aborted" + ".\n";

    } else if (winner > game.players().count()) { // TIE
      str += "Game won by everyone" + ".\n";

    } else { // WIN
      if (nbPlayers === 1) {
        str += "Congratulations, puzzle solved!\n";
      } else {
        const requiresTeams = (game as unknown as { requiresTeams(): boolean }).requiresTeams;
        if (requiresTeams && requiresTeams()) {
          const getTeam = (context.state() as unknown as { getTeam(w: number): number }).getTeam;
          str += "Game won by team " + (getTeam ? getTeam(winner) : winner) + ".\n";
        } else {
          const getPlayerName = (context as unknown as { getPlayerName(i: number): string }).getPlayerName;
          str += "Game won by " + (getPlayerName ? getPlayerName.call(context, winner) : "Player " + winner) + ".\n";
        }
      }
    }

    if (game.players().count() >= 3) { // Rankings
      for (let i = 1; i <= game.players().count(); i++) {
        let anyPlayers = false;
        str += "Rank " + i + ": ";

        for (let j = 1; j <= game.players().count(); j++) {
          const rank = trial.ranking()[j] ?? 0;
          if (Math.floor(rank) === i) {
            const getPlayerName = (context as unknown as { getPlayerName(i: number): string }).getPlayerName;
            const playerName = getPlayerName ? getPlayerName.call(context, j) : "Player " + j;
            if (!anyPlayers) {
              str += playerName;
              anyPlayers = true;
            } else {
              str += ", " + playerName;
            }
          }
        }

        if (!anyPlayers) {
          str += "No one\n";
        } else {
          str += "\n";
        }
      }
    }

    return str;
  }

  // -------------------------------------------------------------------------
}
