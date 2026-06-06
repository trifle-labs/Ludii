// @java Mining/src/gameDistance/datasets/bagOfWords/CompilationConceptDataset.java

import type { Dataset } from "../Dataset.js";
import type { GameLike, TreeLike } from "../../metrics/DistanceMetric.js";
import { Concept, conceptId } from "../../../../../../ludemes/other/concept/Concept.js";
import { ConceptComputationType } from "../../../../../../ludemes/other/concept/ConceptComputationType.js";
import { ConceptDataType } from "../../../../../../ludemes/other/concept/ConceptDataType.js";

/**
 * Dataset containing compilation concepts.
 * - BagOfWords
 *
 * @java gameDistance.datasets.bagOfWords.CompilationConceptDataset
 * @author matthew.stephenson
 */
export class CompilationConceptDataset implements Dataset {

	/**
	 * @java CompilationConceptDataset.getBagOfWords(Game)
	 */
	public getBagOfWords(game: GameLike): Map<string, number> {
		const featureMap = new Map<string, number>();

		const gameWithConcepts = game as unknown as {
			booleanConcepts(): { get(id: number): boolean };
			nonBooleanConcepts(): Map<number, number>;
		};

		const allConcepts: Concept[] = Object.values(Concept).filter(
			(v): v is Concept => typeof v === "number"
		);

		for (let i = 0; i < allConcepts.length; i++) {
			const concept = allConcepts[i];
			if (concept === undefined) continue;

			// Java: concept.computationType().equals(ConceptComputationType.Compilation)
			// The TS enum Concept is a numeric enum; computationType is not a method on Concept values.
			// We use escape hatch: concept may have a computationType() method at runtime,
			// or we default to Compilation as per the TS placeholder.
			const computationType: ConceptComputationType = (concept as unknown as {
				computationType?(): ConceptComputationType
			}).computationType?.() ?? ConceptComputationType.Compilation;

			if (computationType !== ConceptComputationType.Compilation)
				continue;

			const dataType: ConceptDataType = (concept as unknown as {
				dataType?(): ConceptDataType
			}).dataType?.() ?? ConceptDataType.BooleanData;

			const id = conceptId(concept);

			if (dataType === ConceptDataType.BooleanData) {
				if (gameWithConcepts.booleanConcepts().get(id))
					featureMap.set(Concept[concept], 1.0);
				else
					featureMap.set(Concept[concept], 0.0);
			} else if (dataType === ConceptDataType.DoubleData || dataType === ConceptDataType.IntegerData) {
				featureMap.set(Concept[concept], gameWithConcepts.nonBooleanConcepts().get(id) ?? 0.0);
			} else {
				console.log("ERROR, the following concept has an invalid type " + String(concept));
			}
		}

		return featureMap;
	}

	/**
	 * Not Supported
	 * @java CompilationConceptDataset.getSequence(Game)
	 */
	public getSequence(_game: GameLike): string[] {
		return null as unknown as string[];
	}

	/**
	 * Not Supported
	 * @java CompilationConceptDataset.getTree(Game)
	 */
	public getTree(_game: GameLike): TreeLike {
		return null as unknown as TreeLike;
	}

}
