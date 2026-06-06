// @java ViewController/src/view/component/custom/types/XiangqiType.java

/**
 * Xiangqi types.
 *
 * Faithful 1:1 port of view.component.custom.types.XiangqiType.
 *
 * @author Matthew.Stephenson (Java original)
 */
export class XiangqiType {
  static readonly KING           = new XiangqiType("周",   "Zhou",       "King");
  static readonly WHITEGENERAL   = new XiangqiType("秦",   "Qin Jiang",  "General White");
  static readonly REDGENERAL     = new XiangqiType("楚",   "Chu Jiang",  "General Red");
  static readonly ORANGEGENERAL  = new XiangqiType("韓",   "Han Jiang",  "General Orange");
  static readonly BLUEGENERAL    = new XiangqiType("齊",   "Qi Jiang",   "General Blue");
  static readonly GREENGENERAL   = new XiangqiType("魏",   "Wei Jiang",  "General Green");
  static readonly BLACKGENERAL   = new XiangqiType("趙",   "Yan Jiang",  "General Grey");
  static readonly PURPLEGENERAL  = new XiangqiType("燕",   "Zhao Jiang", "General Magenta");
  static readonly DEPUTYGENERAL  = new XiangqiType("偏",   "Pian",       "Deputy General");
  static readonly OFFICER        = new XiangqiType("裨",   "Bai",        "Officer");
  static readonly DIPLOMAT       = new XiangqiType("行人", "Xing ren",   "Diplomat");
  static readonly CATAPULT       = new XiangqiType("砲",   "Pao",        "Catapult");
  static readonly ARCHER         = new XiangqiType("弓",   "Gong",       "Archer");
  static readonly CROSSBOW       = new XiangqiType("弩",   "Nu",         "Crossbow");
  static readonly KNIFE          = new XiangqiType("刀",   "Dao",        "Knife");
  static readonly BROADSWORD     = new XiangqiType("劍",   "Jian",       "Broadsword");
  static readonly KNIGHT         = new XiangqiType("騎",   "Qi",         "Knight");
  static readonly FIRE           = new XiangqiType("火",   "Huo",        "Fire");
  static readonly FLAG           = new XiangqiType("旗",   "Qi",         "Flag");
  static readonly OCEAN          = new XiangqiType("海",   "Hai",        "Ocean");
  static readonly MOUNTAIN       = new XiangqiType("山",   "Shan",       "Mountain");
  static readonly CITY           = new XiangqiType("城",   "Cheng",      "City");
  static readonly CHARIOT        = new XiangqiType("車",   "Ju",         "Chariot");
  static readonly HORSE          = new XiangqiType("馬",   "Ma",         "Horse");
  static readonly ELEPHANT       = new XiangqiType("象",   "Xiang",      "Elephant");
  static readonly GUARD          = new XiangqiType("仕",   "Shi",        "Guard");
  static readonly GENERAL        = new XiangqiType("帅",   "Jiang",      "General");
  static readonly SOLDIER        = new XiangqiType("卒",   "Zu",         "Soldier");

  // -------------------------------------------------------------------------

  private readonly _kanji: string;
  private readonly _romaji: string;
  private readonly _englishName: string;

  // -------------------------------------------------------------------------

  private constructor(kanji: string, romaji: string, englishName: string) {
    this._kanji       = kanji;
    this._romaji      = romaji;
    this._englishName = englishName;
  }

  // -------------------------------------------------------------------------

  /** @java XiangqiType#kanji() */
  kanji(): string {
    return this._kanji;
  }

  /** @java XiangqiType#romaji() */
  romaji(): string {
    return this._romaji;
  }

  /** @java XiangqiType#englishName() */
  englishName(): string {
    return this._englishName;
  }
}
