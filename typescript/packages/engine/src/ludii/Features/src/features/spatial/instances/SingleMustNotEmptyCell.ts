// @java Features/src/features/spatial/instances/SingleMustNotEmptyCell.java

import { AtomicProposition, StateVectorTypes, type Game } from "./AtomicProposition.js";
import type { ChunkSet } from "../../../../../Common/src/main/collections/ChunkSet.js";
import type { State } from "./BitwiseTest.js";

/**
 * A test that check for a single specific cell that must NOT be empty
 *
 * @java features/spatial/instances/SingleMustNotEmptyCell.java
 * @author Dennis Soemers
 */
export class SingleMustNotEmptyCell extends AtomicProposition {

  //-------------------------------------------------------------------------

  /** The site that must be empty */
  protected readonly mustNotEmptySite: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param mustNotEmptySite
   * @java SingleMustNotEmptyCell(int)
   */
  public constructor(mustNotEmptySite: number) {
    super();
    this.mustNotEmptySite = mustNotEmptySite;
  }

  //-------------------------------------------------------------------------

  /** @java SingleMustNotEmptyCell.matches(State) */
  public matches(state: State): boolean {
    return !state.containerStates()[0]!.emptyChunkSetCell().get(this.mustNotEmptySite);
  }

  /** @java SingleMustNotEmptyCell.onlyRequiresSingleMustEmpty() */
  public onlyRequiresSingleMustEmpty(): boolean {
    return false;
  }

  /** @java SingleMustNotEmptyCell.onlyRequiresSingleMustWho() */
  public onlyRequiresSingleMustWho(): boolean {
    return false;
  }

  /** @java SingleMustNotEmptyCell.onlyRequiresSingleMustWhat() */
  public onlyRequiresSingleMustWhat(): boolean {
    return false;
  }

  /** @java SingleMustNotEmptyCell.graphElementType() */
  public graphElementType(): "Cell" | "Edge" | "Vertex" {
    return "Cell";
  }

  /** @java SingleMustNotEmptyCell.addMaskTo(ChunkSet) */
  public addMaskTo(chunkSet: ChunkSet): void {
    chunkSet.set(this.mustNotEmptySite);
  }

  /** @java SingleMustNotEmptyCell.stateVectorType() */
  public stateVectorType(): StateVectorTypes {
    return StateVectorTypes.Empty;
  }

  /** @java SingleMustNotEmptyCell.testedSite() */
  public testedSite(): number {
    return this.mustNotEmptySite;
  }

  /** @java SingleMustNotEmptyCell.value() */
  public value(): number {
    return 1;
  }

  /** @java SingleMustNotEmptyCell.negated() */
  public negated(): boolean {
    return true;
  }

  //-------------------------------------------------------------------------

  /** @java SingleMustNotEmptyCell.provesIfTrue(AtomicProposition, Game) */
  public provesIfTrue(other: AtomicProposition, game: Game): boolean {
    void game;
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // If not empty, we prove not empty
    return (other.stateVectorType() === StateVectorTypes.Empty && other.negated());
  }

  /** @java SingleMustNotEmptyCell.disprovesIfTrue(AtomicProposition, Game) */
  public disprovesIfTrue(other: AtomicProposition, game: Game): boolean {
    void game;
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // If not empty, we disprove empty
    return (other.stateVectorType() === StateVectorTypes.Empty && !other.negated());
  }

  /** @java SingleMustNotEmptyCell.provesIfFalse(AtomicProposition, Game) */
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

  /** @java SingleMustNotEmptyCell.disprovesIfFalse(AtomicProposition, Game) */
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

  /** @java SingleMustNotEmptyCell.hashCode() */
  public hashCode(): number {
    const prime = 31;
    let result = 1;
    result = prime * result + this.mustNotEmptySite;
    return result;
  }

  /** @java SingleMustNotEmptyCell.equals(Object) */
  public equals(obj: unknown): boolean {
    if (this === obj)
      return true;

    if (!(obj instanceof SingleMustNotEmptyCell))
      return false;

    return (this.mustNotEmptySite === obj.mustNotEmptySite);
  }

  /** @java SingleMustNotEmptyCell.toString() */
  public override toString(): string {
    return "[Cell " + this.mustNotEmptySite + " must NOT be empty]";
  }

  //-------------------------------------------------------------------------
}
