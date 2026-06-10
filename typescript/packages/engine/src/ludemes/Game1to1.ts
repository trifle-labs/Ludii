/**
 * @java game/Game.java Game (1:1 port subset)
 *
 * The core game object for the 1:1 Java→TS port.
 *
 * Supports placement, movement, and hand-based games, including phase games:
 *   - start(): builds the initial Context applying start rules
 *   - moves(ctx): generates legal moves via the current phase's play.eval(ctx)
 *   - apply(ctx, move): applies a move, checks end conditions, advances mover,
 *                       and runs phase-transition logic after every move.
 *   - over(ctx): true if the trial is over
 *
 * Phase logic mirrors Java Game.apply() / applyInternal():
 *   @java game/Game.java:3119–3141
 *   After applying the move (and checking end conditions), if the game has
 *   phases and the game is still active, iterate all players 1..numPlayers
 *   and evaluate their current phase's nextPhase conditions in order;
 *   the first condition whose eval != UNDEFINED fires and advances that
 *   player to the returned phase index.
 *
 * Per-phase end rules:
 *   @java game/Game.java:3061–3066
 *   Before evaluating the global end rule, evaluate the current mover's
 *   current phase's end rule (if present).
 *
 * Phase-aware move generation:
 *   @java game/Game.java:2850–2852
 *   For alternating-move games, look up phases[state.currentPhase(mover)].play.
 *
 * Start rules supported:
 *   (place "PieceName1" {sites...})          — place pieces at given sites
 *   (place "PieceName" "Hand" count:N)       — fill hand with N pieces
 *   (place "PieceName" coord)                — place piece at named coord
 *   (start (set Score ...))                  — no-op (scores default to 0)
 *
 * @java game/Game.java — create/start/moves/apply/over
 */

import { Context } from "../context.js";
import type { Game } from "../game.js";
import { Move } from "../move.js";
import { ActionPass } from "../action/action-pass.js";
import { ActionSwapPlayers } from "../action/action-swap-players.js";
import { ActionSetNextPlayer } from "../action/action-set-next-player.js";
import { ActionRemove } from "../action/action-remove.js";
import { State } from "../state.js";
import { Trial } from "../trial.js";

import type { Equipment1to1 } from "./game/equipment/Equipment1to1.js";
import { Mode1to1 } from "./game/mode/Mode1to1.js";
import { GamePlayers1to1 } from "./game/players/GamePlayers1to1.js";
import type { Rules1to1 } from "./game/rules/Rules1to1.js";
import type { Phase } from "./game/rules/phase/Phase.js";
import type { StartRule } from "./game/rules/start/StartRule.js";
import type { CellFlatRadials } from "./topology-radials.js";
import type { Trajectories } from "../eval/graph/trajectories.js";

// ---------------------------------------------------------------------------
// Extended context type for the 1:1 path
// ---------------------------------------------------------------------------

/**
 * A Context augmented with the radials table and eval-scratch.
 * The 1:1 ludemes access ctx._radials (board radials) and ctx._evalTo (pivot).
 * For graph boards, _trajectories is also attached for direction-aware queries.
 */
export type Context1to1 = Context & {
  _radials: readonly CellFlatRadials[];
  /** Graph Trajectories object for non-square boards; null for square boards. */
  _trajectories?: Trajectories | null;
};

function attachRadials(
  ctx: Context,
  radials: readonly CellFlatRadials[],
  trajectories?: Trajectories | null,
): Context1to1 {
  const c = ctx as Context1to1;
  c._radials = radials;
  c._trajectories = trajectories ?? null;
  c._evalTo = -1;
  c._evalFrom = -1;
  c._evalValue = 0;
  return c;
}

// Java constant: UNDEFINED = -1
const UNDEFINED = -1;

interface Game1to1PortOptions {
  readonly startRules?: readonly StartRule[];
  readonly notAllPass?: boolean;
  readonly usesSwapRule?: boolean;
  readonly playerDirs?: Map<number, number>;
}

const GAME_PORT_OPTIONS = new WeakMap<Rules1to1, Game1to1PortOptions>();

type GameBoardSurface = Equipment1to1["board"] & {
  getTracks?: () => readonly unknown[];
};

type GamePieceSurface = Equipment1to1["pieces"][number] & {
  readonly generator?: unknown;
};

type GameEquipmentSurface = Omit<Equipment1to1, "board" | "pieces"> & {
  readonly board: GameBoardSurface;
  readonly pieces: readonly GamePieceSurface[];
  createItems?: (game: unknown) => void;
  containers?: () => unknown[] | null;
  components?: () => unknown[] | null;
  maps?: () => unknown[] | null;
  sitesFrom?: () => number[] | null;
};

const COMPASS_IDX_GAME: Record<string, number> = {
  n: 0, ne: 1, e: 2, se: 3, s: 4, sw: 5, w: 6, nw: 7,
};

function equipmentNeedsCreate(equipment: GameEquipmentSurface): boolean {
  if (typeof equipment.createItems !== "function") return false;
  if (typeof equipment.containers === "function") return equipment.containers() === null;
  return false;
}

