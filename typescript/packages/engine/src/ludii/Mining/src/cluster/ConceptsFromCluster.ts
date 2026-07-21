// @java Mining/src/cluster/ConceptsFromCluster.java

import { fs } from "../../../node-shim/fs-lazy.js";
import { GameLoader, type IGame } from "../../../../ludemes/other/GameLoader.js";
import { FileHandling } from "../../../Common/src/main/FileHandling.js";
import { Concept } from "../../../../ludemes/other/concept/Concept.js";
import { ConceptDataType } from "../../../../ludemes/other/concept/ConceptDataType.js";
import { ConceptType } from "../../../../ludemes/other/concept/ConceptType.js";
import { conceptType as getConceptType } from "../../../../ludemes/other/concept/Concept.js";
import { conceptDataType as getConceptDataType } from "../../../../ludemes/other/concept/Concept.js";
import { ConceptAverageValue } from "./ConceptAverageValue.js";

// RulesetNames is not yet ported; use escape hatch
type IRulesetNames = { gameRulesetName: (game: IGame) => string };
const RulesetNames = (globalThis as unknown as { RulesetNames?: IRulesetNames }).RulesetNames;

/**
 * Generate the percentage of concepts from a list of rulesets.
 *
 * @java cluster.ConceptsFromCluster
 * @author Eric.Piette
 */
export class ConceptsFromCluster {

	/** @java ConceptsFromCluster.listRulesets */
	static readonly listRulesets: string = "./res/cluster/input/clusters/Cluster4.csv";
	/** @java ConceptsFromCluster.nameCluster */
	static readonly nameCluster: string = "Cluster 4";

	/**
	 * Main method to call the reconstruction with command lines.
	 * @java ConceptsFromCluster.main(String[])
	 */
	public static main(_args: string[]): void {
		// Get the list of ruleset names.
		const rulesetNames: string[] = [];
		{
			const content = fs.readFileSync(ConceptsFromCluster.listRulesets, "utf8");
			for (const line of content.split("\n")) {
				if (line.length > 0)
					rulesetNames.push(line.endsWith("\r") ? line.slice(0, -1) : line);
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

		console.log(ConceptsFromCluster.nameCluster);
		console.log("Num compiled rulesets is " + rulesetsCompiled.length);
		console.log("*****************************");

		const concepts: Concept[] = [];
		for (const concept of Object.values(Concept).filter(v => typeof v === "number") as Concept[]) {
			const ct = getConceptType(concept);
			if (
				ct === ConceptType.Start || ct === ConceptType.End || ct === ConceptType.Play
				|| ct === ConceptType.Meta || ct === ConceptType.Container || ct === ConceptType.Component
			) {
				concepts.push(concept);
			}
		}

		console.log("\n\n***Boolean concepts in average***\n");
		const booleanConceptAverageValues: ConceptAverageValue[] = [];
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
				booleanConceptAverageValues.push(conceptAverageValue);
			}
		}
		booleanConceptAverageValues.sort((c1, c2) => {
			const diff = c2.value - c1.value;
			return diff > 0 ? 1 : diff < 0 ? -1 : 0;
		});
		for (const concept of booleanConceptAverageValues)
			console.log(Concept[concept.concept] + "," + concept.value);

		console.log("\n\n***Numerical concepts in average***\n");
		const numericalConceptAverageValues: ConceptAverageValue[] = [];
		// Check numerical concepts
		for (const concept of concepts) {
			const dt = getConceptDataType(concept);
			if (dt === ConceptDataType.IntegerData) {
				let count = 0;
				for (const gameRuleset of rulesetsCompiled) {
					const nonBoolConcepts = (gameRuleset as unknown as { nonBooleanConcepts: () => Map<number, string> }).nonBooleanConcepts();
					if (nonBoolConcepts.get(concept as unknown as number) !== undefined && nonBoolConcepts.get(concept as unknown as number) !== null)
						count += parseFloat(nonBoolConcepts.get(concept as unknown as number)!);
				}
				const average = count / rulesetsCompiled.length;
				const conceptAverageValue = new ConceptAverageValue(concept, average);
				numericalConceptAverageValues.push(conceptAverageValue);
			}

			if (dt === ConceptDataType.DoubleData) {
				let count = 0;
				for (const gameRuleset of rulesetsCompiled) {
					const nonBoolConcepts = (gameRuleset as unknown as { nonBooleanConcepts: () => Map<number, string> }).nonBooleanConcepts();
					if (nonBoolConcepts.get(concept as unknown as number) !== undefined && nonBoolConcepts.get(concept as unknown as number) !== null)
						count += parseFloat(nonBoolConcepts.get(concept as unknown as number)!);
				}
				const average = count / rulesetsCompiled.length;
				const conceptAverageValue = new ConceptAverageValue(concept, average);
				numericalConceptAverageValues.push(conceptAverageValue);
			}
		}

		numericalConceptAverageValues.sort((c1, c2) => {
			const diff = c2.value - c1.value;
			return diff > 0 ? 1 : diff < 0 ? -1 : 0;
		});
		for (const concept of numericalConceptAverageValues)
			console.log(Concept[concept.concept] + "," + concept.value);
	}
}
