// @java Core/src/game/util/graph/Step.java Step
// @java Core/src/game/util/graph/Steps.java Steps
//
// A Step is a single hop from one graph element to an adjacent one, tagged with
// the set of AbsoluteDirections it agrees with (its `directions` BitSet). Steps
// is the per-element collection, indexed three ways exactly like Java:
// flat, by toType, by direction, and by (toType, direction).

import {
  type AbsoluteDirection,
  NUM_DIRECTIONS,
} from "./absolute-direction.js";
import { type GElement, NUM_SITE_TYPES, type SiteType } from "./graph-element.js";

/** @java Core/src/game/util/graph/Step.java Step */
export class Step {
  /** AbsoluteDirection ordinals this step agrees with — @java Step.directions (BitSet). */
  public readonly directions = new Set<number>();

  public constructor(
    public readonly from: GElement,
    public readonly to: GElement,
  ) {}

  /** @java Step.matches(Step): same endpoints AND identical direction set. */
  public matches(other: Step): boolean {
    if (!matchesElement(this.from, other.from)) return false;
    if (!matchesElement(this.to, other.to)) return false;
    if (this.directions.size !== other.directions.size) return false;
    for (const d of this.directions) if (!other.directions.has(d)) return false;
    return true;
  }
}

/** @java GraphElement.matches(GraphElement): same siteType and id. */
export function matchesElement(a: GElement, b: GElement): boolean {
  return a.siteType === b.siteType && a.id === b.id;
}

/** @java Core/src/game/util/graph/Steps.java Steps */
export class Steps {
  public readonly steps: Step[] = [];
  private readonly inDirectionLists: Step[][];
  private readonly toSiteTypeLists: Step[][];
  private readonly toSiteTypeInDirectionLists: Step[][][];
  public readonly totalDirections = new Set<number>();

  public constructor(
    public readonly siteType: SiteType,
    public readonly id: number,
  ) {
    this.toSiteTypeLists = Array.from({ length: NUM_SITE_TYPES }, () => []);
    this.inDirectionLists = Array.from({ length: NUM_DIRECTIONS }, () => []);
    this.toSiteTypeInDirectionLists = Array.from(
      { length: NUM_SITE_TYPES },
      () => Array.from({ length: NUM_DIRECTIONS }, () => []),
    );
  }

  public toSiteType(toType: SiteType): Step[] {
    return this.toSiteTypeLists[toType] as Step[];
  }
  public inDirection(dirn: AbsoluteDirection): Step[] {
    return this.inDirectionLists[dirn] as Step[];
  }
  public toSiteTypeInDirection(toType: SiteType, dirn: AbsoluteDirection): Step[] {
    return (this.toSiteTypeInDirectionLists[toType] as Step[][])[dirn] as Step[];
  }

  public clearInDirection(dirn: AbsoluteDirection): void {
    (this.inDirectionLists[dirn] as Step[]).length = 0;
  }

  public addInDirection(dirn: AbsoluteDirection, step: Step): void {
    (this.inDirectionLists[dirn] as Step[]).push(step);
  }

  /** @java Steps.addToSiteTypeInDirection — dedup by Step.matches. */
  public addToSiteTypeInDirection(toType: SiteType, dirn: AbsoluteDirection, step: Step): void {
    const list = this.toSiteTypeInDirection(toType, dirn);
    for (const existing of list) if (step.matches(existing)) return;
    list.push(step);
  }

  /**
   * @java Steps.add(Step): dedup by (from,to); on a duplicate, OR in any new
   * direction bits. On a fresh step, index it by toType and by each set bit.
   */
  public add(step: Step): void {
    for (const existing of this.steps) {
      if (
        matchesElement(existing.from, step.from) &&
        matchesElement(existing.to, step.to)
      ) {
        for (const d of step.directions) existing.directions.add(d);
        return;
      }
    }
    this.steps.push(step);

    const toId = step.to.siteType;
    (this.toSiteTypeLists[toId] as Step[]).push(step);

    for (const d of step.directions) {
      (this.inDirectionLists[d] as Step[]).push(step);
      (this.toSiteTypeInDirectionLists[toId] as Step[][])[d]?.push(step);
      this.totalDirections.add(d);
    }
  }
}
