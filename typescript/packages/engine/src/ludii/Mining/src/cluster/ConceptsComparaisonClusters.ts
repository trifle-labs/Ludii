// @java Mining/src/cluster/ConceptsComparaisonClusters.java

import { fs } from "../../../node-shim/fs-lazy.js";
import { GameLoader, type IGame } from "../../../../ludemes/other/GameLoader.js";
import { FileHandling } from "../../../Common/src/main/FileHandling.js";
import { StringRoutines } from "../../../Common/src/main/StringRoutines.js";
import { UnixPrintWriter } from "../../../Common/src/main/UnixPrintWriter.js";
import { Concept } from "../../../../ludemes/other/concept/Concept.js";
import { ConceptComputationType } from "../../../../ludemes/other/concept/ConceptComputationType.js";
import { ConceptDataType } from "../../../../ludemes/other/concept/ConceptDataType.js";
import { ConceptType } from "../../../../ludemes/other/concept/ConceptType.js";
import { conceptType as getConceptType } from "../../../../ludemes/other/concept/Concept.js";
import { conceptDataType as getConceptDataType } from "../../../../ludemes/other/concept/Concept.js";
import { conceptComputationType as getConceptComputationType } from "../../../../ludemes/other/concept/Concept.js";
import { ConceptAverageValue } from "./ConceptAverageValue.js";

// RulesetNames is not yet ported; use escape hatch
type IRulesetNames = { gameRulesetName: (game: IGame) => string };
const RulesetNames = (globalThis as unknown as { RulesetNames?: IRulesetNames }).RulesetNames;

/**
 * Generate the percentage of concepts from a list of rulesets.
 *
 * @java cluster.ConceptsComparaisonClusters
 * @author Eric.Piette
 */
export class ConceptsComparaisonClusters {

	/** @java ConceptsComparaisonClusters.pathFile */
	static readonly pathFile: string = "./res/cluster/input/clusters/";
	/** @java ConceptsComparaisonClusters.csv */
	static readonly csv: string = ".csv";
	/** @java ConceptsComparaisonClusters.outputConcept */
	static readonly outputConcept: string = "ConceptsForCluster.csv";

