// @java Core/src/other/translation/LanguageUtils.java LanguageUtils
/**
 * Faithful 1:1 transliteration of other.translation.LanguageUtils.
 *
 * Utility functions for converting game data to human-readable text.
 *
 * Java parity: other/translation/LanguageUtils.java
 */

/** Minimal SiteType surface needed here (Java: game.types.board.SiteType) */
export type SiteType = string;

/** Minimal RoleType surface needed here (Java: game.types.play.RoleType) */
export interface RoleType {
  readonly name: string;
  owner?(): number;
}

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

export class LanguageUtils {

  // -------------------------------------------------------------------------

  /**
   * @java public static String[] SplitPieceName(final String itemName)
   * "Pawn3" → ["Pawn","3"]
   */
  static SplitPieceName(itemName: string): [string, string] {
    let index = itemName.length - 1;
    while (index >= 0) {
      const ch = itemName.charCodeAt(index);
      if (ch < 48 || ch > 57) { // not a digit
        index++;
        break;
      }
      index--;
    }
    if (index < 0) index = 0;

    const pieceName  = itemName.substring(0, index);
    let pieceOwner: string = String(UNDEFINED);
    if (index < itemName.length) pieceOwner = itemName.substring(index);

    return [pieceName, pieceOwner];
  }

  // -------------------------------------------------------------------------

  /**
   * @java public static String getLocationName(final String siteText, final SiteType type)
   */
  static getLocationName(siteText: string, type: SiteType): string {
    return type + " " + siteText;
  }

  // -------------------------------------------------------------------------

