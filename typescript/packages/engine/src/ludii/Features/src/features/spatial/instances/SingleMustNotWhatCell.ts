// @java Features/src/features/spatial/instances/SingleMustNotWhatCell.java

import { AtomicProposition, StateVectorTypes, type Game } from "./AtomicProposition.js";
import type { ChunkSet } from "../../../../../Common/src/main/collections/ChunkSet.js";
import type { State } from "./BitwiseTest.js";

/**
 * A test that check for a single specific cell that must NOT contain a specific value
 *
 * @java features/spatial/instances/SingleMustNotWhatCell.java
 * @author Dennis Soemers
 */
export class SingleMustNotWhatCell extends AtomicProposition {

  //-------------------------------------------------------------------------

  /** The index of the word that we want to match */
  protected readonly wordIdx: number;

  /** The mask that we want to apply to the word when matching */
  protected readonly mask: bigint;

  /** The word that we should match after masking */
  protected readonly matchingWord: bigint;

  /** The site we look at */
  protected readonly site: number;

  /** The value we look for in chunkset */
  protected readonly _value: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param mustNotWhatSite
   * @param mustNotWhatValue
   * @param chunkSize
   * @java SingleMustNotWhatCell(int, int, int)
   */
  public constructor(mustNotWhatSite: number, mustNotWhatValue: number, chunkSize: number) {
    super();
    // Using same logic as ChunkSet.setChunk() here to determine wordIdx, mask, and matchingWord
    const bitIndex = mustNotWhatSite * chunkSize;
    this.wordIdx = bitIndex >> 6;

    const up = bitIndex & 63;
    this.mask = ((0x1n << BigInt(chunkSize)) - 1n) << BigInt(up);
    this.matchingWord = BigInt(mustNotWhatValue) << BigInt(up);

    this.site = mustNotWhatSite;
    this._value = mustNotWhatValue;
  }

  //-------------------------------------------------------------------------

  /** @java SingleMustNotWhatCell.matches(State) */
  public override matches(state: State): boolean {
    return !state.containerStates()[0]!.matchesWhatCell(this.wordIdx, this.mask, this.matchingWord);
  }

  /** @java SingleMustNotWhatCell.onlyRequiresSingleMustEmpty() */
  public onlyRequiresSingleMustEmpty(): boolean {
    return false;
  }

  /** @java SingleMustNotWhatCell.onlyRequiresSingleMustWho() */
  public onlyRequiresSingleMustWho(): boolean {
    return false;
  }

  /** @java SingleMustNotWhatCell.onlyRequiresSingleMustWhat() */
  public onlyRequiresSingleMustWhat(): boolean {
    return false;
  }

  /** @java SingleMustNotWhatCell.graphElementType() */
  public graphElementType(): "Cell" | "Edge" | "Vertex" {
    return "Cell";
  }

  /** @java SingleMustNotWhatCell.addMaskTo(ChunkSet) */
  public addMaskTo(chunkSet: ChunkSet): void {
    chunkSet.addMask(this.wordIdx, this.mask);
  }

  /** @java SingleMustNotWhatCell.stateVectorType() */
  public stateVectorType(): StateVectorTypes {
    return StateVectorTypes.What;
  }

  /** @java SingleMustNotWhatCell.testedSite() */
  public testedSite(): number {
    return this.site;
  }

  /** @java SingleMustNotWhatCell.value() */
  public value(): number {
    return this._value;
  }

  /** @java SingleMustNotWhatCell.negated() */
  public negated(): boolean {
    return true;
  }

  //-------------------------------------------------------------------------

  /** @java SingleMustNotWhatCell.provesIfTrue(AtomicProposition, Game) */
  public provesIfTrue(other: AtomicProposition, game: Game): boolean {
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // If the tested piece type is the only one owned by its player, we can
    // infer not who for that owner
    if (AtomicProposition.ownerOnlyOwns(game, this.value())) {
      // owner of piece doesn't own any other pieces, so can infer that Who is not equal to owner
      return (
        other.stateVectorType() === StateVectorTypes.Who &&
        other.negated() &&
        other.value() === game.equipment().components()[this.value()]!.owner()
      );
    }

    return false;
  }

  /** @java SingleMustNotWhatCell.disprovesIfTrue(AtomicProposition, Game) */
  public disprovesIfTrue(other: AtomicProposition, game: Game): boolean {
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // If the tested piece type is the only one owned by its player, we can
    // infer not who for that owner
    if (other.stateVectorType() === StateVectorTypes.Who && AtomicProposition.ownerOnlyOwns(game, this.value())) {
      // owner of piece doesn't own any other pieces, so can disprove that Who is equal to owner
      return (
        !other.negated() &&
        other.value() === game.equipment().components()[this.value()]!.owner()
      );
    }

    // Not containing a specific piece disproves that we contain that same specific piece
    return (other.stateVectorType() === StateVectorTypes.What && other.value() === this.value());
  }

  /** @java SingleMustNotWhatCell.provesIfFalse(AtomicProposition, Game) */
  public provesIfFalse(other: AtomicProposition, game: Game): boolean {
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // False means we DO contain a specific piece, so we prove that we contain it
    if (other.stateVectorType() === StateVectorTypes.What)
      return (!other.negated() && this.value() === other.value());

    // If we DO contain this specific piece, and if it's the only one owned by its owner, we prove who = owner
    if (other.stateVectorType() === StateVectorTypes.Who && AtomicProposition.ownerOnlyOwns(game, this.value()))
      return (!other.negated() && other.value() === game.equipment().components()[this.value()]!.owner());

    // False means we DO contain a specific piece, so we prove not empty
    return (this.value() > 0 && other.stateVectorType() === StateVectorTypes.Empty && other.negated());
  }

  /** @java SingleMustNotWhatCell.disprovesIfFalse(AtomicProposition, Game) */
  public disprovesIfFalse(other: AtomicProposition, game: Game): boolean {
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // False means we DO contain a specific piece, so we disprove that we don't contain it
    if (other.stateVectorType() === StateVectorTypes.What)
      return (other.negated() && this.value() === other.value());

    // If we DO contain this specific piece, and if it's the only one owned by its owner, we disprove who =/= owner
    if (other.stateVectorType() === StateVectorTypes.Who && AtomicProposition.ownerOnlyOwns(game, this.value()))
      return (other.negated() && other.value() === game.equipment().components()[this.value()]!.owner());

    // False means we DO contain a specific piece, so we disprove empty
    return (this.value() > 0 && other.stateVectorType() === StateVectorTypes.Empty && !other.negated());
  }

  //-------------------------------------------------------------------------

  /** @java SingleMustNotWhatCell.hashCode() */
  public hashCode(): number {
    const prime = 31;
    let result = 1;
    result = prime * result + (Number(this.mask & 0xffffffffn) ^ Number((this.mask >> 32n) & 0xffffffffn));
    result = prime * result + (Number(this.matchingWord & 0xffffffffn) ^ Number((this.matchingWord >> 32n) & 0xffffffffn));
    result = prime * result + this.wordIdx;
    return result;
  }

  /** @java SingleMustNotWhatCell.equals(Object) */
  public equals(obj: unknown): boolean {
    if (this === obj)
      return true;

    if (!(obj instanceof SingleMustNotWhatCell))
      return false;

    return (this.mask === obj.mask && this.matchingWord === obj.matchingWord && this.wordIdx === obj.wordIdx);
  }

  /** @java SingleMustNotWhatCell.toString() */
  public override toString(): string {
    return "[Cell " + this.site + " must NOT contain " + this._value + "]";
  }

  //-------------------------------------------------------------------------
}
