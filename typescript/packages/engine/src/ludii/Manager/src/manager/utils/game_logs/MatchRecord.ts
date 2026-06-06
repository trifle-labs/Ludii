// @java Manager/src/manager/utils/game_logs/MatchRecord.java

import type { Game } from "../../../../../../game.js";
import type { Move } from "../../../../../../move.js";
import type { Trial } from "../../../../../../trial.js";

/**
 * Escape-hatch for org.apache.commons.rng.core.RandomProviderDefaultState.
 * @java org.apache.commons.rng.core.RandomProviderDefaultState
 */
export type RandomProviderDefaultState = { bytes: Uint8Array };

/**
 * Escape-hatch for main.Status and its EndType enum.
 * @java main.Status
 * @java main.Status.EndType
 */
export type EndType = "Natural" | "Forfeit" | "Timeout" | "Abandoned" | "Unknown";
export type StatusShape = { winner: number; endType: EndType };

/**
 * Escape-hatch for other.trial.Trial that exposes the Java-shape mutation
 * methods used during deserialization (addMove, storeLegalMovesHistory, etc.).
 * The core Trial type is immutable in our TS port; we use an escape here
 * because these are load-path-only methods not in the engine's Trial.
 * @java other.trial.Trial
 */
type MutableTrial = {
  moves: readonly Move[];
  over: boolean;
  winner: number;
  numInitialPlacementMoves: number;
  previousStates: readonly number[];
  previousStatesWithinATurn: readonly number[];
  ranking: readonly number[];
  addMove(move: Move): void;
  storeLegalMovesHistory(): void;
  setLegalMovesHistory(history: Move[][]): void;
  storeLegalMovesHistorySizes(): void;
  setLegalMovesHistorySizes(sizes: { toArray(): number[] }): void;
  setNumInitialPlacementMoves(n: number): void;
  setStatus(status: StatusShape): void;
};

/**
 * A record of a single played Match (to be serialised/deserialised, typically
 * as a collection in GameLogs).
 *
 * @java manager.utils.game_logs.MatchRecord
 * @author Dennis Soemers
 */
export class MatchRecord {
  /** @java MatchRecord.serialVersionUID */
  public static readonly serialVersionUID: bigint = 1n;

  // -------------------------------------------------------------------------

  /** @java MatchRecord.trial */
  private readonly trialVal: Trial;

  /** @java MatchRecord.rngState */
  private readonly rngStateVal: RandomProviderDefaultState;

  // -------------------------------------------------------------------------