function prepareFaithfulEquipment(equipment: GameEquipmentSurface, players: GamePlayers1to1): void {
  if (!equipmentNeedsCreate(equipment)) return;

  const gameStub = {
    players: () => players,
    isDeductionPuzzle: () => false,
    hasSubgames: () => false,
    // @java Game.create() — Equipment.createItems(this), with track setup
    // delegated to the just-created main board when tracks are present.
    hasTrack: () => {
      try {
        return (equipment.board.getTracks?.().length ?? 0) > 0;
      } catch {
        return false;
      }
    },
    board: () => equipment.board,
    computeGameFlags: () => 0n,
  };

  equipment.createItems!(gameStub);
}

function startRulesFromRules(rules: Rules1to1): readonly StartRule[] {
  return rules.start?.rules ?? [];
}

function playerDirsFromPlayers(players: GamePlayers1to1): Map<number, number> | undefined {
  const dirs = new Map<number, number>();
  for (let pid = 1; pid <= players.count(); pid++) {
    const direction = players.get(pid)?.direction;
    if (direction === null || direction === undefined) continue;
    const dirIdx = COMPASS_IDX_GAME[direction.toLowerCase()];
    if (dirIdx !== undefined) dirs.set(pid, dirIdx);
  }
  return dirs.size > 0 ? dirs : undefined;
}

function staticMapsFromEquipment(equipment: GameEquipmentSurface): Map<string, Map<number, number>> | undefined {
  const pending = (equipment.board as unknown as { _pendingMaps?: Map<string, Map<number, number>> })._pendingMaps;
  if (pending && pending.size > 0) return pending;

  const rawMaps = typeof equipment.maps === "function" ? equipment.maps() : null;
  if (!Array.isArray(rawMaps) || rawMaps.length === 0) return undefined;

  const board = equipment.board as unknown as {
    containerSpan?: number; numSites?: number; width?: number; height?: number;
    topology?: unknown; topologyAdapter?: unknown;
  };
  const lastSite = (board.containerSpan ?? board.numSites ?? 0) - 1;
  // Map pairs may be (coord "A1")-style functions needing the board (Sittuyin/Tai
  // Shogi); Java computes maps with a real Context (@java Map.computeMap). Provide
  // an equipment-derived eval context instead of {}.
  const topo = board.topology ?? board.topologyAdapter ?? null;
  const evalCtx = {
    game: { width: board.width ?? 0, height: board.height ?? 0, equipment },
    board: () => equipment.board,
    topology: () => topo,
  };
  const result = new Map<string, Map<number, number>>();

  for (const item of rawMaps) {
    if (item === null || typeof item !== "object") continue;
    const mapItem = item as {
      name?: () => string | null;
      map?: () => ReadonlyMap<number, number>;
      _mapPairs?: readonly unknown[];
    };
    const entries = new Map<number, number>(mapItem.map?.() ?? []);
    for (const pair of mapItem._mapPairs ?? []) {
      const pairObj = pair as {
        getIntKey?: () => { eval(ctx: unknown): number };
        getIntValue?: () => { eval(ctx: unknown): number };
        landmark?: number | null;
      };
      let key = -1; let value = -1;
      try { key = pairObj.getIntKey?.().eval(evalCtx) ?? -1; } catch { key = -1; }
      if (key < 0) continue;
      try { value = pairObj.getIntValue?.().eval(evalCtx) ?? -1; } catch { value = -1; }
      if ((value < 0 || value === undefined) && pairObj.landmark !== null && pairObj.landmark !== undefined) {
        // @java LandmarkType.FirstSite / LastSite in Map.computeMap()
        if (pairObj.landmark === 5) value = 0;
        else if (pairObj.landmark === 6) value = lastSite;
      }
      if (value >= 0) entries.set(key, value);
    }
    const name = mapItem.name?.() ?? null;
    result.set(name === null || name === "Map" ? "__default__" : name, entries);
  }

  return result.size > 0 ? result : undefined;
}

// ---------------------------------------------------------------------------
// Game1to1
// ---------------------------------------------------------------------------

export class Game1to1 implements Game {
  /** @java Game.name */
  public readonly name: string;
  /** @java Game.id — same as name for 1:1 port */
  public readonly id: string;
  /** Number of players. @java Game.players().count() */
  public readonly numPlayers: number;
  /** @java Game.board().width() */
  public readonly width: number;
  /** @java Game.board().height() */
  public readonly height: number;
  /** @java Game.numSites() */
  public readonly numSites: number;
  /** Players record. @java Game.players */
  private readonly playersRecord: GamePlayers1to1;
  /** Mode record. @java Game.mode */
  private readonly modeRecord: Mode1to1;
  /** Equipment (board + pieces + hands). */
  public readonly equipment: GameEquipmentSurface;
  /** Rules (play + end + optional phases). */
  public readonly rules: Rules1to1;
  /** Optional start rules. @java game/rules/start/StartRules.java */
  public readonly startRules: readonly StartRule[];

  /**
   * Whether the game uses explicit (move Pass) ludemes.
   * When true, the all-pass draw heuristic is disabled.
   *
   * @java game/rules/play/moves/nonDecision/effect/Pass.java — gameFlags |= GameType.NotAllPass
   * @java game/Game.java:requiresAllPass() — returns false when NotAllPass is set
   */
  public readonly notAllPass: boolean;

  /**
   * Whether the game uses the swap (pie) rule: `(meta (swap))`.
   * When true, on P2's first move, a SwapPlayers decision move is added.
   *
   * @java game/rules/meta/Swap.java — Swap.apply(context, legalMoves)
   * @java game/Game.java:2855 — calls Swap.apply after generating regular moves
   */
  public readonly usesSwapRule: boolean;

