// @java Core/src/other/RankUtils.java
/**
 * Faithful 1:1 transliteration of other.RankUtils.
 *
 * Some utility methods for working with rankings (and converting them to
 * utilities).
 *
 * Deferrals:
 *  - Context: represented by a minimal local interface that exposes only the
 *    surface called in this class (trial().ranking(), state().playerToAgent(),
 *    computeNextDrawRank()).
 *
 * Java parity: other/RankUtils.java
 *
 * @author Dennis Soemers (Java), ported to TS
 */

// ---------------------------------------------------------------------------
// Minimal opaque interfaces for types that live in other engine modules.
// ---------------------------------------------------------------------------

interface IState {
  playerToAgent(player: number): number;
}

interface ITrial {
  ranking(): number[];
}

interface IContext {
  trial(): ITrial;
  state(): IState;
  computeNextDrawRank(): number;
}

// ---------------------------------------------------------------------------

/**
 * Some utility methods for working with rankings (and converting them to
 * utilities).
 *
 * @java other/RankUtils.java — class RankUtils
 */
export class RankUtils {
  // Private constructor — utility class, not instantiated.
  private constructor() {
    // Do not instantiate
  }

  // -------------------------------------------------------------------------

  /**
   * Converts a rank >= 1 into a utility value in [-1, 1].
   *
   * @param rank       The rank (1-based).
   * @param numPlayers Total number of players in the game (active + inactive).
   * @return Utility for the given rank.
   * @java other/RankUtils.java — rankToUtil(double, int)
   */
  static rankToUtil(rank: number, numPlayers: number): number {
    if (numPlayers === 1) {
      // a single-player game
      return 2.0 * rank - 1.0;
    } else {
      // two or more players
      return 1.0 - (rank - 1.0) * (2.0 / (numPlayers - 1));
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Computes a vector of utility values for all players based on the player
   * rankings in the given context.
   *
   * For players who do not yet have an established ranking, a "draw" utility
   * will be returned.
   *
   * For players who do have an established ranking, the utility value will lie
   * in [-1, 1] based on the ranking; 1.0 for top ranking, -1.0 for bottom
   * ranking, 0.0 for middle ranking (e.g. second player out of three), etc.
   *
   * The returned array will have a length equal to the number of players plus
   * one, such that it can be indexed directly by player number.
   *
   * @param context The context.
   * @return The utilities.
   * @java other/RankUtils.java — utilities(Context)
   */
  static utilities(context: IContext): number[] {
    const ranking = context.trial().ranking();
    const utilities = new Array<number>(ranking.length).fill(0);
    const numPlayers = ranking.length - 1;

    for (let p = 1; p < ranking.length; ++p) {
      let rank = ranking[p] ?? 0;
      if (numPlayers > 1 && rank === 0.0) {
        // looks like a playout didn't terminate yet; assign "draw" ranks
        rank = context.computeNextDrawRank();
      }

      utilities[p] = RankUtils.rankToUtil(rank, numPlayers);
    }

    return utilities;
  }

  // -------------------------------------------------------------------------

  /**
   * Computes a vector of utilities, like above, but now for agents.  In states
   * where a player-swap has occurred, the utilities will also be swapped, such
   * that the utility values can be indexed by original-agent-index rather than
   * role / colour / player index.
   *
   * @param context The context.
   * @return The agent utilities.
   * @java other/RankUtils.java — agentUtilities(Context)
   */
  static agentUtilities(context: IContext): number[] {
    const utils = RankUtils.utilities(context);
    const agentUtils = new Array<number>(utils.length).fill(0);

    for (let p = 1; p < utils.length; ++p) {
      agentUtils[p] = utils[context.state().playerToAgent(p)] ?? 0;
    }

    return agentUtils;
  }

  // -------------------------------------------------------------------------
}