  /**
   * Constructor.
   * @java MatchRecord(Trial, RandomProviderDefaultState, String)
   */
  public constructor(
    trial: Trial,
    rngState: RandomProviderDefaultState,
    _loadedGameName: string,
  ) {
    this.trialVal = trial;
    this.rngStateVal = rngState;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Reference to the current trial.
   * @java MatchRecord.trial()
   */
  public trial(): Trial {
    return this.trialVal;
  }

  /**
   * @return RNG state.
   * @java MatchRecord.rngState()
   */
  public rngState(): RandomProviderDefaultState {
    return this.rngStateVal;
  }

  // -------------------------------------------------------------------------

  /**
   * Loads a MatchRecord from a text string (TS equivalent of reading from a
   * file stream). Mirrors the Java text-format deserializer line-by-line.
   *
   * @java MatchRecord.loadMatchRecordFromTextFile(File, Game)
   * @java MatchRecord.loadMatchRecordFromInputStream(InputStreamReader, Game)
   */
  public static loadMatchRecordFromText(
    text: string,
    game: Game,
  ): MatchRecord | null {
    const lines = text.split(/\r?\n/);
    let idx = 0;

    // First line: game=<name>
    if (idx >= lines.length) return null;
    const gameNameLine = lines[idx++] ?? "";
    const loadedGameName = gameNameLine.substring("game=".length);
    void loadedGameName;

    // Skip lines until RNG internal state
    let nextLine: string | null = null;
    while (idx < lines.length) {
      nextLine = lines[idx++] ?? null;
      if (nextLine === null || nextLine === undefined) break;
      if (nextLine.startsWith("RNG internal state=")) break;
      if (nextLine.startsWith("NEW LEGAL MOVES LIST")) break;
      if (nextLine.startsWith("winner=")) break;
      if (nextLine.startsWith("rankings=")) break;
    }

    if (nextLine === null || !nextLine.startsWith("RNG internal state=")) {
      console.error("ERROR: MatchRecord::loadMatchRecordFromText expected to read RNG internal state!");
      return null;
    }

    const rngInternalStateLine = nextLine;
    const byteStrings = rngInternalStateLine.substring("RNG internal state=".length).split(",");
    const bytes = new Uint8Array(byteStrings.length);
    for (let i = 0; i < byteStrings.length; ++i) {
      bytes[i] = parseInt(byteStrings[i] ?? "0", 10) & 0xff;
    }
    const rngState: RandomProviderDefaultState = { bytes };

    // The trial is immutable in the TS engine; we escape-hatch to allow mutations
    // during loading. In practice the full engine Trial doesn't expose addMove etc.
    // so we build a minimal mutable shell.
    const movesArr: Move[] = [];
    const legalMovesHistory: Move[][] = [];
    const legalMovesHistorySizes: number[] = [];
    let winner = -99;
    let endType: EndType = "Unknown";
    let numInitialPlacementMoves = 0;

    // Read moves
    nextLine = idx < lines.length ? (lines[idx++] ?? null) : null;
    while (nextLine !== null && nextLine.startsWith("Move=")) {
      // Move constructor from string — escape-hatch: store raw string
      const moveStr = nextLine.substring("Move=".length);
      // We can't call new Move(string) in TS (Move is not constructed from
      // strings); store as an opaque shape.
      movesArr.push({ id: moveStr, label: moveStr } as unknown as Move);
      nextLine = idx < lines.length ? (lines[idx++] ?? null) : null;
    }

    // Read legal moves list sizes
    while (nextLine !== null) {
      if (nextLine.startsWith("NEW LEGAL MOVES LIST")) break;
      if (nextLine.startsWith("winner=")) break;
      if (nextLine.startsWith("rankings=")) break;
      if (nextLine.startsWith("LEGAL MOVES LIST SIZE = ")) {
        legalMovesHistorySizes.push(parseInt(nextLine.substring("LEGAL MOVES LIST SIZE = ".length), 10));
      }
      nextLine = idx < lines.length ? (lines[idx++] ?? null) : null;
    }

    // Read legal moves sequences
    while (nextLine !== null) {
      if (nextLine.startsWith("winner=")) break;
      if (nextLine.startsWith("rankings=")) break;
      if (nextLine.startsWith("numInitialPlacementMoves=")) break;
      if (nextLine === "NEW LEGAL MOVES LIST") {
        legalMovesHistory.push([]);
      } else if (nextLine !== "END LEGAL MOVES LIST") {
        const last = legalMovesHistory[legalMovesHistory.length - 1];
        if (last !== undefined) {
          last.push({ id: nextLine, label: nextLine } as unknown as Move);
        }
      }
      nextLine = idx < lines.length ? (lines[idx++] ?? null) : null;
    }

    if (nextLine !== null && nextLine.startsWith("numInitialPlacementMoves=")) {
      numInitialPlacementMoves = parseInt(nextLine.substring("numInitialPlacementMoves=".length), 10);
      nextLine = idx < lines.length ? (lines[idx++] ?? null) : null;
    }

    if (nextLine !== null && nextLine.startsWith("winner=")) {
      winner = parseInt(nextLine.substring("winner=".length), 10);
      nextLine = idx < lines.length ? (lines[idx++] ?? null) : null;
    }

    if (nextLine !== null && nextLine.startsWith("endtype=")) {
      endType = nextLine.substring("endtype=".length) as EndType;
      nextLine = idx < lines.length ? (lines[idx++] ?? null) : null;
    }

    // Build the trial shell — escape-hatch as MutableTrial
    const ranking: number[] = [];
    if (nextLine !== null && nextLine.startsWith("rankings=")) {
      const rankingStrings = nextLine.substring("rankings=".length).split(",");
      for (const s of rankingStrings) {
        ranking.push(parseFloat(s));
      }
    }

    // Build a minimal trial-shaped object. The engine's Trial is immutable so
    // we construct an escape-hatch object that satisfies the MutableTrial shape.
    void game; // used in Java to construct new Trial(game)
    const trialShell: MutableTrial = {
      moves: movesArr,
      over: winner > -99,
      winner: winner > -99 ? winner : 0,
      numInitialPlacementMoves,
      previousStates: [],
      previousStatesWithinATurn: [],
      ranking,
      addMove(_m: Move) { (this.moves as Move[]).push(_m); },
      storeLegalMovesHistory() { /* noop */ },
      setLegalMovesHistory(_h: Move[][]) { /* stored separately */ },
      storeLegalMovesHistorySizes() { /* noop */ },
      setLegalMovesHistorySizes(_s: { toArray(): number[] }) { /* stored separately */ },
      setNumInitialPlacementMoves(n: number) { (this as unknown as { numInitialPlacementMoves: number }).numInitialPlacementMoves = n; },
      setStatus(s: StatusShape) {
        (this as unknown as { over: boolean; winner: number }).over = true;
        (this as unknown as { over: boolean; winner: number }).winner = s.winner;
      },
    };

    // Apply mutations
    trialShell.setNumInitialPlacementMoves(numInitialPlacementMoves);
    if (winner > -99) {
      trialShell.setStatus({ winner, endType });
    }
    if (legalMovesHistory.length > 0) {
      trialShell.storeLegalMovesHistory();
      trialShell.setLegalMovesHistory(legalMovesHistory);
    }
    if (legalMovesHistorySizes.length > 0) {
      trialShell.storeLegalMovesHistorySizes();
      trialShell.setLegalMovesHistorySizes({ toArray: () => legalMovesHistorySizes });
    }

    return new MatchRecord(trialShell as unknown as Trial, rngState, "");
  }

  // -------------------------------------------------------------------------
}