  /** Component labels array (index 0 unused, 1-based). */
  private readonly componentLabels: string[];

  /**
   * Static map table for (mapEntry ...) lookups.
   * Keys: map name (or "__default__"), values: player-id→site-id maps.
   * @java game/equipment/other/Map.java — Equipment.maps()
   */
  public readonly _maps?: Map<string, Map<number, number>>;

  /**
   * Per-player facing direction (0-indexed 45°-units: 0=N, 1=NE, 2=E, 3=SE,
   * 4=S, 5=SW, 6=W, 7=NW). Only set when (players {(player SE) ...}) form is
   * used; absent → default N/S for P1/P2.
   * @java game/players/Player.java — Direction.direction()
   */
  public readonly _playerDirs?: Map<number, number>;

  /**
   * Carries TS-port-only construction details that are not Java Game constructor
   * parameters. The next Game1to1 constructed with these Rules consumes them.
   */
  public static setPortOptions(rules: Rules1to1, options: Game1to1PortOptions): void {
    GAME_PORT_OPTIONS.set(rules, options);
  }

  public constructor(
    name: string,
    players: GamePlayers1to1 | null,
    mode: Mode1to1 | null,
    equipment: GameEquipmentSurface,
    rules: Rules1to1,
  ) {
    this.name = name;
    this.id = name;
    this.playersRecord = players ?? GamePlayers1to1.fromCount(2);
    this.numPlayers = this.playersRecord.count();
    if (this.numPlayers === 0) {
      this.modeRecord = new Mode1to1("Simulation");
    } else if (this.numPlayers === 1) {
      this.modeRecord = new Mode1to1("Alternating");
    } else if (mode !== null && mode !== undefined) {
      this.modeRecord = mode;
    } else {
      this.modeRecord = new Mode1to1("Alternating");
    }
    prepareFaithfulEquipment(equipment, this.playersRecord);
    this.equipment = equipment;
    this.rules = rules;
    const portOptions = GAME_PORT_OPTIONS.get(rules);
    GAME_PORT_OPTIONS.delete(rules);
    this.startRules = portOptions?.startRules ?? startRulesFromRules(rules);
    this.notAllPass = portOptions?.notAllPass ?? false;
    this.usesSwapRule = portOptions?.usesSwapRule ?? false;
    this.width = equipment.board.width;
    this.height = equipment.board.height;
    this.numSites = equipment.board.numSites;

    // Build component labels: [unused, piece1label, piece2label, ...]
    // @java Game.componentLabels() — used to populate State.componentLabels
    const maxComponentIndex = equipment.pieces.reduce((max, piece) => Math.max(max, piece.index), 0);
    this.componentLabels = new Array(maxComponentIndex + 1).fill("");
    for (const piece of equipment.pieces) {
      this.componentLabels[piece.index] = `${piece.name}${piece.owner}`;
    }

    // Extract static map table from equipment (compiled from (map ...) equipment items).
    // @java game/equipment/other/Map.java — Equipment.maps() lookup table
    const staticMaps = staticMapsFromEquipment(equipment);
    if (staticMaps && staticMaps.size > 0) {
      this._maps = staticMaps;
    }

    // Store per-player facing directions (from (players {(player SE) ...})).
    const playerDirs = portOptions?.playerDirs ?? playerDirsFromPlayers(this.playersRecord);
    if (playerDirs && playerDirs.size > 0) {
      this._playerDirs = playerDirs;
    }
  }

  /**
   * @java Game.players()
   */
  public players(): GamePlayers1to1 {
    return this.playersRecord;
  }

  /**
   * @java Game.mode()
   */
  public mode(): Mode1to1 {
    return this.modeRecord;
  }

