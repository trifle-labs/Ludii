// @java Core/src/game/functions/dim/DimFunction.java

/**
 * Returns an integer corresponding to a dimension.
 *
 * Java parity: interface extending GameType. In TS we omit GameType
 * (no registry wiring needed) and expose just eval() and toEnglish().
 *
 * @java game.functions.dim.DimFunction
 * @author Eric.Piette and cambolbro
 */
export interface DimFunction {
  /** @java DimFunction.eval() — returns the dimension integer */
  eval(): number;

  /** @java DimFunction.toEnglish(Game) */
  toEnglish(game: unknown): string;
}
