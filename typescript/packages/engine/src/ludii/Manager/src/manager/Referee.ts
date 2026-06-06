// @java Manager/src/manager/Referee.java

import type { Context } from "../../../../context.js";
import type { Game } from "../../../../game.js";
import type { Move } from "../../../../move.js";
import type { Trial } from "../../../../trial.js";
import { AIDetails } from "./ai/AIDetails.js";
import { AIUtil } from "./ai/AIUtil.js";

/** @java main.Constants.UNDEFINED */
const UNDEFINED = -1;

/**
 * Escape-hatch for game.types.play.ModeType.
 * @java game.types.play.ModeType
 */
type ModeType = string;

/**
 * Escape-hatch for other.model.Model and its callback interfaces.
 * @java other.model.Model
 */
type AgentMoveCallback = { call(move: Move): bigint };
type MoveMessageCallback = { call(message: string): void };

type ModelShape = {
  isReady(): boolean;
  isRunning(): boolean;
  expectsHumanInput(): boolean;
  interruptAIs(): void;
  getLiveAIs(): unknown[];
  getLastStepAIs(): (unknown & { generateAnalysisReport?: () => string | null })[];
  movesPerPlayer(): (Move | null)[] | null;
  applyHumanMove(context: RefereeContext, move: Move, mover: number): Move | null;
  unpauseAgents(
    context: RefereeContext,
    ais: unknown[],
    thinkTime: number[],
    maxIt: number,
    maxD: number,
    minThink: number,
    preCb: AgentMoveCallback | null,
    postCb: AgentMoveCallback | null,
    forceThreads: boolean,
    msgCb: MoveMessageCallback,
  ): void;
  startNewStep(
    context: RefereeContext,
    ais: unknown[],
    thinkTime: number[],
    maxIt: number,
    maxD: number,
    minThink: number,
    block: boolean,
    forceThreads: boolean,
    forceNoThreads: boolean,
    preCb: AgentMoveCallback,
    postCb: AgentMoveCallback,
    forceUseThreads: boolean,
    msgCb: MoveMessageCallback,
  ): void;
};

/**
 * Escape-hatch for the Context subsets we need in Referee.
 * Game.moves() returns readonly Move[] (matching the engine's Game interface).
 * @java other.context.Context
 */
type RefereeContext = Context & {
  model(): ModelShape;
  currentInstanceContext(): RefereeContext;
  game: Game & {
    mode(): { mode(): ModeType };
    // Game.moves() returns readonly Move[] per engine Game interface
    playout(ctx: RefereeContext, ais: unknown, time: number, arg3: unknown, a: number, b: number, rng: unknown): void;
    isStochasticGame(): boolean;
    requiresScore(): boolean;
    players: { count(): number };
    getMatchingLegalMove(ctx: RefereeContext, move: Move): Move | null;
  };
  trial: Trial & {
    numMoves(): number;
    moveNumber(): number;
    numInitialPlacementMoves: number;
    generateCompleteMovesList(): Move[];
    addMove(move: Move): void;
    previousState(): { clear(): void };
    previousStateWithinATurn(): { clear(): void };
  };
  state: {
    mover: number;
    playerToAgent(p: number): number;
    stateHash(): bigint;
  };
  rng: { saveState(): unknown };
  score(p: number): number;
};

/**
 * Manager shape used by Referee — avoids circular import.
 * @java manager.Manager
 */
type ManagerShape = {
  aiSelected(): (AIDetails | null)[];
  moverToAgent(): number;
  ref(): Referee;
  settingsManager(): {
    showRepetitions(): boolean;
    setMovesAllowedWithRepetition(moves: Move[]): void;
    agentsPaused(): boolean;
    setAgentsPaused(manager: ManagerShape, paused: boolean): void;
    tickLength(): number;
    minimumAgentThinkTime(): number;
    storedGameStatesForVisuals(): bigint[];
    alwaysAutoPass(): boolean;
  };
  settingsNetwork(): {
    getActiveGameId(): number;
  };
  databaseFunctionsPublic(): {
    sendMoveToDatabase(manager: ManagerShape, move: Move, mover: number, score: string, moveNumber: number): void;
    checkNetworkSwap(manager: ManagerShape, move: Move): void;
  };
  getPlayerInterface(): {
    addTextToStatusPanel(text: string): void;
    addTextToAnalysisPanel(text: string): void;
    postMoveUpdates(move: Move, noAnimation: boolean): void;
    setTemporaryMessage(text: string): void;
    repaint(): void;
  };
  setLiveAIs(ais: unknown[] | null): void;
  liveAIs(): unknown[] | null;
  updateCurrentGameRngInternalState(): void;
};

