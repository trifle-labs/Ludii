// @java Features/src/features/spatial/instances/OneOfMustWhat.java

import type { BitwiseTest, SiteType, State } from "./BitwiseTest.js";
import type { ChunkSet } from "../../../../../Common/src/main/collections/ChunkSet.js";

/**
 * Extended ContainerState interface with violatesNotWhat methods used by OneOfMustWhat.
 * @java other.state.container.ContainerState
 */
interface ContainerStateExt {
	violatesNotWhatCell(mustWhatsMask: ChunkSet, mustWhats: ChunkSet, firstUsedWord: number): boolean;
	violatesNotWhatVertex(mustWhatsMask: ChunkSet, mustWhats: ChunkSet, firstUsedWord: number): boolean;
	violatesNotWhatEdge(mustWhatsMask: ChunkSet, mustWhats: ChunkSet, firstUsedWord: number): boolean;
}

/**
 * Simultaneously tests multiple chunks of the "what" ChunkSet.
 *
 * TODO could make special cases of this class for cells, vertices, and edges
 *
 * @java features.spatial.instances.OneOfMustWhat
 * @author Dennis Soemers
 */
export class OneOfMustWhat implements BitwiseTest {

	//-------------------------------------------------------------------------

	/**
	 * Set of chunks of which at least one must match game state's What
	 * ChunkSet for test to succeed.
	 */
	protected readonly _mustWhats: ChunkSet;

	/** Mask for must-what tests */
	protected readonly _mustWhatsMask: ChunkSet;

	/** The first non-zero word in the mustWhatsMask ChunkSet */
	protected readonly _firstUsedWord: number;

	/** Graph element type we want to test on */
	protected readonly _graphElementType: SiteType;

	//-------------------------------------------------------------------------

	/**
	 * Constructor
	 * @param mustWhats
	 * @param mustWhatsMask
	 * @param graphElementType
	 * @java OneOfMustWhat(ChunkSet, ChunkSet, SiteType)
	 */
	constructor(mustWhats: ChunkSet, mustWhatsMask: ChunkSet, graphElementType: SiteType) {
		this._mustWhats = mustWhats;
		this._mustWhatsMask = mustWhatsMask;
		this._graphElementType = graphElementType;
		const cs = mustWhatsMask as unknown as { nextSetBit(fromIndex: number): number };
		this._firstUsedWord = Math.floor(cs.nextSetBit(0) / 64);
	}

	//-------------------------------------------------------------------------

	/**
	 * @java OneOfMustWhat.matches(State)
	 */
	public matches(state: State): boolean {
		const container = state.containerStates()[0]! as unknown as ContainerStateExt;
		switch (this._graphElementType) {
			case "Cell":
				return container.violatesNotWhatCell(this._mustWhatsMask, this._mustWhats, this._firstUsedWord);
			case "Vertex":
				return container.violatesNotWhatVertex(this._mustWhatsMask, this._mustWhats, this._firstUsedWord);
			case "Edge":
				return container.violatesNotWhatEdge(this._mustWhatsMask, this._mustWhats, this._firstUsedWord);
			default:
				break;
		}

		return false;
	}

	//-------------------------------------------------------------------------

	/**
	 * @java OneOfMustWhat.hasNoTests()
	 */
	public hasNoTests(): boolean {
		return false;
	}

	/**
	 * @java OneOfMustWhat.onlyRequiresSingleMustEmpty()
	 */
	public onlyRequiresSingleMustEmpty(): boolean {
		return false;
	}

	/**
	 * @java OneOfMustWhat.onlyRequiresSingleMustWho()
	 */
	public onlyRequiresSingleMustWho(): boolean {
		return true;
	}

	/**
	 * @java OneOfMustWhat.onlyRequiresSingleMustWhat()
	 */
	public onlyRequiresSingleMustWhat(): boolean {
		return false;
	}

	/**
	 * @java OneOfMustWhat.graphElementType()
	 */
	public graphElementType(): SiteType {
		return this._graphElementType;
	}

	//-------------------------------------------------------------------------

	/**
	 * @return mustWhats ChunkSet
	 * @java OneOfMustWhat.mustWhats()
	 */
	public mustWhats(): ChunkSet {
		return this._mustWhats;
	}

	/**
	 * @return mustWhatsMask ChunkSet
	 * @java OneOfMustWhat.mustWhatsMask()
	 */
	public mustWhatsMask(): ChunkSet {
		return this._mustWhatsMask;
	}

	//-------------------------------------------------------------------------

	public toString(): string {
		let requirementsStr = "";

		const cs = this._mustWhats as unknown as {
			numChunks(): number;
			getChunk(i: number): number;
		};
		const mask = this._mustWhatsMask as unknown as {
			getChunk(i: number): number;
		};

		for (let i = 0; i < cs.numChunks(); ++i) {
			if (mask.getChunk(i) !== 0) {
				requirementsStr += `${i} must contain ${cs.getChunk(i)}, `;
			}
		}

		return `One of these what-conditions must hold: [${requirementsStr}]`;
	}

	//-------------------------------------------------------------------------
}
