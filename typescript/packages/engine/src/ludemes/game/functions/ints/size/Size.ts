// @java Core/src/game/functions/ints/size/Size.java

/**
 * Static factory dispatching the (size …) variants.
 *
 * @java game/functions/ints/size/Size.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";
// Transitional delegates: these classes hold the engine-substrate logic; their
// re-homing to @java paths is a separate mechanical step (item-3 recipe).
import { SizeGroup, SizeStack, SizeArray } from "../../ints1to1/size/Size.js";
import { SizeTerritory } from "./connection/SizeTerritory.js";
import { SizeLargePiece } from "./largePiece/SizeLargePiece.js";
import { LastTo } from "../last/LastTo.js";

export class Size extends BaseIntFunction {
  private constructor() { super(); }

  /** @java Size.construct(SizeArrayType, IntArrayFunction array) */
  public static constructArray(_sizeType: string, array: unknown): BaseIntFunction {
    return new SizeArray(array as never) as unknown as BaseIntFunction;
  }

  /** @java Size.construct(SizeTerritoryType, SiteType, @Or RoleType, @Or Player, AbsoluteDirection) */
  public static constructTerritory(_sizeType: string, type: unknown, role: unknown, player: unknown, direction: unknown = null): BaseIntFunction {
    return new SizeTerritory(type as never, role as never, player as never, direction as never) as unknown as BaseIntFunction;
  }

  /** @java Size.construct(SizeSiteType Stack, SiteType, in@Or, at@Or) */
  public static constructSite(_sizeType: string, _type: unknown, _inRegion: unknown, at: unknown = null): BaseIntFunction {
    const atFn = (at as JavaIntFunction | null) ?? new LastTo();
    return new SizeStack(atFn as never) as unknown as BaseIntFunction;
  }

  /** @java Size.construct(SizeLargePieceType, SiteType, in@Or, at@Or) */
  public static constructLargePiece(_sizeType: string, _type: unknown, inRegion: unknown, at: unknown = null): BaseIntFunction {
    // Exported SizeLargePiece ctor is (type, atFn, inFn) — the Java order.
    return new SizeLargePiece(_type as never, (at ?? null) as never, (inRegion ?? null) as never) as unknown as BaseIntFunction;
  }

  /** @java Size.construct(SizeGroupType, SiteType, at@Name, Direction, If@Name) */
  public static constructGroup(_sizeType: string, _type: unknown, at: unknown, directions: unknown = null, _If: unknown = null): BaseIntFunction {
    const dir = typeof directions === "string" ? directions : "Adjacent";
    return new SizeGroup(at as never, dir) as unknown as BaseIntFunction;
  }

  /** @java Size.eval — never called (static-factory-only). */
  public override eval(_context: Context): number {
    throw new Error("Size.eval(): Should never be called directly.");
  }
  public isStatic(): boolean { return false; }
}