/**
 * Runnable for per-step threads in Referee.
 *
 * @java manager.Referee.RefereeStepRunnable
 * @author Dennis Soemers
 */
export abstract class RefereeStepRunnable {
  /** @java RefereeStepRunnable.shouldTerminate */
  public shouldTerminate: boolean = false;

  /** @java RefereeStepRunnable.run() */
  public abstract run(): void;
}

/**
 * Per-step thread for referee.
 *
 * @java manager.Referee.RefereeStepThread
 * @author Dennis Soemers
 */
export class RefereeStepThread {
  /** @java RefereeStepThread.runnable */
  public readonly runnable: RefereeStepRunnable;

  /** @java RefereeStepThread.isAlive — tracks whether the simulated thread is running */
  private alive: boolean = false;

  /**
   * Constructor.
   * @java RefereeStepThread(RefereeStepRunnable)
   */
  public constructor(runnable: RefereeStepRunnable) {
    this.runnable = runnable;
  }

  /** @java Thread.setDaemon(boolean) */
  public setDaemon(_daemon: boolean): void {
    // no-op in TS; no daemon threads
  }

  /** @java Thread.start() */
  public start(): void {
    this.alive = true;
    // In Java this launches the runnable in a background thread. In TS we
    // schedule it as a microtask so the calling synchronous frame can finish.
    Promise.resolve().then(() => {
      try {
        this.runnable.run();
      } finally {
        this.alive = false;
      }
    });
  }

  /** @java Thread.isAlive() */
  public isAlive(): boolean {
    return this.alive;
  }
}

/**
 * The Referee class coordinates all aspects of game play including self-play
 * tournaments.
 *
 * @java manager.Referee
 * @author cambolbro and Eric.Piette and Matthew.Stephenson
 */
export class Referee {

  // -------------------------------------------------------------------------

  /** @java Referee.context */
  contextVal: RefereeContext | null = null;

  /** @java Referee.allowHumanBasedStepStart — AtomicBoolean */
  private allowHumanBasedStepStart: boolean = true;

  /** @java Referee.wantNextMoveCall — AtomicBoolean */
  private wantNextMoveCall: boolean = false;

  /** @java Referee.AI_VIS_UPDATE_TIME */
  public static readonly AI_VIS_UPDATE_TIME: number = 40;

  /** @java Referee.moveThread */
  private moveThread: RefereeStepThread | null = null;

  // -------------------------------------------------------------------------

