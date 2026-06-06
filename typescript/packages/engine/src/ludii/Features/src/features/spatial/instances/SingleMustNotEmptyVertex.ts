// @java Features/src/features/spatial/instances/SingleMustNotEmptyVertex.java

import { AtomicProposition, type Game, StateVectorTypes } from "./AtomicProposition.js";
import type { SiteType, State } from "./BitwiseTest.js";
import type { ChunkSet } from "../../../../../Common/src/main/collections/ChunkSet.js";

/**
 * A test that check for a single specific vertex that must NOT be empty
 *
 * @java features.spatial.instances.SingleMustNotEmptyVertex
 * @author Dennis Soemers
 */
export class SingleMustNotEmptyVertex extends AtomicProposition {

	//-------------------------------------------------------------------------

	/** The site that must NOT be empty */
	protected readonly mustNotEmptySite: number;

	//-------------------------------------------------------------------------

	/**
	 * Constructor
	 * @param mustNotEmptySite
	 * @java SingleMustNotEmptyVertex(int)
	 */
	constructor(mustNotEmptySite: number) {
		super();
		this.mustNotEmptySite = mustNotEmptySite;
	}

	//-------------------------------------------------------------------------

	/**
	 * @java SingleMustNotEmptyVertex.matches(State)
	 */
	public override matches(state: State): boolean {
		return !state.containerStates()[0]!.emptyChunkSetVertex().get(this.mustNotEmptySite);
	}

	/**
	 * @java SingleMustNotEmptyVertex.onlyRequiresSingleMustEmpty()
	 */
	public override onlyRequiresSingleMustEmpty(): boolean {
		return false;
	}

	/**
	 * @java SingleMustNotEmptyVertex.onlyRequiresSingleMustWho()
	 */
	public override onlyRequiresSingleMustWho(): boolean {
		return false;
	}

	/**
	 * @java SingleMustNotEmptyVertex.onlyRequiresSingleMustWhat()
	 */
	public override onlyRequiresSingleMustWhat(): boolean {
		return false;
	}

	/**
	 * @java SingleMustNotEmptyVertex.graphElementType()
	 */
	public override graphElementType(): SiteType {
		return "Vertex";
	}

	/**
	 * @java SingleMustNotEmptyVertex.addMaskTo(ChunkSet)
	 */
	public override addMaskTo(chunkSet: ChunkSet): void {
		(chunkSet as unknown as { set(bit: number): void }).set(this.mustNotEmptySite);
	}

	/**
	 * @java SingleMustNotEmptyVertex.stateVectorType()
	 */
	public override stateVectorType(): StateVectorTypes {
		return StateVectorTypes.Empty;
	}

	/**
	 * @java SingleMustNotEmptyVertex.testedSite()
	 */
	public override testedSite(): number {
		return this.mustNotEmptySite;
	}

	/**
	 * @java SingleMustNotEmptyVertex.value()
	 */
	public override value(): number {
		return 1;
	}

	/**
	 * @java SingleMustNotEmptyVertex.negated()
	 */
	public override negated(): boolean {
		return true;
	}

	//-------------------------------------------------------------------------

	/**
	 * @java SingleMustNotEmptyVertex.provesIfTrue(AtomicProposition, Game)
	 */
	public override provesIfTrue(other: AtomicProposition, _game: Game): boolean {
		if (this.graphElementType() !== other.graphElementType())
			return false;

		if (this.testedSite() !== other.testedSite())
			return false;

		// If not empty, we prove not empty
		return (other.stateVectorType() === StateVectorTypes.Empty && other.negated());
	}

	/**
	 * @java SingleMustNotEmptyVertex.disprovesIfTrue(AtomicProposition, Game)
	 */
	public override disprovesIfTrue(other: AtomicProposition, _game: Game): boolean {
		if (this.graphElementType() !== other.graphElementType())
			return false;

		if (this.testedSite() !== other.testedSite())
			return false;

		// If not empty, we disprove empty
		return (other.stateVectorType() === StateVectorTypes.Empty && !other.negated());
	}

	/**
	 * @java SingleMustNotEmptyVertex.provesIfFalse(AtomicProposition, Game)
	 */
	public override provesIfFalse(other: AtomicProposition, _game: Game): boolean {
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

	/**
	 * @java SingleMustNotEmptyVertex.disprovesIfFalse(AtomicProposition, Game)
	 */
	public override disprovesIfFalse(other: AtomicProposition, _game: Game): boolean {
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

	public hashCode(): number {
		const prime = 31;
		let result = 1;
		result = (prime * result + this.mustNotEmptySite) | 0;
		return result;
	}

	public equals(obj: unknown): boolean {
		if (this === obj)
			return true;

		if (!(obj instanceof SingleMustNotEmptyVertex))
			return false;

		const other = obj as SingleMustNotEmptyVertex;
		return (this.mustNotEmptySite === other.mustNotEmptySite);
	}

	public override toString(): string {
		return `[Vertex ${this.mustNotEmptySite} must NOT be empty]`;
	}

	//-------------------------------------------------------------------------
}
