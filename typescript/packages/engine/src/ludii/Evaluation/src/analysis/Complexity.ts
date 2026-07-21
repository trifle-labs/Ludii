// @java Evaluation/src/analysis/Complexity.java

/**
 * Methods to estimate various complexity measures using random trials.
 *
 * @java analysis/Complexity.java
 * @author Dennis Soemers and Matthew.Stephenson
 */

/** Minimal escape-hatch for not-yet-ported Game */
interface Game {
  disableMemorylessPlayouts(): void;
  start(context: Context): void;
  playout(
    context: Context,
    ais: unknown,
    maxSeconds: number,
    randomiser: unknown,
    maxNumBiasedActions: number,
    maxNumPlayoutActions: number,
    rng: unknown
  ): Trial;
  metaRules(): { setRepetitionType(type: unknown): void };
}

/** Minimal escape-hatch for not-yet-ported Trial */
interface Trial {
  numMoves(): number;
  numInitialPlacementMoves(): number;
  storeLegalMovesHistorySizes(): void;
  auxilTrialData(): { legalMovesHistorySizes(): IntList };
}

/** Minimal escape-hatch for not-yet-ported Context */
interface Context {
  state(): { numTurn(): number };
}

/** Minimal escape-hatch for a list of ints */
interface IntList {
  size(): number;
  getQuick(index: number): number;
}

/** Minimal escape-hatch for not-yet-ported UserSelections */
type UserSelections = unknown;

//-----------------------------------------------------------------------------

/**
 * Methods to estimate various complexity measures using random trials.
 *
 * @java analysis/Complexity.java
 */
export class Complexity {

  //-------------------------------------------------------------------------

  /**
   * Estimates average branching factor for the given game by running random trials
   * for the given number of seconds.
   *
   * @param gameResource Path for game's resource path
   * @param userSelections
   * @param numSeconds
   * @return A map from Strings to doubles:
   *   "Avg Trial Branching Factor" --> estimated average branching factor per trial
   *   "Avg State Branching Factor" --> estimated average branching factor per state
   *   "Num Trials" --> number of trials over which we estimated
   * @java Complexity.estimateBranchingFactor(String, UserSelections, double)
   */
  public static estimateBranchingFactor(
    gameResource: string,
    userSelections: UserSelections,
    numSeconds: number,
  ): Map<string, number> {
    // WARNING: do NOT modify this method to directly take a compiled game as argument
    // we may have to modify the game object itself by getting rid of custom playout
    // implementations, because they cannot properly store all the data we need to store.

    // First compile our game — escape-hatched (requires Java Compiler)
    const game = {} as unknown as Game;
    void gameResource; void userSelections;

    // Disable custom playout implementations if they cannot properly store
    // history of legal moves per state.
    game.disableMemorylessPlayouts();

    const trial = {} as unknown as Trial;
    const context = {} as unknown as Context;
    trial.storeLegalMovesHistorySizes();

    let stopAt = 0n;
    const start = process.hrtime.bigint !== undefined
      ? process.hrtime.bigint()
      : BigInt(Date.now()) * 1_000_000n;
    const abortAt = start + BigInt(Math.ceil(numSeconds * 1_000_000_000));
    let numTrials = 0;
    let numStates = 0n;

    let sumBranchingFactors = 0n;
    let sumAvgTrialBranchingFactors = 0.0;

    while (stopAt < abortAt) {
      game.start(context);
      const endTrial = game.playout(context, null, 1.0, null, -1, -1, null);
      const numDecisions = endTrial.numMoves() - endTrial.numInitialPlacementMoves();

      let trialSumBranchingFactors = 0n;
      const branchingFactors = endTrial.auxilTrialData().legalMovesHistorySizes();
      for (let i = 0; i < branchingFactors.size(); ++i) {
        trialSumBranchingFactors += BigInt(branchingFactors.getQuick(i));
      }
      numStates += BigInt(branchingFactors.size());

      sumBranchingFactors += trialSumBranchingFactors;
      sumAvgTrialBranchingFactors += Number(trialSumBranchingFactors) / numDecisions;

      ++numTrials;
      stopAt = process.hrtime.bigint !== undefined
        ? process.hrtime.bigint()
        : BigInt(Date.now()) * 1_000_000n;
    }

    const map = new Map<string, number>();
    map.set("Avg Trial Branching Factor", sumAvgTrialBranchingFactors / numTrials);
    map.set("Avg State Branching Factor", Number(sumBranchingFactors) / Number(numStates));
    map.set("Num Trials", numTrials);

    return map;
  }

  //-------------------------------------------------------------------------

