// @java Features/src/features/Feature.java

/**
 * Abstract class for features; can be spatial or aspatial.
 *
 * @java features/Feature.java
 * @author Dennis Soemers
 */

/** @java game.Game */
export interface Game {
  players(): { count(): number };
}

//-----------------------------------------------------------------------------

/**
 * @java features.Feature
 */
export abstract class Feature {

  //-------------------------------------------------------------------------

  /**
   * @param string
   * @return Feature constructed from given string
   * @java Feature.fromString(String)
   */
  public static fromString(string: string): Feature {
    // Lazy imports to avoid circular deps
    if (string.includes("abs:")) {
      const { AbsoluteFeature } = require("./spatial/AbsoluteFeature.js") as typeof import("./spatial/AbsoluteFeature.js");
      return new AbsoluteFeature(string);
    } else if (string.includes("rel:")) {
      const { RelativeFeature } = require("./spatial/RelativeFeature.js") as typeof import("./spatial/RelativeFeature.js");
      return new RelativeFeature(string);
    } else {
      return Feature.aspatialFromString(string);
    }
  }

  /**
   * @param string
   * @return Aspatial feature constructed from given string
   * @java Feature.aspatialFromString(String)
   */
  private static aspatialFromString(string: string): Feature {
    if (string === "PassMove") {
      const { PassMoveFeature } = require("./aspatial/PassMoveFeature.js") as typeof import("./aspatial/PassMoveFeature.js");
      return (PassMoveFeature as unknown as { instance(): Feature }).instance();
    } else if (string === "SwapMove") {
      const { SwapMoveFeature } = require("./aspatial/SwapMoveFeature.js") as typeof import("./aspatial/SwapMoveFeature.js");
      return (SwapMoveFeature as unknown as { instance(): Feature }).instance();
    } else if (string === "Intercept") {
      const { InterceptFeature } = require("./aspatial/InterceptFeature.js") as typeof import("./aspatial/InterceptFeature.js");
      return (InterceptFeature as unknown as { instance(): Feature }).instance();
    } else {
      console.error("Cannot construct aspatial feature from string: " + string);
    }
    return null as unknown as Feature;
  }

  //-------------------------------------------------------------------------

  /**
   * @param game Game to visualise for
   * @return Tikz code to visualise this feature in a Tikz environment in LaTeX.
   * @java Feature.generateTikzCode(Game)
   */
  public abstract generateTikzCode(game: Game): string;

  //-------------------------------------------------------------------------
}
