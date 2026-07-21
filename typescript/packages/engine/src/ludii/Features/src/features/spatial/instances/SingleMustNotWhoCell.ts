// @java Features/src/features/spatial/instances/SingleMustNotWhoCell.java

import { AtomicProposition, StateVectorTypes, type Game } from "./AtomicProposition.js";
import type { ChunkSet } from "../../../../../Common/src/main/collections/ChunkSet.js";
import type { State } from "./BitwiseTest.js";

/**
 * A test that check for a single specific cell that must be not owned by a specific player
 *
 * @java features/spatial/instances/SingleMustNotWhoCell.java
 * @author Dennis Soemers
 */
export class SingleMustNotWhoCell extends AtomicProposition {

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
   * @param mustNotWhoSite
   * @param mustNotWhoValue
   * @param chunkSize
   * @java SingleMustNotWhoCell(int, int, int)
   */
  public constructor(mustNotWhoSite: number, mustNotWhoValue: number, chunkSize: number) {
    super();
    // Using same logic as ChunkSet.setChunk() here to determine wordIdx, mask, and matchingWord
    const bitIndex = mustNotWhoSite * chunkSize;
    this.wordIdx = bitIndex >> 6;

    const up = bitIndex & 63;
    this.mask = ((0x1n << BigInt(chunkSize)) - 1n) << BigInt(up);
    this.matchingWord = BigInt(mustNotWhoValue) << BigInt(up);

    this.site = mustNotWhoSite;
    this._value = mustNotWhoValue;
  }

  //-------------------------------------------------------------------------

  /** @java SingleMustNotWhoCell.matches(State) */
  public matches(state: State): boolean {
    return !state.containerStates()[0]!.matchesWhoCell(this.wordIdx, this.mask, this.matchingWord);
  }

  /** @java SingleMustNotWhoCell.onlyRequiresSingleMustEmpty() */
  public onlyRequiresSingleMustEmpty(): boolean {
    return false;
  }

  /** @java SingleMustNotWhoCell.onlyRequiresSingleMustWho() */
  public onlyRequiresSingleMustWho(): boolean {
    return false;
  }

  /** @java SingleMustNotWhoCell.onlyRequiresSingleMustWhat() */
  public onlyRequiresSingleMustWhat(): boolean {
    return false;
  }

  /** @java SingleMustNotWhoCell.graphElementType() */
  public graphElementType(): "Cell" | "Edge" | "Vertex" {
    return "Cell";
  }

  /** @java SingleMustNotWhoCell.addMaskTo(ChunkSet) */
  public addMaskTo(chunkSet: ChunkSet): void {
    chunkSet.addMask(this.wordIdx, this.mask);
  }

  /** @java SingleMustNotWhoCell.stateVectorType() */
  public stateVectorType(): StateVectorTypes {
    return StateVectorTypes.Who;
  }

  /** @java SingleMustNotWhoCell.testedSite() */
  public testedSite(): number {
    return this.site;
  }

  /** @java SingleMustNotWhoCell.value() */
  public value(): number {
    return this._value;
  }

  /** @java SingleMustNotWhoCell.negated() */
  public negated(): boolean {
    return true;
  }

  //-------------------------------------------------------------------------

  /** @java SingleMustNotWhoCell.provesIfTrue(AtomicProposition, Game) */
  public provesIfTrue(other: AtomicProposition, game: Game): boolean {
    void game;
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // If not who is true, we also prove not what for any what owned by the player
    if (other.stateVectorType() === StateVectorTypes.What && other.negated())
      return (AtomicProposition.ownedComponentIDs(game, this.value()).includes(other.value()));

    return false;
  }

  /** @java SingleMustNotWhoCell.disprovesIfTrue(AtomicProposition, Game) */
  public disprovesIfTrue(other: AtomicProposition, game: Game): boolean {
    void game;
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // If not who is true, we disprove what for any what owned by the player
    if (other.stateVectorType() === StateVectorTypes.What && !other.negated())
      return (AtomicProposition.ownedComponentIDs(game, this.value()).includes(other.value()));

    // Not containing a specific player disproves that we contain that same specific player
    return (other.stateVectorType() === StateVectorTypes.Who && other.value() === this.value());
  }

  /** @java SingleMustNotWhoCell.provesIfFalse(AtomicProposition, Game) */
  public provesIfFalse(other: AtomicProposition, game: Game): boolean {
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // False means we DO contain player we look for
    if (other.stateVectorType() === StateVectorTypes.Who)
      return (!other.negated() && this.value() === other.value());

    // If the tested player only owns a single piece type, we also prove what for that piece type
    if (other.stateVectorType() === StateVectorTypes.What && !other.negated())
      return (AtomicProposition.playerOnlyOwns(game, this.value(), other.value()));

    // We prove not-what for any what not owned by player
    if (other.stateVectorType() === StateVectorTypes.What && other.negated())
      return (!AtomicProposition.ownedComponentIDs(game, this.value()).includes(other.value()));

    // False means we DO contain a specific player, so we prove not empty
    return (this.value() > 0 && other.stateVectorType() === StateVectorTypes.Empty && other.negated());
  }

  /** @java SingleMustNotWhoCell.disprovesIfFalse(AtomicProposition, Game) */
  public disprovesIfFalse(other: AtomicProposition, game: Game): boolean {
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // False means we DO contain player we look for
    if (other.stateVectorType() === StateVectorTypes.Who)
      return (other.negated() && this.value() === other.value());

    // If player owns only a single piece type, we disprove not-what for that piece type
    if (other.stateVectorType() === StateVectorTypes.What && other.negated())
      return (AtomicProposition.playerOnlyOwns(game, this.value(), other.value()));

    // We disprove what for any what not owned by this player
    if (other.stateVectorType() === StateVectorTypes.What && !other.negated())
      return (!AtomicProposition.ownedComponentIDs(game, this.value()).includes(other.value()));

    // False means we DO contain a specific player, so we disprove empty
    return (this.value() > 0 && other.stateVectorType() === StateVectorTypes.Empty && !other.negated());
  }

  //-------------------------------------------------------------------------

  /** @java SingleMustNotWhoCell.hashCode() */
  public hashCode(): number {
    const prime = 31;
    let result = 1;
    result = prime * result + Number(this.mask & 0xffffffffn) ^ Number((this.mask >> 32n) & 0xffffffffn);
    result = prime * result + Number(this.matchingWord & 0xffffffffn) ^ Number((this.matchingWord >> 32n) & 0xffffffffn);
    result = prime * result + this.wordIdx;
    return result;
  }

  /** @java SingleMustNotWhoCell.equals(Object) */
  public equals(obj: unknown): boolean {
    if (this === obj)
      return true;

    if (!(obj instanceof SingleMustNotWhoCell))
      return false;

    return (this.mask === obj.mask && this.matchingWord === obj.matchingWord && this.wordIdx === obj.wordIdx);
  }

  /** @java SingleMustNotWhoCell.toString() */
  public override toString(): string {
    return "[Cell " + this.site + " must NOT be owned by Player " + this._value + "]";
  }

  //-------------------------------------------------------------------------
}
