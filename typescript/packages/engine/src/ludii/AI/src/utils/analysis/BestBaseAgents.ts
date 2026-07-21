// @java AI/src/utils/analysis/BestBaseAgents.java

/**
 * Wrapper around collected data on the best base agents in all games.
 *
 * @java utils.analysis.BestBaseAgents
 * @author Dennis Soemers
 */
export class BestBaseAgents {

  //-------------------------------------------------------------------------

  /** Map of entries (mapping from cleaned game names to entries of data). @java BestBaseAgents.entries */
  private readonly entries: Map<string, BestBaseAgents.Entry>;

  //-------------------------------------------------------------------------

  /**
   * Loads and returns the analysed data as stored so far.
   * @java BestBaseAgents.loadData()
   */
  static loadData(): BestBaseAgents {
    const entries = new Map<string, BestBaseAgents.Entry>();
    // DEFERRED: File I/O is not directly available in TypeScript/browser.
    // In a Node.js environment, this would read from:
    // "../AI/resources/Analysis/BestBaseAgents.csv"
    // and parse CSV lines split by ","
    // For now, returns an empty map.
    return new BestBaseAgents(entries);
  }

  /**
   * Constructor.
   * @param entries
   * @java BestBaseAgents(Map)
   */
  private constructor(entries: Map<string, BestBaseAgents.Entry>) {
    this.entries = entries;
  }

  //-------------------------------------------------------------------------

  /**
   * @param cleanGameName
   * @return Stored entry for given game name
   * @java BestBaseAgents.getEntry(String)
   */
  getEntry(cleanGameName: string): BestBaseAgents.Entry | undefined {
    return this.entries.get(cleanGameName);
  }

  /**
   * @return Set of all game keys in our file
   * @java BestBaseAgents.keySet()
   */
  keySet(): Set<string> {
    return new Set(this.entries.keys());
  }

  //-------------------------------------------------------------------------
}

export namespace BestBaseAgents {

  /**
   * An entry with data for one game in our collected data.
   *
   * @java utils.analysis.BestBaseAgents.Entry
   * @author Dennis Soemers
   */
  export class Entry {

    /** Name of game for which we stored data. @java Entry.gameName */
    private readonly _gameName: string;

    /** Name of ruleset for which we stored data. @java Entry.rulesetName */
    private readonly _rulesetName: string;

    /** Name of game+ruleset for which we stored data. @java Entry.gameRulesetName */
    private readonly _gameRulesetName: string;

    /** String description of top agent. @java Entry.topAgent */
    private readonly _topAgent: string;

    /** Win percentage of the top agent. @java Entry.topScore */
    private readonly _topScore: number;

    /**
     * Constructor.
     * @param gameName
     * @param rulesetName
     * @param gameRulesetName
     * @param topAgent
     * @param topScore
     * @java Entry(String, String, String, String, float)
     */
    constructor(
      gameName: string,
      rulesetName: string,
      gameRulesetName: string,
      topAgent: string,
      topScore: number
    ) {
      this._gameName = gameName;
      this._rulesetName = rulesetName;
      this._gameRulesetName = gameRulesetName;
      this._topAgent = topAgent;
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
     * @return String description of top agent
     * @java Entry.topAgent()
     */
    topAgent(): string {
      return this._topAgent;
    }

    /**
     * @return Win percentage of the top agent
     * @java Entry.topScore()
     */
    topScore(): number {
      return this._topScore;
    }
  }
}
