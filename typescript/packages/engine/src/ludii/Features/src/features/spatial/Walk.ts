// @java Features/src/features/spatial/Walk.java

/**
 * A relative position specified by a sequence of turns to take whilst walking.
 *
 * @java features/spatial/Walk.java
 * @author Dennis Soemers and cambolbro
 */

/** @java other.topology.TopologyElement */
export interface TopologyElement {
  index(): number;
  sortedOrthos(): Array<TopologyElement | null>;
}

/** @java game.Game */
export interface Game {
  board(): {
    topology(): {
      trueOrthoConnectivities(game: Game): number[];
    };
  };
  graphPlayElements(): TopologyElement[];
}

/** @java features.spatial.graph_search.Path (forward ref to avoid circular import) */
export interface PathLike {
  destination(): TopologyElement;
  sites(): TopologyElement[];
  walk(): Walk;
}

//-----------------------------------------------------------------------------

/** Weak-reference cache of last game for which allGameRotations was computed */
let _cachedGame: Game | null = null;
let _cachedAllGameRotations: number[] = [];

//-----------------------------------------------------------------------------

/**
 * @java features.spatial.Walk
 */
export class Walk {

  //-------------------------------------------------------------------------

  /** Relative turns to make for every step */
  public readonly steps: number[];

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java Walk()
   */
  constructor();

  /**
   * Constructor
   * @param steps
   * @java Walk(float...)
   */
  constructor(steps: number[]);

  /**
   * Copy constructor
   * @param other
   * @java Walk(Walk)
   */
  constructor(other: Walk);

  /**
   * Constructor from string
   * @param string
   * @java Walk(String)
   */
  constructor(string: string);

