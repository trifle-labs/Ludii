// @java Mining/src/gameDistance/datasets/sequence/MoveConceptDataset.java

import type { Dataset } from "../Dataset.js";
import type { GameLike, TreeLike } from "../../metrics/DistanceMetric.js";
import { DatasetUtils } from "../DatasetUtils.js";
import { Concept } from "../../../../../../ludemes/other/concept/Concept.js";
import type { Trial } from "../../../../../../trial.js";

/**
 * Dataset containing move concepts from trials.
 * - BagOfWords
 * - Sequence
 *
 * @java gameDistance.datasets.sequence.MoveConceptDataset
 * @author matthew.stephenson
 */
export class MoveConceptDataset implements Dataset {

	//-------------------------------------------------------------------------

	/**
	 * @java MoveConceptDataset.getBagOfWords(Game)
	 */
	public getBagOfWords(game: GameLike): Map<string, number> {
		const featureMap = new Map<string, number>();
		const gameTrials: Trial[] = DatasetUtils.getSavedTrials(game);

		const allConcepts: Concept[] = Object.values(Concept).filter(
			(v): v is Concept => typeof v === "number"
		);

		// Escape-hatch for game.start / game.apply
		const gameEx = game as unknown as {
			start(context: unknown): void;
			apply(context: unknown, move: unknown): void;
		};

		for (let i = 0; i < gameTrials.length; ++i) {
			const trial = gameTrials[i];
			if (!trial) continue;

			// new Trial(game) — use escape hatch
			const TrialCtor = (globalThis as unknown as { Trial?: new (game: GameLike) => Trial }).Trial;
			if (!TrialCtor) break;
			const newTrial = new TrialCtor(game);

			// new Context(game, newTrial) — use escape hatch
			const ContextCtor = (globalThis as unknown as { Context?: new (game: GameLike, trial: Trial) => unknown }).Context;
			if (!ContextCtor) break;
			const context = new ContextCtor(game, newTrial);

			gameEx.start(context);

			// gameMoveConceptSet simulates TIntArrayList with number[]
			const gameMoveConceptSet: number[] = [];
			for (let j = 0; j < allConcepts.length; j++)
				gameMoveConceptSet.push(0);

			const newTrialEx = newTrial as unknown as { numInitialPlacementMoves: number; numMoves: number };
			const trialEx = trial as unknown as { numMoves: number; getMove(o: number): unknown };

			for (let o = newTrialEx.numInitialPlacementMoves; o < trialEx.numMoves; o++) {
				const move = trialEx.getMove(o);
				// moveConceptsValue returns TIntArrayList — use escape hatch as number[]
				const moveConceptSet: number[] = (move as unknown as {
					moveConceptsValue(context: unknown): number[]
				}).moveConceptsValue(context);

				for (let j = 0; j < allConcepts.length; j++) {
					const cur = gameMoveConceptSet[j] ?? 0;
					const add = moveConceptSet[j] ?? 0;
					gameMoveConceptSet[j] = cur + add;
				}

				gameEx.apply(context, move);
			}

			for (let j = 0; j < gameMoveConceptSet.length; j++) {
				const concept = allConcepts[j];
				if (concept !== undefined)
					featureMap.set(Concept[concept], gameMoveConceptSet[j] ?? 0);
			}
		}

		return featureMap;
	}

	//-------------------------------------------------------------------------

	/**
	 * @java MoveConceptDataset.getSequence(Game)
	 */
	public getSequence(game: GameLike): string[] {
		const moveConceptSequence: string[] = [];
		const gameTrials: Trial[] = DatasetUtils.getSavedTrials(game);

		const gameEx = game as unknown as {
			start(context: unknown): void;
			apply(context: unknown, move: unknown): void;
		};

		// For now, just take the first trial.
		for (let i = 0; i < 1; ++i) {
			if (i >= gameTrials.length) break;
			const trial = gameTrials[i];
			if (!trial) break;

			const TrialCtor = (globalThis as unknown as { Trial?: new (game: GameLike) => Trial }).Trial;
			if (!TrialCtor) break;
			const newTrial = new TrialCtor(game);

			const ContextCtor = (globalThis as unknown as { Context?: new (game: GameLike, trial: Trial) => unknown }).Context;
			if (!ContextCtor) break;
			const context = new ContextCtor(game, newTrial);

			gameEx.start(context);

			const newTrialEx = newTrial as unknown as { numInitialPlacementMoves: number; numMoves: number };
			const trialEx = trial as unknown as { numMoves: number; getMove(o: number): unknown };

			const moveConceptSet: number[][] = [];
			for (let o = newTrialEx.numInitialPlacementMoves; o < trialEx.numMoves; o++) {
				const move = trialEx.getMove(o);
				moveConceptSet.push((move as unknown as {
					moveConceptsValue(context: unknown): number[]
				}).moveConceptsValue(context));
				gameEx.apply(context, move);
			}

			for (let j = 0; j < moveConceptSet.length; j++)
				moveConceptSequence.push((moveConceptSet[j] ?? []).toString());
		}

		return moveConceptSequence;
	}

	//-------------------------------------------------------------------------

	/**
	 * Not Supported
	 * @java MoveConceptDataset.getTree(Game)
	 */
	public getTree(_game: GameLike): TreeLike {
		return null as unknown as TreeLike;
	}

	//-------------------------------------------------------------------------

}
