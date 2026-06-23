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
import type { Game as EngineGame } from "../game.js";
import { Move } from "../move.js";
import { SeededRng } from "../rng.js";
import { ActionPass } from "../action/action-pass.js";
import { ActionSwapPlayers } from "../action/action-swap-players.js";
import { ActionSetNextPlayer } from "../action/action-set-next-player.js";
import { ActionRemove } from "../action/action-remove.js";
import { Gravity } from "./game/rules/meta/Gravity.js";
import { SetTeam } from "./game/rules/start/set/players/SetTeam.js";
import type { Action } from "../action/index.js";
import { evalDeferredThens } from "./game/rules/play/moves/nonDecision/effect/Then.js";
import { State } from "../state.js";
import { Trial } from "../trial.js";
import { buildTrackLocToIndex, buildInitialOnTrackIndices } from "../on-track-indices.js";

import type { EquipmentSurface } from "./game/equipment/EquipmentSurface.js";
import { Mode } from "./game/mode/Mode.js";
import { GamePlayers } from "./game/players/GamePlayers.js";
import type { Rules } from "./game/rules/Rules.js";
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

const GAME_PORT_OPTIONS = new WeakMap<Rules, Game1to1PortOptions>();

type GameBoardSurface = EquipmentSurface["board"] & {
  getTracks?: () => readonly unknown[];
};

type GamePieceSurface = EquipmentSurface["pieces"][number] & {
  readonly generator?: unknown;
};

