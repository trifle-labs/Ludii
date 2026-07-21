// @java Features/src/features/spatial/instances/SingleMustWhatVertex.java

import { AtomicProposition, type Game, StateVectorTypes } from "./AtomicProposition.js";
import type { SiteType, State } from "./BitwiseTest.js";
import type { ChunkSet } from "../../../../../Common/src/main/collections/ChunkSet.js";

/**
 * A test that check for a single specific vertex that must contain a specific value
 *
 * @java features.spatial.instances.SingleMustWhatVertex
 * @author Dennis Soemers
 */
export class SingleMustWhatVertex extends AtomicProposition {

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
	 * @param mustWhatSite
	 * @param mustWhatValue
	 * @param chunkSize
	 * @java SingleMustWhatVertex(int, int, int)
	 */
	constructor(mustWhatSite: number, mustWhatValue: number, chunkSize: number) {
		super();
		// Using same logic as ChunkSet.setChunk() here to determine wordIdx, mask, and matchingWord
		const bitIndex = mustWhatSite * chunkSize;
		this._wordIdx = bitIndex >> 6;

		const up = bitIndex & 63;
		this._mask = (((0x1n << BigInt(chunkSize)) - 1n) << BigInt(up));
		this._matchingWord = (BigInt(mustWhatValue) << BigInt(up));

		this._site = mustWhatSite;
		this._value = mustWhatValue;
	}

	//-------------------------------------------------------------------------

	/**
	 * @java SingleMustWhatVertex.matches(State)
	 */
	public override matches(state: State): boolean {
		return state.containerStates()[0]!.matchesWhatVertex(this._wordIdx, this._mask, this._matchingWord);
	}

	/**
	 * @java SingleMustWhatVertex.onlyRequiresSingleMustEmpty()
	 */
	public override onlyRequiresSingleMustEmpty(): boolean {
		return false;
	}

	/**
	 * @java SingleMustWhatVertex.onlyRequiresSingleMustWho()
	 */
	public override onlyRequiresSingleMustWho(): boolean {
		return false;
	}

	/**
	 * @java SingleMustWhatVertex.onlyRequiresSingleMustWhat()
	 */
	public override onlyRequiresSingleMustWhat(): boolean {
		return true;
	}

	/**
	 * @java SingleMustWhatVertex.graphElementType()
	 */
	public override graphElementType(): SiteType {
		return "Vertex";
	}

	/**
	 * @java SingleMustWhatVertex.addMaskTo(ChunkSet)
	 */
	public override addMaskTo(chunkSet: ChunkSet): void {
		(chunkSet as unknown as { addMask(wordIdx: number, mask: bigint): void }).addMask(this._wordIdx, this._mask);
	}

	/**
	 * @java SingleMustWhatVertex.stateVectorType()
	 */
	public override stateVectorType(): StateVectorTypes {
		return StateVectorTypes.What;
	}

	/**
	 * @java SingleMustWhatVertex.testedSite()
	 */
	public override testedSite(): number {
		return this._site;
	}

	/**
	 * @java SingleMustWhatVertex.value()
	 */
	public override value(): number {
		return this._value;
	}

	/**
	 * @java SingleMustWhatVertex.negated()
	 */
	public override negated(): boolean {
		return false;
	}

	//-------------------------------------------------------------------------

	/**
	 * @java SingleMustWhatVertex.provesIfTrue(AtomicProposition, Game)
	 */
	public override provesIfTrue(other: AtomicProposition, game: Game): boolean {
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

	/**
	 * @java SingleMustWhatVertex.disprovesIfTrue(AtomicProposition, Game)
	 */
	public override disprovesIfTrue(other: AtomicProposition, game: Game): boolean {
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

	/**
	 * @java SingleMustWhatVertex.provesIfFalse(AtomicProposition, Game)
	 */
	public override provesIfFalse(other: AtomicProposition, game: Game): boolean {
		if (this.graphElementType() !== other.graphElementType())
			return false;

		if (this.testedSite() !== other.testedSite())
			return false;

		// If this is the only piece type owned by its owner, we prove not-who for that owner
		if (AtomicProposition.ownerOnlyOwns(game, this.value()))
			return (other.stateVectorType() === StateVectorTypes.Who && other.negated() && other.value() === game.equipment().components()[this.value()]!.owner());

		return false;
	}

	/**
	 * @java SingleMustWhatVertex.disprovesIfFalse(AtomicProposition, Game)
	 */
	public override disprovesIfFalse(other: AtomicProposition, game: Game): boolean {
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

	public hashCode(): number {
		const prime = 31;
		let result = 1;
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

		if (!(obj instanceof SingleMustWhatVertex))
			return false;

		const other = obj as SingleMustWhatVertex;
		return (this._mask === other._mask && this._matchingWord === other._matchingWord && this._wordIdx === other._wordIdx);
	}

	public override toString(): string {
		return `[Vertex ${this._site} must contain ${this._value}]`;
	}

	//-------------------------------------------------------------------------
}
