// @java Mining/src/reconstruction/utils/FormatReconstructionOutputs.java

import { StringRoutines } from "../../../../Common/src/main/StringRoutines.js";

/**
 * Format the generated reconstructions.
 *
 * @java reconstruction.utils.FormatReconstructionOutputs
 * @author Eric.Piette
 */
export class FormatReconstructionOutputs {

  /**
   * Nicely indents the description in entry.
   *
   * @java FormatReconstructionOutputs.indentNicely(String)
   */
  public static indentNicely(desc: string): string {
    const linesArray: string[] = desc.split(/\r?\n/);
    const lines: string[] = [];
    for (let n = 0; n < linesArray.length; n++)
      lines.push(linesArray[n]!);

    // Left justify all lines
    for (let n = 0; n < lines.length; n++) {
      let str = lines[n]!;
      // strip leading spaces and tabs
      while (str.length > 0 && (str.charAt(0) === ' ' || str.charAt(0) === '\t'))
        str = str.substring(1);
      lines[n] = str;
    }

    FormatReconstructionOutputs.removeDoubleEmptyLines(lines);
    FormatReconstructionOutputs.indentLines(lines);

    const outputDesc: string[] = [];
    for (const result of lines)
      outputDesc.push(result + "\n");

    return outputDesc.join("");
  }

  /**
   * Removes double empty lines.
   *
   * @java FormatReconstructionOutputs.removeDoubleEmptyLines(List)
   */
  static removeDoubleEmptyLines(lines: string[]): void {
    let n = 1;
    while (n < lines.length) {
      if (lines[n] === "" && lines[n - 1] === "")
        lines.splice(n, 1);
      else
        n++;
    }
  }

  /**
   * Nicely indents the lines of a desc.
   *
   * @java FormatReconstructionOutputs.indentLines(List)
   */
  static indentLines(lines: string[]): void {
    const indentString = "    ";
    let indent = 0;
    for (let n = 0; n < lines.length; n++) {
      let str = lines[n]!;

      const numOpen  = StringRoutines.numChar(str, '(');  // don't count curly braces!
      const numClose = StringRoutines.numChar(str, ')');

      const difference = numOpen - numClose;

      if (difference < 0) {
        // Unindent from this line
        indent += difference;
        if (indent < 0)
          indent = 0;
      }

      for (let step = 0; step < indent; step++)
        str = indentString + str;

      lines[n] = str;

      if (difference > 0)
        indent += difference;  // indent from next line
    }
  }
}
