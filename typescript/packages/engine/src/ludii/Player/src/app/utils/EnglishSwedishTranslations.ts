// @java Player/src/app/utils/EnglishSwedishTranslations.java

/**
 * Enum for English/Swedish translations of UI strings.
 *
 * Faithful 1:1 port of app.utils.EnglishSwedishTranslations.
 *
 * @author (Java original)
 * @java app.utils.EnglishSwedishTranslations
 */
export enum EnglishSwedishTranslations {
  // Menu Text
  MYOGTITLE = "MYOGTITLE",
  INTRO_A = "INTRO_A",
  INTRO_B = "INTRO_B",
  MAKE_YOUR_GAME = "MAKE_YOUR_GAME",
  PLAY_YOUR_GAME = "PLAY_YOUR_GAME",
  HOME = "HOME",
  ENGLISH = "ENGLISH",
  SWEDISH = "SWEDISH",
  CHOOSEBOARD = "CHOOSEBOARD",
  DRAGPIECES = "DRAGPIECES",
  MOVEMENT = "MOVEMENT",
  CAPTURE = "CAPTURE",
  GOAL = "GOAL",
  // Button Text
  START = "START",
  RESET = "RESET",
  PLAY = "PLAY",
  PLAYAGAIN = "PLAYAGAIN",
  EDIT = "EDIT",
  HUMANVSHUMAN = "HUMANVSHUMAN",
  HUMANVSAI = "HUMANVSAI",
  PRINT = "PRINT",
  // Goal Options
  LINE3 = "LINE3",
  LINE4 = "LINE4",
  ELIMINATE = "ELIMINATE",
  BLOCK = "BLOCK",
  SURROUND = "SURROUND",
  // Move Options
  STEP = "STEP",
  SLIDE = "SLIDE",
  KNIGHT = "KNIGHT",
  ADD = "ADD",
  ANY = "ANY",
  // Capture Options
  REPLACE = "REPLACE",
  HOP = "HOP",
  FLANK = "FLANK",
  NEIGHBOR = "NEIGHBOR",
}

// -------------------------------------------------------------------------

/** Map from enum key to [english, swedish] pair. */
const _translations: Record<EnglishSwedishTranslations, [string, string]> = {
  [EnglishSwedishTranslations.MYOGTITLE]:      ["Make Your Own Game",                           "Gor Ditt Eget Spel"],
  [EnglishSwedishTranslations.INTRO_A]:        ["Ludemes are the elements that make up games.", "Spel består av beståndsdelar som kallas ludemes."],
  [EnglishSwedishTranslations.INTRO_B]:        ["Here you can mix and match ludemes to make your own game!", "Här kan du mixa och matcha ludemes och göra ditt eget spel!"],
  [EnglishSwedishTranslations.MAKE_YOUR_GAME]: ["Make Your Game",                               "Gor Ditt Spel"],
  [EnglishSwedishTranslations.PLAY_YOUR_GAME]: ["Play Your Game",                               "Spela Ditt Spel"],
  [EnglishSwedishTranslations.HOME]:           ["Home",                                         "Home"],
  [EnglishSwedishTranslations.ENGLISH]:        ["EN",                                           "EN"],
  [EnglishSwedishTranslations.SWEDISH]:        ["SV",                                           "SV"],
  [EnglishSwedishTranslations.CHOOSEBOARD]:    ["Choose a board",                               "Välj ett spelbräde"],
  [EnglishSwedishTranslations.DRAGPIECES]:     ["Drag pieces onto the board",                   "Dra pjäser till brädet"],
  [EnglishSwedishTranslations.MOVEMENT]:       ["Piece moves",                                  "Hur man flyttar"],
  [EnglishSwedishTranslations.CAPTURE]:        ["How to capture",                               "Hur man fångar"],
  [EnglishSwedishTranslations.GOAL]:           ["How to win",                                   "Hur man vinner"],
  [EnglishSwedishTranslations.START]:          ["Start",                                        "Starta"],
  [EnglishSwedishTranslations.RESET]:          ["Reset",                                        "Återställ"],
  [EnglishSwedishTranslations.PLAY]:           ["Play",                                         "Spela"],
  [EnglishSwedishTranslations.PLAYAGAIN]:      ["Play Again",                                   "Spela igen"],
  [EnglishSwedishTranslations.EDIT]:           ["Edit Rules",                                   "Redigera regler"],
  [EnglishSwedishTranslations.HUMANVSHUMAN]:   ["vs Human",                                     "vs Person"],
  [EnglishSwedishTranslations.HUMANVSAI]:      ["vs AI",                                        "vs AI"],
  [EnglishSwedishTranslations.PRINT]:          ["Print",                                        "Skriva ut"],
  [EnglishSwedishTranslations.LINE3]:          ["Line of 3",                                    "Tre i rad"],
  [EnglishSwedishTranslations.LINE4]:          ["Line of 4",                                    "Fyra i rad"],
  [EnglishSwedishTranslations.ELIMINATE]:      ["Eliminate",                                    "Eliminera"],
  [EnglishSwedishTranslations.BLOCK]:          ["Block",                                        "Blockera"],
  [EnglishSwedishTranslations.SURROUND]:       ["Surround",                                     "Omringa"],
  [EnglishSwedishTranslations.STEP]:           ["Step",                                         "Steg"],
  [EnglishSwedishTranslations.SLIDE]:          ["Slide",                                        "Glida"],
  [EnglishSwedishTranslations.KNIGHT]:         ["Knight",                                       "Riddare"],
  [EnglishSwedishTranslations.ADD]:            ["Add",                                          "Tillsätta"],
  [EnglishSwedishTranslations.ANY]:            ["Anywhere",                                     "Överallt"],
  [EnglishSwedishTranslations.REPLACE]:        ["Replace",                                      "Ersätta"],
  [EnglishSwedishTranslations.HOP]:            ["Hop",                                          "Hoppa"],
  [EnglishSwedishTranslations.FLANK]:          ["Flank",                                        "Flankera"],
  [EnglishSwedishTranslations.NEIGHBOR]:       ["Neighbor",                                     "Angränsa"],
};

// -------------------------------------------------------------------------

/** Change this to use English or Swedish words. */
let _inEnglish = true;

// -------------------------------------------------------------------------

/** @java EnglishSwedishTranslations#inEnglish() */
export function inEnglish(): boolean {
  return _inEnglish;
}

/** @java EnglishSwedishTranslations#setInEnglish(boolean) */
export function setInEnglish(value: boolean): void {
  _inEnglish = value;
}

/**
 * Returns the string for the given enum value in the current language.
 * @java EnglishSwedishTranslations#toString()
 */
export function translationToString(key: EnglishSwedishTranslations): string {
  const pair = _translations[key];
  return _inEnglish ? pair[0] : pair[1];
}

// -------------------------------------------------------------------------