type GameEquipmentSurface = Omit<EquipmentSurface, "board" | "pieces"> & {
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

function prepareFaithfulEquipment(equipment: GameEquipmentSurface, players: GamePlayers): void {
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

function startRulesFromRules(rules: Rules): readonly StartRule[] {
  return rules.start?.rules ?? [];
}

function playerDirsFromPlayers(players: GamePlayers): Map<number, number> | undefined {
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

  // @java Game.create — equipment.maps()[i].computeMap(this): the faithful
  // computeMap resolves string coordinates via SiteFinder against the board
  // topology and component names against the components list (Ashtapada's
  // (map "Entry" {(pair P1 "D1") …})). Run it before reading the table.
  const boardForMap = equipment.board as unknown as {
    topology?: () => unknown;
    defaultSite?: (() => string) | string;
  };
  const gameForMap = {
    board: () => ({
      defaultSite: () => (typeof boardForMap.defaultSite === "function"
        ? boardForMap.defaultSite()
        : (boardForMap.defaultSite ?? "Cell")),
      topology: () => boardForMap.topology?.(),
    }),
    equipment: () => ({
      components: () => [null, ...equipment.pieces.map((p) => ({ name: () => `${p.name}` }))],
    }),
  };

  for (const item of rawMaps) {
    if (item === null || typeof item !== "object") continue;
    const mapItem = item as {
      name?: () => string | null;
      map?: () => ReadonlyMap<number, number>;
      _mapPairs?: readonly unknown[];
      computeMap?: (game: unknown) => void;
    };
    if (typeof mapItem.computeMap === "function" && typeof boardForMap.topology === "function") {
      try { mapItem.computeMap(gameForMap); } catch { /* fall through to the pair loop */ }
    }
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
// Game
// ---------------------------------------------------------------------------

export class Game implements Game {
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
  private readonly playersRecord: GamePlayers;
  /** Mode record. @java Game.mode */
  private readonly modeRecord: Mode;
  /** Equipment (board + pieces + hands). */
  public readonly equipment: GameEquipmentSurface;
  /** Rules (play + end + optional phases). */
  public readonly rules: Rules;
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

  /**
   * Whether the game uses the pyramidal-drop gravity meta-rule:
   * `(meta (gravity))`. When true, after every move any ball that is not
   * fully supported falls one step `Downward` into an empty support pocket,
   * repeating until the board is stable (Shibumi family: Spline+, Spought…).
   *
   * @java game/rules/meta/Gravity.java — Gravity.apply(context, move)
   *   appends the drop actions as a `then` of the generated move. Because the
   *   replay harness matches by the player's DECISION (from/to) and only the
   *   resulting board state feeds the next ply, applying the same drops
   *   post-hoc in {@link apply} yields the identical board.
   */
  public readonly usesGravity: boolean;

  /**
   * Team membership: `teamOf[pid]` is the 1-based team index of player `pid`,
   * or 0 if the player is on no team. Harvested from the `(set Team …)` start
   * rules (which fix membership at game start). Used to resolve RoleType.Team*
   * (TeamMover/TeamNext) in end/no-pieces rules.
   * @java other/state/State.java — getTeam(pid) / ActionAddPlayerToTeam
   */
  public readonly teamOf: readonly number[];

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
   * parameters. The next Game constructed with these Rules consumes them.
   */
  public static setPortOptions(rules: Rules, options: Game1to1PortOptions): void {
    GAME_PORT_OPTIONS.set(rules, options);
  }

  public constructor(
    name: string,
    players: GamePlayers | null,
    mode: Mode | null,
    equipment: GameEquipmentSurface,
    rules: Rules,
  ) {
    this.name = name;
    this.id = name;
    this.playersRecord = players ?? GamePlayers.fromCount(2);
    this.numPlayers = this.playersRecord.count();
    if (this.numPlayers === 0) {
      this.modeRecord = new Mode("Simulation");
    } else if (this.numPlayers === 1) {
      this.modeRecord = new Mode("Alternating");
    } else if (mode !== null && mode !== undefined) {
      this.modeRecord = mode;
    } else {
      this.modeRecord = new Mode("Alternating");
    }
    prepareFaithfulEquipment(equipment, this.playersRecord);
    this.equipment = equipment;
    this.rules = rules;
    const portOptions = GAME_PORT_OPTIONS.get(rules);
    GAME_PORT_OPTIONS.delete(rules);
    this.startRules = portOptions?.startRules ?? startRulesFromRules(rules);
    // @java Game.java:1397-1398 — `if (hasHandDice()) flags |= GameType.NotAllPass;`
    // Dice games never end by implicit all-pass draw (Dubblets records two
    // consecutive passes mid-game and plays on). The portOptions flag carries
    // the other Java sources (Pass.java:79, (passEnd NoEnd), PlayCard,
    // SetTrumpSuit, AllPassed).
    const hasHandDice = equipment.pieces.some(p => /^Die\d*$/.test(p.name));
    this.notAllPass = (portOptions?.notAllPass ?? false) || hasHandDice;
    this.usesSwapRule = portOptions?.usesSwapRule ?? false;
    // @java Gravity.eval — context.game().metaRules().setGravityType(type).
    // We detect the meta-rule directly off the compiled rules tree instead of
    // a portOption: any (meta (gravity …)) enables pyramidal drop in apply().
    this.usesGravity = (rules.meta?.rules ?? []).some(r => r instanceof Gravity);
    // @java SetTeam.eval — ActionAddPlayerToTeam(teamId, pid). Harvest the
    // static team membership from the (set Team …) start rules.
    {
      const teams: number[] = [];
      for (const sr of this.startRules) {
        if (sr instanceof SetTeam) {
          for (const pid of sr.players()) teams[pid] = sr.team();
        }
      }
      this.teamOf = teams;
    }
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

    // Facing tables for relative-direction resolution ("set by the game
    // compiler" per eval-context.ts; the bespoke compiler used to do this).
    // @java Component.getDirn() (componentFacing, indexed by what id) and
    // (player <Dir>) declarations (playerFacing, 1-based). A piece's own facing
    // overrides its owner's; Dodgem's Cars face E/N with no player facings.
    {
      const boardAny = this.equipment.board as unknown as {
        componentFacing?: (string | undefined)[];
        playerFacing?: (string | undefined)[];
      };
      const compFacing: (string | undefined)[] = [];
      for (const p of this.equipment.pieces) {
        const dirn = (p as unknown as { dirn?: string }).dirn;
        if (dirn !== undefined) compFacing[p.index] = dirn;
      }
      if (compFacing.some((v) => v !== undefined)) boardAny.componentFacing = compFacing;
      const pf: (string | undefined)[] = [];
      for (let pid = 1; pid <= this.numPlayers; pid++) {
        const direction = this.playersRecord.get(pid)?.direction;
        if (direction !== null && direction !== undefined) pf[pid] = direction;
      }
      if (pf.some((v) => v !== undefined)) boardAny.playerFacing = pf;
    }
  }

  /**
   * @java Game.handDice() — the list of Dice containers.
   * Our equipment model keeps per-die specs (diceSpecs) + a base site
   * (diceSiteBase); Java's typical (dice d:N num:M) is ONE container with M
   * locs. Container index = 1 + number of hands (board=0, hands, dice).
   */
  public handDice(): Array<{ index(): number; getNumFaces(): number; numLocs(): number }> {
    const specs = this.equipment.diceSpecs;
    if (specs.length === 0) return [];
    const idx = 1 + this.equipment.hands.length;
    const numFaces = specs[0]?.faces.length ?? 6;
    return [{ index: () => idx, getNumFaces: () => numFaces, numLocs: () => specs.length }];
  }

  /** @java Game.getHandDice(int) */
  public getHandDice(i: number): { index(): number; getNumFaces(): number; numLocs(): number } {
    return this.handDice()[i]!;
  }

  /**
   * @java Game.getMaxMoveLimit() — returns maxMovesLimit (default
   * Constants.DEFAULT_MOVES_LIMIT = 10000). Used by (value MoveLimit) and the
   * MoveLimit end check; its absence threw "getMaxMoveLimit is not a function"
   * (Ludus Coriovalli). Matches the 10000 bound already used in apply()'s
   * Step 4b move-limit draw.
   */
  public getMaxMoveLimit(): number {
    return 10000;
  }

  /**
   * @java Equipment.sitesFrom() — base site index per container:
   * [0 (board), hand bases..., dice base].
   */
  public sitesFrom(): number[] {
    const out: number[] = [0];
    for (const hand of this.equipment.hands) {
      out.push(this.equipment.handSiteFor(hand.owner, 0));
    }
    if (this.equipment.diceSpecs.length > 0) out.push(this.equipment.diceSiteBase);
    return out;
  }

  /**
   * @java Game.java:930 — `(gameFlags & GameType.InternalLoopInTrack) != 0L`
   * True when any board track has an internal loop (Pachisi / Ludo / Barjis /
   * Kints family): a track where the same site appears at two different ring
   * positions, so `(trackSite Move …)` must use `OnTrackIndices` to
   * disambiguate which ring-iteration the piece is currently on.
   */
  public hasInternalLoopInTrack(): boolean {
    const rawTracks = this.equipment.board.getTracks?.() ?? [];
    return (rawTracks as unknown as Array<{ hasInternalLoop?: () => boolean }>)
      .some(t => t.hasInternalLoop?.() === true);
  }

  /**
   * @java Game.players()
   */
  public players(): GamePlayers {
    return this.playersRecord;
  }

  /**
   * @java Game.mode()
   */
  public mode(): Mode {
    return this.modeRecord;
  }

  /** @java Game.voteStringsTable — registry of vote/proposition strings. */
  private readonly _voteStringsTable: string[] = [];

  /**
   * @java Game.registerVoteString — returns the int index of a vote string,
   * registering it on first sight. Crucial that registered indices are >= 0:
   * (is Decided "End") compares state.isDecided() (UNDEFINED=-1 until a vote
   * resolves) against this index; a -1 index made every mancala agree-to-end
   * rule fire on move 1 (Oware and ~70 two_rows kin ended as instant draws).
   */
  public registerVoteString(voteString: string): number {
    const existing = this._voteStringsTable.indexOf(voteString);
    if (existing >= 0) return existing;
    this._voteStringsTable.push(voteString);
    return this._voteStringsTable.length - 1;
  }

  /**
   * @java game/Game.java — start(context)
   *
   * Returns the initial Context for a new game. Applies start rules to
   * set up the initial board position.
   */
  public start(startRng?: SeededRng): Context {
    // Use totalSites to include hand slots in the state.
    const totalSites = this.equipment.totalSites;
    const cells = new Array<number>(totalSites).fill(0);
    const whats = new Array<number>(totalSites).fill(0);
    const countAt = new Array<number>(totalSites).fill(0);
    // Dual-SiteType staging (@java per-type ContainerStates): start placements
    // whose explicit type differs from the play type (Guerrilla Checkers'
    // Cell pieces on a Vertex-play board) land here, keyed by type name.
    const typedStaging = new Map<string, { who: number[]; what: number[]; count: number[] }>();
    // @java Start.placePieces(onStack=true) is a repeated ActionAdd(onStacking):
    // each (place Stack ...) on an already-stacked site PUSHES a new level
    // (Seesaw starts Hex+Disc as a two-piece custom stack). Levels beyond the
    // first stage here and replay as stack pushes after State construction;
    // the first level keeps the flat path (count-based monotonous stacks).
    const stackedStaging = new Map<number, Array<{ what: number; owner: number; count: number; state: number; value: number }>>();
    // Per-site state and value arrays (from state:N / value:N in place rules).
    // @java ActionAdd.apply() — setStateAt / setValueAt on the initial container state.
    const stateAt = new Array<number>(totalSites).fill(0);
    const valueAt = new Array<number>(totalSites).fill(0);
    // Player-level start values (from (set Score ...) / (set Amount ...) rules).
    // @java State.scores / State.amounts — initialised by ActionSetScore/SetAmount.
    const scores = new Array<number>(this.numPlayers + 1).fill(0);
    const amounts = new Array<number>(this.numPlayers + 1).fill(0);
    // Bridge-owned start collections (STATE CONVERGENCE chunk 4 — the equipment
    // side-channels fold into these; rules write via the ContainerState facade).
    const startRemembered = new Map<string, number[]>();
    const startHidden = new Map<string, boolean>();

    // Place the die components at the dice container sites (@java Equipment
    // create: each Die occupies its container loc; Roll reads what(loc) there).
    // The Die components are REAL pieces (the recorded trials place what=1,2 at
    // the dice sites) — use their actual component ids.
    if (this.equipment.diceSpecs.length > 0) {
      const dieIds = this.equipment.pieces
        .filter((p) => /^Die\d*$/.test(p.name) || (p as unknown as { isDie?: () => boolean }).isDie?.() === true)
        .map((p) => p.index);
      for (let i = 0; i < this.equipment.diceSpecs.length; i++) {
        const loc = this.equipment.diceSiteBase + i;
        if (loc < whats.length && dieIds[i] !== undefined) whats[loc] = dieIds[i]!;
      }
    }

    // Apply start rules.
    // @java game/Game.java — start(): applies ActionAdd for each start placement
    for (const rule of this.startRules) {
      this.applyStartRule(rule, cells, whats, countAt, stateAt, valueAt, scores, amounts, startRemembered, startHidden, typedStaging, stackedStaging, startRng);
    }

    // Check if any non-zero stateAt/valueAt were set (to avoid allocating sparse arrays).
    const hasNonZeroState = stateAt.some(v => v !== 0);
    const hasNonZeroValue = valueAt.some(v => v !== 0);
    const hasNonZeroScores = scores.some(v => v !== 0);
    const hasNonZeroAmounts = amounts.some(v => v !== 0);

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
      scores: hasNonZeroScores ? scores : undefined,
      amounts: hasNonZeroAmounts ? amounts : undefined,
      typedSites: typedStaging.size > 0 ? typedStaging : undefined,
      // @java GameType.Stacking — compiled-tree flag (play1to1 harvest).
      stackingGame: (this as unknown as { usesStacking?: boolean }).usesStacking === true || undefined,
      stackMovesGame: (this as unknown as { usesStackMoves?: boolean }).usesStackMoves === true || undefined,
    });

    // @java ActionAdd.apply (onStacking) — replay staged level-2+ start
    // placements as stack pushes (withStackPush backfills level 0 from the
    // flat write; withOwnedAdd no-ops until the owned registry materializes).
    for (const [site, levels] of stackedStaging) {
      for (let li = 1; li < levels.length; li += 1) {
        const lv = levels[li]!;
        if (lv.owner < 1) continue;
        for (let c = 0; c < Math.max(1, lv.count); c += 1) {
          state = state.withStackPush(site, lv.owner, lv.what);
          state = state.withOwnedAdd(lv.owner, lv.what, site, state.stackSize(site) - 1);
          if (lv.state !== UNDEFINED) state = state.withStateAt(site, lv.state);
        }
      }
    }

    // Apply remembered-value start rules (from (set RememberValue "name" <region>)).
    // @java game/rules/start/set/remember/SetRememberValue.java — eval() calls ActionRememberValue.apply()
    if (startRemembered.size > 0) {
      for (const [key, values] of startRemembered) {
        for (const v of values) {
          state = state.withRemember(key, v);
        }
      }
    }

    // Apply hidden-info start rules (from (set Hidden ... to:P1)).
    // @java game/rules/start/set/hidden/SetHidden.java — eval() calls ActionSetHidden.apply()
    if (startHidden.size > 0) {
      for (const [key, val] of startHidden) {
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

    // @java State.java:496 — OnTrackIndices allocated only when the game has an
    // internal-loop track (Pachisi / Ludo / Barjis / Kints family). Java sets
    // GameType.InternalLoopInTrack in Game.create() when any track reports
    // hasInternalLoop(), then State.<init>:496 conditionally news up the
    // OnTrackIndices. Here we initialise after start rules so whats[] is final.
    if (this.hasInternalLoopInTrack()) {
      const rawTracks = this.equipment.board.getTracks?.() ?? [];
      type TrackLike = {
        hasInternalLoop(): boolean;
        elems(): Array<{ site: number }> | null;
        trackIdx(): number;
        islooped(): boolean;
        name(): string;
        owner(): number;
      };
      const mancalaTracks = (rawTracks as unknown as TrackLike[]).map(t => ({
        name: t.name(),
        sites: (t.elems() ?? []).map(e => e.site),
        loop: t.islooped(),
        owner: t.owner(),
        trackIdx: t.trackIdx(),
        internalLoop: t.hasInternalLoop(),
      }));
      const tli = buildTrackLocToIndex(mancalaTracks);
      if (tli !== undefined) {
        // @java ActionAdd.java onTrackIndices block — scans ALL container sites
        // (board + hands + off-board start piles) because Pachisi-family tracks
        // begin at sites beyond board.numSites (e.g. Kints site 46 is the
        // player-1 start pile, still the first track element). Use totalSites
        // rather than board.numSites so those start-pile pieces are counted.
        const oti = buildInitialOnTrackIndices(
          mancalaTracks,
          tli,
          this.componentLabels.length,
          // Read the TOP piece of each site via state.whatAtSite (not the local
          // whats[] which, after (place Stack …) starts, still holds the BOTTOM
          // piece). TrackSiteMove later looks up OTI by the top piece's
          // component, so the init must agree (Tugi-Epfe stacked start).
          (site) => state.whatAtSite(site),
          (site) => countAt[site] ?? 0,
          this.equipment.totalSites,
        );
        state = state.withTrackIndices(oti, tli);
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

    // @java Game.java:2948 — context.state().setStalemated(mover,
    // legalMoves.moves().isEmpty()): the stalemated flag is a CACHE written
    // during REAL move generation (with the real roll), read by
    // (no Moves <player>). Eagerly recomputing it per-apply with a
    // hypothetical roll flagged dice games stalemated whenever the sampled
    // roll had no moves (Cab e Quinal drew at ply 4). Mutate in place —
    // cache semantics, like Java.
    {
      const flags = ctx.state.stalemated as boolean[];
      flags[ctx.state.mover] = generated.length === 0;
    }

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
  /**
   * Pyramidal-drop gravity: faithful port of Gravity.apply's inner loop.
   *
   * @java game/rules/meta/Gravity.java:81-109 — `do { … } while (pieceDropped)`
   *   For each occupied Vertex (ascending id), take the first `Downward`
   *   neighbour that is empty and relocate the ball there (an ActionMove from
   *   level 0 to level 0); restart the full scan after every single drop.
   *   The Java loop bounds on topology.vertices().size(); for a vertex board
   *   that equals the board site count.
   */
  private applyPyramidalDrop(
    state: State,
    traj: { steps(site: number, dir: string): number[] } | null | undefined,
  ): State {
    if (!traj || typeof traj.steps !== "function") return state;
    const n = this.equipment.board.numSites;
    let newState = state;
    let pieceDropped = true;
    // Guard against pathological cycles (a ball can only ever move strictly
    // downward, so the board count bounds the total number of drops).
    let guard = n * n + 1;
    while (pieceDropped && guard-- > 0) {
      pieceDropped = false;
      for (let site = 0; site < n; site++) {
        if (newState.whatAtSite(site) === 0) continue;
        // @java steps(Vertex, site, Vertex, Downward) — supports below `site`.
        const downward = traj.steps(site, "Downward");
        for (const toSite of downward) {
          if (toSite < 0 || toSite >= n) continue;
          if (newState.whatAtSite(toSite) !== 0) continue;
          // @java ActionMove.construct(Vertex, site, 0, Vertex, toSite, 0, …)
          // — relocate the whole ball (owner + what + count) one pocket down.
          const who = newState.who(site);
          const what = newState.whatAtSite(site);
          const cnt = newState.countAtSite(site);
          newState = newState
            .withCell(site, 0).withWhatAt(site, 0).withCountAt(site, 0)
            .withCell(toSite, who).withWhatAt(toSite, what)
            .withCountAt(toSite, cnt > 0 ? cnt : 1);
          pieceDropped = true;
          break;
        }
        if (pieceDropped) break;
      }
    }
    return newState;
  }

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

    // Step 1a: Evaluate deferred (then …) consequences against the post-move
    // state and fold their actions + moveAgain into the applied move.
    // @java Core/src/other/move/Move.java:apply — actions apply first, then
    // each entry of then() is evaluated in the post-move context and its
    // moves applied (recursively). The trial records the realised move with
    // the consequence actions appended (cf. recorded trials: the moveAgain
    // SetNextPlayer is the LAST action of the move).
    let appliedMove = move;
    if (move.deferredThens.length > 0) {
      const folded = this.applyDeferredThens(context, newState, move);
      newState = folded.state;
      appliedMove = folded.move;
    }

    // Step 1b: Flush deferred (at:EndOfTurn) captures when the turn ENDS.
    // Java parity: Move.apply() lines 544-591 — when !containsReplayAction (turn ends),
    // applies ActionRemove for each site in sitesToRemove, then calls reInitCapturedPiece().
    // @java Core/src/other/move/Move.java lines 544-591
    {
      const setNextActEarly = appliedMove.actions.find(a => a.actionType() === "SetNextPlayer");
      const turningOver = !appliedMove.moveAgain && !(setNextActEarly !== undefined && setNextActEarly.who() === mover);
      if (turningOver && newState.sitesToRemove.length > 0) {
        if (process.env.TRACE_FLUSH) console.error(`[flush] sitesToRemove=${JSON.stringify([...newState.sitesToRemove])} ply=${(globalThis as Record<string, unknown>).__PLY}`);
        if (newState.ownedEntries !== undefined) {
          // @java Move.java:549-575 (stacking branch) — count queue entries
          // per site, clamp to the CURRENT stack size, then apply level
          // removes top-down. The clamp + FullOwned's decrement loop is what
          // strands Java's stale owned ghosts (Fenix) — port verbatim.
          const counts = new Map<number, number>();
          for (const site of newState.sitesToRemove) counts.set(site, (counts.get(site) ?? 0) + 1);
          for (const [site, queued] of [...counts.entries()].sort((a, b) => a[0] - b[0])) {
            const numToRemove = Math.min(queued, newState.stackSize(site));
            // ORACLE-EMPIRICAL (Update 169): the RUNNING binary applies the
            // level removes ASCENDING (ghost signature: board [2,2]->[] with
            // owned L0 surviving); Core/src reads descending — trust javap/
            // observables over source.
            for (let level = 0; level < numToRemove; level++) {
              const sz = newState.stacks[site]?.length ?? 0;
              const flatOccupied = sz === 0 && newState.who(site) > 0;
              if (sz === 0 && !(flatOccupied && level === 0)) continue;
              // @java cs.remove CLAMPS an out-of-range level to the top (the
              // ascending pass shrinks the stack under the recorded levels;
              // the board still empties — only Owned, matching by ORIGINAL
              // level, strands the ghost). Skipping here left a live piece.
              const readLvl = level < sz ? level : Math.max(0, sz - 1);
              const own = sz > 0 ? newState.stackAt(site, readLvl) : newState.who(site);
              const wht = sz > 0 ? newState.whatAtSiteLevel(site, readLvl) : newState.whatAtSite(site);
              if (own <= 0) continue;
              newState = newState.withOwnedRemoveLevel(own, wht, site, level);
              if (sz > 0) {
                newState = newState.withStackPop(site, level);
                // @java cs.remove maintains the site count; withStackPop
                // doesn't — a start-placed countAt=1 would survive the pop
                // and keep (is Empty) false forever (Fenix ghost count).
                if (newState.stackSize(site) === 0 && newState.countAtSite(site) > 0) {
                  newState = newState.withCountAt(site, 0);
                }
              } else {
                newState = newState.withCell(site, 0).withWhatAt(site, 0);
                if (newState.countAtSite(site) > 0) newState = newState.withCountAt(site, 0);
              }
            }
          }
        } else {
          // Remove all deferred capture sites.
          for (const site of newState.sitesToRemove) {
            if (!newState.isEmptySite(site)) {
              newState = new ActionRemove({ to: site }).apply(newState);
            }
          }
        }
        newState = newState.withClearedSitesToRemove();
      } else if (!turningOver) {
        // Turn continues: keep sitesToRemove for the next hop (it's ToClear)
      }
    }

    // Step 1c: Pyramidal-drop gravity. After the move's own actions have
    // settled, any unsupported ball falls one step Downward into an empty
    // support pocket, repeating until stable.
    // @java game/rules/meta/Gravity.java — Gravity.apply(context, move)
    if (this.usesGravity) {
      const traj = (context as Context1to1)._trajectories ?? this.equipment.board.trajectories;
      newState = this.applyPyramidalDrop(newState, traj);
    }

    // Step 2: Build eval context with the move recorded.
    // Set _evalTo so IsLine's (through: LastTo) resolves to the placed site.
    const evalTrial = context.trial.withMove(appliedMove, false, -1);
    // @java Game.java — the end rule is evaluated with state.next() ALREADY at
    // the upcoming mover (setMoverAndImpliedPrevAndNext). Our State otherwise
    // carries next=0 until Step 6 advances, so RoleType.Next / the (next) ludeme
    // resolved to 0 inside the end rule: the chaturanga/shatranj Checkmate def's
    //   (can Move (do (forEach Piece Next) ifAfterwards:(not ("IsInCheck" K Next))))
    // iterated player 0 (no pieces) → no escape → a FALSE checkmate fired the
    // instant the opponent was in check (Saxun/Shatranj at-Tamma/Tepong/Krida/
    // Rumi Shatranj ended mid-game instead of playing on). Stamp the implied next
    // onto the END-EVAL state ONLY, mirroring Step 6's nextMover.
    //
    // DICE GUARD: skip this for games with hand dice. There the end rule's
    // opponent move generation (forEach Piece Next) consumes RNG during
    // GENERATION (a separate latent issue), which would desync the recorded die
    // roll on the next ply (Shatranj al-Mustatila is a dice shatranj). Leaving
    // next=0 for dice games preserves their prior behaviour exactly — no
    // regression — until the RNG-during-generation bug is fixed in its own pass.
    let endEvalState = newState;
    if (this.handDice().length === 0 && !(newState.next && newState.next > 0)) {
      const endSetNext = appliedMove.actions.find(a => a.actionType() === "SetNextPlayer");
      const endNextOverride = endSetNext ? endSetNext.who() : 0;
      const endImpliedNext = appliedMove.moveAgain
        ? newState.mover
        : (endNextOverride > 0 ? endNextOverride : (newState.mover % this.numPlayers) + 1);
      endEvalState = newState.withNext(endImpliedNext);
    }
    const evalCtx = new Context(this, endEvalState, evalTrial, context.rng) as Context1to1;
    evalCtx._radials = (context as Context1to1)._radials ?? this.equipment.board.radials;
    evalCtx._trajectories = (context as Context1to1)._trajectories ?? this.equipment.board.trajectories;
    evalCtx._evalTo = appliedMove.to();
    evalCtx._evalFrom = appliedMove.from();
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

    // Step 4: All-pass draw is now handled faithfully INSIDE End.eval
    // (End.ts — @java End.java:113); firing it here unconditionally drew
    // phases that have no (end …) but a (nextPhase (all Passed) …) transition.
    void this.allPassed;

    // Step 4b: Turn/move limits.
    // @java game/Game.java:3075,3764 — checkMaxTurns(context): the game ends as a
    // DRAW (winner 0, EndType TurnLimit/MoveLimit) when
    //   state.numTurn() >= DEFAULT_TURN_LIMIT(1250) * numPlayers, or
    //   trial.numMoves() - numInitialPlacementMoves >= DEFAULT_MOVES_LIMIT(10000).
    // Our trial records only decision moves, so numMoves compares directly.
    if (!over) {
      const numTurn = (newState as unknown as { numTurn?: number }).numTurn ?? 1;
      const numMoves = evalTrial.moves.length;
      if (numTurn >= 1250 * this.numPlayers || numMoves >= 10000) {
        over = true;
        winner = 0; // draw
      }
    }

    const setNextAct = appliedMove.actions.find(a => a.actionType() === "SetNextPlayer");
    const willContinueTurn = appliedMove.moveAgain || (setNextAct !== undefined && setNextAct.who() === mover);

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
      const setNextAction = appliedMove.actions.find(a => a.actionType() === "SetNextPlayer");
      const dynamicNextOverride: number = setNextAction ? setNextAction.who() : 0;

      let nextMover: number;
      if (appliedMove.moveAgain) {
        // Static (then (moveAgain)) flag: keep the same player.
        // The ActionSetNextPlayer(mover) we added also sets next=mover (same).
        nextMover = newState.mover;
      } else if (dynamicNextOverride > 0) {
        // Dynamic ActionSetNextPlayer from current move's effects.
        nextMover = dynamicNextOverride;
      } else {
        nextMover = (newState.mover % this.numPlayers) + 1;
      }
      // @java Game.java:3200 — state.setPrev(mover) before mover advances.
      // (value Player Prev) / MaxMoves' prev==mover replay check read this.
      advanced = advanced.withPrev(newState.mover);
      advanced = advanced.withMover(nextMover);
      // Always clear state.next after consumption.
      // @java ludeme-game.ts — advanced = phased.withMover(nextMover).withNext(0)
      advanced = advanced.withNext(0);
      if (nextMover !== newState.mover) {
        // @java Game.java:3207 reinitNumTurnSamePlayer() — new turn: bump
        // numTurn, reset the same-player move counter.
        advanced = advanced.withNewTurn().withNumTurnSamePlayer(0);
        // @java Game.java:3183-3186 — turn passes: clear the visited scratch.
        advanced = advanced.withVisitedCleared();
      } else {
        // @java Game.java:3205 incrementNumTurnSamePlayer() — same player
        // moves again ((count MovesThisTurn) reads this).
        advanced = advanced.withNumTurnSamePlayer(advanced.numTurnSamePlayer + 1);
        // @java Game.java:3188-3193 — relay continues: visit the applied
        // move's endpoints ((not (is Visited (to))) gates Fanorona chains).
        advanced = advanced.withVisited(appliedMove.from(), appliedMove.to());
      }
      if (process.env.TRACE_TURNCNT) {
        console.error(`[turncnt] ply=${(globalThis as Record<string, unknown>).__PLY} mover=${newState.mover} next=${nextMover} cnt=${advanced.numTurnSamePlayer}`);
      }
      // Increment counter (Java: state.incrCounter())
      advanced = advanced.withCounter(advanced.counter + 1);
    } else {
      // @java Game.java:3112-3114 — !context.active(): state.setPrev(mover).
      advanced = advanced.withPrev(newState.mover);
      // Still increment counter even when over.
      advanced = advanced.withCounter(advanced.counter + 1);
    }

    // Step 7 (removed): Java does NOT eagerly compute the new mover's
    // stalemated flag on apply — the flag is a cache written by real move
    // generation (Game.java:2948; see Game.moves above). NoMoves(Next)
    // computes its own temporary check (@java NoMoves.java autoFail path).

    // Step 8: Record move in trial.
    const finalWinner = over ? winner : -1;
    let trial = context.trial.withMove(appliedMove, over, finalWinner);
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

  /**
   * Evaluate a move's deferred `(then …)` clauses against the post-move state.
   * @java Core/src/other/move/Move.java:apply — after the move's actions
   * apply, each Moves in then() is evaluated in the post-move context (the
   * move already on the trial) and every generated move is applied in order,
   * recursing into ITS then() list. The consequence actions are appended to
   * the realised move (recorded trials show e.g. the moveAgain SetNextPlayer
   * as the move's last action) and are never decision actions.
   */
  private applyDeferredThens(
    context: Context,
    postState: State,
    move: Move,
  ): { state: State; move: Move } {
    // Make sure the topology scratch is visible to the consequence subtree
    // even when the incoming context predates it.
    const src = context as Context1to1;
    src._radials = src._radials ?? this.equipment.board.radials;
    src._trajectories = src._trajectories ?? this.equipment.board.trajectories;
    // @java the applied move's endpoints are VISITED before its consequences
    // evaluate (oracle-proven on Fanorona: the chain probe's (not (is Visited
    // (to))) sees {from, to}; the turn-pass reInit later clears them).
    const preVisited = postState.withVisited(move.from(), move.to());
    const { state, extraActions, moveAgain } = evalDeferredThens(context, preVisited, move);
    if (extraActions.length === 0 && moveAgain === move.moveAgain) return { state, move };
    return { state, move: move.withConsequence(extraActions as Action[], moveAgain) };
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
    scores?: number[],
    amounts?: number[],
    startRemembered?: Map<string, number[]>,
    startHidden?: Map<string, boolean>,
    typedStaging?: Map<string, { who: number[]; what: number[]; count: number[] }>,
    stackedStaging?: Map<number, Array<{ what: number; owner: number; count: number; state: number; value: number }>>,
    rng?: SeededRng,
  ): void {
    const evalRule = rule as { eval?: (ctx: Context) => void };
    if (typeof evalRule.eval !== "function") return;

    const state = new State(1, cells, this.componentLabels, {
      numPlayers: this.numPlayers,
      whats,
      countAt,
      stateAt,
      valueAt,
    });
    const trial = new Trial([], false, -1);
    const ctx = new Context(this.startGameFacade(), state, trial, rng) as Context & {
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
    // @java other/state/container/ContainerState.java — the MUTATION facade for
    // start rules (STATE CONVERGENCE chunk 3). Java start rules apply actions that
    // call ContainerState.setSite(...); converted rules speak this API instead of
    // touching parallel arrays. UNDEFINED (-1) leaves a slot unchanged, as Java does.
    (ctx as unknown as { _startState?: unknown })._startState = {
      /** @java ContainerState.setSite(state, site, who, what, count, state, rotation, value) */
      setSite: (site: number, who: number, what: number, count: number, stateVal: number, value: number): void => {
        if (site < 0 || site >= cells.length) return;
        if (who !== UNDEFINED) cells[site] = who;
        if (what !== UNDEFINED) whats[site] = what;
        if (count !== UNDEFINED) countAt[site] = count;
        if (stateVal !== UNDEFINED) stateAt[site] = stateVal;
        if (value !== UNDEFINED) valueAt[site] = value;
      },
      /** @java State.setScore(player, score) */
      setScore: (pid: number, score: number): void => {
        if (scores && pid >= 0 && pid < scores.length) scores[pid] = score;
      },
      /** @java State.setAmount(player, amount) */
      setAmount: (pid: number, amount: number): void => {
        if (amounts && pid >= 0 && pid < amounts.length) amounts[pid] = amount;
      },
      /** @java State.remember(name, value) — ActionRememberValue.apply(context). */
      rememberValue: (name: string | null, value: number, unique: boolean): void => {
        if (!startRemembered) return;
        const key = name ?? "";
        const bucket = startRemembered.get(key) ?? [];
        if (unique && bucket.includes(value)) return;
        bucket.push(value);
        startRemembered.set(key, bucket);
      },
      /** @java ActionSetHidden.apply(context) — State.setHidden(pid, site, value). */
      setHidden: (pid: number, site: number, value: boolean): void => {
        if (!startHidden) return;
        startHidden.set(`${pid}:${site}`, value);
      },
      /** @java ContainerState.who(site) — LIVE read (the per-rule bridge State
       * snapshots the arrays at construction; intra-rule reads need the live view). */
      who: (site: number): number => (site >= 0 && site < cells.length ? cells[site]! : 0),
      /** Total number of sites (board + hands). */
      size: cells.length,
      /** @java ContainerState.what(site) — LIVE read. */
      what: (site: number): number => {
        if (site < 0 || site >= cells.length) return 0;
        const w = whats[site] ?? 0;
        return w !== 0 ? w : (cells[site] ?? 0);
      },
    };
    const playType = (this.equipment.board as unknown as { defaultSite?: string | (() => string) }).defaultSite;
    const playTypeName = typeof playType === "function" ? playType() : playType ?? null;
    ctx.placePieces = (site, what, count, stateValue, _rotation, value, _onStack, _type) => {
      if (process.env.TRACE_PLACE && site === 19) console.error("[place] site 19 what", what, new Error().stack?.split("\n").slice(2,5).join(" | "));
      // @java per-type ContainerStates: an EXPLICIT type differing from the
      // play type routes to the typed channel (Guerrilla Checkers places
      // "Counter" pieces on Cells of a Vertex-play board).
      if (_type && playTypeName && _type !== playTypeName && typedStaging) {
        const component = this.equipment.componentAt(what);
        const ownerT = component?.owner ?? 0;
        let ch = typedStaging.get(_type);
        if (!ch) { ch = { who: [], what: [], count: [] }; typedStaging.set(_type, ch); }
        while (ch.who.length <= site) { ch.who.push(0); ch.what.push(0); ch.count.push(0); }
        ch.who[site] = ownerT; ch.what[site] = what; ch.count[site] = count;
        return;
      }
      if (site < 0 || site >= cells.length) return;
      const component = this.equipment.componentAt(what);
      const owner = component?.owner ?? 0;
      if (_onStack && stackedStaging) {
        const levels = stackedStaging.get(site);
        if (levels && levels.length > 0) {
          const last = levels[levels.length - 1]!;
          // @java PlaceMonotonousStack calls placePieces `count` times with
          // the SAME (what, owner) — a homogeneous pile carried by countAt,
          // NOT extra stack levels (Backgammon's 5-checker points). Only a
          // DIFFERENT component/owner at the same site is a genuine new
          // level (PlaceCustomStack's Hex-then-Disc — Seesaw).
          if (last.what === what && last.owner === owner) {
            // monotonous repeat: fall through to the flat overwrite below.
          } else {
            levels.push({ what, owner, count, state: stateValue, value });
            return;
          }
        } else {
          stackedStaging.set(site, [{ what, owner, count, state: stateValue, value }]);
        }
      }
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

    const placeItem = evalRule as unknown as {
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
      if (process.env.TRACE_PLACE) console.error("[place] region", (placeItem.siteId as object)?.constructor?.name, "->", JSON.stringify(sites));
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

    evalRule.eval(ctx);
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
  private startGameFacade(): EngineGame {
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
    }) as unknown as EngineGame;
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
  private getPlayForMover(ctx: Context1to1): Rules["play"] {
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
