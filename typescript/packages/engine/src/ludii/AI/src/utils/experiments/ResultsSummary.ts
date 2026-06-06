// @java AI/src/utils/experiments/ResultsSummary.java

/**
 * A summary of results for multiple played games. Thread-safe.
 *
 * @java utils.experiments.ResultsSummary
 * @author Dennis Soemers
 */

import { Stats } from "../../../../Common/src/main/math/statistics/Stats.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/** @java game.Game (opaque) */
type Game = {
  players(): { count(): number };
};

// TDoubleArrayList shim (mirrors gnu.trove.list.array.TDoubleArrayList)
class TDoubleArrayList {
  private _data: number[] = [];

  add(val: number): void {
    this._data.push(val);
  }

  getQuick(index: number): number {
    return this._data[index]!;
  }

  size(): number {
    return this._data.length;
  }
}

// ---------------------------------------------------------------------------

/**
 * @java utils.experiments.ResultsSummary
 */
export class ResultsSummary {

  //-------------------------------------------------------------------------

  /** List of names / descriptions / string-representations of agents. @java ResultsSummary.agents */
  protected readonly agents: string[];

  /** Points per agent (regardless of player number). Wins = 1, draws = 0.5, losses = 0. @java ResultsSummary.agentPoints */
  protected _agentPoints: Stats[];

  /** Points per agent per player number. Wins = 1, draws = 0.5, losses = 0. @java ResultsSummary.agentPointsPerPlayer */
  protected agentPointsPerPlayer: Stats[][];

  /** For every game in which the agent played, the duration (in number of decisions). @java ResultsSummary.agentGameDurations */
  protected agentGameDurations: Stats[];

  /** For every game in which the agent played per player number, the duration (in number of decisions). @java ResultsSummary.agentGameDurationsPerPlayer */
  protected agentGameDurationsPerPlayer: Stats[][];

  /** Map from matchup lists to arrays of sums of payoffs. @java ResultsSummary.matchupPayoffsMap */
  protected matchupPayoffsMap: Map<string, number[]>;

  /** Map from matchup arrays to counts of how frequently we observed that matchup. @java ResultsSummary.matchupCountsMap */
  protected matchupCountsMap: Map<string, number>;

  /**
   * Map from matchup lists to lists of outcome-lists.
   * @java ResultsSummary.matchupOutcomesListsMap
   */
  protected matchupOutcomesListsMap: Map<string, TDoubleArrayList[]>;

  //-------------------------------------------------------------------------

  /**
   * Construct a new object to collect a summary of results for a
   * larger number of games being played.
   * @param game
   * @param agents
   * @java ResultsSummary(Game, List)
   */
  constructor(game: Game, agents: string[]) {
    this.agents = agents;

    const numPlayers = game.players().count();

    this._agentPoints = new Array<Stats>(agents.length);
    this.agentPointsPerPlayer = Array.from({ length: agents.length }, () => new Array<Stats>(numPlayers + 1));

    this.agentGameDurations = new Array<Stats>(agents.length);
    this.agentGameDurationsPerPlayer = Array.from({ length: agents.length }, () => new Array<Stats>(numPlayers + 1));

    for (let i = 0; i < agents.length; i++) {
      this._agentPoints[i] = new Stats(agents[i] + " points");
      this.agentGameDurations[i] = new Stats(agents[i] + " game durations");

      for (let p = 1; p <= numPlayers; p++) {
        this.agentPointsPerPlayer[i]![p] = new Stats(agents[i]! + " points as P" + p);
        this.agentGameDurationsPerPlayer[i]![p] = new Stats(agents[i]! + " game durations as P" + p);
      }
    }

    this.matchupPayoffsMap = new Map<string, number[]>();
    this.matchupCountsMap = new Map<string, number>();
    this.matchupOutcomesListsMap = new Map<string, TDoubleArrayList[]>();
  }

  //-------------------------------------------------------------------------

  /**
   * Records the results from a played game.
   * @param agentPermutation
   *   Array giving us the original agent index for every player index 1 <= p <= numPlayers
   * @param utilities
   *   Array of utilities for the players
   * @param gameDuration
   *   Number of moves made in the game
   * @java ResultsSummary.recordResults(int[], double[], int)
   */
  recordResults(
    agentPermutation: number[],
    utilities: number[],
    gameDuration: number
  ): void {
    for (let p = 1; p < agentPermutation.length; p++) {
      // Convert utility from [-1.0, 1.0] to [0.0, 1.0]
      const points = (utilities[p]! + 1.0) / 2.0;
      const agentNumber = agentPermutation[p]!;

      this.agentPoints()[agentNumber]!.addSample(points);
      this.agentPointsPerPlayer[agentNumber]![p]!.addSample(points);

      this.agentGameDurations[agentNumber]!.addSample(gameDuration);
      this.agentGameDurationsPerPlayer[agentNumber]![p]!.addSample(gameDuration);
    }

    const agentsList: string[] = [];
    for (let p = 1; p < agentPermutation.length; p++) {
      agentsList.push(this.agents[agentPermutation[p]!]!);
    }

    const key = ResultsSummary._listKey(agentsList);

    if (!this.matchupPayoffsMap.has(key)) {
      this.matchupPayoffsMap.set(key, new Array<number>(utilities.length - 1).fill(0.0));
      this.matchupOutcomesListsMap.set(key, []);
    }

    this.matchupCountsMap.set(key, (this.matchupCountsMap.get(key) ?? 0) + 1);
    const sumUtils = this.matchupPayoffsMap.get(key)!;
    const outcomes = new TDoubleArrayList();

    for (let p = 1; p < utilities.length; p++) {
      sumUtils[p - 1]! += utilities[p]!;
      outcomes.add(utilities[p]!);
    }

    this.matchupOutcomesListsMap.get(key)!.push(outcomes);
  }

