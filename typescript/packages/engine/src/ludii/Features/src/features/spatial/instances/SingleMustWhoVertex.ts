// @java Features/src/features/spatial/instances/SingleMustWhoVertex.java

import { AtomicProposition, type Game, StateVectorTypes } from "./AtomicProposition.js";
import type { SiteType, State } from "./BitwiseTest.js";
import type { ChunkSet } from "../../../../../Common/src/main/collections/ChunkSet.js";

/**
 * A test that check for a single specific vertex that must be owned by a specific player
 *
 * @java features.spatial.instances.SingleMustWhoVertex
 * @author Dennis Soemers
 */
export class SingleMustWhoVertex extends AtomicProposition {

	//-------------------------------------------------------------------------

	/** The index of the word that we want to match */
	protected readonly _wordIdx: number;

	/** The mask that we want to apply to the word when matching */
	protected readonly _mask: bigint;

	/** The word that we should match after masking */
	protected readonly _matchingWord: bigint;

	/** The site we look at */
	protected readonly _site: number;

	/** The value we look for in chunkset */
	protected readonly _value: number;

	//-------------------------------------------------------------------------

	/**
	 * Constructor
	 * @param mustWhoSite
	 * @param mustWhoValue
	 * @param chunkSize
	 * @java SingleMustWhoVertex(int, int, int)
	 */
	constructor(mustWhoSite: number, mustWhoValue: number, chunkSize: number) {
		super();
		// Using same logic as ChunkSet.setChunk() here to determine wordIdx, mask, and matchingWord
		const bitIndex = mustWhoSite * chunkSize;
		this._wordIdx = bitIndex >> 6;

		const up = bitIndex & 63;
		this._mask = (((0x1n << BigInt(chunkSize)) - 1n) << BigInt(up));
		this._matchingWord = (BigInt(mustWhoValue) << BigInt(up));

		this._site = mustWhoSite;
		this._value = mustWhoValue;
	}

	//-------------------------------------------------------------------------

	/**
	 * @java SingleMustWhoVertex.matches(State)
	 */
	public override matches(state: State): boolean {
		return state.containerStates()[0]!.matchesWhoVertex(this._wordIdx, this._mask, this._matchingWord);
	}

	/**
	 * @java SingleMustWhoVertex.onlyRequiresSingleMustEmpty()
	 */
	public override onlyRequiresSingleMustEmpty(): boolean {
		return false;
	}

	/**
	 * @java SingleMustWhoVertex.onlyRequiresSingleMustWho()
	 */
	public override onlyRequiresSingleMustWho(): boolean {
		return true;
	}

	/**
	 * @java SingleMustWhoVertex.onlyRequiresSingleMustWhat()
	 */
	public override onlyRequiresSingleMustWhat(): boolean {
		return false;
	}

	/**
	 * @java SingleMustWhoVertex.graphElementType()
	 */
	public override graphElementType(): SiteType {
		return "Vertex";
	}

	/**
	 * @java SingleMustWhoVertex.addMaskTo(ChunkSet)
	 */
	public override addMaskTo(chunkSet: ChunkSet): void {
		(chunkSet as unknown as { addMask(wordIdx: number, mask: bigint): void }).addMask(this._wordIdx, this._mask);
	}

	/**
	 * @java SingleMustWhoVertex.stateVectorType()
	 */
	public override stateVectorType(): StateVectorTypes {
		return StateVectorTypes.Who;
	}

	/**
	 * @java SingleMustWhoVertex.testedSite()
	 */
	public override testedSite(): number {
		return this._site;
	}

	/**
	 * @java SingleMustWhoVertex.value()
	 */
	public override value(): number {
		return this._value;
	}

	/**
	 * @java SingleMustWhoVertex.negated()
	 */
	public override negated(): boolean {
		return false;
	}

	//-------------------------------------------------------------------------

	/**
	 * @java SingleMustWhoVertex.provesIfTrue(AtomicProposition, Game)
	 */
	public override provesIfTrue(other: AtomicProposition, game: Game): boolean {
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

	/**
	 * @java SingleMustWhoVertex.disprovesIfTrue(AtomicProposition, Game)
	 */
	public override disprovesIfTrue(other: AtomicProposition, game: Game): boolean {
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

	/**
	 * @java SingleMustWhoVertex.provesIfFalse(AtomicProposition, Game)
	 */
	public override provesIfFalse(other: AtomicProposition, _game: Game): boolean {
		if (this.graphElementType() !== other.graphElementType())
			return false;

		if (this.testedSite() !== other.testedSite())
			return false;

		// We prove not-who
		if (other.stateVectorType() === StateVectorTypes.Who)
			return (other.negated() && other.value() === this.value());

		// We prove not-what for any what owned by this player
		if (other.stateVectorType() === StateVectorTypes.What && other.negated())
			return (AtomicProposition.ownedComponentIDs(_game, this.value()).includes(other.value()));

		return false;
	}

	/**
	 * @java SingleMustWhoVertex.disprovesIfFalse(AtomicProposition, Game)
	 */
	public override disprovesIfFalse(other: AtomicProposition, game: Game): boolean {
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

	public hashCode(): number {
		const prime = 31;
		let result = 1;
		// Simulating Java's long hash: (int)(mask ^ (mask >>> 32))
		const maskHi = Number((this._mask >> 32n) & 0xffffffffn);
		const maskLo = Number(this._mask & 0xffffffffn);
		const mwHi = Number((this._matchingWord >> 32n) & 0xffffffffn);
		const mwLo = Number(this._matchingWord & 0xffffffffn);
		result = (prime * result + (maskLo ^ maskHi)) | 0;
		result = (prime * result + (mwLo ^ mwHi)) | 0;
		result = (prime * result + this._wordIdx) | 0;
		return result;
	}

	public equals(obj: unknown): boolean {
		if (this === obj)
			return true;

		if (!(obj instanceof SingleMustWhoVertex))
			return false;

		const other = obj as SingleMustWhoVertex;
		return (this._mask === other._mask && this._matchingWord === other._matchingWord && this._wordIdx === other._wordIdx);
	}

	public override toString(): string {
		return `[Vertex ${this._site} must be owned by Player ${this._value}]`;
	}

	//-------------------------------------------------------------------------
}