  constructor(stepsOrOtherOrString?: number[] | Walk | string) {
    if (stepsOrOtherOrString === undefined) {
      this.steps = [];
    } else if (typeof stepsOrOtherOrString === "string") {
      const string = stepsOrOtherOrString;
      const walkString = string.substring("{".length, string.length - "}".length);
      if (walkString.length > 0) {
        const stepStrings = walkString.split(",");
        this.steps = [];
        for (const stepStr of stepStrings) {
          const s = stepStr.trim();
          if (s.includes("/")) {
            const parts = s.split("/");
            this.steps.push(parseInt(parts[0]!) / parseInt(parts[1]!));
          } else {
            this.steps.push(parseFloat(s));
          }
        }
      } else {
        this.steps = [];
      }
    } else if (stepsOrOtherOrString instanceof Walk) {
      this.steps = [...stepsOrOtherOrString.steps];
    } else {
      this.steps = [...stepsOrOtherOrString];
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Applies given reflection multiplier to this Walk
   * @param reflection
   * @java Walk.applyReflection(int)
   */
  public applyReflection(reflection: number): void {
    if (reflection === 1) {
      return;
    }
    // assert reflection === -1
    for (let i = 0; i < this.steps.length; ++i) {
      this.steps[i] = this.steps[i]! * reflection;
    }
  }

  /**
   * Applies given rotation to this walk
   * @param rotation
   * @java Walk.applyRotation(float)
   */
  public applyRotation(rotation: number): void {
    if (this.steps.length > 0) {
      this.steps[0] = this.steps[0]! + rotation;
    }
  }

  /**
   * Adds all steps from the given walk to the end of this walk
   * @param walk
   * @java Walk.appendWalk(Walk)
   */
  public appendWalk(walk: Walk): void {
    for (const step of walk.steps) {
      this.steps.push(step);
    }
  }

  /**
   * Adds a step corresponding to the given direction to the beginning of the Walk
   * @param step
   * @java Walk.prependStep(float)
   */
  public prependStep(step: number): void {
    this.steps.unshift(step);
  }

  /**
   * Adds all steps from the given walk to the beginning of this Walk
   * @param walk
   * @java Walk.prependWalk(Walk)
   */
  public prependWalk(walk: Walk): void {
    this.steps.unshift(...walk.steps);
  }

  /**
   * Prepends all steps of the given walk to this walk, with correction to first step.
   * @param walk
   * @param path
   * @param rotToRevert
   * @param refToRevert
   * @java Walk.prependWalkWithCorrection(Walk, Path, float, int)
   */
  public prependWalkWithCorrection(
    walk: Walk,
    path: PathLike,
    rotToRevert: number,
    refToRevert: number,
  ): void {
    if (walk.steps.length === 0)
      return;

    if (this.steps.length > 0) {
      const endSite = path.destination();
      const pathSites = path.sites();
      const penultimateSite = pathSites[pathSites.length - 2]!;

      const sortedOrthos = endSite.sortedOrthos();
      let fromDir = -1;

      for (let orthIdx = 0; orthIdx < sortedOrthos.length; ++orthIdx) {
        const o = sortedOrthos[orthIdx];
        if (o != null && o.index() === penultimateSite.index()) {
          fromDir = orthIdx;
          break;
        }
      }

      if (fromDir === -1) {
        console.error("Warning! Walk.prependWalkWithCorrection() could not find fromDir!");
      }

      const contDir = fromDir + Math.floor(sortedOrthos.length / 2);
      const toSubtract = (contDir / sortedOrthos.length) - rotToRevert * refToRevert;

      this.steps[0] = this.steps[0]! - toSubtract;
    }

    this.steps.unshift(...walk.steps);
  }

  //-------------------------------------------------------------------------

  /**
   * Resolves this Walk
   * @param game Game in which we're resolving a Walk
   * @param startSite TopologyElement to start walking from
   * @param rotModifier Additional rotation to apply
   * @param reflectionMult Reflection multiplier
   * @return Indices of all possible sites this Walk can end up in
   * @java Walk.resolveWalk(Game, TopologyElement, float, int)
   */
  public resolveWalk(
    game: Game,
    startSite: TopologyElement,
    rotModifier: number,
    reflectionMult: number,
  ): number[] {
    const results: number[] = [];

    if (this.steps.length > 0) {
      const sortedOrthos = startSite.sortedOrthos();
      const connectionIndices: number[] = [];

      let connectionIdxFloat =
        ((this.steps[0]! + rotModifier) * reflectionMult) * sortedOrthos.length;
      let connectionIdxFractionalPart = connectionIdxFloat - Math.trunc(connectionIdxFloat);

      if (
        Math.abs(0.5 - connectionIdxFractionalPart) < 0.02 ||
        Math.abs(0.5 + connectionIdxFractionalPart) < 0.02
      ) {
        connectionIndices.push(Math.floor(connectionIdxFloat));
      } else {
        connectionIndices.push(Math.round(connectionIdxFloat));
      }

      let wentOffBoard = false;

      for (let c = 0; c < connectionIndices.length; ++c) {
        let prevSite: TopologyElement = startSite;
        let connectionIdx = connectionIndices[c]!;

        // wrap around
        connectionIdx = ((connectionIdx % sortedOrthos.length) + sortedOrthos.length) % sortedOrthos.length;
        let nextSiteRaw: TopologyElement | null = sortedOrthos[connectionIdx] ?? null;

        let nextSites: Array<TopologyElement | null> = [nextSiteRaw];
        let prevSites: Array<TopologyElement> = [prevSite];

        for (let step = 1; step < this.steps.length; ++step) {
          const newNextSites: Array<TopologyElement | null> = [];
          const newPrevSites: Array<TopologyElement> = [];

          for (let i = 0; i < nextSites.length; ++i) {
            prevSite = prevSites[i]!;
            const nextSite = nextSites[i]!;

            if (nextSite == null) {
              wentOffBoard = true;
            } else {
              const nextSortedOrthos = nextSite.sortedOrthos();
              let fromDir = -1;

              for (let nextOrthIdx = 0; nextOrthIdx < nextSortedOrthos.length; ++nextOrthIdx) {
                const o = nextSortedOrthos[nextOrthIdx];
                if (o != null && o.index() === prevSite.index()) {
                  fromDir = nextOrthIdx;
                  break;
                }
              }

              if (fromDir === -1) {
                console.error("Warning! Walk.resolveWalk() could not find fromDir!");
              }

              const contDir = fromDir + Math.floor(nextSortedOrthos.length / 2);

              const nextConnectionIndices: number[] = [];
              connectionIdxFloat =
                contDir + (this.steps[step]! * reflectionMult) * nextSortedOrthos.length;
              connectionIdxFractionalPart = connectionIdxFloat - Math.trunc(connectionIdxFloat);

              if (
                Math.abs(0.5 - connectionIdxFractionalPart) < 0.02 ||
                Math.abs(0.5 + connectionIdxFractionalPart) < 0.02
              ) {
                nextConnectionIndices.push(Math.floor(connectionIdxFloat));
              } else {
                nextConnectionIndices.push(Math.round(connectionIdxFloat));
              }

              for (const nci of nextConnectionIndices) {
                const wrappedIdx = ((nci % nextSortedOrthos.length) + nextSortedOrthos.length) % nextSortedOrthos.length;
                const newNextSite: TopologyElement | null = nextSortedOrthos[wrappedIdx] ?? null;
                newPrevSites.push(nextSite);
                newNextSites.push(newNextSite);
              }
            }
          }

          nextSites = newNextSites;
          prevSites = newPrevSites;
        }

        for (const dest of nextSites) {
          if (dest == null) {
            wentOffBoard = true;
          } else {
            results.push(dest.index());
          }
        }
      }

      if (wentOffBoard) {
        results.push(-1);
      }
    } else {
      results.push(startSite.index());
    }

    return results;
  }

  //-------------------------------------------------------------------------

  public hashCode(): number {
    const prime = 31;
    let result = 1;
    for (let i = 0; i < this.steps.length; ++i) {
      // Mirroring Java: Float.floatToIntBits((steps.getQuick(i) + 1.f) * 663608941.737f)
      const fVal = (this.steps[i]! + 1.0) * 663608941.737;
      result = (prime * result + (fVal | 0)) | 0;
    }
    result = (prime * result + this.steps.length) | 0;
    return result;
  }

  public equals(other: unknown): boolean {
    if (!(other instanceof Walk))
      return false;
    if (this.steps.length !== other.steps.length)
      return false;
    for (let i = 0; i < this.steps.length; ++i) {
      if (this.steps[i] !== other.steps[i])
        return false;
    }
    return true;
  }

  //-------------------------------------------------------------------------

  /**
   * @param game
   * @return Array of all possible sensible rotations for the given game's board
   * @java Walk.allGameRotations(Game)
   */
  public static allGameRotations(game: Game): number[] {
    if (_cachedGame === game)
      return _cachedAllGameRotations;

    const connectivities: number[] = game.board().topology().trueOrthoConnectivities(game);
    const rotations: number[] = [];

    for (let i = connectivities.length - 1; i >= 0; --i) {
      const connectivity = connectivities[i]!;
      if (connectivity === 0)
        continue;

      let alreadyHandled = false;
      for (let j = i + 1; j < connectivities.length; ++j) {
        if ((connectivities[j]! % connectivity) === 0) {
          alreadyHandled = true;
          break;
        }
      }

      if (!alreadyHandled) {
        const newRots = Walk.rotationsForNumOrthos(connectivity);
        for (const r of newRots) {
          if (!rotations.includes(r))
            rotations.push(r);
        }
      }
    }

    _cachedAllGameRotations = rotations;
    _cachedGame = game;

    return _cachedAllGameRotations;
  }

  /**
   * @param numOrthos
   * @return Array of all possible rotations for cell with given number of orthogonals.
   * @java Walk.rotationsForNumOrthos(int)
   */
  public static rotationsForNumOrthos(numOrthos: number): number[] {
    const allowedRotations: number[] = [];
    for (let i = 0; i < numOrthos; ++i) {
      allowedRotations.push(i / numOrthos);
    }
    return allowedRotations;
  }

  //-------------------------------------------------------------------------

  public toString(): string {
    let str = "";
    for (let i = 0; i < this.steps.length; ++i) {
      str += this.steps[i]!;
      if (i < this.steps.length - 1) {
        str += ",";
      }
    }
    return `{${str}}`;
  }

  //-------------------------------------------------------------------------
}
