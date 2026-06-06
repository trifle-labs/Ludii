// @java AI/src/utils/analysis/BestStartingHeuristics.java

/**
 * Wrapper around collected data on the best starting heuristics
 * to start training Alpha-Beta agents with.
 *
 * @java utils.analysis.BestStartingHeuristics
 * @author Dennis Soemers
 */
export class BestStartingHeuristics {

  //-------------------------------------------------------------------------

  /** Map of entries (mapping from cleaned game names to entries of data). @java BestStartingHeuristics.entries */
  private readonly entries: Map<string, BestStartingHeuristics.Entry>;

  //-------------------------------------------------------------------------

  /**
   * Loads and returns the analysed data as stored so far.
   * @java BestStartingHeuristics.loadData()
   */
  static loadData(): BestStartingHeuristics {
    const entries = new Map<string, BestStartingHeuristics.Entry>();
    // DEFERRED: File I/O is not directly available in TypeScript/browser.
    // In a Node.js environment, this would read from:
    // "../AI/resources/Analysis/BestStartingHeuristics.csv"
    // and parse CSV lines split by ","
    // For now, returns an empty map.
    return new BestStartingHeuristics(entries);
  }

  /**
   * Constructor.
   * @param entries
   * @java BestStartingHeuristics(Map)
   */
  private constructor(entries: Map<string, BestStartingHeuristics.Entry>) {
    this.entries = entries;
  }

  //-------------------------------------------------------------------------

  /**
   * @param cleanGameName
   * @return Stored entry for given game name
   * @java BestStartingHeuristics.getEntry(String)
   */
  getEntry(cleanGameName: string): BestStartingHeuristics.Entry | undefined {
    return this.entries.get(cleanGameName);
  }

  /**
   * @return Set of all game keys in our file
   * @java BestStartingHeuristics.keySet()
   */
  keySet(): Set<string> {
    return new Set(this.entries.keys());
  }

  //-------------------------------------------------------------------------
}

export namespace BestStartingHeuristics {

  /**
   * An entry with data for one game in our collected data.
   *
   * @java utils.analysis.BestStartingHeuristics.Entry
   * @author Dennis Soemers
   */
  export class Entry {

    /** Name of game for which we stored data. @java Entry.gameName */
    private readonly _gameName: string;

    /** Name of ruleset for which we stored data. @java Entry.rulesetName */
    private readonly _rulesetName: string;

    /** Name of game+ruleset for which we stored data. @java Entry.gameRulesetName */
    private readonly _gameRulesetName: string;

    /** String description of top starting heuristic. @java Entry.topHeuristic */
    private readonly _topHeuristic: string;

    /** Win percentage of the Alpha-Beta agent with the top starting heuristic. @java Entry.topScore */
    private readonly _topScore: number;

    /**
     * Constructor.
     * @param gameName
     * @param rulesetName
     * @param gameRulesetName
     * @param topHeuristic
     * @param topScore
     * @java Entry(String, String, String, String, float)
     */
    constructor(
      gameName: string,
      rulesetName: string,
      gameRulesetName: string,
      topHeuristic: string,
      topScore: number
    ) {
      this._gameName = gameName;
      this._rulesetName = rulesetName;
      this._gameRulesetName = gameRulesetName;
      this._topHeuristic = topHeuristic;
      this._topScore = topScore;
    }

    /**
     * @return Name of game for which we stored data
     * @java Entry.gameName()
     */
    gameName(): string {
      return this._gameName;
    }

    /**
     * @return Name of ruleset for which we stored data
     * @java Entry.rulesetName()
     */
    rulesetName(): string {
      return this._rulesetName;
    }

    /**
     * @return Name of game+ruleset for which we stored data
     * @java Entry.gameRulesetName()
     */
    gameRulesetName(): string {
      return this._gameRulesetName;
    }

    /**
     * @return String description of top starting heuristic
     * @java Entry.topHeuristic()
     */
    topHeuristic(): string {
      return this._topHeuristic;
    }

    /**
     * @return Win percentage of the Alpha-Beta agent with the top starting heuristic
     * @java Entry.topScore()
     */
    topScore(): number {
      return this._topScore;
    }
  }
}
