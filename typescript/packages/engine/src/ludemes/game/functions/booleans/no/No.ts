/**
 * Static-factory dispatcher for "(no …)" boolean functions, mirroring Java's
 * game.functions.booleans.no.No.construct() overloads. ArgCompiler invokes the
 * static construct* method whose arity matches the bound Java executable.
 *
 * @java game/functions/booleans/no/No.java — static construct() dispatchers
 */
import type { BooleanFunction, IntFunction, RegionFunction, RoleType } from "../../../../base.js";
import { NoMoves } from "../no1to1/NoMoves.js";
import { NoPieces } from "../no1to1/NoPieces.js";

type SiteType = "Cell" | "Edge" | "Vertex";

export class NoDispatch {
  /**
   * @java No.construct(NoPieceType noType, @Opt SiteType type, @Opt @Or RoleType role,
   *   @Opt @Or @Name IntFunction of, @Opt String name, @Opt @Name RegionFunction in)
   *   — routes "(no Pieces …)". 6 required params so .length===6 matches the bind.
   */
  public static constructPieces(
    _noType: string,
    type: SiteType | null,
    role: RoleType | null,
    of: IntFunction | null,
    name: string | null,
    in_: RegionFunction | null,
  ): BooleanFunction {
    return new NoPieces(type, role, of, name, in_);
  }

  /**
   * @java No.construct(NoMoveType noType, RoleType playerFn) — routes "(no Moves <role>)".
   */
  public static constructMoves(_noType: string, playerFn: RoleType): BooleanFunction {
    return new NoMoves(playerFn);
  }
}
