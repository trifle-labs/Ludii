// @java ViewController/src/view/component/custom/types/NativeAmericanDiceType.java

/**
 * Native American Dice types.
 *
 * Faithful 1:1 port of view.component.custom.types.NativeAmericanDiceType.
 *
 * @author Matthew.Stephenson (Java original)
 */
export class NativeAmericanDiceType {
  // Patol
  static readonly Patol1      = new NativeAmericanDiceType("PatolDice",        "blank on one side, two lines on other");
  static readonly Patol2      = new NativeAmericanDiceType("Dice2",            "blank on one side, three lines on other");

  // Notched
  static readonly Notched     = new NativeAmericanDiceType("NotchedDice",      "blank on one side, dots on the other");

  // Set Dilth
  static readonly SetDilth    = new NativeAmericanDiceType("SetDilthDice",     "blank on one side, two lines on other near middle");

  // Nebakuthana
  static readonly Nebakuthana1 = new NativeAmericanDiceType("NebakuthanaDice1","blank on one side, many lines on other");
  static readonly Nebakuthana2 = new NativeAmericanDiceType("NebakuthanaDice2","blank on one side, cross on other");
  static readonly Nebakuthana3 = new NativeAmericanDiceType("NebakuthanaDice3","blank on one side, diamond on other");
  static readonly Nebakuthana4 = new NativeAmericanDiceType("NebakuthanaDice4","line and dots on one side, star pattern of lines on other");

  // Kints
  static readonly Kints1      = new NativeAmericanDiceType("KintsDice1",       "blank on one side, zigzag on other");
  static readonly Kints2      = new NativeAmericanDiceType("KintsDice2",       "blank on one side, four lines on other");
  static readonly Kints3      = new NativeAmericanDiceType("KintsDice3",       "blank on one side, two triangles on other");
  static readonly Kints4      = new NativeAmericanDiceType("KintsDice4",       "blank on one side, cross on other");

  // Kolica
  static readonly Kolica1     = new NativeAmericanDiceType("Kolica1",          "blank on one side, many lines on other");
  static readonly Kolica2     = new NativeAmericanDiceType("Kolica2",          "blank on one side, cross on other");
  static readonly Kolica3     = new NativeAmericanDiceType("Kolica3",          "blank on one side, two lines on other near middle");
  static readonly Kolica4     = new NativeAmericanDiceType("Kolica4",          "blank on one side, two lines on other near middle");

  // -------------------------------------------------------------------------

  /** All values in declaration order — mirrors Java's .values() */
  static readonly VALUES: readonly NativeAmericanDiceType[] = [
    NativeAmericanDiceType.Patol1, NativeAmericanDiceType.Patol2,
    NativeAmericanDiceType.Notched,
    NativeAmericanDiceType.SetDilth,
    NativeAmericanDiceType.Nebakuthana1, NativeAmericanDiceType.Nebakuthana2,
    NativeAmericanDiceType.Nebakuthana3, NativeAmericanDiceType.Nebakuthana4,
    NativeAmericanDiceType.Kints1, NativeAmericanDiceType.Kints2,
    NativeAmericanDiceType.Kints3, NativeAmericanDiceType.Kints4,
    NativeAmericanDiceType.Kolica1, NativeAmericanDiceType.Kolica2,
    NativeAmericanDiceType.Kolica3, NativeAmericanDiceType.Kolica4,
  ];

  // -------------------------------------------------------------------------

  private readonly _englishName: string;
  private readonly _description: string;
  readonly name: string;

  // -------------------------------------------------------------------------

  private constructor(englishName: string, description: string) {
    this._englishName = englishName;
    this._description = description;
    // name() mirrors Java enum name() — use english name as unique id
    this.name = englishName;
  }

  // -------------------------------------------------------------------------

  /** @java NativeAmericanDiceType#englishName() */
  englishName(): string {
    return this._englishName;
  }

  /** @java NativeAmericanDiceType#description() */
  description(): string {
    return this._description;
  }

  // -------------------------------------------------------------------------

  /** Mirrors Java enum values() */
  static values(): readonly NativeAmericanDiceType[] {
    return NativeAmericanDiceType.VALUES;
  }
}