	/**
	 * Main method to call the reconstruction with command lines.
	 * @java ConceptsComparaisonClusters.main(String[])
	 */
	public static main(_args: string[]): void {
		const clusters: string[] = [
			"Cluster1.1", "Cluster1.2", "Cluster1.3", "Cluster1.4", "Cluster1.5", "Cluster1.6",
			"Cluster2.1", "Cluster2.2", "Cluster2.3", "Cluster2.4", "Cluster2.5", "Cluster2.6", "Cluster2.7", "Cluster2.8",
			"Cluster3.1", "Cluster3.2", "Cluster3.3", "Cluster3.4", "Cluster3.5", "Cluster3.6",
			"Cluster3.7", "Cluster3.8", "Cluster3.9", "Cluster3.10", "Cluster3.11", "Cluster3.12",
			"Cluster4"
		];

		const results: ConceptAverageValue[][] = [];

		// Get the list of the right concepts.
		const concepts: Concept[] = [];
		for (const concept of Object.values(Concept).filter(v => typeof v === "number") as Concept[]) {
			const ct = getConceptType(concept);
			const cct = getConceptComputationType(concept);
			if (
				(
					ct === ConceptType.Start || ct === ConceptType.End || ct === ConceptType.Play
					|| ct === ConceptType.Meta || ct === ConceptType.Container || ct === ConceptType.Component
				)
				&& cct === ConceptComputationType.Compilation
			) {
				concepts.push(concept);
			}
		}

		try {
			const writer = new UnixPrintWriter(ConceptsComparaisonClusters.outputConcept);

			const lineToWrite: string[] = [];
			lineToWrite.push("");
			for (const clusterName of clusters)
				lineToWrite.push(clusterName);
			writer.printlnStr(StringRoutines.join(",", lineToWrite));

			let numConcepts = 0;

			for (const clusterName of clusters) {
				// Get the list of ruleset names.
				const rulesetNames: string[] = [];
				{
					const content = fs.readFileSync(ConceptsComparaisonClusters.pathFile + clusterName + ConceptsComparaisonClusters.csv, "utf8");
					for (const line of content.split("\n")) {
						const l = line.endsWith("\r") ? line.slice(0, -1) : line;
						if (l.length > 0)
							rulesetNames.push(l);
					}
				}

				// Conversion to Game object
				const rulesetsCompiled: IGame[] = [];
				const gameNames: string[] = FileHandling.listGames();
				for (let index = 0; index < gameNames.length; index++) {
					const gameName = gameNames[index]!;
					if (gameName.replaceAll("\\", "/").includes("/lud/bad/"))
						continue;

					if (gameName.replaceAll("\\", "/").includes("/lud/wip/"))
						continue;

					if (gameName.replaceAll("\\", "/").includes("/lud/WishlistDLP/"))
						continue;

					if (gameName.replaceAll("\\", "/").includes("/lud/test/"))
						continue;

					if (gameName.replaceAll("\\", "/").includes("subgame"))
						continue;

					if (gameName.replaceAll("\\", "/").includes("reconstruction"))
						continue;

					const game = GameLoader.loadGameFromName(gameName);

					const rulesetsInGame = game.description().rulesets();

					// Get all the rulesets of the game if it has some.
					if (rulesetsInGame !== null && rulesetsInGame.length > 0) {
						for (let rs = 0; rs < rulesetsInGame.length; rs++) {
							const ruleset = rulesetsInGame[rs]!;
							if (ruleset.optionSettings().length > 0 && !ruleset.heading().includes("Incomplete")) {
								const gameRuleset = GameLoader.loadGameFromName(gameName, ruleset.heading());
								const rulesetName = RulesetNames ? RulesetNames.gameRulesetName(gameRuleset) : "";
								if (rulesetNames.includes(rulesetName))
									rulesetsCompiled.push(gameRuleset);
							}
						}
					} else {
						const rulesetName = RulesetNames ? RulesetNames.gameRulesetName(game) : "";
						if (rulesetNames.includes(rulesetName))
							rulesetsCompiled.push(game);
					}
				}

				console.log(clusterName);
				console.log("Num compiled rulesets is " + rulesetsCompiled.length);
				console.log("*****************************");

				const conceptAverageValues: ConceptAverageValue[] = [];
				// Check boolean concepts
				for (const concept of concepts) {
					if (getConceptDataType(concept) === ConceptDataType.BooleanData) {
						let count = 0;
						for (const gameRuleset of rulesetsCompiled) {
							const boolConcepts = (gameRuleset as unknown as { booleanConcepts: () => { get: (id: number) => boolean } }).booleanConcepts();
							if (boolConcepts.get(concept as unknown as number))
								count++;
						}

						const average = (count * 100) / rulesetsCompiled.length;
						const conceptAverageValue = new ConceptAverageValue(concept, average);
						conceptAverageValues.push(conceptAverageValue);
					}
				}

				// Check numerical concepts
				for (const concept of concepts) {
					const dt = getConceptDataType(concept);
					// Note: Java source has a tautology: `ConceptDataType.IntegerData || ConceptDataType.IntegerData`
					// Cast to unknown to preserve the faithful reproduction without a TS type error.
					if ((dt as unknown) === ConceptDataType.IntegerData || (dt as unknown) === ConceptDataType.IntegerData) {
						let count = 0;
						for (const gameRuleset of rulesetsCompiled) {
							const nonBoolConcepts = (gameRuleset as unknown as { nonBooleanConcepts: () => Map<number, string> }).nonBooleanConcepts();
							const val = nonBoolConcepts.get(concept as unknown as number);
							if (val !== undefined && val !== null)
								count += parseFloat(val);
						}
						const average = count / rulesetsCompiled.length;
						const conceptAverageValue = new ConceptAverageValue(concept, average);
						conceptAverageValues.push(conceptAverageValue);
					}
				}

				numConcepts = conceptAverageValues.length;
				results.push(conceptAverageValues);
				console.log(clusterName + " Average concepts computed");
			}

			for (let i = 0; i < numConcepts; i++) {
				const lineToWriteConcept: string[] = [];
				lineToWriteConcept.push(Concept[results[0]![i]!.concept] ?? "");
				for (const conceptAverage of results)
					lineToWriteConcept.push("" + conceptAverage[i]!.value);
				writer.printlnStr(StringRoutines.join(",", lineToWriteConcept));
			}

			// flush/close: write buffered content to file
			fs.writeFileSync(ConceptsComparaisonClusters.outputConcept, writer.flush(), "utf8");
		} catch (e) {
			console.error(e);
		}
		console.log("Done.");
	}
}
