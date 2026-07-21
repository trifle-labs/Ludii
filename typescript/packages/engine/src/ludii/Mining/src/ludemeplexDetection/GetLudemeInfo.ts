// @java Mining/src/ludemeplexDetection/GetLudemeInfo.java

import { Grammar, type LudemeInfo_ } from "../../../Language/src/grammar/Grammar.js";
import { LudemeInfo } from "../../../Common/src/main/grammar/LudemeInfo.js";
import { EditorHelpData } from "../../../Common/src/main/EditorHelpData.js";

/**
 * Get ludeme info from JavaDoc help and database.
 *
 * @java ludemeplexDetection.GetLudemeInfo
 * @author cambolbro and Matthew.Stephenson
 */
export class GetLudemeInfo {

	/** Cached version of ludeme information. @java GetLudemeInfo.ludemeInfo */
	private static ludemeInfo: LudemeInfo[] | null = null;

	//-------------------------------------------------------------------------

	/**
	 * Get ludeme info.
	 * @java GetLudemeInfo.getLudemeInfo()
	 */
	public static getLudemeInfo(): LudemeInfo[] {
		if (GetLudemeInfo.ludemeInfo === null) {
			// Grammar.ludemesUsed() returns LudemeInfo_[] (minimal interface from Grammar.ts);
			// cast to LudemeInfo[] as the Java original uses the same main.grammar.LudemeInfo type.
			const ludemes: LudemeInfo[] = Grammar.grammar().ludemesUsed() as unknown as LudemeInfo[];
			console.log(ludemes.length + " ludemes loaded.");

			// Get ids from database for known ludemes
			let idCounter = 1;

			// Get JavaDoc help for known ludemes
			const help = EditorHelpData.get();

			for (const ludeme of ludemes) {
				let classPath: string = (ludeme.symbol() as unknown as { cls: () => { getName: () => string } }).cls().getName();
				let description = "";

				const ludemeType = (ludeme.symbol() as unknown as { ludemeType: () => unknown }).ludemeType();
				if (ludemeType === null || ludemeType === undefined) {
					console.log("** Null ludemeType for: " + ludeme.symbol());
					continue;
				}

				ludeme.setId(idCounter);
				idCounter++;

				// Check for ludemes that could be Structural type but aren't
				const sym = ludeme.symbol() as unknown as {
					usedInGrammar: () => boolean;
					usedInDescription: () => boolean;
					usedInMetadata: () => boolean;
					ludemeType: () => unknown;
				};
				if (
					sym.usedInGrammar()
					&& !sym.usedInDescription()
					&& !sym.usedInMetadata()
					&& String(ludemeType) !== "Structural"
					&& String(ludemeType) !== "Constant"
				) {
					console.log("Could be made a Structural ludeme: " + ludeme.symbol());
				}

				if (String(ludemeType) === "Primitive") {
					if (classPath === "int")
						description = "An integer value.";
					else if (classPath === "float")
						description = "A floating point value.";
					else if (classPath === "boolean")
						description = "A boolean value.";
				} else if (String(ludemeType) === "Constant") {
					// Handle enum constant
					classPath += "$" + (ludeme.symbol() as unknown as { name: () => string }).name();

					let key = classPath.replace(/\$/g, ".");
					let enums: string[] | null | undefined = (help as unknown as { enumConstantLines: (key: string) => string[] | null | undefined }).enumConstantLines(key);

					// Get list of descriptions for this enum type
					if (enums === null || enums === undefined || enums.length === 0) {
						const parts = classPath.split("$");
						key = parts[0]!;
						enums = (help as unknown as { enumConstantLines: (key: string) => string[] | null | undefined }).enumConstantLines(key);
					}

					// Find matching description
					if (enums !== null && enums !== undefined) {
						const symName = (ludeme.symbol() as unknown as { name: () => string }).name();
						for (const str of enums) {
							const parts = str.split(": ");
							if (parts[0] === symName) {
								description = parts[1]!;
								break;
							}
						}
					}
				} else {
					// Is ludeme class
					description = (help as unknown as { typeDocString: (classPath: string) => string }).typeDocString(classPath);
				}

				ludeme.setDescription(description);
			}

			GetLudemeInfo.ludemeInfo = ludemes;
		}

		return GetLudemeInfo.ludemeInfo;
	}

	//-------------------------------------------------------------------------

	/** @java GetLudemeInfo.main(String[]) */
	public static main(_args: string[]): void {
		GetLudemeInfo.getLudemeInfo();
	}

	//-------------------------------------------------------------------------

}