  /**
   * Estimates average game lengths for the given game by running random trials
   * for the given number of seconds.
   *
   * @param game
   * @param numSeconds
   * @return A map from Strings to doubles:
   *   "Avg Num Decisions" --> average number of decisions per trial
   *   "Avg Num Player Switches" --> average number of switches of player-to-move per trial
   *   "Num Trials" --> number of trials over which we estimated
   * @java Complexity.estimateGameLength(Game, double)
   */
  public static estimateGameLength(
    game: Game,
    numSeconds: number,
  ): Map<string, number> {
    const trial = {} as unknown as Trial;
    const context = {} as unknown as Context;

    let stopAt = 0n;
    const start = process.hrtime.bigint !== undefined
      ? process.hrtime.bigint()
      : BigInt(Date.now()) * 1_000_000n;
    const abortAt = start + BigInt(Math.ceil(numSeconds * 1_000_000_000));
    let numTrials = 0;
    let numDecisions = 0n;
    let numPlayerSwitches = 0n;

    while (stopAt < abortAt) {
      game.start(context);
      const endTrial = game.playout(context, null, 1.0, null, -1, -1, null);
      numDecisions += BigInt(endTrial.numMoves() - endTrial.numInitialPlacementMoves());
      numPlayerSwitches += BigInt(context.state().numTurn() - 1);
      ++numTrials;
      stopAt = process.hrtime.bigint !== undefined
        ? process.hrtime.bigint()
        : BigInt(Date.now()) * 1_000_000n;
    }

    const map = new Map<string, number>();
    map.set("Avg Num Decisions", Number(numDecisions) / numTrials);
    map.set("Avg Num Player Switches", Number(numPlayerSwitches) / numTrials);
    map.set("Num Trials", numTrials);

    return map;
  }

  //-------------------------------------------------------------------------

  /**
   * Estimates game tree complexity for the given game by running random trials
   * for the given number of seconds.
   *
   * @param gameResource Path for game's resource path
   * @param userSelections
   * @param numSeconds
   * @param forceNoStateRepetitionRule If true, we force the game to use a No State Repetition rule
   * @return A map from Strings to doubles:
   *   "Avg Num Decisions" --> average number of decisions per trial
   *   "Avg Trial Branching Factor" --> estimated average branching factor per trial
   *   "Estimated Complexity Power" --> power (which 10 should be raised to) of estimated game tree complexity b^d
   *   "Num Trials" --> number of trials over which we estimated
   * @java Complexity.estimateGameTreeComplexity(String, UserSelections, double, boolean)
   */
  public static estimateGameTreeComplexity(
    gameResource: string,
    userSelections: UserSelections,
    numSeconds: number,
    forceNoStateRepetitionRule: boolean,
  ): Map<string, number> {
    // WARNING: do NOT modify this method to directly take a compiled game as argument
    // we may have to modify the game object itself by getting rid of custom playout
    // implementations, because they cannot properly store all the data we need to store.

    // First compile our game — escape-hatched (requires Java Compiler)
    const game = {} as unknown as Game;
    void gameResource; void userSelections;

    // disable custom playout implementations if they cannot properly store history of legal moves per state
    game.disableMemorylessPlayouts();

    if (forceNoStateRepetitionRule) {
      // Java: RepetitionType.Positional
      game.metaRules().setRepetitionType("Positional");
    }

    const trial = {} as unknown as Trial;
    const context = {} as unknown as Context;
    trial.storeLegalMovesHistorySizes();

    let stopAt = 0n;
    const start = process.hrtime.bigint !== undefined
      ? process.hrtime.bigint()
      : BigInt(Date.now()) * 1_000_000n;
    const abortAt = start + BigInt(Math.ceil(numSeconds * 1_000_000_000));
    let numTrials = 0;
    let sumNumDecisions = 0n;

    let sumAvgTrialBranchingFactors = 0.0;

    while (stopAt < abortAt) {
      game.start(context);
      const endTrial = game.playout(context, null, 1.0, null, -1, -1, null);
      const numDecisions = endTrial.numMoves() - endTrial.numInitialPlacementMoves();

      let trialSumBranchingFactors = 0n;
      const branchingFactors = endTrial.auxilTrialData().legalMovesHistorySizes();
      for (let i = 0; i < branchingFactors.size(); ++i) {
        trialSumBranchingFactors += BigInt(branchingFactors.getQuick(i));
      }

      sumAvgTrialBranchingFactors += Number(trialSumBranchingFactors) / numDecisions;
      sumNumDecisions += BigInt(numDecisions);

      ++numTrials;
      stopAt = process.hrtime.bigint !== undefined
        ? process.hrtime.bigint()
        : BigInt(Date.now()) * 1_000_000n;
    }

    const map = new Map<string, number>();
    const d = Number(sumNumDecisions) / numTrials;
    const b = sumAvgTrialBranchingFactors / numTrials;
    map.set("Avg Num Decisions", d);
    map.set("Avg Trial Branching Factor", b);
    map.set("Estimated Complexity Power", d * Math.log10(b));
    map.set("Num Trials", numTrials);

    return map;
  }

  //-------------------------------------------------------------------------
}
