// @java Core/src/game/util/graph/Radial.java Radial
// @java Core/src/game/util/graph/Radials.java Radials
//
// A Radial is a ray: a sequence of graph elements starting at an origin and
// stepping in one direction (e.g. a rook's file). Radials is the per-element
// collection, indexed by direction, with the "distinct" sublists Java uses to
// deduplicate a radial against its opposite.

import {
  AbsoluteDirection,
  AbsoluteDirection as ABS,
  NUM_DIRECTIONS,
  specific,
} from "./absolute-direction.js";
import { type GElement } from "./graph-element.js";
import { absTanAngleDifference3D, angle2D } from "./math.js";
import { matchesElement } from "./step.js";

/** @java Core/src/game/util/graph/Radial.java Radial */
export class Radial {
  private opps: Radial[] | null = null;

  public constructor(
    public readonly steps: GElement[],
    public readonly direction: AbsoluteDirection,
  ) {}

  public from(): GElement {
    return this.steps[0] as GElement;
  }
  public lastStep(): GElement {
    return this.steps[this.steps.length - 1] as GElement;
  }
  public opposites(): Radial[] | null {
    return this.opps;
  }

  /** @java Radial.matches: same direction and identical step path. */
  public matches(other: Radial): boolean {
    if (this.direction !== other.direction) return false;
    return this.stepsMatch(other);
  }

  /** @java Radial.stepsMatch: same length, element-for-element match. */
  public stepsMatch(other: Radial): boolean {
    if (this.steps.length !== other.steps.length) return false;
    for (let n = 0; n < this.steps.length; n += 1) {
      if (!matchesElement(this.steps[n] as GElement, other.steps[n] as GElement)) {
        return false;
      }
    }
    return true;
  }

  /** @java Radial.isOppositeAngleTo: first hops point ~180° apart (~9° slack). */
  public isOppositeAngleTo(other: Radial): boolean {
    const tanThreshold = Math.tan(0.1);
    const geA = this.steps[1] as GElement;
    const geB = this.steps[0] as GElement;
    const geC = other.steps[1] as GElement;
    return absTanAngleDifference3D(geA.pt, geB.pt, geC.pt) < tanThreshold;
  }

  /** @java Radial.addOpposite */
  public addOpposite(opp: Radial): void {
    if (this.opps === null) {
      this.opps = [opp];
      return;
    }
    for (const existing of this.opps) {
      if (
        this.direction === opp.direction ||
        specific(this.direction) ||
        opp.stepsMatch(existing)
      ) {
        return;
      }
    }
    this.opps.push(opp);
  }

  /** @java Radial.removeOppositeSubsets */
  public removeOppositeSubsets(): void {
    if (this.opps === null) return;
    for (let o = this.opps.length - 1; o >= 0; o -= 1) {
      const oppositeO = this.opps[o] as Radial;
      for (let n = 0; n < this.opps.length; n += 1) {
        if (n === o) continue;
        if (oppositeO.isSubsetOf(this.opps[n] as Radial)) {
          this.opps.splice(o, 1);
          break;
        }
      }
    }
  }

  /** @java Radial.isSubsetOf: this path is a prefix of other's. */
  public isSubsetOf(other: Radial): boolean {
    if (this.steps.length > other.steps.length) return false;
    for (let n = 0; n < this.steps.length; n += 1) {
      if (!matchesElement(this.steps[n] as GElement, other.steps[n] as GElement)) {
        return false;
      }
    }
    return true;
  }
}

/** Stable CW-from-N sort — @java Radials.sort / Steps.sort via ItemScore. */
function sortByFirstHop(list: Radial[]): void {
  const ranked = list.map((radial, n) => {
    const p0 = radial.steps[0] as GElement;
    const p1 = radial.steps[1] as GElement;
    const theta = angle2D(p0.pt.x, p0.pt.y, p1.pt.x, p1.pt.y);
    let score = Math.PI / 2 - theta + 0.0001;
    while (score < 0) score += 2 * Math.PI;
    return { radial, score, n };
  });
  ranked.sort((a, b) => (a.score === b.score ? a.n - b.n : a.score - b.score));
  for (let i = 0; i < ranked.length; i += 1) {
    list[i] = (ranked[i] as { radial: Radial }).radial;
  }
}

/** @java Core/src/game/util/graph/Radials.java Radials */
export class Radials {
  public readonly radials: Radial[] = [];
  private readonly inDirectionLists: Radial[][];
  private readonly distinctInDirectionLists: Radial[][];
  public readonly totalDirections = new Set<number>();

