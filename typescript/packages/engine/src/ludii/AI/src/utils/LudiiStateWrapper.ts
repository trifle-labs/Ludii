// @java AI/src/utils/LudiiStateWrapper.java

/**
 * Wrapper around a Ludii context (trial + state), with various extra methods required for
 * other frameworks that like to wrap around Ludii (e.g. OpenSpiel, Polygames)
 *
 * @java utils/LudiiStateWrapper.java
 * @author Dennis Soemers
 */

// Escape-hatch interfaces for not-yet-ported dependencies

/** @java game.equipment.container.Container */
interface Container {
  numSites(): number;
  name(): string;
}

/** @java other.state.container.ContainerState */
interface ContainerState {
  countCell(site: number): number;
  stateCell(site: number): number;
  toString(): string;
}

/** @java other.state.stacking.BaseContainerStateStacking */
interface BaseContainerStateStacking extends ContainerState {
  sizeStackCell(site: number): number;
  whatCell(site: number, level: number): number;
}

/** @java other.state.owned.Owned */
interface Owned {
  sites(player: number, componentType: number): TIntArrayList;
}

/** @java other.state.State */
interface State {
  mover(): number;
  next(): number;
  prev(): number;
  numPlayers(): number;
  playerToAgent(player: number): number;
  fullHash(): bigint;
  stateHash(): bigint;
  containerStates(): ContainerState[];
  owned(): Owned;
  amount(player: number): number;
  orderHasChanged(): boolean;
}

/** @java other.context.Context */
interface Context {
  trial(): Trial;
  state(): State;
  game(): Game;
  active(player: number): boolean;
  score(player: number): number;
}

/** @java other.context.TempContext */
interface TempContext extends Context {
  __tempContext: true;
}

/** @java other.trial.Trial */
interface Trial {
  over(): boolean;
  ranking(): number[];
  generateCompleteMovesList(): Move[];
  numInitialPlacementMoves(): number;
  moveNumber(): number;
  numMoves(): number;
}

/** @java other.move.Move */
interface Move {
  mover(): number;
  fromNonDecision(): number;
  toNonDecision(): number;
  toTrialFormat(ctx: Context): string;
}

/** @java game.Game */
interface Game {
  name(): string;
  players(): { count(): number };
  moves(ctx: Context): { moves(): FastArrayList<Move> };
  apply(ctx: Context, move: Move): void;
  start(ctx: Context): void;
  playout(
    ctx: Context,
    list: unknown,
    threshold: number,
    selector: unknown,
    cap: number,
    rand: unknown
  ): void;
  equipment(): Equipment;
  isStacking(): boolean;
  requiresCount(): boolean;
  requiresBet(): boolean;
  requiresLocalState(): boolean;
  metaRules(): { usesSwapRule(): boolean };
  requiresScore(): boolean;
}

/** @java game.equipment.Equipment */
interface Equipment {
  containers(): Container[];
  components(): unknown[];
  sitesFrom(): number[];
}

/** @java main.collections.FastArrayList */
interface FastArrayList<T> {
  size(): number;
  get(i: number): T;
  toArray(arr?: T[]): T[];
}

/** @java gnu.trove.list.array.TIntArrayList */
interface TIntArrayList {
  size(): number;
  getQuick(i: number): number;
  add(v: number): void;
  contains(v: number): boolean;
  sort(): void;
  toArray(): number[];
}

/** @java other.RankUtils */
interface RankUtils {
  agentUtilities(ctx: Context): number[];
}

/** @java main.Constants.OFF */
const OFF = -1;

//-------------------------------------------------------------------------

// Imports for LudiiGameWrapper (already ported)
import type { LudiiGameWrapper } from "./LudiiGameWrapper.js";

//-------------------------------------------------------------------------

/**
 * Wrapper around a Ludii context (trial + state).
 *
 * @java utils.LudiiStateWrapper
 */
export class LudiiStateWrapper {

  //-------------------------------------------------------------------------

