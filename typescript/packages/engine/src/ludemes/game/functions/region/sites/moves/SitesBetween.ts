// @java Core/src/game/functions/region/sites/moves/SitesBetween.java

/**
 * Returns the "between" sites of a set of moves.
 *
 * @java game/functions/region/sites/moves/SitesBetween.java
 * @author Eric Piette
 */

import type { Context } from "../../../../../../context.js";
import type { MovesFunction, EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/** Minimal Move surface used here. */
interface MoveLike {
	betweenNonDecision?(): number[];
	/** Fallback: _between field directly. */
	_between?: number[];
}

/**
 * Returns the "between" sites of a set of moves.
 *
 * Java parity: SitesBetween.eval(context) evaluates the moves and collects
 * all betweenNonDecision() sites from each generated move.
 *
 * @java game/functions/region/sites/moves/SitesBetween.java
 */
export class SitesBetween extends BaseRegionFunction {
	/** The moves from which to take between-sites. */
	private readonly moves: MovesFunction;

	/**
	 * @param moves The moves from which to take between-sites.
	 * @java SitesBetween(Moves)
	 */
	public constructor(moves: MovesFunction) {
		super();
		this.moves = moves;
	}

	/**
	 * @java SitesBetween.eval(Context)
	 *
	 * Returns all between-non-decision sites from the generated moves.
	 */
	public override eval(context: Context & EvalScratch): number[] {
		const sites: number[] = [];

		// @java final Moves generatedMoves = moves.eval(context)
		const generatedMoves = this.moves.eval(context);

		// @java for (final Move m : generatedMoves.moves()) sites.addAll(m.betweenNonDecision())
		// generatedMoves is a Move[] or { moves(): MoveLike[] }
		let moveList: MoveLike[];
		if (Array.isArray(generatedMoves)) {
			moveList = generatedMoves as unknown as MoveLike[];
		} else {
			const movesObj = generatedMoves as unknown as { moves?: () => MoveLike[] };
			moveList = movesObj.moves?.() ?? [];
		}

		for (const m of moveList) {
			let between: number[];
			if (typeof m.betweenNonDecision === "function") {
				between = m.betweenNonDecision();
			} else if (Array.isArray(m._between)) {
				between = m._between;
			} else {
				between = [];
			}
			for (const site of between) {
				sites.push(site);
			}
		}

		return sites;
	}

	/** @java SitesBetween.isStatic() */
	public override isStatic(): boolean {
		return (this.moves as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
	}

	/** @java SitesBetween.toString() */
	public override toString(): string {
		return "SitesBetween()";
	}
}