  public constructor(
    public readonly siteType: number,
    public readonly siteId: number,
  ) {
    this.inDirectionLists = Array.from({ length: NUM_DIRECTIONS }, () => []);
    this.distinctInDirectionLists = Array.from({ length: NUM_DIRECTIONS }, () => []);
  }

  public inDirection(dirn: AbsoluteDirection): Radial[] {
    return this.inDirectionLists[dirn] as Radial[];
  }
  public distinctInDirection(dirn: AbsoluteDirection): Radial[] {
    return this.distinctInDirectionLists[dirn] as Radial[];
  }

  public addInDirection(dirn: AbsoluteDirection, radial: Radial): void {
    (this.inDirectionLists[dirn] as Radial[]).push(radial);
  }

  /** @java Radials.addSafe: dedup, register opposites, track distinctness. */
  public addSafe(radial: Radial): void {
    // Skip exact duplicates.
    for (const existing of this.radials) if (existing.matches(radial)) return;

    // Register opposite relationships (rotational pairs or opposite-angle rays).
    for (const existing of this.radials) {
      if (
        (radial.direction === ABS.CW && existing.direction === ABS.CCW) ||
        (radial.direction === ABS.CCW && existing.direction === ABS.CW) ||
        (radial.direction === ABS.In && existing.direction === ABS.Out) ||
        (radial.direction === ABS.Out && existing.direction === ABS.In) ||
        (radial.isOppositeAngleTo(existing) &&
          ((specific(radial.direction) && specific(existing.direction)) ||
            radial.direction === existing.direction))
      ) {
        radial.addOpposite(existing);
        existing.addOpposite(radial);
      }
    }

    // Distinctness within this direction.
    let isDistinct = true;
    for (const existing of this.inDirection(radial.direction)) {
      if (radial.stepsMatch(existing) || radial.isOppositeAngleTo(existing)) {
        isDistinct = false;
        break;
      }
      const opps = radial.opposites();
      if (opps !== null) {
        for (const existingOpposite of opps) {
          if (radial.stepsMatch(existingOpposite)) {
            isDistinct = false;
            break;
          }
        }
      }
    }

    this.radials.push(radial);
    (this.inDirectionLists[radial.direction] as Radial[]).push(radial);
    this.totalDirections.add(radial.direction);
    if (isDistinct) {
      (this.distinctInDirectionLists[radial.direction] as Radial[]).push(radial);
    }
  }

  /** @java Radials.removeSubsetsInDirection */
  public removeSubsetsInDirection(dirn: AbsoluteDirection): void {
    const list = this.inDirectionLists[dirn] as Radial[];
    for (let n = list.length - 1; n >= 0; n -= 1) {
      const radial = list[n] as Radial;
      for (let nn = 0; nn < list.length; nn += 1) {
        if (n === nn) continue;
        if (radial.isSubsetOf(list[nn] as Radial)) {
          list.splice(n, 1);
          break;
        }
      }
    }
  }

  /** @java Radials.setDistinct: recompute distinct sublists per direction. */
  public setDistinct(): void {
    for (let dirn = 0; dirn < NUM_DIRECTIONS; dirn += 1) {
      (this.distinctInDirectionLists[dirn] as Radial[]).length = 0;
    }
    for (let dirn = 0; dirn < NUM_DIRECTIONS; dirn += 1) {
      const list = this.inDirectionLists[dirn] as Radial[];
      const distinct = this.distinctInDirectionLists[dirn] as Radial[];
      for (const radial of list) {
        let isDistinct = true;
        for (const existing of distinct) {
          if (radial === existing) continue;
          const opps = existing.opposites();
          if (opps === null) continue;
          for (const opp of opps) {
            if (radial.stepsMatch(opp)) {
              isDistinct = false;
              break;
            }
          }
          if (!isDistinct) break;
        }
        if (isDistinct) distinct.push(radial);
      }
    }
  }

  /** @java Radials.sort: CW from N across every list. */
  public sort(): void {
    sortByFirstHop(this.radials);
    for (let dirn = 0; dirn < NUM_DIRECTIONS; dirn += 1) {
      sortByFirstHop(this.inDirectionLists[dirn] as Radial[]);
      sortByFirstHop(this.distinctInDirectionLists[dirn] as Radial[]);
    }
  }
}