  //-------------------------------------------------------------------------

  /**
   * @param agentName
   * @return Score averaged over all games, all agents with name equal to
   * given name.
   * @java ResultsSummary.avgScoreForAgentName(String)
   */
  avgScoreForAgentName(agentName: string): number {
    let sumScores = 0.0;
    let sumNumGames = 0;

    for (let i = 0; i < this.agents.length; i++) {
      if (this.agents[i] === agentName) {
        this.agentPoints()[i]!.measure();
        sumScores += this.agentPoints()[i]!.getSum();
        sumNumGames += this.agentPoints()[i]!.n();
      }
    }

    return sumScores / sumNumGames;
  }

  //-------------------------------------------------------------------------

  /**
   * Generates an intermediate summary of results.
   * @return The generated summary
   * @java ResultsSummary.generateIntermediateSummary()
   */
  generateIntermediateSummary(): string {
    const sb: string[] = [];

    sb.push("=====================================================\n");

    let totGamesPlayed = 0;
    for (let i = 0; i < this.agentPointsPerPlayer.length; i++) {
      totGamesPlayed += this.agentPointsPerPlayer[i]![1]!.n();
    }

    sb.push("Completed " + totGamesPlayed + " games.\n");
    sb.push("\n");

    for (let i = 0; i < this.agents.length; i++) {
      sb.push("Agent " + (i + 1) + " (" + this.agents[i] + ")\n");

      this.agentPoints()[i]!.measure();
      sb.push("Winning score (between 0 and 1) " + this.agentPoints()[i]! + "\n");

      for (let p = 1; p < this.agentPointsPerPlayer[i]!.length; p++) {
        this.agentPointsPerPlayer[i]![p]!.measure();
        sb.push("P" + p + this.agentPointsPerPlayer[i]![p]! + "\n");
      }

      this.agentGameDurations[i]!.measure();
      sb.push("Game Durations" + this.agentGameDurations[i]! + "\n");

      for (let p = 1; p < this.agentGameDurationsPerPlayer[i]!.length; p++) {
        this.agentGameDurationsPerPlayer[i]![p]!.measure();
        sb.push("P" + p + this.agentGameDurationsPerPlayer[i]![p]! + "\n");
      }

      if (i < this.agents.length - 1) {
        sb.push("\n");
      }
    }

    sb.push("=====================================================\n");

    return sb.join("");
  }

  //-------------------------------------------------------------------------

  /**
   * Writes results data for processing by the OpenSpiel implementation of alpha-rank,
   * to a .csv file.
   *
   * @param outFile
   * @java ResultsSummary.writeAlphaRankData(File)
   */
  writeAlphaRankData(outFile: { write(content: string): void; close?(): void }): void {
    // DEFERRED: File I/O (PrintWriter) is not available in TypeScript/browser.
    // In Node.js, use fs.writeFileSync or a stream.
    outFile.write("agents,scores\n");

    for (const [key, scoreSums] of this.matchupPayoffsMap) {
      const matchup = ResultsSummary._keyToList(key);
      const agentTuple: string[] = [];
      agentTuple.push("\"(");
      for (let i = 0; i < matchup.length; i++) {
        if (i > 0) agentTuple.push(", ");
        agentTuple.push("'");
        agentTuple.push(matchup[i]!);
        agentTuple.push("'");
      }
      agentTuple.push(")\"");

      const count = this.matchupCountsMap.get(key) ?? 1;
      const avgScores = scoreSums.map(s => s / count);

      const scoreTuple: string[] = [];
      scoreTuple.push("\"(");
      for (let i = 0; i < avgScores.length; i++) {
        if (i > 0) scoreTuple.push(", ");
        scoreTuple.push(String(avgScores[i]));
      }
      scoreTuple.push(")\"");

      outFile.write(agentTuple.join("") + "," + scoreTuple.join("") + "\n");
    }

    if (outFile.close) outFile.close();
  }

  //-------------------------------------------------------------------------

  /**
   * Writes raw results.
   *
   * @param outFile
   * @java ResultsSummary.writeRawResults(File)
   */
  writeRawResults(outFile: { write(content: string): void; close?(): void }): void {
    // DEFERRED: File I/O (PrintWriter) is not available in TypeScript/browser.
    outFile.write("agents,utilities\n");

    for (const [key, outcomesList] of this.matchupOutcomesListsMap) {
      const matchup = ResultsSummary._keyToList(key);
      const agentTuple: string[] = [];
      agentTuple.push("\"(");
      for (let i = 0; i < matchup.length; i++) {
        if (i > 0) agentTuple.push(" / ");
        agentTuple.push("'");
        agentTuple.push(matchup[i]!);
        agentTuple.push("'");
      }
      agentTuple.push(")\"");

      for (const utils of outcomesList) {
        const utilsSb: string[] = [];
        utilsSb.push("\"");
        for (let i = 0; i < utils.size(); i++) {
          if (i > 0) utilsSb.push(";");
          utilsSb.push(String(utils.getQuick(i)));
        }
        utilsSb.push("\"");
        outFile.write(agentTuple.join("") + "," + utilsSb.join("") + "\n");
      }
    }

    if (outFile.close) outFile.close();
  }

  //-------------------------------------------------------------------------

  /**
   * @java ResultsSummary.agentPoints()
   */
  agentPoints(): Stats[] {
    return this._agentPoints;
  }

  //-------------------------------------------------------------------------

  /** Converts a string list to a map key. */
  private static _listKey(list: string[]): string {
    return JSON.stringify(list);
  }

  /** Converts a map key back to a string list. */
  private static _keyToList(key: string): string[] {
    return JSON.parse(key) as string[];
  }

  //-------------------------------------------------------------------------
}