  /**
   * @java game/Game.java — start(context)
   *
   * Returns the initial Context for a new game. Applies start rules to
   * set up the initial board position.
   */
  public start(): Context {
    // Use totalSites to include hand slots in the state.
    const totalSites = this.equipment.totalSites;
    const cells = new Array<number>(totalSites).fill(0);
    const whats = new Array<number>(totalSites).fill(0);
    const countAt = new Array<number>(totalSites).fill(0);
    // Per-site state and value arrays (from state:N / value:N in place rules).
    // @java ActionAdd.apply() — setStateAt / setValueAt on the initial container state.
    const stateAt = new Array<number>(totalSites).fill(0);
    const valueAt = new Array<number>(totalSites).fill(0);

    // Apply start rules.
    // @java game/Game.java — start(): applies ActionAdd for each start placement
    for (const rule of this.startRules) {
      this.applyStartRule(rule, cells, whats, countAt, stateAt, valueAt);
    }

    // Check if any non-zero stateAt/valueAt were set (to avoid allocating sparse arrays).
    const hasNonZeroState = stateAt.some(v => v !== 0);
    const hasNonZeroValue = valueAt.some(v => v !== 0);

    // Compute initial phase indices for each player.
    // @java other/state/State.java — initPhase(game)
    // For each player, scan phases in order and assign the first matching one:
    //   - phase.ownerPlayerId === pid → assign that phase
    //   - phase.ownerPlayerId === 0 (Shared) → assign that phase
    const initialPhases = new Array(this.numPlayers + 1).fill(0);
    if (this.rules.phases !== null) {
      const phases = this.rules.phases;
      for (let pid = 1; pid <= this.numPlayers; pid++) {
        for (let idx = 0; idx < phases.length; idx++) {
          const phase = phases[idx]!;
          const owner = phase.ownerPlayerId;
          if (owner === pid || owner === 0) {
            initialPhases[pid] = idx;
            break;
          }
        }
      }
    }

    // Initialize diceValues: one slot per die, pre-filled with 0 so
    // ActionUpdateDice dice-value mode can write to diceValues[i].
    // @java Game.java — start() initialises currentDice containers to 0.
    const numDice = this.equipment.diceSpecs.length;
    const initialDiceValues = numDice > 0 ? new Array(numDice).fill(0) : undefined;

    let state = new State(1, cells, this.componentLabels, {
      numPlayers: this.numPlayers,
      whats,
      countAt,
      phases: initialPhases,
      diceValues: initialDiceValues,
      stateAt: hasNonZeroState ? stateAt : undefined,
      valueAt: hasNonZeroValue ? valueAt : undefined,
    });

    // Apply remembered-value start rules (from (set RememberValue "name" <region>)).
    // @java game/rules/start/set/remember/SetRememberValue.java — eval() calls ActionRememberValue.apply()
    const initRemembered = (this.equipment as unknown as { _initialRemembered?: Map<string, number[]> })._initialRemembered;
    if (initRemembered) {
      for (const [key, values] of initRemembered) {
        for (const v of values) {
          state = state.withRemember(key, v);
        }
      }
    }

    // Apply hidden-info start rules (from (set Hidden ... to:P1)).
    // @java game/rules/start/set/hidden/SetHidden.java — eval() calls ActionSetHidden.apply()
    const initHidden = (this.equipment as unknown as { _initialHidden?: Map<string, boolean> })._initialHidden;
    if (initHidden) {
      for (const [key, val] of initHidden) {
        const colonIdx = key.indexOf(':');
        const pidStr = key.slice(0, colonIdx);
        const siteStr = key.slice(colonIdx + 1);
        const pid = Number(pidStr);
        const site = Number(siteStr);
        if (pid >= 0 && pid < this.numPlayers + 1 && site >= 0 && site < totalSites) {
          state = state.withHidden(pid, site, val);
        }
      }
    }

    const trial = new Trial([], false, -1);

    // Populate trial._startingPos: for each piece type (component index), record its initial sites.
    // @java game/Game.java — start() → context.trial().startingPos() populated by Add.apply()
    // In Java, ActionAdd.apply() adds each start site to trial.startingPos[componentIndex].
    // Here we reconstruct it from the initial cells/whats arrays post start-rule application.
    // This is needed for (sites Start (piece ...)) in defines like InitialPawnMove.
    {
      const startingPos: number[][] = [];
      for (let site = 0; site < whats.length; site++) {
        const what = whats[site]!;
        if (what > 0) {
          // Ensure array is long enough
          while (startingPos.length <= what) startingPos.push([]);
          startingPos[what]!.push(site);
        }
      }
      trial._startingPos = startingPos;
    }

    const ctx = new Context(this, state, trial);

    return attachRadials(ctx, this.equipment.board.radials, this.equipment.board.trajectories);
  }

  /**
   * @java game/Game.java — moves(context)
   *
   * Returns legal moves for the current state.
   *
   * For phase games: uses phases[state.currentPhase(mover)].play.
   * @java game/Game.java:2849–2852
   *
   * If no moves are available, returns a single forced-pass move
   * (Java's stalemated player behaviour).
   */
  public moves(context: Context): readonly Move[] {
    const ctx = context as Context1to1;
    // Ensure radials are always attached (survives withRng/withState copies).
    ctx._radials = ctx._radials ?? this.equipment.board.radials;
    ctx._trajectories = ctx._trajectories ?? this.equipment.board.trajectories;
    ctx._evalTo = -1;
    ctx._evalFrom = -1;
    ctx._evalValue = 0;

    const movesGen = this.getPlayForMover(ctx);
    const generated: Move[] = [...movesGen.moves.eval(ctx)];

    // @java game/Game.java:2855 — Swap.apply(context, legalMoves)
    // @java game/rules/meta/Swap.java:apply — fires when usesSwapRule() &&
    //   trial.moveNumber() == game.players().count() - 1 (i.e. P2's first move).
    if (
      this.usesSwapRule &&
      ctx.trial.numMoves === this.numPlayers - 1
    ) {
      const mover = ctx.state.mover;
      const moverLastTurn = ctx.trial.lastTurnMover(mover);
      if (moverLastTurn !== -1 && moverLastTurn !== mover) {
        // Build the SwapPlayers move: ActionSwap(pid1=mover, pid2=lastTurnMover)
        // with decision=true, plus ActionSetNextPlayer(mover) to keep the same mover.
        // @java game/rules/play/moves/nonDecision/effect/state/swap/players/SwapPlayers.java:eval()
        const swapAction = new ActionSwapPlayers(mover, moverLastTurn);
        swapAction.setDecision(true);
        const setNextAction = new ActionSetNextPlayer(mover);
        const swapMove = new Move({
          id: "swap-players",
          label: "Swap",
          siteIndices: [],
          mover,
          placedOwner: mover,
          actions: [swapAction, setNextAction],
        });
        generated.push(swapMove);
      }
    }

    if (generated.length > 0) {
      return generated;
    }

    // Stalemated: emit a forced pass.
    // @java Game.java — forced pass when no legal moves
    const passAction = new ActionPass();
    const passMove = new Move({
      id: "pass",
      label: "Pass",
      siteIndices: [0], // dummy site; Pass move is valid
      mover: ctx.state.mover,
      placedOwner: ctx.state.mover,
      actions: [passAction],
    });
    return [passMove];
  }

