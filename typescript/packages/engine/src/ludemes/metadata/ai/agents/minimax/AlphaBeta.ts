// @java Core/src/metadata/ai/agents/minimax/AlphaBeta.java

import type { Heuristics } from "../../heuristics/Heuristics.js";

/**
 * Describes an Alpha-Beta search agent.
 *
 * @author Dennis Soemers
 */
export class AlphaBeta {
  /** The heuristics we want to use. If null, will just use from game file's metadata */
  protected readonly heuristics: Heuristics | null;

  // -------------------------------------------------------------------------

  /**
   * Constructor
   *
   * @param heuristics The heuristics to be used by this agent. Will default
   * to heuristics from the game file's metadata if left unspecified [null].
   *
   * @example (alphaBeta)
   */
  constructor(heuristics: Heuristics | null = null) {
    this.heuristics = heuristics;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Our heuristics (can be null if we just want to use from game
   * file's metadata)
   */
  getHeuristics(): Heuristics | null {
    return this.heuristics;
  }

  // -------------------------------------------------------------------------

  toString(): string {
    if (this.heuristics == null) return "(alphaBeta)";
    return `(alphaBeta ${this.heuristics.toString()})`;
  }
}
