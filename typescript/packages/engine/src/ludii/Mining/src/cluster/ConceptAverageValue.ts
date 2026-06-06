// @java Mining/src/cluster/ConceptAverageValue.java

import { Concept } from "../../../../ludemes/other/concept/Concept.js";

/**
 * A concept associated with a value.
 * Used to sort a list.
 *
 * @java cluster.ConceptAverageValue
 * @author Eric.Piette
 */
export class ConceptAverageValue {

	/**
	 * The concept.
	 * @java ConceptAverageValue.concept
	 */
	readonly concept: Concept;

	/**
	 * The value associated with the concept.
	 * @java ConceptAverageValue.value
	 */
	readonly value: number;

	/**
	 * @java ConceptAverageValue(Concept, double)
	 */
	public constructor(concept: Concept, value: number) {
		this.concept = concept;
		this.value = value;
	}

}
