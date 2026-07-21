// @java Core/src/parity/EmitFixture.java EmitFixture
/**
 * Faithful 1:1 transliteration of parity.EmitFixture.
 *
 * EmitFixture is a deterministic playout fixture emitter for parity testing.
 * It runs a Ludii game to completion with a fixed RNG state and writes a
 * text fixture recording every move and the resulting board hash.
 *
 * Usage: java parity.EmitFixture <ludPath> <rngStateCsv-8bytes> <outPath>
 *
 * The rngStateCsv is 8 comma-separated byte values (signed or unsigned 0-255).
 * These 8 bytes are the raw serialized state of the SplitMix64 RNG.
 *
 * Deferrals / Java-specific types replaced by minimal TS equivalents:
 *  - SplitMix64 / RandomProviderDefaultState: replaced by ISplitMix64 / IRngState
 *    opaque interfaces; callers must supply a real implementation.
 *  - GameLoader.loadGameFromFile: replaced by IGameLoader interface.
 *  - File: replaced by a plain string path (ludPath).
 *  - PrintWriter / FileWriter: replaced by Node.js fs.writeFileSync via
 *    IFileWriter interface so this file compiles without importing 'fs'.
 *  - context2.winners(): returns number[] in this port.
 *  - trial2.ranking(): returns number[].
 *  - The main() entry-point mirrors the Java static main(String[] args) exactly.
 *
 * @author (parity fixture) (Java original)
 * @java parity.EmitFixture
 */

// ---------------------------------------------------------------------------
// Minimal opaque interfaces for types that live in other engine modules.
// ---------------------------------------------------------------------------

/** Minimal surface of game.Game */
export interface IGame {
  name(): string;
  disableMemorylessPlayouts(): void;
  start(context: IContext): void;
  apply(context: IContext, move: IMove): void;
  playout(
    context: IContext,
    aiList: unknown,
    thinkingTime: number,
    plyLimit: unknown,
    fromPly: number,
    untilEnd: number,
    random: unknown
  ): void;
}

/** Minimal surface of other.context.Context */
export interface IContext {
  rng(): IRng;
  state(): IState;
  winners(): { size(): number; get(i: number): number };
}

/** Minimal surface of other.trial.Trial */
export interface ITrial {
  generateCompleteMovesList(): IMove[];
  numInitialPlacementMoves(): number;
  ranking(): number[];
}

/** Minimal surface of other.move.Move */
export interface IMove {
  toTrialFormat(context: IContext | null): string;
}

/** Minimal surface of game state */
export interface IState {
  fullHash(context: IContext): bigint;
}

/** Minimal surface of RNG */
export interface IRng {
  restoreState(state: IRngState): void;
}

/** Opaque RNG state (maps to RandomProviderDefaultState) */
export interface IRngState {
  readonly bytes: Uint8Array;
}

/** Minimal surface of SplitMix64 */
export interface ISplitMix64 {
  restoreState(state: IRngState): void;
}

// ---------------------------------------------------------------------------
// Injectable dependencies (replace static Java classes)
// ---------------------------------------------------------------------------

/** Injectable stand-in for other.GameLoader (static utility in Java) */
export interface IGameLoader {
  loadGameFromFile(ludPath: string): IGame;
}

/** Injectable stand-in for Context constructor */
export interface IContextFactory {
  create(game: IGame, trial: ITrial): IContext;
}

/** Injectable stand-in for Trial constructor */
export interface ITrialFactory {
  create(game: IGame): ITrial;
}

/** Injectable stand-in for SplitMix64 constructor */
export interface ISplitMix64Factory {
  create(): ISplitMix64;
}

/** Injectable stand-in for RandomProviderDefaultState constructor */
export interface IRngStateFactory {
  fromBytes(bytes: Uint8Array): IRngState;
}

/** Injectable stand-in for file writing (replaces PrintWriter / FileWriter) */
export interface IFileWriter {
  write(path: string, content: string): void;
}

// ---------------------------------------------------------------------------
// EmitFixture
// ---------------------------------------------------------------------------

/**
 * Deterministic playout fixture emitter for parity testing.
 *
 * Usage (Java CLI equivalent):
 *   EmitFixture.main(["<ludPath>", "<rngStateCsv>", "<outPath>"], deps)
 *
 * @java parity.EmitFixture
 */