  /**
   * @java game/Game.java — apply(context, move)
   *
   * Applies a move and returns the new Context.
   *
   * Play loop (mirroring Java Game.apply / applyInternal):
   *   1. Apply move actions to state.
   *   2. Set _evalTo to move.to() for end-rule evaluation.
   *   3a. Evaluate per-phase end rule (if game has phases).   @java 3061–3066
   *   3b. Evaluate global end rules.
   *   4. If not over, check all-pass draw.
   *   5. If still active, evaluate nextPhase conditions for all players.  @java 3119–3141
   *   6. Advance mover (rotate).
   *   7. Update stalemated flag for new mover.
   *   8. Record move in trial.
   */
  public apply(context: Context, move: Move): Context {
    if (context.over) {
      throw new Error("Cannot apply a move to a finished game.");
    }

    const mover = context.state.mover;

    // Step 1: Clear pending state then apply move actions.
    // @java Game.java:3047 — state.rebootPending() before every move.apply()
    // This ensures each apply() starts with a clean pending set; ActionSetPending
    // in the current move may re-add to it.
    let newState = move.applyTo(context.state.withPendingClear(), context.rng);

    // Step 1b: Flush deferred (at:EndOfTurn) captures when the turn ENDS.
    // Java parity: Move.apply() lines 544-591 — when !containsReplayAction (turn ends),
    // applies ActionRemove for each site in sitesToRemove, then calls reInitCapturedPiece().
    // @java Core/src/other/move/Move.java lines 544-591
    {
      const setNextActEarly = move.actions.find(a => a.actionType() === "SetNextPlayer");
      const turningOver = !move.moveAgain && !(setNextActEarly !== undefined && setNextActEarly.who() === mover);
      if (turningOver && newState.sitesToRemove.length > 0) {
        // Remove all deferred capture sites.
        for (const site of newState.sitesToRemove) {
          if (!newState.isEmptySite(site)) {
            newState = new ActionRemove({ to: site }).apply(newState);
          }
        }
        newState = newState.withClearedSitesToRemove();
      } else if (!turningOver) {
        // Turn continues: keep sitesToRemove for the next hop (it's ToClear)
      }
    }

    // Step 2: Build eval context with the move recorded.
    // Set _evalTo so IsLine's (through: LastTo) resolves to the placed site.
    const evalTrial = context.trial.withMove(move, false, -1);
    const evalCtx = new Context(this, newState, evalTrial, context.rng) as Context1to1;
    evalCtx._radials = (context as Context1to1)._radials ?? this.equipment.board.radials;
    evalCtx._trajectories = (context as Context1to1)._trajectories ?? this.equipment.board.trajectories;
    evalCtx._evalTo = move.to();
    evalCtx._evalFrom = move.from();
    evalCtx._evalValue = 0;

    // Step 3a: Evaluate per-phase end rule.
    // @java game/Game.java:3061–3066 — end rule of current phase for mover
    let over = false;
    let winner = -1;
    let ranking: readonly number[] | undefined;

    if (this.rules.phases !== null) {
      const phaseIdx = newState.phase(mover);
      const phases = this.rules.phases;
      if (phaseIdx >= 0 && phaseIdx < phases.length) {
        const phaseEnd = phases[phaseIdx]!.end;
        if (phaseEnd !== null) {
          const phaseEndResult = phaseEnd.eval(evalCtx);
          if (phaseEndResult !== null && phaseEndResult.over) {
            over = true;
            winner = phaseEndResult.winner;
            ranking = phaseEndResult.ranking;
          }
        }
      }
    }

    // Step 3b: Evaluate global end rules.
    if (!over && this.rules.end !== null) {
      const endResult = this.rules.end.eval(evalCtx);
      if (endResult !== null && endResult.over) {
        over = true;
        winner = endResult.winner;
        ranking = endResult.ranking;
      }
    }

    // Step 4: All-pass draw.
    // @java game/Game.java:End.eval — only fires if requiresAllPass() (i.e. no explicit (move Pass))
    // @java game/rules/play/moves/nonDecision/effect/Pass.java — sets GameType.NotAllPass flag
    if (!over && !this.notAllPass && this.allPassed(evalTrial)) {
      over = true;
      winner = 0; // draw
    }

    const setNextAct = move.actions.find(a => a.actionType() === "SetNextPlayer");
    const willContinueTurn = move.moveAgain || (setNextAct !== undefined && setNextAct.who() === mover);

    // Step 5: Phase transitions (only when game is still active).
    // @java game/Game.java:3117–3141
    // "We update the current Phase for each player if this is a game with phases."
    // NOTE: Java always evaluates phase transitions, even during moveAgain. The TS
    // previously deferred them to prevent Placement→Movement flip during Morris
    // mill removals, but that broke Nerenchi Keliya where the moveAgain causes
    // a Movement→Capture transition. Java's SameTurn check handles the Morris
    // case correctly without deferral. @java Game.java:3119-3141
    let stateAfterPhase = newState;
    if (!over && this.rules.phases !== null) {
      const phases = this.rules.phases;
      for (let pid = 1; pid <= this.numPlayers; pid++) {
        const currentPhaseIdx = stateAfterPhase.phase(pid);
        if (currentPhaseIdx < 0 || currentPhaseIdx >= phases.length) continue;
        const currentPhase = phases[currentPhaseIdx]!;

        for (const np of currentPhase.nextPhases) {
          // @java NextPhase.who().eval(context): who == players.count()+1 means Shared/All
          const whoVal = np.who.eval(evalCtx);
          const isShared = whoVal === this.numPlayers + 1;
          if (!isShared && pid !== whoVal) continue;

          // @java NextPhase.eval(context): returns targetPhaseIdx or UNDEFINED
          if (np.cond.eval(evalCtx)) {
            // Resolve target index
            let targetIdx: number;
            if (np.targetName === null) {
              // Wrap to next in list
              targetIdx = (currentPhaseIdx + 1) % phases.length;
            } else {
              targetIdx = np.targetIndex;
            }
            if (targetIdx !== UNDEFINED && targetIdx !== currentPhaseIdx) {
              stateAfterPhase = stateAfterPhase.withPhase(pid, targetIdx);
            }
            break; // first firing condition wins
          }
        }
      }
    }

    // Step 6: Advance mover.
    // @java game/Game.java:3193–3206 — rotate mover unless move.moveAgain or
    // the current move includes an ActionSetNextPlayer that overrides the player.
    //
    // Key: only use state.next if it was SET by the CURRENT MOVE's actions.
    // This avoids picking up a stale next-player from a previous (then (moveAgain)).
    let advanced = stateAfterPhase;
    if (!over) {
      // Find the ActionSetNextPlayer in the current move's actions, if any.
      // @java Game.java:3195 — the "next" override from ActionSetNextPlayer
      const setNextAction = move.actions.find(a => a.actionType() === "SetNextPlayer");
      const dynamicNextOverride: number = setNextAction ? setNextAction.who() : 0;

      let nextMover: number;
      if (move.moveAgain) {
        // Static (then (moveAgain)) flag: keep the same player.
        // The ActionSetNextPlayer(mover) we added also sets next=mover (same).
        nextMover = newState.mover;
      } else if (dynamicNextOverride > 0) {
        // Dynamic ActionSetNextPlayer from current move's effects.
        nextMover = dynamicNextOverride;
      } else {
        nextMover = (newState.mover % this.numPlayers) + 1;
      }
      advanced = advanced.withMover(nextMover);
      // Always clear state.next after consumption.
      // @java ludeme-game.ts — advanced = phased.withMover(nextMover).withNext(0)
      advanced = advanced.withNext(0);
      if (nextMover !== newState.mover) {
        // @java Game.java:3200 — bump numTurn when player changes
        advanced = advanced.withNewTurn();
      }
      // Increment counter (Java: state.incrCounter())
      advanced = advanced.withCounter(advanced.counter + 1);
    } else {
      // Still increment counter even when over.
      advanced = advanced.withCounter(advanced.counter + 1);
    }

    // Step 7: Update stalemated flag for the new mover.
    // @java Game.java — computeStalemated: called after advancing the mover
    // so that (no Moves Next) can read the correct cached value.
    if (!over) {
      advanced = this.computeStalemated(advanced, evalCtx);
    }

    // Step 8: Record move in trial.
    const finalWinner = over ? winner : -1;
    let trial = context.trial.withMove(move, over, finalWinner);
    if (ranking !== undefined) trial = trial.withRanking(ranking);
    trial = trial.saveState(advanced);

    const newCtx = new Context(this, advanced, trial, context.rng) as Context1to1;
    newCtx._radials = (context as Context1to1)._radials ?? this.equipment.board.radials;
    newCtx._trajectories = (context as Context1to1)._trajectories ?? this.equipment.board.trajectories;
    newCtx._evalTo = -1;
    newCtx._evalFrom = -1;
    newCtx._evalValue = 0;
    return newCtx;
  }

