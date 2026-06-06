// @java Features/src/features/spatial/instances/BitwiseTest.java

/**
 * Interface for classes that can perform bitwise tests on game states.
 *
 * The primary class implementing this interface is the general Feature
 * Instance, but there are also some more specific subclasses that only
 * need a small part of the full Feature Instance functionality, and can
 * run their tests more efficiently.
 *
 * @java features/spatial/instances/BitwiseTest.java
 * @author Dennis Soemers
 */

/** @java game.types.board.SiteType */
export type SiteType = "Cell" | "Edge" | "Vertex";

/** @java other.state.State */
export interface State {
  containerStates(): ContainerState[];
}

/** @java other.state.container.ContainerState */
export interface ContainerState {
  matchesWhoCell(wordIdx: number, mask: bigint, matchingWord: bigint): boolean;
  matchesWhoEdge(wordIdx: number, mask: bigint, matchingWord: bigint): boolean;
  matchesWhoVertex(wordIdx: number, mask: bigint, matchingWord: bigint): boolean;
  matchesWhatCell(wordIdx: number, mask: bigint, matchingWord: bigint): boolean;
  matchesWhatEdge(wordIdx: number, mask: bigint, matchingWord: bigint): boolean;
  matchesWhatVertex(wordIdx: number, mask: bigint, matchingWord: bigint): boolean;
  emptyChunkSetCell(): { get(site: number): boolean };
  emptyChunkSetEdge(): { get(site: number): boolean };
  emptyChunkSetVertex(): { get(site: number): boolean };
  whoCell(site: number): number;
}

//-----------------------------------------------------------------------------

/**
 * Interface for bitwise tests on game states.
 *
 * @java features.spatial.instances.BitwiseTest
 */
export interface BitwiseTest {

  //-------------------------------------------------------------------------

  /**
   * @param state
   * @return True if this test matches the given game state
   * @java BitwiseTest.matches(State)
   */
  matches(state: State): boolean;

  //-------------------------------------------------------------------------

  /**
   * @return True if and only if this test automatically returns true
   * @java BitwiseTest.hasNoTests()
   */
  hasNoTests(): boolean;

  /**
   * @return True if and only if this test only requires a single chunk to
   * be empty.
   * @java BitwiseTest.onlyRequiresSingleMustEmpty()
   */
  onlyRequiresSingleMustEmpty(): boolean;

  /**
   * @return True if and only if this test only requires a single chunk to be
   * owned by a specific player.
   * @java BitwiseTest.onlyRequiresSingleMustWho()
   */
  onlyRequiresSingleMustWho(): boolean;

  /**
   * @return True if and only if this test only requires a single chunk to
   * contain a specific component.
   * @java BitwiseTest.onlyRequiresSingleMustWhat()
   */
  onlyRequiresSingleMustWhat(): boolean;

  /**
   * @return GraphElementType that this test applies to
   * @java BitwiseTest.graphElementType()
   */
  graphElementType(): SiteType;

  //-------------------------------------------------------------------------
}
