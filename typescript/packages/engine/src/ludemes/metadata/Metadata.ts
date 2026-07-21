/**
 * @java metadata/Metadata.java Metadata
 *
 * The metadata of a game. Holds info, graphics, AI, and reconstruction
 * metadata sub-blocks.
 *
 * @author cambolbro and Eric.Piette and Dennis Soemers and Matthew.Stephenson
 *
 * @example (metadata
 *   (info { (description "Description of The game") (source "Source of the game")
 *           (version "1.0.0") (classification "board/space/territory")
 *           (origin "Origin of the game.") })
 *   (graphics { (board Style Go) (player Colour P1 (colour Black))
 *               (player Colour P2 (colour White)) })
 *   (ai (bestAgent "UCT"))
 * )
 */

import { Info } from "./info/Info.js";
import { Recon } from "./recon/Recon.js";
import type { MetadataItem } from "./MetadataItem.js";

// ---------------------------------------------------------------------------
// Forward-declaration stubs for Graphics and Ai.
// These classes are defined in metadata.graphics and metadata.ai respectively.
// They are not in scope for this translation pass; the stubs below satisfy
// TypeScript's structural-typing requirements so that Metadata can compile
// without pulling in the untranslated packages.
// When those packages are translated, replace these stubs with proper imports.
// ---------------------------------------------------------------------------

/**
 * @java metadata/graphics/Graphics.java Graphics
 * Stub — full translation deferred (metadata.graphics not in scope).
 */
export interface GraphicsLike extends MetadataItem {
  toString(): string;
}

/**
 * @java metadata/ai/Ai.java Ai
 * Stub — full translation deferred (metadata.ai not in scope).
 */
export interface AiLike extends MetadataItem {
  toString(): string;
}

// ---------------------------------------------------------------------------

export class Metadata implements MetadataItem {
  /** @java metadata/Metadata.java — info field */
  private readonly _info: Info;

  /** @java metadata/Metadata.java — graphics field */
  private readonly _graphics: GraphicsLike;

  /** @java metadata/Metadata.java — ai field */
  private readonly _ai: AiLike;

  /** @java metadata/Metadata.java — recon field */
  private readonly _recon: Recon;

  // -------------------------------------------------------------------------

  /**
   * @java metadata/Metadata.java — constructor(Info, Graphics, Ai, Recon)
   *
   * Java marks all parameters @Opt. Null maps to default empty instances.
   *
   * @param info     The info metadata.
   * @param graphics The graphics metadata.
   * @param ai       Metadata for AIs playing this game.
   * @param recon    The metadata related to reconstruction.
   */
  public constructor(
    info?: Info | null,
    graphics?: GraphicsLike | null,
    ai?: AiLike | null,
    recon?: Recon | null,
  ) {
    // @java metadata/Metadata.java — if (info != null) ... else new Info(null, null)
    this._info = info ?? new Info(null, null);

    // @java metadata/Metadata.java — if (graphics != null) ... else new Graphics(null, null)
    this._graphics = graphics ?? Metadata._emptyGraphics();

    // @java metadata/Metadata.java — if (ai != null) ... else new Ai(null, null, null, null, null, null)
    this._ai = ai ?? Metadata._emptyAi();

    // @java metadata/Metadata.java — if (recon != null) ... else new Recon(null, null)
    this._recon = recon ?? new Recon(null, null);
  }

  // -------------------------------------------------------------------------
  // Empty-instance helpers (mirror the Java default-constructor path)
  // -------------------------------------------------------------------------

  private static _emptyGraphics(): GraphicsLike {
    return { toString: () => "" };
  }

  private static _emptyAi(): AiLike {
    return { toString: () => "" };
  }

  // -------------------------------------------------------------------------

  /**
   * @java metadata/Metadata.java — info()
   * @returns The info metadata.
   */
  public info(): Info {
    return this._info;
  }

  /**
   * @java metadata/Metadata.java — graphics()
   * @returns The graphics metadata.
   */
  public graphics(): GraphicsLike {
    return this._graphics;
  }

  /**
   * @java metadata/Metadata.java — ai()
   * @returns Our AI metadata.
   */
  public ai(): AiLike {
    return this._ai;
  }

  /**
   * @java metadata/Metadata.java — recon()
   * @returns Our Recon metadata.
   */
  public recon(): Recon {
    return this._recon;
  }

  // -------------------------------------------------------------------------

  /** @java metadata/Metadata.java — toString() */
  public toString(): string {
    let sb = "(metadata\n";
    if (this._info != null)    sb += this._info.toString();
    if (this._graphics != null) sb += this._graphics.toString();
    if (this._ai != null)      sb += this._ai.toString();
    if (this._recon != null)   sb += this._recon.toString();
    sb += ")\n";
    return sb;
  }
}
