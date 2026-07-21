// @java Features/src/features/spatial/instances/SingleMustWhoEdge.java

import { AtomicProposition, StateVectorTypes, type Game } from "./AtomicProposition.js";
import type { ChunkSet } from "../../../../../Common/src/main/collections/ChunkSet.js";
import type { State } from "./BitwiseTest.js";

/**
 * A test that check for a single specific edge that must be owned by a specific player
 *
 * @java features/spatial/instances/SingleMustWhoEdge.java
 * @author Dennis Soemers
 */
export class SingleMustWhoEdge extends AtomicProposition {

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
   * @param mustWhoSite
   * @param mustWhoValue
   * @param chunkSize
   * @java SingleMustWhoEdge(int, int, int)
   */
  public constructor(mustWhoSite: number, mustWhoValue: number, chunkSize: number) {
    super();
    // Using same logic as ChunkSet.setChunk() here to determine wordIdx, mask, and matchingWord
    const bitIndex = mustWhoSite * chunkSize;
    this.wordIdx = bitIndex >> 6;

    const up = bitIndex & 63;
    this.mask = ((0x1n << BigInt(chunkSize)) - 1n) << BigInt(up);
    this.matchingWord = BigInt(mustWhoValue) << BigInt(up);

    this.site = mustWhoSite;
    this._value = mustWhoValue;
  }

  //-------------------------------------------------------------------------

  /** @java SingleMustWhoEdge.matches(State) */
  public matches(state: State): boolean {
    return state.containerStates()[0]!.matchesWhoEdge(this.wordIdx, this.mask, this.matchingWord);
  }

  /** @java SingleMustWhoEdge.onlyRequiresSingleMustEmpty() */
  public onlyRequiresSingleMustEmpty(): boolean {
    return false;
  }

  /** @java SingleMustWhoEdge.onlyRequiresSingleMustWho() */
  public onlyRequiresSingleMustWho(): boolean {
    return true;
  }

  /** @java SingleMustWhoEdge.onlyRequiresSingleMustWhat() */
  public onlyRequiresSingleMustWhat(): boolean {
    return false;
  }

  /** @java SingleMustWhoEdge.graphElementType() */
  public graphElementType(): "Cell" | "Edge" | "Vertex" {
    return "Edge";
  }

  /** @java SingleMustWhoEdge.addMaskTo(ChunkSet) */
  public addMaskTo(chunkSet: ChunkSet): void {
    chunkSet.addMask(this.wordIdx, this.mask);
  }

  /** @java SingleMustWhoEdge.stateVectorType() */
  public stateVectorType(): StateVectorTypes {
    return StateVectorTypes.Who;
  }

  /** @java SingleMustWhoEdge.testedSite() */
  public testedSite(): number {
    return this.site;
  }

  /** @java SingleMustWhoEdge.value() */
  public value(): number {
    return this._value;
  }

  /** @java SingleMustWhoEdge.negated() */
  public negated(): boolean {
    return false;
  }

  //-------------------------------------------------------------------------

  /** @java SingleMustWhoEdge.provesIfTrue(AtomicProposition, Game) */
  public provesIfTrue(other: AtomicProposition, game: Game): boolean {
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // True means we DO contain player we look for
    if (other.stateVectorType() === StateVectorTypes.Who)
      return (!other.negated() && this.value() === other.value());

    // We prove not-what for any piece not owned by player, and also prove what if this player only owns a single piece type
    if (other.stateVectorType() === StateVectorTypes.What) {
      if (other.negated())
        return (game.equipment().components()[other.value()]!.owner() !== this.value());
      else
        return AtomicProposition.playerOnlyOwns(game, this.value(), other.value());
    }

    // True means we DO contain a specific player, so we prove not empty
    return (this.value() > 0 && other.stateVectorType() === StateVectorTypes.Empty && other.negated());
  }

  /** @java SingleMustWhoEdge.disprovesIfTrue(AtomicProposition, Game) */
  public disprovesIfTrue(other: AtomicProposition, game: Game): boolean {
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // True means we DO contain player we look for
    if (other.stateVectorType() === StateVectorTypes.Who)
      return (other.negated() && this.value() === other.value());

    // We disprove what for any piece not owned by player, and also disprove not-what for piece if player only owns a single piece type
    if (other.stateVectorType() === StateVectorTypes.What) {
      if (other.negated())
        return AtomicProposition.playerOnlyOwns(game, this.value(), other.value());
      else
        return (game.equipment().components()[other.value()]!.owner() !== this.value());
    }

    // True means we DO contain a specific player, so we disprove empty
    return (this.value() > 0 && other.stateVectorType() === StateVectorTypes.Empty && !other.negated());
  }

  /** @java SingleMustWhoEdge.provesIfFalse(AtomicProposition, Game) */
  public provesIfFalse(other: AtomicProposition, game: Game): boolean {
    void game;
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // We prove not-who
    if (other.stateVectorType() === StateVectorTypes.Who)
      return (other.negated() && other.value() === this.value());

    // We prove not-what for any what owned by this player
    if (other.stateVectorType() === StateVectorTypes.What && other.negated())
      return (AtomicProposition.ownedComponentIDs(game, this.value()).includes(other.value()));

    return false;
  }

  /** @java SingleMustWhoEdge.disprovesIfFalse(AtomicProposition, Game) */
  public disprovesIfFalse(other: AtomicProposition, game: Game): boolean {
    void game;
    if (this.graphElementType() !== other.graphElementType())
      return false;

    if (this.testedSite() !== other.testedSite())
      return false;

    // We disprove what for any what owned by this player
    if (other.stateVectorType() === StateVectorTypes.What && !other.negated())
      return (AtomicProposition.ownedComponentIDs(game, this.value()).includes(other.value()));

    return false;
  }

  //-------------------------------------------------------------------------

  /** @java SingleMustWhoEdge.hashCode() */
  public hashCode(): number {
    const prime = 31;
    let result = 1;
    result = prime * result + Number(this.mask & 0xffffffffn) ^ Number((this.mask >> 32n) & 0xffffffffn);
    result = prime * result + Number(this.matchingWord & 0xffffffffn) ^ Number((this.matchingWord >> 32n) & 0xffffffffn);
    result = prime * result + this.wordIdx;
    return result;
  }

  /** @java SingleMustWhoEdge.equals(Object) */
  public equals(obj: unknown): boolean {
    if (this === obj)
      return true;

    if (!(obj instanceof SingleMustWhoEdge))
      return false;

    return (this.mask === obj.mask && this.matchingWord === obj.matchingWord && this.wordIdx === obj.wordIdx);
  }

  /** @java SingleMustWhoEdge.toString() */
  public override toString(): string {
    return "[Edge " + this.site + " must be owned by Player " + this._value + "]";
  }

  //-------------------------------------------------------------------------
}
