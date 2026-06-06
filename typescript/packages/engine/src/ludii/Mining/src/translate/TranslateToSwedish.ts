// @java Mining/src/translate/TranslateToSwedish.java

import * as fs from "fs";
import * as https from "https";
import { UnixPrintWriter } from "../../../Common/src/main/UnixPrintWriter.js";

/**
 * Code to add a Swedish description to all the games in the Games table.
 *
 * @java translate.TranslateToSwedish
 * @author Eric.Piette
 */
export class TranslateToSwedish {

	/** @java TranslateToSwedish.defaultInputPath */
	static readonly defaultInputPath: string = "./res/Games.csv";

	/**
	 * @java TranslateToSwedish.main(String[])
	 */
	public static async main(_args: string[]): Promise<void> {
		// Read the CSV line by line.
		const CSVlines: string[] = [];
		let tempLine = "";
		const content = fs.readFileSync(TranslateToSwedish.defaultInputPath, "utf8");
		for (const rawLine of content.split("\n")) {
			const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
			if (line.length > 2 && line.charAt(0) === '"' && /\d/.test(line.charAt(1))) {
				if (tempLine.length > 0)
					CSVlines.push(tempLine);
				tempLine = "";
			}
			tempLine += line;
		}
		CSVlines.push(tempLine);

		// Translate all the description from English to Swedish.
		const swedishDescriptions: string[] = [];
		for (let i = 1; i < CSVlines.length; i++) {
			const csvLine = CSVlines[i]!;
			let inQuote = false;
			let numColumn = 0;
			let descriptionBuffer = "";
			for (let c = 0; c < csvLine.length; c++) {
				const ch = csvLine.charAt(c);
				if (ch === '"')
					inQuote = !inQuote;
				if (ch === ',' && !inQuote)
					numColumn++;
				else if (numColumn === 3)
					descriptionBuffer += ch;
				if (numColumn === 4)
					break;
			}

			const description = descriptionBuffer.substring(1, descriptionBuffer.length - 1);
			let descriptionSwedish = await TranslateToSwedish.translate("en", "sv", description);
			descriptionSwedish = descriptionSwedish.replaceAll("&quot;&quot;", '""');
			descriptionSwedish = descriptionSwedish.replaceAll("&quot;", '""');
			swedishDescriptions.push(descriptionSwedish);
			console.log("Line " + i + " done.");
		}

		const output = "Games.csv";

		// Write the new CSV.
		try {
			const writer = new UnixPrintWriter(output);
			writer.printlnStr(CSVlines[0]!);
			for (let i = 1; i < CSVlines.length; i++) {
				const line = CSVlines[i]!;
				writer.print(line.substring(0, line.length - 4));
				writer.printlnStr('"' + swedishDescriptions[i - 1] + '"');
			}
			// flush/close: write buffered content to file
			fs.writeFileSync(output, writer.flush(), "utf8");
		} catch (e1) {
			console.error(e1);
		}
	}

	/**
	 * Translate any String to another language.
	 * @param langFrom The language from.
	 * @param langTo the language to.
	 * @param text The string to translate.
	 * @return The translated string.
	 * @java TranslateToSwedish.translate(String, String, String)
	 */
	private static translate(langFrom: string, langTo: string, text: string): Promise<string> {
		// INSERT YOU URL HERE
		const encodedText = encodeURIComponent(text);
		const urlStr = "https://script.google.com/macros/s/AKfycbxohIwAG-uJMG864Rc_yoDkZvJhJe3vpxcWSGNomLC62LNK1xaY89-UU2b7RddEYq8HXA/exec"
			+ "?q=" + encodedText
			+ "&target=" + langTo
			+ "&source=" + langFrom;

		return new Promise<string>((resolve, reject) => {
			const options = {
				headers: { "User-Agent": "Mozilla/5.0" }
			};
			https.get(urlStr, options, (res) => {
				let response = "";
				res.on("data", (chunk: string) => { response += chunk; });
				res.on("end", () => { resolve(response); });
				res.on("error", reject);
			}).on("error", reject);
		});
	}

}