  /**
   * @java public static String RoleTypeAsText(final RoleType role, final boolean isNewSentence)
   */
  static RoleTypeAsText(role: RoleType, isNewSentence: boolean): string {
    switch (role.name) {
      case "P1": case "P2": case "P3": case "P4": case "P5":
      case "P6": case "P7": case "P8": case "P9": case "P10":
      case "P11": case "P12": case "P13": case "P14": case "P15": case "P16":
        return (isNewSentence ? "Player" : "player") + " " + LanguageUtils.NumberAsText(role.owner?.() ?? 0);
      case "Mover":
        return (isNewSentence ? "The" : "the") + " moving player";
      case "Next":
        return (isNewSentence ? "The" : "the") + " next player";
      case "Neutral":
        return (isNewSentence ? "No" : "no") + " player";
      default:
        return role.name;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java public static String NumberAsText(final int number)
   */
  static NumberAsText(originalNumber: number): string;
  static NumberAsText(originalNumber: number, suffixSingular: string | null, suffixPlural: string | null): string;

  static NumberAsText(
    originalNumber: number,
    suffixSingular: string | null = null,
    suffixPlural: string | null = null
  ): string {
    let number = originalNumber;
    if (number < -999 || number > 999) {
      throw new Error(`NumberAsText: not implemented for [${number}]`);
    }

    let text = "";
    if (number < 0) { text += "minus "; number = -number; }

    if      (number === 0)  text += "zero";
    else if (number === 1)  text += "one";
    else if (number === 2)  text += "two";
    else if (number === 3)  text += "three";
    else if (number === 4)  text += "four";
    else if (number === 5)  text += "five";
    else if (number === 6)  text += "six";
    else if (number === 7)  text += "seven";
    else if (number === 8)  text += "eight";
    else if (number === 9)  text += "nine";
    else if (number === 10) text += "ten";
    else if (number === 11) text += "eleven";
    else if (number === 12) text += "twelve";
    else if (number === 13) text += "thirteen";
    else if (number === 15) text += "fifteen";
    else if (number === 18) text += "eighteen";
    else if (number > 10 && number < 20) text += LanguageUtils.NumberAsText(number % 10) + "teen";
    else if (number === 20) text += "twenty";
    else if (number === 30) text += "thirty";
    else if (number === 40) text += "forty";
    else if (number === 50) text += "fifty";
    else if (number === 60) text += "sixty";
    else if (number === 70) text += "seventy";
    else if (number === 80) text += "eighty";
    else if (number === 90) text += "ninety";
    else if (number >= 100) {
      text += LanguageUtils.NumberAsText(Math.floor(number / 100)) + " hundred";
      if (number % 100 > 0) text += " and " + LanguageUtils.NumberAsText(number % 100);
    } else if (number > 20 && number < 100) {
      text += LanguageUtils.NumberAsText(Math.floor(number / 10) * 10) + "-" + LanguageUtils.NumberAsText(number % 10);
    } else {
      throw new Error(`NumberAsText: unknown number [${number}]`);
    }

    if (originalNumber === 1 || (originalNumber < 0 && -originalNumber === 1)) {
      if (suffixSingular !== null) text += " " + suffixSingular;
    } else {
      if (suffixPlural !== null) text += " " + suffixPlural;
    }

    return text;
  }

  // -------------------------------------------------------------------------

  /**
   * @java public static String IndexAsText(final int index)
   */
  static IndexAsText(index: number): string {
    if (index < 0 || index > 999) {
      throw new Error(`IndexAsText: not implemented for [${index}]`);
    }

    let text = "";
    if      (index === 0)  text += "zeroth";
    if      (index === 1)  text += "first";
    else if (index === 2)  text += "second";
    else if (index === 3)  text += "third";
    else if (index === 4)  text += "fourth";
    else if (index === 5)  text += "fifth";
    else if (index === 6)  text += "sixth";
    else if (index === 7)  text += "seventh";
    else if (index === 8)  text += "eighth";
    else if (index === 9)  text += "ninth";
    else if (index === 10) text += "tenth";
    else if (index === 11) text += "eleventh";
    else if (index === 12) text += "twelfth";
    else if (index >= 13 && index <= 19) text += LanguageUtils.NumberAsText(index) + "th";
    else if (index === 20) text += "twentieth";
    else if (index === 30) text += "thirtieth";
    else if (index === 40) text += "fortieth";
    else if (index === 50) text += "fiftieth";
    else if (index === 60) text += "sixtieth";
    else if (index === 70) text += "seventieth";
    else if (index === 80) text += "eightieth";
    else if (index === 90) text += "ninetieth";
    else if (index >= 100) {
      const h = Math.floor(index / 100);
      const d = index - h * 100;
      if (h > 1) text += LanguageUtils.NumberAsText(h);
      text += " hundred" + (d === 0 ? "th" : "");
      if (d > 0) text += " and " + LanguageUtils.IndexAsText(d);
    } else if (index > 20 && index < 100) {
      text += LanguageUtils.NumberAsText(Math.floor(index / 10) * 10) + "-" + LanguageUtils.IndexAsText(index % 10);
    } else {
      throw new Error(`IndexAsText: unknown index [${index}]`);
    }

    return text;
  }

  // -------------------------------------------------------------------------

  /**
   * @java public static String GetDirection(final String direction)
   */
  static GetDirection(direction: string): string {
    switch (direction) {
      case "N":    return "north";
      case "S":    return "south";
      case "E":    return "east";
      case "W":    return "west";
      case "FL":   return "forward-left";
      case "FLL":  return "forward-left-left";
      case "FLLL": return "forward-left-left-left";
      case "BL":   return "backward-left";
      case "BLL":  return "backward-left-left";
      case "BLLL": return "backward-left-left-left";
      case "FR":   return "forward-right";
      case "FRR":  return "forward-right-right";
      case "FRRR": return "forward-right-right-right";
      case "BR":   return "backward-right";
      case "BRR":  return "backward-right-right";
      case "BRRR": return "backward-right-right-right";
      default:
        return LanguageUtils.splitCamelCase(direction);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java public final static String splitCamelCase(final String string)
   */
  static splitCamelCase(s: string): string {
    return s
      .replace(/(?<!(^|[A-Z]))(?=[A-Z])|(?<!^)(?=[A-Z][a-z])/g, " ")
      .toLowerCase();
  }
}
