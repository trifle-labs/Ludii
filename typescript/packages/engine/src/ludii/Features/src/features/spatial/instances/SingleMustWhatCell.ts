// @java Features/src/features/spatial/instances/SingleMustWhatCell.java

import { AtomicProposition, StateVectorTypes, type Game } from "./AtomicProposition.js";
import type { ChunkSet } from "../../../../../Common/src/main/collections/ChunkSet.js";
import type { State } from "./BitwiseTest.js";

/**
 * A test that check for a single specific cell that must contain a specific value
 *
 * @java features/spatial/instances/SingleMustWhatCell.java
 * @author Dennis Soemers
 */
export class SingleMustWhatCell extends AtomicProposition {

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
   * @param mustWhatSite
   * @param mustWhatValue
   * @param chunkSize
   * @java SingleMustWhatCell(int, int, int)
   */
  public constructor(mustWhatSite: number, mustWhatValue: number, chunkSize: number) {
    super();
    // Using same logic as ChunkSet.setChunk() here to determine wordIdx, mask, and matchingWord
    const bitIndex = mustWhatSite * chunkSize;
    this.wordIdx = bitIndex >> 6;

    const up = bitIndex & 63;
    this.mask = ((0x1n << BigInt(chunkSize)) - 1n) << BigInt(up);
    this.matchingWord = BigInt(mustWhatValue) << BigInt(up);

    this.site = mustWhatSite;
    this._value = mustWhatValue;
  }

  //-------------------------------------------------------------------------

  /** @java SingleMustWhatCell.matches(State) */
  public matches(state: State): boolean {
    return state.containerStates()[0]!.matchesWhatCell(this.wordIdx, this.mask, this.matchingWord);
  }

  /** @java SingleMustWhatCell.onlyRequiresSingleMustEmpty() */
  public onlyRequiresSingleMustEmpty(): boolean {
    return false;
  }

  /** @java SingleMustWhatCell.onlyRequiresSingleMustWho() */
  public onlyRequiresSingleMustWho(): boolean {
    return false;
  }

  /** @java SingleMustWhatCell.onlyRequiresSingleMustWhat() */
  public onlyRequiresSingleMustWhat(): boolean {
    return true;
  }

  /** @java SingleMustWhatCell.graphElementType() */
  public graphElementType(): "Cell" | "Edge" | "Vertex" {
    return "Cell";
  }

  /** @java SingleMustWhatCell.addMaskTo(ChunkSet) */
  public addMaskTo(chunkSet: ChunkSet): void {
    chunkSet.addMask(this.wordIdx, this.mask);
  }

  /** @java SingleMustWhatCell.stateVectorType() */
  public stateVectorType(): StateVectorTypes {
    return StateVectorTypes.What;
  }

  /** @java SingleMustWhatCell.testedSite() */
  public testedSite(): number {
    return this.site;
  }

  /** @java SingleMustWhatCell.value() */
  public value(): number {
    return this._value;
  }

  /** @java SingleMustWhatCell.negated() */
  public negated(): boolean {
    return false;
  }

  //-------------------------------------------------------------------------

  /** @java SingleMustWhatCell.provesIfTrue(AtomicProposition, Game) */
  public provesIfTrue(other: AtomicProposition, game: Game): boolean {
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // True means we DO contain a specific piece, so we prove that we contain it and prove that we do NOT contain something else
    if (other.stateVectorType() === StateVectorTypes.What) {
      if (other.negated())
        return (this.value() !== other.value());
      else
        return (this.value() === other.value());
    }

    // We prove who for owner of piece type, and not who for any other player
    if (other.stateVectorType() === StateVectorTypes.Who) {
      if (other.negated())
        return (other.value() !== game.equipment().components()[this.value()]!.owner());
      else
        return (other.value() === game.equipment().components()[this.value()]!.owner());
    }

    // True means we DO contain a specific piece, so we prove not empty
    return (this.value() > 0 && other.stateVectorType() === StateVectorTypes.Empty && other.negated());
  }

  /** @java SingleMustWhatCell.disprovesIfTrue(AtomicProposition, Game) */
  public disprovesIfTrue(other: AtomicProposition, game: Game): boolean {
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // True means we DO contain a specific piece, so we disprove that we don't contain it, and disprove containing any other piece
    if (other.stateVectorType() === StateVectorTypes.What) {
      if (other.negated())
        return (this.value() === other.value());
      else
        return (this.value() !== other.value());
    }

    // We disprove not who for owner, and who for any other player
    if (other.stateVectorType() === StateVectorTypes.Who) {
      if (other.negated())
        return (other.value() === game.equipment().components()[this.value()]!.owner());
      else
        return (other.value() !== game.equipment().components()[this.value()]!.owner());
    }

    // True means we DO contain a specific piece, so we disprove empty
    return (this.value() > 0 && other.stateVectorType() === StateVectorTypes.Empty && !other.negated());
  }

  /** @java SingleMustWhatCell.provesIfFalse(AtomicProposition, Game) */
  public provesIfFalse(other: AtomicProposition, game: Game): boolean {
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // If this is the only piece type owned by its owner, we prove not-who for that owner
    if (AtomicProposition.ownerOnlyOwns(game, this.value()))
      return (other.stateVectorType() === StateVectorTypes.Who && other.negated() && other.value() === game.equipment().components()[this.value()]!.owner());

    return false;
  }

  /** @java SingleMustWhatCell.disprovesIfFalse(AtomicProposition, Game) */
  public disprovesIfFalse(other: AtomicProposition, game: Game): boolean {
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // If this is the only piece type owned by its owner, we disprove who for that owner
    if (AtomicProposition.ownerOnlyOwns(game, this.value()))
      return (other.stateVectorType() === StateVectorTypes.Who && !other.negated() && other.value() === game.equipment().components()[this.value()]!.owner());

    return false;
  }

  //-------------------------------------------------------------------------

  /** @java SingleMustWhatCell.hashCode() */
  public hashCode(): number {
    const prime = 31;
    let result = 1;
    result = prime * result + Number(this.mask & 0xffffffffn) ^ Number((this.mask >> 32n) & 0xffffffffn);
    result = prime * result + Number(this.matchingWord & 0xffffffffn) ^ Number((this.matchingWord >> 32n) & 0xffffffffn);
    result = prime * result + this.wordIdx;
    return result;
  }

  /** @java SingleMustWhatCell.equals(Object) */
  public equals(obj: unknown): boolean {
    if (this === obj)
      return true;

    if (!(obj instanceof SingleMustWhatCell))
      return false;

    return (this.mask === obj.mask && this.matchingWord === obj.matchingWord && this.wordIdx === obj.wordIdx);
  }

  /** @java SingleMustWhatCell.toString() */
  public override toString(): string {
    return "[Cell " + this.site + " must contain " + this._value + "]";
  }

  //-------------------------------------------------------------------------
}