  /** Reference back to our wrapped Ludii game */
  protected game: LudiiGameWrapper;

  /** Our wrapped context */
  protected context: Context;

  /** Our wrapped trial */
  protected trial: Trial;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param game
   * @java LudiiStateWrapper(LudiiGameWrapper)
   */
  public constructor(game: LudiiGameWrapper);
  /**
   * Constructor
   * @param gameWrapper
   * @param context
   * @java LudiiStateWrapper(LudiiGameWrapper, Context)
   */
  public constructor(gameWrapper: LudiiGameWrapper, context: Context);
  /**
   * Copy constructor
   * @param other
   * @java LudiiStateWrapper(LudiiStateWrapper)
   */
  public constructor(other: LudiiStateWrapper);
  public constructor(
    gameOrOther: LudiiGameWrapper | LudiiStateWrapper,
    contextArg?: Context
  ) {
    if (gameOrOther instanceof LudiiStateWrapper) {
      // Copy constructor
      const other = gameOrOther;
      this.game = other.game;
      this.context = LudiiStateWrapper._copyContext(other.context);
      this.trial = this.context.trial();
    } else if (contextArg !== undefined) {
      // Constructor with context
      this.game = gameOrOther as LudiiGameWrapper;
      this.trial = contextArg.trial();
      this.context = contextArg;
    } else {
      // Default constructor from game only
      const gw = gameOrOther as LudiiGameWrapper;
      this.game = gw;
      const g = (gw as unknown as { game: Game }).game;
      this.trial = LudiiStateWrapper._newTrial(g);
      this.context = LudiiStateWrapper._newContext(g, this.trial);
      g.start(this.context);
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Copies data from given other LudiiStateWrapper.
   * @param other
   * @java LudiiStateWrapper.copyFrom(LudiiStateWrapper)
   */
  public copyFrom(other: LudiiStateWrapper): void {
    this.game = other.game;
    this.context = LudiiStateWrapper._copyContext(other.context);
    this.trial = this.context.trial();
  }

  //-------------------------------------------------------------------------

  /**
   * @param actionID
   * @param player
   * @return A string (with fairly detailed information) on the move(s) represented
   * by the given actionID in the current game state.
   * @java LudiiStateWrapper.actionToString(int, int)
   */
  public actionToString(actionID: number, player: number): string {
    const g = (this.game as unknown as { game: Game }).game;
    const legalMoves = this._getLegalMovesForPlayer(g, player);

    const moves: Move[] = [];
    for (let i = 0; i < legalMoves.size(); ++i) {
      const move = legalMoves.get(i);
      if ((this.game as unknown as { moveToInt(m: Move): number }).moveToInt(move) === actionID)
        moves.push(move);
    }

    if (moves.length === 0) {
      return "[Ludii found no move for ID: " + actionID + "!]";
    } else if (moves.length === 1) {
      return moves[0]!.toTrialFormat(this.context);
    } else {
      return "[Multiple Ludii moves for ID=" + actionID + ": " + moves.toString() + "]";
    }
  }

  /**
   * Applies the given move
   * @param move
   * @java LudiiStateWrapper.applyMove(Move)
   */
  public applyMove(move: Move): void {
    const g = (this.game as unknown as { game: Game }).game;
    g.apply(this.context, move);
  }

  /**
   * Applies the nth legal move in current game state
   * @param n Legal move index
   * @java LudiiStateWrapper.applyNthMove(int)
   */
  public applyNthMove(n: number): void {
    const g = (this.game as unknown as { game: Game }).game;
    const legalMoves = g.moves(this.context).moves();
    const moveToApply = legalMoves.get(n);
    g.apply(this.context, moveToApply);
  }

  /**
   * Applies a move represented by given int in the single-int-action-representation.
   * @param action
   * @param player
   * @java LudiiStateWrapper.applyIntAction(int, int)
   */
  public applyIntAction(action: number, player: number): void {
    const g = (this.game as unknown as { game: Game }).game;
    const legalMoves = this._getLegalMovesForPlayer(g, player);

    const moves: Move[] = [];
    for (let i = 0; i < legalMoves.size(); ++i) {
      const move = legalMoves.get(i);
      if ((this.game as unknown as { moveToInt(m: Move): number }).moveToInt(move) === action)
        moves.push(move);
    }

    const idx = Math.floor(Math.random() * moves.length);
    g.apply(this.context, moves[idx]!);
  }

  /**
   * @java LudiiStateWrapper.clone()
   */
  public clone(): LudiiStateWrapper {
    return new LudiiStateWrapper(this);
  }

  /**
   * @return Current player to move (not accurate in simultaneous-move games).
   * Returns a 0-based index.
   * @java LudiiStateWrapper.currentPlayer()
   */
  public currentPlayer(): number {
    return this.context.state().playerToAgent(this.context.state().mover()) - 1;
  }

  /**
   * @return True if and only if current trial is over (terminal game state reached)
   * @java LudiiStateWrapper.isTerminal()
   */
  public isTerminal(): boolean {
    return this.trial.over();
  }

  /**
   * @return The full Zobrist hash of the current state
   * @java LudiiStateWrapper.fullZobristHash()
   */
  public fullZobristHash(): bigint {
    return this.context.state().fullHash();
  }

  /**
   * Resets this game state back to an initial game state
   * @java LudiiStateWrapper.reset()
   */
  public reset(): void {
    const g = (this.game as unknown as { game: Game }).game;
    g.start(this.context);
  }

  /**
   * @return Array of legal Move objects
   * @java LudiiStateWrapper.legalMovesArray()
   */
  public legalMovesArray(): Move[] {
    const g = (this.game as unknown as { game: Game }).game;
    const moves = g.moves(this.context).moves();
    const result: Move[] = [];
    for (let i = 0; i < moves.size(); ++i) {
      result.push(moves.get(i));
    }
    return result;
  }

  /**
   * @return Array of indices for legal moves.
   * @java LudiiStateWrapper.legalMoveIndices()
   */
  public legalMoveIndices(): number[] {
    const g = (this.game as unknown as { game: Game }).game;
    const moves = g.moves(this.context).moves();
    const indices: number[] = new Array(moves.size());
    for (let i = 0; i < indices.length; ++i) {
      indices[i] = i;
    }
    return indices;
  }

  /**
   * @return Number of legal moves in current state
   * @java LudiiStateWrapper.numLegalMoves()
   */
  public numLegalMoves(): number {
    const g = (this.game as unknown as { game: Game }).game;
    return Math.max(1, g.moves(this.context).moves().size());
  }

  /**
   * @return Array of integers corresponding to moves that are legal in current game state.
   * @java LudiiStateWrapper.legalMoveInts()
   */
  public legalMoveInts(): number[] {
    const g = (this.game as unknown as { game: Game }).game;
    const moves = g.moves(this.context).moves();
    const moveInts = new Set<number>();

    for (let i = 0; i < moves.size(); ++i) {
      const toAdd = (this.game as unknown as { moveToInt(m: Move): number }).moveToInt(moves.get(i));
      moveInts.add(toAdd);
    }

    return Array.from(moveInts).sort((a, b) => a - b);
  }

  /**
   * @param player
   * @return Array of integers corresponding to moves that are legal in current
   * game state for the given player.
   * @java LudiiStateWrapper.legalMoveIntsPlayer(int)
   */
  public legalMoveIntsPlayer(player: number): number[] {
    const g = (this.game as unknown as { game: Game }).game;
    const legalMoves = this._getLegalMovesForPlayer(g, player);
    const moveInts = new Set<number>();

    for (let i = 0; i < legalMoves.size(); ++i) {
      const toAdd = (this.game as unknown as { moveToInt(m: Move): number }).moveToInt(legalMoves.get(i));
      moveInts.add(toAdd);
    }

    return Array.from(moveInts).sort((a, b) => a - b);
  }

  /**
   * @return Array with a length equal to the number of legal moves in current state.
   * Every element is an int array of size 3, containing [channel_idx, x, y].
   * @java LudiiStateWrapper.legalMovesTensors()
   */
  public legalMovesTensors(): number[][] {
    const g = (this.game as unknown as { game: Game }).game;
    const moves = g.moves(this.context).moves();
    const gw = this.game as unknown as {
      MOVE_PASS_CHANNEL_IDX: number;
      moveToTensor(m: Move): number[];
    };

    if (moves.size() === 0) {
      return [[gw.MOVE_PASS_CHANNEL_IDX, 0, 0]];
    } else {
      const movesTensors: number[][] = new Array(moves.size());
      for (let i = 0; i < moves.size(); ++i) {
        movesTensors[i] = gw.moveToTensor(moves.get(i));
      }
      return movesTensors;
    }
  }

  /**
   * Runs a random playout.
   * @java LudiiStateWrapper.runRandomPlayout()
   */
  public runRandomPlayout(): void {
    const g = (this.game as unknown as { game: Game }).game;
    g.playout(this.context, null, 0.0, null, 0, Math.random);
  }

  /**
   * Estimates a reward for a given player based on one or more random rollouts.
   * @param player
   * @param numRollouts
   * @param playoutCap Max number of random actions we'll select in playout
   * @return Estimated reward
   * @java LudiiStateWrapper.getRandomRolloutsReward(int, int, int)
   */
  public getRandomRolloutsReward(player: number, numRollouts: number, playoutCap: number): number {
    const g = (this.game as unknown as { game: Game }).game;
    let sumRewards = 0.0;

    for (let i = 0; i < numRollouts; ++i) {
      const copyContext = LudiiStateWrapper._makeTempContext(this.context);
      g.playout(copyContext, null, 0.1, null, playoutCap, Math.random);
      const returns = LudiiStateWrapper._agentUtilities(copyContext);
      sumRewards += returns[player + 1] ?? 0;
    }

    return sumRewards / numRollouts;
  }

  /**
   * @return Array of utilities in [-1, 1] for all players. Player index assumed to be 0-based!
   * @java LudiiStateWrapper.returns()
   */
  public returns(): number[] {
    if (!this.isTerminal())
      return new Array((this.game as unknown as { numPlayers(): number }).numPlayers()).fill(0);

    const returns = LudiiStateWrapper._agentUtilities(this.context);
    return returns.slice(1);
  }

  /**
   * @param player
   * @return The returns for given player (index assumed to be 0-based!).
   * @java LudiiStateWrapper.returns(int)
   */
  public returnsForPlayer(player: number): number {
    if (!this.isTerminal())
      return 0.0;

    const returns = LudiiStateWrapper._agentUtilities(this.context);
    return returns[player + 1] ?? 0;
  }

  /**
   * Undo the last move.
   * @java LudiiStateWrapper.undoLastMove()
   */
  public undoLastMove(): void {
    const g = (this.game as unknown as { game: Game }).game;
    const moves = this.context.trial().generateCompleteMovesList();
    this.reset();

    for (let i = this.context.trial().numInitialPlacementMoves(); i < moves.length - 1; ++i) {
      g.apply(this.context, moves[i]!);
    }
  }

  /**
   * @return A flat, 1D array tensor representation of the current game state
   * @java LudiiStateWrapper.toTensorFlat()
   */
  public toTensorFlat(): Float32Array {
    const g = (this.game as unknown as { game: Game }).game;
    const gw = this.game as unknown as {
      tensorCoordsX(): number[];
      tensorCoordsY(): number[];
      tensorDimX(): number;
      tensorDimY(): number;
      stateTensorNumChannels: number;
      allOnesChannelFlat(): Float32Array;
      containerPositionChannels(): Float32Array;
      NUM_STACK_CHANNELS: number;
      NUM_LOCAL_STATE_CHANNELS: number;
    };

    const containers = g.equipment().containers();
    const numPlayers = g.players().count();
    const numPieceTypes = g.equipment().components().length - 1;
    const stacking = g.isStacking();
    const usesCount = g.requiresCount();
    const usesAmount = g.requiresBet();
    const usesState = g.requiresLocalState();
    const usesSwap = g.metaRules().usesSwapRule();

    const xCoords = gw.tensorCoordsX();
    const yCoords = gw.tensorCoordsY();
    const tensorDimX = gw.tensorDimX();
    const tensorDimY = gw.tensorDimY();
    const numChannels = gw.stateTensorNumChannels;

    const flatTensor = new Float32Array(numChannels * tensorDimX * tensorDimY);

    let currentChannel = 0;

    if (!stacking) {
      // Just one channel per piece type
      const owned = this.context.state().owned();

      for (let e = 1; e <= numPieceTypes; ++e) {
        for (let p = 1; p <= numPlayers + 1; ++p) {
          const sites = owned.sites(p, e);
          for (let i = 0; i < sites.size(); ++i) {
            const site = sites.getQuick(i);
            flatTensor[yCoords[site]! + tensorDimY * (xCoords[site]! + (currentChannel * tensorDimX))] = 1.0;
          }
        }
        ++currentChannel;
      }
    } else {
      // Stacking
      const sitesFrom = g.equipment().sitesFrom();
      for (let c = 0; c < containers.length; ++c) {
        const cont = containers[c]!;
        const cs = this.context.state().containerStates()[c] as BaseContainerStateStacking;
        const contStartSite = sitesFrom[c]!;

        for (let site = 0; site < cont.numSites(); ++site) {
          const stackSize = cs.sizeStackCell(contStartSite + site);

          if (stackSize > 0) {
            // Store in channels for bottom NUM_STACK_CHANNELS/2 elements of stack
            for (let i = 0; i < gw.NUM_STACK_CHANNELS / 2; ++i) {
              if (i >= stackSize) break;
              const what = cs.whatCell(contStartSite + site, i);
              const channel = currentChannel + ((what - 1) * gw.NUM_STACK_CHANNELS + i);
              flatTensor[yCoords[contStartSite + site]! + tensorDimY * (xCoords[contStartSite + site]! + (channel * tensorDimX))] = 1.0;
            }

            // And same for top NUM_STACK_CHANNELS/2 elements
            for (let i = 0; i < gw.NUM_STACK_CHANNELS / 2; ++i) {
              if (i >= stackSize) break;
              const what = cs.whatCell(contStartSite + site, stackSize - 1 - i);
              const channel = currentChannel + ((what - 1) * gw.NUM_STACK_CHANNELS + (gw.NUM_STACK_CHANNELS / 2) + i);
              flatTensor[yCoords[contStartSite + site]! + tensorDimY * (xCoords[contStartSite + site]! + (channel * tensorDimX))] = 1.0;
            }

            // Height channel
            const channel = currentChannel + gw.NUM_STACK_CHANNELS * numPieceTypes;
            flatTensor[yCoords[contStartSite + site]! + tensorDimY * (xCoords[contStartSite + site]! + (channel * tensorDimX))] = stackSize;
          }
        }
      }
      // + 1 for stack size channel
      currentChannel += gw.NUM_STACK_CHANNELS * numPieceTypes + 1;
    }

    if (usesCount) {
      const sitesFrom = g.equipment().sitesFrom();
      for (let c = 0; c < containers.length; ++c) {
        const cont = containers[c]!;
        const cs = this.context.state().containerStates()[c]!;
        const contStartSite = sitesFrom[c]!;

        for (let site = 0; site < cont.numSites(); ++site) {
          flatTensor[yCoords[contStartSite + site]! + tensorDimY * (xCoords[contStartSite + site]! + (currentChannel * tensorDimX))] =
            cs.countCell(contStartSite + site);
        }
      }
      ++currentChannel;
    }

    if (usesAmount) {
      for (let p = 1; p <= numPlayers; ++p) {
        const amount = this.context.state().amount(p);
        const startFill = tensorDimY * currentChannel * tensorDimX;
        const endFill = startFill + (tensorDimY * tensorDimX);
        flatTensor.fill(amount, startFill, endFill);
        ++currentChannel;
      }
    }

    if (numPlayers > 1) {
      const mover = this.context.state().playerToAgent(this.context.state().mover());
      const startFill = tensorDimY * (currentChannel + mover - 1) * tensorDimX;
      const onesFlat = gw.allOnesChannelFlat();
      flatTensor.set(onesFlat, startFill);
      currentChannel += numPlayers;
    }

    if (usesState) {
      const sitesFrom = g.equipment().sitesFrom();
      for (let c = 0; c < containers.length; ++c) {
        const cont = containers[c]!;
        const contStartSite = sitesFrom[c]!;
        const cs = this.context.state().containerStates()[c]!;

        for (let site = 0; site < cont.numSites(); ++site) {
          const state = Math.min(cs.stateCell(contStartSite + site), gw.NUM_LOCAL_STATE_CHANNELS - 1);
          flatTensor[yCoords[contStartSite + site]! + tensorDimY * (xCoords[contStartSite + site]! + ((currentChannel + state) * tensorDimX))] = 1.0;
        }
      }
      currentChannel += gw.NUM_LOCAL_STATE_CHANNELS;
    }

    if (usesSwap) {
      if (this.context.state().orderHasChanged()) {
        const startFill = tensorDimY * currentChannel * tensorDimX;
        flatTensor.set(gw.allOnesChannelFlat(), startFill);
      }
      currentChannel += 1;
    }

    // Channels for whether or not positions exist in containers
    const startFill = tensorDimY * currentChannel * tensorDimX;
    flatTensor.set(gw.containerPositionChannels(), startFill);
    currentChannel += containers.length;

    // Channels marking from and to of last Move
    const trialMoves = this.trial.generateCompleteMovesList();
    if (trialMoves.length - this.trial.numInitialPlacementMoves() > 0) {
      const lastMove = trialMoves[trialMoves.length - 1]!;
      const from = lastMove.fromNonDecision();

      if (from !== OFF)
        flatTensor[yCoords[from]! + tensorDimY * (xCoords[from]! + (currentChannel * tensorDimX))] = 1.0;

      ++currentChannel;
      const to = lastMove.toNonDecision();

      if (to !== OFF)
        flatTensor[yCoords[to]! + tensorDimY * (xCoords[to]! + (currentChannel * tensorDimX))] = 1.0;

      ++currentChannel;
    } else {
      currentChannel += 2;
    }

    // And the same for move before last move
    if (trialMoves.length - this.trial.numInitialPlacementMoves() > 1) {
      const lastLastMove = trialMoves[trialMoves.length - 2]!;
      const from = lastLastMove.fromNonDecision();

      if (from !== OFF)
        flatTensor[yCoords[from]! + tensorDimY * (xCoords[from]! + (currentChannel * tensorDimX))] = 1.0;

      ++currentChannel;
      const to = lastLastMove.toNonDecision();

      if (to !== OFF)
        flatTensor[yCoords[to]! + tensorDimY * (xCoords[to]! + (currentChannel * tensorDimX))] = 1.0;

      ++currentChannel;
    } else {
      currentChannel += 2;
    }

    // Assert that we correctly ran through all channels
    console.assert(currentChannel === numChannels, "Channel count mismatch: " + currentChannel + " vs " + numChannels);

    return flatTensor;
  }

  /**
   * @return A single (3D) tensor representation of the current game state
   * @java LudiiStateWrapper.toTensor()
   */
  public toTensor(): Float32Array[][][] {
    const gw = this.game as unknown as {
      tensorDimX(): number;
      tensorDimY(): number;
      stateTensorNumChannels: number;
    };

    const tensorDimX = gw.tensorDimX();
    const tensorDimY = gw.tensorDimY();
    const numChannels = gw.stateTensorNumChannels;

    const flatTensor = this.toTensorFlat();
    const tensor: Float32Array[][][] = new Array(numChannels);

    for (let c = 0; c < numChannels; ++c) {
      tensor[c] = new Array(tensorDimX);
      for (let x = 0; x < tensorDimX; ++x) {
        tensor[c]![x] = flatTensor.subarray(
          tensorDimY * (x + (c * tensorDimX)),
          tensorDimY * (x + (c * tensorDimX)) + tensorDimY
        ) as unknown as Float32Array[];
      }
    }

    return tensor;
  }

  /**
   * @return The wrapped trial object
   * @java LudiiStateWrapper.trial()
   */
  public trialObj(): Trial {
    return this.trial;
  }

  //-------------------------------------------------------------------------

  /**
   * @java LudiiStateWrapper.toString()
   */
  public toString(): string {
    const sb: string[] = [];
    const state = this.context.state();

    sb.push("BEGIN LUDII STATE\n");

    sb.push("Mover colour = " + state.mover() + "\n");
    sb.push("Mover player/agent = " + state.playerToAgent(state.mover()) + "\n");
    sb.push("Next = " + state.next() + "\n");
    sb.push("Previous = " + state.prev() + "\n");

    for (let p = 1; p <= state.numPlayers(); ++p) {
      sb.push("Player " + p + " active = " + this.context.active(p) + "\n");
    }

    sb.push("State hash = " + state.stateHash() + "\n");

    const g = (this.game as unknown as { game: Game }).game;
    if (g.requiresScore()) {
      for (let p = 1; p <= state.numPlayers(); ++p) {
        sb.push("Player " + p + " score = " + this.context.score(p) + "\n");
      }
    }

    for (let p = 1; p <= state.numPlayers(); ++p) {
      sb.push("Player " + p + " ranking = " + this.context.trial().ranking()[p] + "\n");
    }

    for (let i = 0; i < state.containerStates().length; ++i) {
      const cs = state.containerStates()[i]!;
      sb.push("BEGIN CONTAINER STATE " + i + "\n");
      sb.push(cs.toString() + "\n");
      sb.push("END CONTAINER STATE " + i + "\n");
    }

    sb.push("END LUDII GAME STATE\n");

    return sb.join("");
  }

  //-------------------------------------------------------------------------
  // Escape-hatch stubs for not-yet-ported dependencies

  /** @java new Trial(Game) */
  private static _newTrial(_game: Game): Trial {
    return {} as unknown as Trial;
  }

  /** @java new Context(Game, Trial) */
  private static _newContext(_game: Game, _trial: Trial): Context {
    return {} as unknown as Context;
  }

  /** @java new Context(Context) */
  private static _copyContext(ctx: Context): Context {
    return ctx as unknown as Context;
  }

  /** @java new TempContext(Context) */
  private static _makeTempContext(ctx: Context): TempContext {
    return ctx as unknown as TempContext;
  }

  /** @java RankUtils.agentUtilities(Context) */
  private static _agentUtilities(_ctx: Context): number[] {
    return [];
  }

  /** Helper: get legal moves filtered by player for simultaneous move games */
  private _getLegalMovesForPlayer(g: Game, player: number): FastArrayList<Move> {
    const gw = this.game as unknown as { isSimultaneousMoveGame(): boolean };
    if (gw.isSimultaneousMoveGame()) {
      return LudiiStateWrapper._extractMovesForMover(g.moves(this.context).moves(), player + 1);
    } else {
      return g.moves(this.context).moves();
    }
  }

  /** @java AIUtils.extractMovesForMover(FastArrayList, int) */
  private static _extractMovesForMover(
    moves: FastArrayList<Move>,
    _player: number
  ): FastArrayList<Move> {
    // Escape hatch — AIUtils not yet ported in this batch
    return moves;
  }

  //-------------------------------------------------------------------------
}
