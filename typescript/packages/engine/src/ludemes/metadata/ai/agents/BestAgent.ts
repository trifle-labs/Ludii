// @java Core/src/metadata/ai/agents/BestAgent.java

/**
 * Describes the name of an algorithm or agent that is typically expected to
 * be the best-performing algorithm available in Ludii for this game.
 *
 * @remarks Some examples of names that Ludii can currently recognise are
 * "Random", "Flat MC", "Alpha-Beta", "UCT", "MC-GRAVE",
 * and "Biased MCTS".
 *
 * @author Dennis Soemers
 */
export class BestAgent {
  /** Agent name */
  private readonly agentName: string;

  // -------------------------------------------------------------------------

  /**
   * Constructor
   * @param agent The name of the (expected) best agent for this game.
   *
   * @example (bestAgent "UCT")
   */
  constructor(agent: string) {
    this.agentName = agent;
  }

  // -------------------------------------------------------------------------

  /** @return The agent string */
  agent(): string {
    return this.agentName;
  }

  // -------------------------------------------------------------------------

  toString(): string {
    return `(bestAgent "${this.agentName}")`;
  }
}
