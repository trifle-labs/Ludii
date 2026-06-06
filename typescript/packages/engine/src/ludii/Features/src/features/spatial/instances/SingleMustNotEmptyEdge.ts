// @java Features/src/features/spatial/instances/SingleMustNotEmptyEdge.java

import { AtomicProposition, StateVectorTypes, type Game } from "./AtomicProposition.js";
import type { ChunkSet } from "../../../../../Common/src/main/collections/ChunkSet.js";
import type { State } from "./BitwiseTest.js";

/**
 * A test that check for a single specific edge that must NOT be empty
 *
 * @java features/spatial/instances/SingleMustNotEmptyEdge.java
 * @author Dennis Soemers
 */
export class SingleMustNotEmptyEdge extends AtomicProposition {

  //-------------------------------------------------------------------------

  /** The site that must be empty */
  protected readonly mustNotEmptySite: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param mustNotEmptySite
   * @java SingleMustNotEmptyEdge(int)
   */
  public constructor(mustNotEmptySite: number) {
    super();
    this.mustNotEmptySite = mustNotEmptySite;
  }

  //-------------------------------------------------------------------------

  /** @java SingleMustNotEmptyEdge.matches(State) */
  public matches(state: State): boolean {
    return !state.containerStates()[0]!.emptyChunkSetEdge().get(this.mustNotEmptySite);
  }

  /** @java SingleMustNotEmptyEdge.onlyRequiresSingleMustEmpty() */
  public onlyRequiresSingleMustEmpty(): boolean {
    return false;
  }

  /** @java SingleMustNotEmptyEdge.onlyRequiresSingleMustWho() */
  public onlyRequiresSingleMustWho(): boolean {
    return false;
  }

  /** @java SingleMustNotEmptyEdge.onlyRequiresSingleMustWhat() */
  public onlyRequiresSingleMustWhat(): boolean {
    return false;
  }

  /** @java SingleMustNotEmptyEdge.graphElementType() */
  public graphElementType(): "Cell" | "Edge" | "Vertex" {
    return "Edge";
  }

  /** @java SingleMustNotEmptyEdge.addMaskTo(ChunkSet) */
  public addMaskTo(chunkSet: ChunkSet): void {
    chunkSet.set(this.mustNotEmptySite);
  }

  /** @java SingleMustNotEmptyEdge.stateVectorType() */
  public stateVectorType(): StateVectorTypes {
    return StateVectorTypes.Empty;
  }

  /** @java SingleMustNotEmptyEdge.testedSite() */
  public testedSite(): number {
    return this.mustNotEmptySite;
  }

  /** @java SingleMustNotEmptyEdge.value() */
  public value(): number {
    return 1;
  }

  /** @java SingleMustNotEmptyEdge.negated() */
  public negated(): boolean {
    return true;
  }

  //-------------------------------------------------------------------------

  /** @java SingleMustNotEmptyEdge.provesIfTrue(AtomicProposition, Game) */
  public provesIfTrue(other: AtomicProposition, game: Game): boolean {
    void game;
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // If not empty, we prove not empty
    return (other.stateVectorType() === StateVectorTypes.Empty && other.negated());
  }

  /** @java SingleMustNotEmptyEdge.disprovesIfTrue(AtomicProposition, Game) */
  public disprovesIfTrue(other: AtomicProposition, game: Game): boolean {
    void game;
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // If not empty, we disprove empty
    return (other.stateVectorType() === StateVectorTypes.Empty && !other.negated());
  }

  /** @java SingleMustNotEmptyEdge.provesIfFalse(AtomicProposition, Game) */
  public provesIfFalse(other: AtomicProposition, game: Game): boolean {
    void game;
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // If not not empty, we prove empty
    if (other.stateVectorType() === StateVectorTypes.Empty)
      return !other.negated();

    // If not not empty, we prove that it's not friend, not enemy, not piece 1, not piece 2, etc.
    return (other.stateVectorType() !== StateVectorTypes.Empty && other.value() > 0 && other.negated());
  }

  /** @java SingleMustNotEmptyEdge.disprovesIfFalse(AtomicProposition, Game) */
  public disprovesIfFalse(other: AtomicProposition, game: Game): boolean {
    void game;
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // If not not empty, we disprove not empty
    if (other.stateVectorType() === StateVectorTypes.Empty)
      return other.negated();

    // If not not empty, we disprove friend, enemy, piece 1, piece 2, etc.
    return (other.stateVectorType() !== StateVectorTypes.Empty && other.value() > 0 && !other.negated());
  }

  //-------------------------------------------------------------------------

  /** @java SingleMustNotEmptyEdge.hashCode() */
  public hashCode(): number {
    const prime = 31;
    let result = 1;
    result = prime * result + this.mustNotEmptySite;
    return result;
  }

  /** @java SingleMustNotEmptyEdge.equals(Object) */
  public equals(obj: unknown): boolean {
    if (this === obj)
      return true;

    if (!(obj instanceof SingleMustNotEmptyEdge))
      return false;

    return (this.mustNotEmptySite === obj.mustNotEmptySite);
  }

  /** @java SingleMustNotEmptyEdge.toString() */
  public override toString(): string {
    return "[Edge " + this.mustNotEmptySite + " must NOT be empty]";
  }

  //-------------------------------------------------------------------------
}
