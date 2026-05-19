import {
  type Context,
  compileLudSource,
  type FlatBoardGame,
  type Move,
  ticTacToeGame,
} from "@ludii/typescript-engine";

import type {
  BrowserGame,
  BrowserGameSession,
  BrowserMove,
  BrowserState,
  BrowserTrial,
  BrowserTrialEntry,
  CellView,
} from "./contract.js";

function moveToBrowserMove(move: Move): BrowserMove {
  return {
    id: move.id,
    label: move.label,
    siteIndices: move.siteIndices,
    mover: move.mover,
  };
}

class EngineState implements BrowserState {
  public constructor(private readonly context: Context) {}

  public cellAt(siteIndex: number): CellView {
    return this.context.state.cellAt(siteIndex);
  }

  public get siteCount(): number {
    return this.context.state.siteCount;
  }
}

class EngineTrial implements BrowserTrial {
  public readonly entries: readonly BrowserTrialEntry[];

  public constructor(context: Context) {
    this.entries = context.trial.moves.map(
      (move, index): BrowserTrialEntry => ({
        index,
        move: moveToBrowserMove(move),
      }),
    );
  }
}

export class EngineSession implements BrowserGameSession {
  public readonly game: BrowserGame;
  public readonly state: BrowserState;
  public readonly trial: BrowserTrial;

  private readonly engineGame: FlatBoardGame;
  private readonly context: Context;

  public constructor(engineGame: FlatBoardGame, context: Context) {
    this.engineGame = engineGame;
    this.context = context;
    this.game = {
      id: engineGame.id,
      name: engineGame.name,
      numPlayers: engineGame.numPlayers,
      width: engineGame.width,
      height: engineGame.height,
    };
    this.state = new EngineState(context);
    this.trial = new EngineTrial(context);
  }

  public get mover(): number {
    return this.context.mover;
  }

  public get over(): boolean {
    return this.context.over;
  }

  public get winner(): number {
    return this.context.winner;
  }

  public legalMoves(): readonly BrowserMove[] {
    return this.engineGame.moves(this.context).map(moveToBrowserMove);
  }

  public legalMovesAtSite(siteIndex: number): readonly BrowserMove[] {
    return this.engineGame
      .moves(this.context)
      .filter((m) => m.siteIndices.includes(siteIndex))
      .map(moveToBrowserMove);
  }

  public apply(moveId: string): BrowserGameSession {
    const move = this.engineGame
      .moves(this.context)
      .find((m) => m.id === moveId);
    if (!move) {
      throw new Error(`Unknown move id "${moveId}".`);
    }
    const next = this.engineGame.apply(this.context, move);
    return new EngineSession(this.engineGame, next);
  }

  public reset(): BrowserGameSession {
    return new EngineSession(this.engineGame, this.engineGame.start());
  }

  public truncate(numMoves: number): BrowserGameSession {
    if (numMoves < 0 || numMoves > this.context.trial.numMoves) {
      throw new RangeError(
        `truncate(${numMoves}) out of range [0, ${this.context.trial.numMoves}].`,
      );
    }
    const moves = this.context.trial.moves.slice(0, numMoves);
    let next = this.engineGame.start();
    for (const move of moves) {
      next = this.engineGame.apply(next, move);
    }
    return new EngineSession(this.engineGame, next);
  }
}

export function createSessionForGame(game: FlatBoardGame): BrowserGameSession {
  return new EngineSession(game, game.start());
}

export function createTicTacToeSession(): BrowserGameSession {
  return createSessionForGame(ticTacToeGame());
}

/**
 * Compile a `.lud` source string into a playable session. Bridges the
 * Phase 3 roadmap entry: the browser-player can take a `.lud` string
 * and play it without an intermediate engine build step.
 */
export function createSessionFromLud(ludSource: string): BrowserGameSession {
  return createSessionForGame(compileLudSource(ludSource));
}
