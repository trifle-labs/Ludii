// @java Features/src/features/spatial/instances/SingleMustEmptyCell.java

import { AtomicProposition, type Game, StateVectorTypes } from "./AtomicProposition.js";
import type { SiteType, State } from "./BitwiseTest.js";
import type { ChunkSet } from "../../../../../Common/src/main/collections/ChunkSet.js";

/**
 * A test that check for a single specific cell that must be empty
 *
 * @java features.spatial.instances.SingleMustEmptyCell
 * @author Dennis Soemers
 */
export class SingleMustEmptyCell extends AtomicProposition {

	//-------------------------------------------------------------------------

	/** The site that must be empty */
	protected readonly mustEmptySite: number;

	//-------------------------------------------------------------------------

	/**
	 * Constructor
	 * @param mustEmptySite
	 * @java SingleMustEmptyCell(int)
	 */
	constructor(mustEmptySite: number) {
		super();
		this.mustEmptySite = mustEmptySite;
	}

	//-------------------------------------------------------------------------

	/**
	 * @java SingleMustEmptyCell.matches(State)
	 */
	public override matches(state: State): boolean {
		return state.containerStates()[0]!.emptyChunkSetCell().get(this.mustEmptySite);
	}

	/**
	 * @java SingleMustEmptyCell.onlyRequiresSingleMustEmpty()
	 */
	public override onlyRequiresSingleMustEmpty(): boolean {
		return true;
	}

	/**
	 * @java SingleMustEmptyCell.onlyRequiresSingleMustWho()
	 */
	public override onlyRequiresSingleMustWho(): boolean {
		return false;
	}

	/**
	 * @java SingleMustEmptyCell.onlyRequiresSingleMustWhat()
	 */
	public override onlyRequiresSingleMustWhat(): boolean {
		return false;
	}

	/**
	 * @java SingleMustEmptyCell.graphElementType()
	 */
	public override graphElementType(): SiteType {
		return "Cell";
	}

	/**
	 * @java SingleMustEmptyCell.addMaskTo(ChunkSet)
	 */
	public override addMaskTo(chunkSet: ChunkSet): void {
		(chunkSet as unknown as { set(bit: number): void }).set(this.mustEmptySite);
	}

	/**
	 * @java SingleMustEmptyCell.stateVectorType()
	 */
	public override stateVectorType(): StateVectorTypes {
		return StateVectorTypes.Empty;
	}

	/**
	 * @java SingleMustEmptyCell.testedSite()
	 */
	public override testedSite(): number {
		return this.mustEmptySite;
	}

	/**
	 * @java SingleMustEmptyCell.value()
	 */
	public override value(): number {
		return 1;
	}

	/**
	 * @java SingleMustEmptyCell.negated()
	 */
	public override negated(): boolean {
		return false;
	}

	//-------------------------------------------------------------------------

	/**
	 * @java SingleMustEmptyCell.provesIfTrue(AtomicProposition, Game)
	 */
	public override provesIfTrue(other: AtomicProposition, _game: Game): boolean {
		if (this.graphElementType() !== other.graphElementType())
			return false;

		if (this.testedSite() !== other.testedSite())
			return false;

		// If empty, we prove the same (equal prop, probably shouldn't happen)
		if (other.stateVectorType() === StateVectorTypes.Empty)
			return !other.negated();

		// If empty, we prove that it's not friend, not enemy, not piece 1, not piece 2, etc.
		return (other.stateVectorType() !== StateVectorTypes.Empty && other.value() > 0 && other.negated());
	}

	/**
	 * @java SingleMustEmptyCell.disprovesIfTrue(AtomicProposition, Game)
	 */
	public override disprovesIfTrue(other: AtomicProposition, _game: Game): boolean {
		if (this.graphElementType() !== other.graphElementType())
			return false;

		if (this.testedSite() !== other.testedSite())
			return false;

		// If empty, we disprove not empty
		if (other.stateVectorType() === StateVectorTypes.Empty)
			return other.negated();

		// If empty, we disprove friend, enemy, piece 1, piece 2, etc.
		return (other.stateVectorType() !== StateVectorTypes.Empty && other.value() > 0 && !other.negated());
	}

	/**
	 * @java SingleMustEmptyCell.provesIfFalse(AtomicProposition, Game)
	 */
	public override provesIfFalse(other: AtomicProposition, _game: Game): boolean {
		if (this.graphElementType() !== other.graphElementType())
			return false;

		if (this.testedSite() !== other.testedSite())
			return false;

		// If not empty, we prove not empty
		return (other.stateVectorType() === StateVectorTypes.Empty && other.negated());
	}

	/**
	 * @java SingleMustEmptyCell.disprovesIfFalse(AtomicProposition, Game)
	 */
	public override disprovesIfFalse(other: AtomicProposition, _game: Game): boolean {
		if (this.graphElementType() !== other.graphElementType())
			return false;

		if (this.testedSite() !== other.testedSite())
			return false;

		return false;
	}

	//-------------------------------------------------------------------------

	public hashCode(): number {
		const prime = 31;
		let result = 1;
		result = (prime * result + this.mustEmptySite) | 0;
		return result;
	}

	public equals(obj: unknown): boolean {
		if (this === obj)
			return true;

		if (!(obj instanceof SingleMustEmptyCell))
			return false;

		const other = obj as SingleMustEmptyCell;
		return (this.mustEmptySite === other.mustEmptySite);
	}

	public override toString(): string {
		return `[Cell ${this.mustEmptySite} must be empty]`;
	}

	//-------------------------------------------------------------------------
}