export class EmitFixture {
  /**
   * Equivalent of Java's static main(String[] args).
   *
   * @param args          Three-element array: [ludPath, rngStateCsv, outPath]
   * @param gameLoader    Provides loadGameFromFile
   * @param contextFactory Provides Context construction
   * @param trialFactory  Provides Trial construction
   * @param rngStateFactory Provides RandomProviderDefaultState construction
   * @param fileWriter    Writes text to outPath
   * @param stderr        Receives error messages (defaults to console.error)
   * @param stdout        Receives info messages (defaults to console.log)
   * @java parity.EmitFixture#main
   */
  static main(
    args: string[],
    gameLoader: IGameLoader,
    contextFactory: IContextFactory,
    trialFactory: ITrialFactory,
    rngStateFactory: IRngStateFactory,
    fileWriter: IFileWriter,
    stderr: (msg: string) => void = console.error,
    stdout: (msg: string) => void = console.log
  ): void {
    if (args.length < 3) {
      stderr("Usage: EmitFixture <ludPath> <rngStateCsv> <outPath>");
      return; // Java: System.exit(1) — TS port returns instead of exiting
    }

    const ludPath = args[0] as string;
    const rngCsv  = args[1] as string;
    const outPath = args[2] as string;

    // Parse the 8 RNG seed bytes
    const parts = rngCsv.split(",");
    if (parts.length !== 8) {
      stderr(`rngStateCsv must have exactly 8 comma-separated bytes, got: ${parts.length}`);
      return; // Java: System.exit(1)
    }
    const rngBytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
      // Java: (byte) Integer.parseInt(parts[i].trim())
      rngBytes[i] = parseInt((parts[i] as string).trim(), 10) & 0xff;
    }

    // Load game
    // Java: final Game game = GameLoader.loadGameFromFile(new File(ludPath));
    const game = gameLoader.loadGameFromFile(ludPath);
    game.disableMemorylessPlayouts();

    // First pass: run the playout to record all moves
    // Java: final SplitMix64 rng1 = new SplitMix64();
    //       rng1.restoreState(new RandomProviderDefaultState(rngBytes));
    // (rng1 is created but only used to initialise — mirrors the Java which
    //  constructs rng1 then restores its state; the actual seeding goes into
    //  context1.rng() below.)

    const trial1 = trialFactory.create(game);
    const context1 = contextFactory.create(game, trial1);
    context1.rng().restoreState(rngStateFactory.fromBytes(rngBytes));
    game.start(context1);

    // Java: game.playout(context1, null, 1.0, null, 0, -1, new java.util.Random(0L));
    game.playout(context1, null, 1.0, null, 0, -1, null);

    // Collect the full moves list (includes init placement moves)
    const allMoves = trial1.generateCompleteMovesList();

    // Second pass: replay to capture hashes at each ply
    const trial2 = trialFactory.create(game);
    const context2 = contextFactory.create(game, trial2);
    context2.rng().restoreState(rngStateFactory.fromBytes(rngBytes));
    game.start(context2);

    // Figure out how many setup/init moves were played before decision moves
    const numInitMoves = trial2.numInitialPlacementMoves();

    // Build output lines (mirrors Java's PrintWriter usage)
    const lines: string[] = [];
    lines.push(`game=${game.name()}`);
    lines.push(`lud=${ludPath}`);
    lines.push(`rng=${rngCsv}`);
    lines.push(`total_moves=${allMoves.length - numInitMoves}`);
    lines.push("");

    let ply = 0;
    for (let i = numInitMoves; i < allMoves.length; i++) {
      const m = allMoves[i] as IMove;
      lines.push(`ply=${ply} move=${m.toTrialFormat(null)}`);
      game.apply(context2, m);
      const hash = context2.state().fullHash(context2);
      lines.push(`ply=${ply} hash=${hash}`);
      ply++;
    }

    lines.push("");

    // Winners
    // Java: for (int i = 0; i < context2.winners().size(); i++)
    const winnersObj = context2.winners();
    const winParts: string[] = [];
    for (let i = 0; i < winnersObj.size(); i++) {
      winParts.push(String(winnersObj.get(i)));
    }
    lines.push(`winners=${winParts.join(",")}`);

    // Rankings
    // Java: final double[] rankings = trial2.ranking();
    //       for (int i = 1; i < rankings.length; i++) ...
    const rankings = trial2.ranking();
    const rankParts: string[] = [];
    for (let i = 1; i < rankings.length; i++) {
      rankParts.push(String(rankings[i]));
    }
    lines.push(`rankings=${rankParts.join(",")}`);

    // Java: try (final PrintWriter pw = new PrintWriter(new FileWriter(outPath)))
    fileWriter.write(outPath, lines.join("\n"));

    stdout(`Fixture written to: ${outPath}`);
  }
}