  /** @java game/Game.java — over(context). Returns context.over. */
  public over(context: Context): boolean {
    return context.over;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Apply either the existing TS start-rule surface or a faithful Java-style
   * StartRule with eval(Context).
   * @java game/rules/start/Start.java — eval(Context)
   */
  private applyStartRule(
    rule: StartRule,
    cells: number[],
    whats: number[],
    countAt: number[],
    stateAt: number[],
    valueAt: number[],
  ): void {
    const maybeArrayRule = rule as unknown as {
      applyToInitialState?: (
        cells: number[],
        whats: number[],
        countAt: number[],
        equipment: GameEquipmentSurface,
        numPlayers: number,
        stateAt?: number[],
        valueAt?: number[],
      ) => void;
      eval?: (ctx: Context) => void;
    };

    if (typeof maybeArrayRule.applyToInitialState === "function") {
      maybeArrayRule.applyToInitialState(cells, whats, countAt, this.equipment, this.numPlayers, stateAt, valueAt);
      return;
    }

    if (typeof maybeArrayRule.eval !== "function") return;

    const state = new State(1, cells, this.componentLabels, {
      numPlayers: this.numPlayers,
      whats,
      countAt,
      stateAt,
      valueAt,
    });
    const trial = new Trial([], false, -1);
    const ctx = new Context(this.startGameFacade(), state, trial) as Context & {
      placePieces?: (
        site: number,
        what: number,
        count: number,
        state: number,
        rotation: number,
        value: number,
        onStack: boolean,
        type: string | null,
      ) => void;
    };

    // Attach the board's trajectories/radials so Sites* region evals (Row/Left/Right/...)
    // resolve on the start-rule bridge context exactly as they do in play.
    (ctx as unknown as { _trajectories?: unknown })._trajectories = this.equipment.board.trajectories;
    (ctx as unknown as { _radials?: unknown })._radials = this.equipment.board.radials;
    ctx.placePieces = (site, what, count, stateValue, _rotation, value, _onStack, _type) => {
      if (site < 0 || site >= cells.length) return;
      const component = this.equipment.componentAt(what);
      const owner = component?.owner ?? 0;
      cells[site] = owner;
      whats[site] = what;
      countAt[site] = count;
      if (stateValue !== UNDEFINED) stateAt[site] = stateValue;
      if (value !== UNDEFINED) valueAt[site] = value;
    };
    const topologyAdapter = {
      neighbours: (site: number, _siteType: string | null): number[] => {
        const cellRadials = this.equipment.board.radials[site];
        if (cellRadials === undefined) return [];
        const out: number[] = [];
        for (const axis of cellRadials.axes) {
          const a = axis.ray[1];
          const b = axis.opposite[1];
          if (a !== undefined) out.push(a);
          if (b !== undefined) out.push(b);
        }
        return out;
      },
      top: (_siteType: string): Array<{ index(): number }> => {
        const start = (this.equipment.board.height - 1) * this.equipment.board.width;
        return Array.from({ length: this.equipment.board.width }, (_, i) => ({ index: () => start + i }));
      },
      bottom: (_siteType: string): Array<{ index(): number }> =>
        Array.from({ length: this.equipment.board.width }, (_, i) => ({ index: () => i })),
    };
    // Only shadow Context.topology()/containers() with the synthetic adapter when the
    // board has NO faithful topology — otherwise the real Context methods (which resolve
    // via the faithful Board topology, with real labels/rows) must stay visible. The
    // shadowing collapsed start-rule regions like El Perro's
    // (intersection (union (sites Left)(sites Right)) (sites Row 2)) to empty.
    const boardHasFaithfulTopology = typeof (this.equipment.board as unknown as { topology?: () => unknown }).topology === "function";
    if (!boardHasFaithfulTopology) {
      (ctx as unknown as { containers: () => Array<{ topology: () => typeof topologyAdapter }> }).containers = () => [
        { topology: () => topologyAdapter },
      ];
      (ctx as unknown as { topology: () => typeof topologyAdapter }).topology = () => topologyAdapter;
    }

    const placeItem = maybeArrayRule as unknown as {
      constructor?: { name?: string };
      item?: string;
      siteId?: { eval(ctx: Context): unknown } | null;
      countFn?: { eval(ctx: Context): number };
      stateFn?: { eval(ctx: Context): number };
      valueFn?: { eval(ctx: Context): number };
      region?: unknown;
      locationIds?: unknown;
      coords?: unknown;
      countsFn?: unknown;
    };
    if (
      placeItem.constructor?.name === "PlaceItem" &&
      typeof placeItem.item === "string" &&
      placeItem.siteId != null &&
      placeItem.region == null &&
      placeItem.locationIds == null &&
      placeItem.coords == null &&
      placeItem.countsFn == null
    ) {
      const sites = placeItem.siteId.eval(ctx);
      if (Array.isArray(sites)) {
        const component = this.componentByName(placeItem.item);
        if (component !== null) {
          const what = component.index();
          const count = placeItem.countFn?.eval(ctx) ?? 1;
          const stateValue = placeItem.stateFn?.eval(ctx) ?? UNDEFINED;
          const value = placeItem.valueFn?.eval(ctx) ?? UNDEFINED;
          const placementSites = sites.length > 0
            ? sites
            : this.facingStartStripSites(placeItem.item);
          for (const site of placementSites) {
            if (typeof site !== "number") continue;
            ctx.placePieces?.(site, what, count, stateValue, UNDEFINED, value, false, null);
          }
        }
        return;
      }
    }

    maybeArrayRule.eval(ctx);
  }

  private facingStartStripSites(item: string): number[] {
    const suffix = item.match(/(\d+)$/);
    if (!suffix) return [];
    const owner = Number(suffix[1]);
    const dir = this._playerDirs?.get(owner);
    const width = this.equipment.board.width;
    const height = this.equipment.board.height;
    if (width <= 0 || height <= 0) return [];

    if (dir === 0) {
      return Array.from({ length: Math.min(2, height) * width }, (_, site) => site);
    }
    if (dir === 4) {
      const rows = Math.min(2, height);
      const start = (height - rows) * width;
      return Array.from({ length: rows * width }, (_, i) => start + i);
    }
    return [];
  }

  /**
   * Minimal Java Game facade for faithful start-rule eval().
   * @java game/Game.java — getComponent/mapContainer/equipment/players
   */
  private startGameFacade(): Game {
    const game = this;
    const equipmentCallable = new Proxy(
      function equipmentFn() { return game.equipment; },
      {
        get(_target, prop) {
          return (game.equipment as unknown as Record<PropertyKey, unknown>)[prop];
        },
      },
    );

    return new Proxy(this as unknown as Record<PropertyKey, unknown>, {
      get(target, prop) {
        if (prop === "equipment") return equipmentCallable;
        if (prop === "players") return () => game.playersRecord;
        if (prop === "isDeductionPuzzle") return () => false;
        if (prop === "getComponent") return (name: string) => game.componentByName(name);
        if (prop === "mapContainer") return () => game.containerMap();
        return target[prop];
      },
    }) as unknown as Game;
  }

  private componentByName(name: string): { index(): number; role(): { equals(role: string): boolean } } | null {
    const direct = this.equipment.pieces.find((piece) => `${piece.name}${piece.owner}` === name);
    const suffix = name.match(/^(.*?)(\d+)$/);
    const bySuffix = suffix
      ? this.equipment.pieces.find((piece) => piece.name === suffix[1] && piece.owner === Number(suffix[2]))
      : undefined;
    const byName = this.equipment.pieces.find((piece) => piece.name === name);
    const piece = direct ?? bySuffix ?? byName;
    if (piece === undefined) return null;
    const role = piece.owner === 0 ? "Neutral" : `P${piece.owner}`;
    return {
      index: () => piece.index,
      role: () => ({ equals: (r: string) => r === role }),
    };
  }

  private containerMap(): Map<string, { index(): number; numSites(): number }> {
    const out = new Map<string, { index(): number; numSites(): number }>();
    const containers = this.equipment.containers?.() ?? [];
    for (const container of containers) {
      const c = container as {
        name?: () => string | null;
        index?: () => number;
        numSites?: () => number;
        getNumSites?: () => number;
      };
      const name = c.name?.();
      if (name === null || name === undefined) continue;
      out.set(name, {
        index: () => c.index?.() ?? 0,
        numSites: () => c.numSites?.() ?? c.getNumSites?.() ?? 0,
      });
    }
    return out;
  }

  /**
   * Return the play rules for the current mover.
   *
   * For phase games: looks up phases[state.currentPhase(mover)].play.
   * @java game/Game.java:2849–2852 — indexPhase = state.currentPhase(mover)
   *
   * For bare games: returns rules.play.
   */
  private getPlayForMover(ctx: Context1to1): Rules1to1["play"] {
    if (this.rules.phases !== null) {
      const mover = ctx.state.mover;
      const phaseIdx = ctx.state.phase(mover);
      const phases = this.rules.phases;
      if (phaseIdx >= 0 && phaseIdx < phases.length) {
        return phases[phaseIdx]!.play;
      }
      // Fallback to phase 0 if index out of range
      return phases[0]!.play;
    }
    return this.rules.play;
  }

  /**
   * Detect all-pass draw: if the last `numPlayers` moves in the trial are all
   * forced passes, the game is a draw.
   *
   * @java game/Game.java — allPassed (End.eval implicit draw for no-pass games)
   */
  private allPassed(trial: Trial): boolean {
    const moves = trial.moves;
    const n = this.numPlayers;
    if (moves.length < n) return false;
    for (let i = moves.length - 1; i >= moves.length - n; i--) {
      const m = moves[i];
      if (!m || !m.isPass()) return false;
    }
    return true;
  }

  /**
   * Update the stalemated flag for the new mover.
   * @java Game.java — computeStalemated(Context)
   *
   * Temporarily builds a context for the new mover and checks if they have
   * any legal moves. Updates state.stalemated[newMover] accordingly.
   *
   * IMPORTANT: Uses a CLONED rng so that dice rolling during the stalemated
   * check does NOT advance the real RNG. Java's applyInternal does NOT call
   * computeStalemated on every apply — it only does so lazily (when a pass is
   * played without the stalemated flag being set). In the TS 1:1 path we call
   * it eagerly but MUST isolate the RNG so that race/escape games (which roll
   * dice in (do (roll) next:...)) don't consume extra RNG values here and
   * desync the dice sequence for the next real move.
   * @java game/Game.java:3044 — computeStalemated called only on unexpected pass
   */
  private computeStalemated(state: State, baseCtx: Context1to1): State {
    const newMover = state.mover;
    // Build a temporary context for the new mover to check for legal moves.
    // Clone the RNG so that (roll) inside the stalemated check does NOT consume
    // values from the real RNG stream — Java's Do.eval() in the stalemated path
    // operates on a TempContext with its own cloned RNG state, so dice rolled
    // here must not advance the authoritative RNG.
    const tempTrial = baseCtx.trial;
    const clonedRng = baseCtx.rng.clone();
    const tempCtx = new Context(this, state, tempTrial, clonedRng) as Context1to1;
    tempCtx._radials = baseCtx._radials;
    tempCtx._trajectories = baseCtx._trajectories;
    tempCtx._evalTo = -1;
    tempCtx._evalFrom = -1;
    tempCtx._evalValue = 0;

    const playForMover = this.getPlayForMover(tempCtx);
    const legalMoves = playForMover.moves.eval(tempCtx);
    const isStalemated = legalMoves.length === 0;

    return state.withStalemated(newMover, isStalemated);
  }
}