  /**
   * @return Current context.
   * @java Referee.context()
   */
  public context(): RefereeContext | null {
    return this.contextVal;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Referee.setGame(Manager, Game)
   */
  public setGame(manager: ManagerShape, game: Game): Referee {
    // In Java: context = new Context(game, new Trial(game))
    // Escape-hatch: use game.start() which returns a full Context
    this.contextVal = game.start() as unknown as RefereeContext;
    manager.updateCurrentGameRngInternalState();
    return this;
  }

  // -------------------------------------------------------------------------

  /**
   * Apply a saved move to the game. Used only when viewing prior states.
   * No validity checks.
   * @java Referee.makeSavedMoves(Manager, List<Move>)
   */
  public makeSavedMoves(manager: ManagerShape, moves: Move[]): void {
    if (this.contextVal === null) return;

    let move: Move | null = null;

    for (let i = this.contextVal.trial.numMoves(); i < moves.length; i++) {
      const m = moves[i];
      if (m === undefined) continue;
      move = m;
      this.preMoveApplication(manager, move);
      this.contextVal.game.apply(this.contextVal, move);
    }

    if (move !== null) {
      this.postMoveApplication(manager, move, true);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Apply human move to game.
   * @java Referee.applyHumanMoveToGame(Manager, Move)
   */
  public applyHumanMoveToGame(manager: ManagerShape, move: Move): void {
    if (this.contextVal === null) return;
    const model = this.contextVal.model();

    if (model.isReady()) {
      if (!this.nextMove(manager, true)) return;
    }

    const legalMoves = this.contextVal.game.moves(this.contextVal);
    const isPassMove = (move as unknown as { isPass?: () => boolean }).isPass?.() ?? false;
    const autoPass = isPassMove && legalMoves.length === 0;

    if (!autoPass) {
      // In Java: busy-wait for model to start running. In TS we can't busy-wait,
      // so we proceed (the model.applyHumanMove handles synchronisation).
    }

    // Equivalent of the Runnable.run() inline invocation:
    this.preMoveApplication(manager, move);
    const appliedMove = model.applyHumanMove(this.contextVal, move, move.mover);

    if (model.movesPerPlayer() !== null) {
      const playerIdsWaitingFor: number[] = [];
      const movesPerPlayer = model.movesPerPlayer()!;
      for (let i = 1; i < movesPerPlayer.length; i++) {
        if (movesPerPlayer[i] === null) playerIdsWaitingFor.push(i);
      }

      if (playerIdsWaitingFor.length > 0) {
        let tempMessage = "Waiting for moves from";
        for (const index of playerIdsWaitingFor) {
          tempMessage += ` P${index} and`;
        }
        tempMessage = tempMessage.substring(0, tempMessage.length - 4);
        tempMessage += ".\n";
        manager.getPlayerInterface().addTextToStatusPanel(tempMessage);
      }
    }

    if (appliedMove !== null) {
      this.postMoveApplication(manager, appliedMove, false);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Apply remote move that we received from the network.
   * @java Referee.applyNetworkMoveToGame(Manager, Move)
   */
  public applyNetworkMoveToGame(manager: ManagerShape, move: Move): boolean {
    if (this.contextVal === null) return false;
    const model = this.contextVal.model();

    if (model.isReady() && !this.nextMove(manager, true)) {
      console.log("Waiting on the model: " + String(move));
      return false;
    }

    const realMoveToApply = this.contextVal.game.getMatchingLegalMove(this.contextVal, move);

    if (realMoveToApply === null) {
      manager.getPlayerInterface().addTextToStatusPanel(`received move was not legal: ${String(move)}\n`);
      manager.getPlayerInterface().addTextToStatusPanel(`currentTrialLength: ${this.contextVal.trial.moveNumber()}\n`);
      return false;
    }

    this.applyHumanMoveToGame(manager, realMoveToApply);
    return true;
  }

  // -------------------------------------------------------------------------

  /**
   * Plays a random move in the current position.
   * @java Referee.randomMove(Manager)
   */
  public randomMove(manager: ManagerShape): void {
    if (this.contextVal === null) return;
    const legal = this.contextVal.game.moves(this.contextVal);

    if (legal.length > 0) {
      const moveIndex = Math.floor(Math.random() * legal.length);
      const randomMove = legal[moveIndex];
      if (randomMove !== undefined) {
        this.applyHumanMoveToGame(manager, randomMove);
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Time random playouts.
   * @java Referee.timeRandomPlayouts()
   * @return Average number of playouts per second.
   */
  public timeRandomPlayouts(): number {
    if (this.contextVal === null) return 0;

    const timingContext = this.contextVal;
    const game = timingContext.game;

    // Warming — 10 seconds
    let stopAt = 0;
    let start = Date.now();
    let abortAt = start + 10_000;

    while (stopAt < abortAt) {
      game.start();
      game.playout(timingContext, null, 1.0, null, 0, -1, null);
      stopAt = Date.now();
    }

    stopAt = 0;
    start = Date.now();
    abortAt = start + 30_000;
    let playouts = 0;
    let moveDone = 0;

    while (stopAt < abortAt) {
      game.start();
      game.playout(timingContext, null, 1.0, null, 0, -1, null);
      stopAt = Date.now();
      moveDone += timingContext.trial.numMoves();
      playouts++;
    }

    const secs = (stopAt - start) / 1000.0;
    const rate = playouts / secs;
    const rateMove = moveDone / secs;

    console.log(rate.toFixed(2) + "p/s");
    console.log(rateMove.toFixed(2) + "m/s");

    return rate;
  }

  // -------------------------------------------------------------------------

  /**
   * Perform a random playout.
   * @java Referee.randomPlayout(Manager)
   */
  public randomPlayout(manager: ManagerShape): void {
    if (this.contextVal === null) return;
    this.interruptAI(manager);

    const gameToPlayout = this.contextVal.game;
    gameToPlayout.playout(this.contextVal, null, 1.0, null, 0, -1, null);

    // EventQueue.invokeLater equivalent
    Promise.resolve().then(() => {
      const lastMove = (this.contextVal!.trial as unknown as { lastMove?(): Move }).lastMove?.();
      if (lastMove !== undefined) {
        manager.getPlayerInterface().postMoveUpdates(lastMove, true);
      }
    });
  }

  /**
   * Perform a random playout only for the current instance within a Match.
   * @java Referee.randomPlayoutSingleInstance(Manager)
   */
  public randomPlayoutSingleInstance(manager: ManagerShape): void {
    if (this.contextVal === null) return;
    const instanceContext = this.contextVal.currentInstanceContext();
    const instanceTrial = instanceContext.trial;

    if (!(instanceTrial as unknown as { over: boolean }).over) {
      this.interruptAI(manager);

      const startInstanceTrial = this.contextVal.currentInstanceContext().trial;
      let currentMovesMade = startInstanceTrial.numMoves();
      void currentMovesMade;

      const gameToPlayout = instanceContext.game;
      gameToPlayout.playout(instanceContext, null, 1.0, null, 0, -1, null);

      // Append extra moves to the match-wide trial
      const subtrialMoves = instanceContext.trial.generateCompleteMovesList();
      const numMovesAfterPlayout = subtrialMoves.length;
      const numMovesToAppend = numMovesAfterPlayout - startInstanceTrial.numMoves();

      for (let i = 0; i < numMovesToAppend; ++i) {
        const m = subtrialMoves[subtrialMoves.length - numMovesToAppend + i];
        if (m !== undefined) {
          this.contextVal.trial.addMove(m);
        }
      }

      // If instance is over, advance in the Match
      if ((instanceTrial as unknown as { over: boolean }).over) {
        const legalMatchMoves = this.contextVal.game.moves(this.contextVal);
        if (legalMatchMoves.length === 1 && legalMatchMoves[0] !== undefined) {
          this.contextVal.game.apply(this.contextVal, legalMatchMoves[0]);
        }
      }

      // Adjust currentMovesMade if transitioned to new instance
      if (this.context()!.currentInstanceContext().trial !== startInstanceTrial) {
        currentMovesMade = this.context()!.currentInstanceContext().trial.numInitialPlacementMoves;
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Triggers a move from the next player. If the next player is human then
   * control drops through to wait for input.
   *
   * @param humanBasedStepStart True if the caller responds to human input
   * @return True if we started a new step in the model
   * @java Referee.nextMove(Manager, boolean)
   */
  public nextMove(manager: ManagerShape, humanBasedStepStart: boolean): boolean {
    this.wantNextMoveCall = false;

    if (!this.allowHumanBasedStepStart && humanBasedStepStart) return false;

    try {
      if (this.contextVal === null) return false;

      if (!(this.contextVal.trial as unknown as { over: boolean }).over) {
        const model = this.contextVal.model();

        // Simulation mode
        const modeType: ModeType = this.contextVal.game.mode().mode();
        if (modeType === "Simulation") {
          const doNothingAI = { selectAction: () => undefined };
          model.unpauseAgents(
            this.contextVal,
            [doNothingAI],
            [manager.settingsManager().tickLength()],
            UNDEFINED,
            UNDEFINED,
            0.0,
            null,
            null,
            true,
            {
              call: (message: string) => {
                manager.getPlayerInterface().addTextToStatusPanel(message);
              },
            },
          );
          const lastMove = (this.contextVal.trial as unknown as { lastMove?(): Move }).lastMove?.();
          if (lastMove !== undefined) {
            this.postMoveApplication(manager, lastMove, false);
          }
        }

        if (!model.isReady() && model.isRunning() && !manager.settingsManager().agentsPaused()) {
          const thinkTime = AIDetails.convertToThinkTimeArray(manager.aiSelected());
          let agents: (unknown | null)[] | null = null;

          if (!manager.settingsManager().agentsPaused()) {
            agents = AIDetails.convertToAIList(manager.aiSelected());
          }
          if (agents !== null) {
            // Cast to avoid recursive ManagerShape mismatch across modules
            AIUtil.checkAISupported(manager as unknown as Parameters<typeof AIUtil.checkAISupported>[0], this.contextVal);
          }

          model.unpauseAgents(
            this.contextVal,
            agents ?? [],
            thinkTime,
            -1, -1,
            0.4,
            {
              call: (move: Move) => {
                this.preMoveApplication(manager, move);
                return 0n;
              },
            },
            {
              call: (move: Move) => {
                this.postMoveApplication(manager, move, false);
                return -1n;
              },
            },
            true,
            {
              call: (message: string) => {
                manager.getPlayerInterface().addTextToStatusPanel(message);
              },
            },
          );
        } else {
          this.allowHumanBasedStepStart = model.expectsHumanInput();

          if (this.moveThread !== null && this.moveThread.isAlive()) {
            this.moveThread.runnable.shouldTerminate = true;
          }

          const referee = this;

          const runnable = new (class extends RefereeStepRunnable {
            public override run(): void {
              const thinkTime = AIDetails.convertToThinkTimeArray(manager.aiSelected());

              let agents: (unknown | null)[] | null = null;
              if (!manager.settingsManager().agentsPaused()) {
                agents = AIDetails.convertToAIList(manager.aiSelected());
              }

              // Make sure any AIs are initialised
              if (agents !== null && referee.contextVal !== null) {
                const playerCount = referee.contextVal.game.players.count();
                for (let p = 1; p <= playerCount; ++p) {
                  if (agents[p] === null || agents[p] === undefined) continue;

                  const ai = agents[p] as unknown as { supportsGame(g: unknown): boolean; friendlyName: string; initIfNeeded?(g: unknown, p: number): void };
                  if (!ai.supportsGame(referee.contextVal.game)) {
                    const oldDetail = manager.aiSelected()[p];
                    const newAIFriendlyName = "Random";
                    const json = { AI: { algorithm: newAIFriendlyName } };

                    manager.aiSelected()[p] = new AIDetails(manager as unknown as ConstructorParameters<typeof AIDetails>[0], json, p, "Ludii AI");

                    Promise.resolve().then(() => {
                      manager.getPlayerInterface().addTextToStatusPanel(
                        `${oldDetail?.name() ?? "AI"} does not support this game. Switching to default AI for this game: ${newAIFriendlyName}.\n`,
                      );
                    });
                  }

                  ai.initIfNeeded?.(referee.contextVal.game, p);
                }
              }

              const startInstanceTrial = referee.contextVal!.currentInstanceContext().trial;

              model.startNewStep(
                referee.contextVal!,
                agents ?? [],
                thinkTime,
                -1, -1,
                manager.settingsManager().minimumAgentThinkTime(),
                false,   // don't block
                true,    // force use of threads
                false,   // don't force no threads
                {
                  call: (move: Move) => {
                    referee.preMoveApplication(manager, move);
                    return 0n;
                  },
                },
                {
                  call: (move: Move) => {
                    referee.postMoveApplication(manager, move, false);
                    return -1n;
                  },
                },
                true,
                {
                  call: (message: string) => {
                    manager.getPlayerInterface().addTextToStatusPanel(message);
                  },
                },
              );

              // Async poll loop (replaces the Java busy-wait while loop)
              const pollInterval = setInterval(() => {
                if (this.shouldTerminate || model.isReady()) {
                  clearInterval(pollInterval);

                  if (this.shouldTerminate) return;

                  manager.setLiveAIs(null);

                  Promise.resolve().then(() => {
                    manager.getPlayerInterface().repaint();
                  });

                  referee.allowHumanBasedStepStart = false;
                  manager.setLiveAIs(null);

                  // If transitioned to new instance, pause
                  if (startInstanceTrial !== referee.contextVal!.currentInstanceContext().trial) {
                    manager.settingsManager().setAgentsPaused(manager, true);
                  }

                  if (!manager.settingsManager().agentsPaused()) {
                    const ais = model.getLastStepAIs();

                    Promise.resolve().then(() => {
                      for (let i = 0; i < ais.length; ++i) {
                        const ai = ais[i];
                        if (ai !== null && ai !== undefined) {
                          const analysisReport = (ai as { generateAnalysisReport?: () => string | null }).generateAnalysisReport?.();
                          if (analysisReport !== null && analysisReport !== undefined) {
                            manager.getPlayerInterface().addTextToAnalysisPanel(analysisReport + "\n");
                          }
                        }
                      }
                    });

                    if (!(referee.contextVal!.trial as unknown as { over: boolean }).over) {
                      referee.wantNextMoveCall = true;
                      referee.nextMove(manager, false);
                    } else {
                      referee.allowHumanBasedStepStart = true;
                    }
                  } else {
                    referee.allowHumanBasedStepStart = true;
                  }

                  return;
                }

                manager.setLiveAIs(model.getLiveAIs());
                referee.allowHumanBasedStepStart = model.expectsHumanInput();

                const liveAIs = manager.liveAIs();
                if (liveAIs !== null && liveAIs.length > 0) {
                  Promise.resolve().then(() => {
                    manager.getPlayerInterface().repaint();
                  });
                }
              }, Referee.AI_VIS_UPDATE_TIME);
            }
          })();

          this.moveThread = new RefereeStepThread(runnable);
          this.moveThread.setDaemon(true);
          this.moveThread.start();

          // In Java: busy-wait until model is running. In TS we return immediately.
        }
      } else {
        return false;
      }

      return true;
    } finally {
      if (!humanBasedStepStart && this.contextVal !== null && !this.contextVal.model().isRunning()) {
        this.allowHumanBasedStepStart = true;
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Callback to call prior to application of AI-chosen moves.
   * @java Referee.preMoveApplication(Manager, Move)
   */
  preMoveApplication(manager: ManagerShape, move: Move): void {
    if (this.contextVal === null) return;

    if (manager.settingsManager().showRepetitions()) {
      // Construct a copy of context for analysis — escape-hatch via game.start
      const newContext = this.contextVal.game.start() as unknown as RefereeContext;
      newContext.trial.previousState().clear();
      newContext.trial.previousStateWithinATurn().clear();
      newContext.game.apply(newContext, move);
      manager.settingsManager().setMovesAllowedWithRepetition(
        [...newContext.game.moves(newContext)] as Move[],
      );
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Handle miscellaneous stuff we need to do after applying a move.
   * @java Referee.postMoveApplication(Manager, Move, boolean)
   */
  public postMoveApplication(manager: ManagerShape, move: Move, savedMove: boolean): void {
    if (this.contextVal === null) return;

    // Store the hash of each state encountered.
    if (manager.settingsManager().showRepetitions()) {
      const hash = this.contextVal.state.stateHash();
      if (!manager.settingsManager().storedGameStatesForVisuals().includes(hash)) {
        manager.settingsManager().storedGameStatesForVisuals().push(hash);
      }
    }

    if (!savedMove) {
      // manager.undoneMoves().clear() — escape-hatch: called on manager directly
      (manager as unknown as { undoneMoves(): Move[] }).undoneMoves?.().splice(0);

      if (manager.settingsNetwork().getActiveGameId() !== 0) {
        let scoreString = "";
        if (this.contextVal.game.requiresScore()) {
          for (let i = 1; i <= this.contextVal.game.players.count(); i++) {
            scoreString += this.contextVal.score(this.contextVal.state.playerToAgent(i)) + ",";
          }
        }

        const moveNumber =
          this.contextVal.currentInstanceContext().trial.numMoves() -
          this.contextVal.currentInstanceContext().trial.numInitialPlacementMoves;

        manager.databaseFunctionsPublic().sendMoveToDatabase(
          manager,
          move,
          this.contextVal.state.mover,
          scoreString,
          moveNumber,
        );
        manager.databaseFunctionsPublic().checkNetworkSwap(manager, move);
      }

      // Check if need to apply instant Pass move.
      this.checkInstantPass(manager);
    }

    manager.getPlayerInterface().setTemporaryMessage("");
    manager.getPlayerInterface().postMoveUpdates(move, savedMove);
  }

  // -------------------------------------------------------------------------

  /**
   * Checks if a pass move should be applied instantly, if it's the only legal
   * move and the game is stochastic.
   * @java Referee.checkInstantPass(Manager)
   */
  private checkInstantPass(manager: ManagerShape): void {
    if (this.contextVal === null) return;

    const legalMoves = this.contextVal.game.moves(this.contextVal);
    if (legalMoves.length === 0) return;

    const firstMove = legalMoves[0];
    if (firstMove === undefined) return;

    const firstMoveShape = firstMove as unknown as { isPass?(): boolean; isForced?(): boolean };

    if (
      (manager.aiSelected()[manager.moverToAgent()]?.ai() === null ||
        manager.aiSelected()[manager.moverToAgent()]?.ai() === undefined) &&
      legalMoves.length === 1 &&
      (firstMoveShape.isPass?.() ?? false) &&
      (firstMoveShape.isForced?.() ?? false) &&
      (!this.contextVal.game.isStochasticGame() || manager.settingsManager().alwaysAutoPass()) &&
      manager.settingsNetwork().getActiveGameId() === 0
    ) {
      this.applyHumanMoveToGame(manager, firstMove);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Attempts to interrupt any AI that is currently running, and returns only
   * once there no longer is any AI thinking thread alive.
   * @java Referee.interruptAI(Manager)
   */
  public interruptAI(manager: ManagerShape): void {
    if (this.contextVal !== null) {
      this.contextVal.model().interruptAIs();
    }
    manager.setLiveAIs(null);
    this.allowHumanBasedStepStart = true;
  }

  // -------------------------------------------------------------------------
}
