import {
  type Context,
  type Game,
  type Move,
  play1to1,
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

  private readonly engineGame: Game;
  private readonly context: Context;

  public constructor(engineGame: Game, context: Context) {
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
    // A finished trial offers no moves (Java player UX; Game.apply throws on
    // finished contexts).
    if (this.context.over) return [];
    return this.engineGame.moves(this.context).map(moveToBrowserMove);
  }

  public legalMovesAtSite(siteIndex: number): readonly BrowserMove[] {
    if (this.context.over) return [];
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

export function createSessionForGame(game: Game): BrowserGameSession {
  return new EngineSession(game, game.start());
}

/** Official Ludii Tic-Tac-Toe rules. @java Common/res/lud/board/space/line/Tic-Tac-Toe.lud */
const TIC_TAC_TOE_LUD = `(game "Tic-Tac-Toe"
    (players 2)
    (equipment {
        (board (square 3))
        (piece "Disc" P1)
        (piece "Cross" P2)
    })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Line 3) (result Mover Win)))
    )
)`;

/** Official Ludii Hex rules. @java Common/res/lud/board/space/connection/Hex.lud */
const hexLud = (size: number): string => `(game "Hex"
    (players 2)
    (equipment {
        (board (hex Diamond ${size}))
        (piece "Marker" Each)
        (regions P1 {(sites Side NE) (sites Side SW) })
        (regions P2 {(sites Side NW) (sites Side SE) })
    })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Connected Mover) (result Mover Win)))
    )
)`;

export function createTicTacToeSession(): BrowserGameSession {
  return createSessionFromLud(TIC_TAC_TOE_LUD);
}

export function createHexSession(size = 7): BrowserGameSession {
  return createSessionFromLud(hexLud(size));
}

/**
 * Compile a `.lud` source string into a playable session via the faithful
 * 1:1 Java→TS compile path (the ONLY engine path; the bespoke
 * compileLudSource interpreter was deleted with the structural port).
 * @java player compile path — Compiler.compile + Game.create/start
 */
export function createSessionFromLud(ludSource: string): BrowserGameSession {
  return createSessionForGame(play1to1(ludSource));
}
