// @java Features/src/features/spatial/instances/OneOfMustEmpty.java

import type { BitwiseTest, SiteType, State } from "./BitwiseTest.js";
import type { ChunkSet } from "../../../../../Common/src/main/collections/ChunkSet.js";

/**
 * Extended ChunkSet interface with violatesNot method used by OneOfMustEmpty.
 * @java main.collections.ChunkSet
 */
interface ChunkSetExt {
	violatesNot(mustEmpties: ChunkSet, mask: ChunkSet, firstUsedWord: number): boolean;
	nextSetBit(fromIndex: number): number;
}

/**
 * Extended ContainerState interface with emptyChunkSet* methods.
 * @java other.state.container.ContainerState
 */
interface ContainerStateExt {
	emptyChunkSetCell(): ChunkSet;
	emptyChunkSetEdge(): ChunkSet;
	emptyChunkSetVertex(): ChunkSet;
}

/**
 * Simultaneously tests multiple chunks of the "empty" ChunkSet, returning
 * true if at least one of them is indeed empty.
 *
 * TODO could make special cases of this class for cells, vertices, and edges
 *
 * @java features.spatial.instances.OneOfMustEmpty
 * @author Dennis Soemers
 */
export class OneOfMustEmpty implements BitwiseTest {

	//-------------------------------------------------------------------------

	/** Set of chunks of which at least one must be empty for test to succeed */
	protected readonly _mustEmpties: ChunkSet;

	/** The first non-zero word in the mustEmpties ChunkSet */
	protected readonly _firstUsedWord: number;

	/** Graph element type we want to test on */
	protected readonly _graphElementType: SiteType;

	//-------------------------------------------------------------------------

	/**
	 * Constructor
	 * @param mustEmpties
	 * @param graphElementType
	 * @java OneOfMustEmpty(ChunkSet, SiteType)
	 */
	constructor(mustEmpties: ChunkSet, graphElementType: SiteType) {
		this._mustEmpties = mustEmpties;
		this._graphElementType = graphElementType;
		const cs = mustEmpties as unknown as ChunkSetExt;
		this._firstUsedWord = Math.floor(cs.nextSetBit(0) / 64);
	}

	//-------------------------------------------------------------------------

	/**
	 * @java OneOfMustEmpty.matches(State)
	 */
	public matches(state: State): boolean {
		const container = state.containerStates()[0]! as unknown as ContainerStateExt;
		let chunkSet: ChunkSet | null = null;
		switch (this._graphElementType) {
			case "Cell":
				chunkSet = container.emptyChunkSetCell();
				break;
			case "Vertex":
				chunkSet = container.emptyChunkSetVertex();
				break;
			case "Edge":
				chunkSet = container.emptyChunkSetEdge();
				break;
			default:
				chunkSet = null;
				break;
		}

		return (chunkSet as unknown as ChunkSetExt).violatesNot(this._mustEmpties, this._mustEmpties, this._firstUsedWord);
	}

	//-------------------------------------------------------------------------

	/**
	 * @java OneOfMustEmpty.hasNoTests()
	 */
	public hasNoTests(): boolean {
		return false;
	}

	/**
	 * @java OneOfMustEmpty.onlyRequiresSingleMustEmpty()
	 */
	public onlyRequiresSingleMustEmpty(): boolean {
		return true;
	}

	/**
	 * @java OneOfMustEmpty.onlyRequiresSingleMustWho()
	 */
	public onlyRequiresSingleMustWho(): boolean {
		return false;
	}

	/**
	 * @java OneOfMustEmpty.onlyRequiresSingleMustWhat()
	 */
	public onlyRequiresSingleMustWhat(): boolean {
		return false;
	}

	/**
	 * @java OneOfMustEmpty.graphElementType()
	 */
	public graphElementType(): SiteType {
		return this._graphElementType;
	}

	//-------------------------------------------------------------------------

	/**
	 * @return Chunks of which at least one must be empty
	 * @java OneOfMustEmpty.mustEmpties()
	 */
	public mustEmpties(): ChunkSet {
		return this._mustEmpties;
	}

	//-------------------------------------------------------------------------

	public toString(): string {
		let requirementsStr = "";

		const cs = this._mustEmpties as unknown as ChunkSetExt;
		for (let i = cs.nextSetBit(0); i >= 0; i = cs.nextSetBit(i + 1)) {
			requirementsStr += `${i}, `;
		}

		return `One of these must be empty: [${requirementsStr}]`;
	}

	//-------------------------------------------------------------------------
}
