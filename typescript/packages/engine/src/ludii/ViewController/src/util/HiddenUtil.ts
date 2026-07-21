// @java ViewController/src/util/HiddenUtil.java

/**
 * Functions to deal with hidden information.
 *
 * @author Matthew.Stephenson (Java), ported to TS
 */

import type { ContainerState, SiteType } from "../../../../ludemes/other/state/container/ContainerState.js";

// ---------------------------------------------------------------------------
// Minimal Context interface needed by HiddenUtil
// (subset of other.context.Context)
// ---------------------------------------------------------------------------
export interface IHiddenContext {
  game(): { players(): { count(): number } };
}

// ---------------------------------------------------------------------------
// Constants (mirrors main.Constants.MAX_PLAYERS = 16)
// ---------------------------------------------------------------------------
const MAX_PLAYERS = 16;

// ---------------------------------------------------------------------------
// HiddenUtil
// ---------------------------------------------------------------------------

export class HiddenUtil {

  public static readonly hiddenIndex        = 0;
  public static readonly hiddenWhatIndex    = 1;
  public static readonly hiddenWhoIndex     = 2;
  public static readonly hiddenStateIndex   = 3;
  public static readonly hiddenValueIndex   = 4;
  public static readonly hiddenCountIndex   = 5;
  public static readonly hiddenRotationIndex = 6;

  // -------------------------------------------------------------------------

  /**
   * Return true if the location is hidden from a specific who.
   */
  public static siteHidden(
    context: IHiddenContext,
    cs: ContainerState,
    site: number,
    level: number,
    who: number,
    type: SiteType,
  ): boolean {
    if (who > MAX_PLAYERS) {
      // If a spectator, check if info is hidden from ANY player
      for (let i = 1; i <= context.game().players().count(); i++) {
        if (cs.isHidden(i, site, level, type)) return true;
      }
      return false;
    } else {
      return cs.isHidden(who, site, level, type);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Return true if the location's what is hidden from a specific who.
   */
  public static siteWhatHidden(
    context: IHiddenContext,
    cs: ContainerState,
    site: number,
    level: number,
    who: number,
    type: SiteType,
  ): boolean {
    if (who > MAX_PLAYERS) {
      // If a spectator, check if info is hidden from ANY player
      for (let i = 1; i <= context.game().players().count(); i++) {
        if (cs.isHiddenWhat(i, site, level, type)) return true;
      }
      return false;
    } else {
      return cs.isHiddenWhat(who, site, level, type);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Return true if the location's who is hidden from a specific who.
   */
  public static siteWhoHidden(
    context: IHiddenContext,
    cs: ContainerState,
    site: number,
    level: number,
    who: number,
    type: SiteType,
  ): boolean {
    if (who > MAX_PLAYERS) {
      // If a spectator, check if info is hidden from ANY player
      for (let i = 1; i <= context.game().players().count(); i++) {
        if (cs.isHiddenWho(i, site, level, type)) return true;
      }
      return false;
    } else {
      return cs.isHiddenWho(who, site, level, type);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Return true if the location's state is hidden from a specific who.
   */
  public static siteStateHidden(
    context: IHiddenContext,
    cs: ContainerState,
    site: number,
    level: number,
    who: number,
    type: SiteType,
  ): boolean {
    if (who > MAX_PLAYERS) {
      // If a spectator, check if info is hidden from ANY player
      for (let i = 1; i <= context.game().players().count(); i++) {
        if (cs.isHiddenState(i, site, level, type)) return true;
      }
      return false;
    } else {
      return cs.isHiddenState(who, site, level, type);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Return true if the location's count is hidden from a specific who.
   */
  public static siteCountHidden(
    context: IHiddenContext,
    cs: ContainerState,
    site: number,
    level: number,
    who: number,
    type: SiteType,
  ): boolean {
    if (who > MAX_PLAYERS) {
      // If a spectator, check if info is hidden from ANY player
      for (let i = 1; i <= context.game().players().count(); i++) {
        if (cs.isHiddenCount(i, site, level, type)) return true;
      }
      return false;
    } else {
      return cs.isHiddenCount(who, site, level, type);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Return true if the location's value is hidden from a specific who.
   */
  public static siteValueHidden(
    context: IHiddenContext,
    cs: ContainerState,
    site: number,
    level: number,
    who: number,
    type: SiteType,
  ): boolean {
    if (who > MAX_PLAYERS) {
      // If a spectator, check if info is hidden from ANY player
      for (let i = 1; i <= context.game().players().count(); i++) {
        if (cs.isHiddenValue(i, site, level, type)) return true;
      }
      return false;
    } else {
      return cs.isHiddenValue(who, site, level, type);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Return true if the location's rotation is hidden from a specific who.
   */
  public static siteRotationHidden(
    context: IHiddenContext,
    cs: ContainerState,
    site: number,
    level: number,
    who: number,
    type: SiteType,
  ): boolean {
    if (who > MAX_PLAYERS) {
      // If a spectator, check if info is hidden from ANY player
      for (let i = 1; i <= context.game().players().count(); i++) {
        if (cs.isHiddenRotation(i, site, level, type)) return true;
      }
      return false;
    } else {
      return cs.isHiddenRotation(who, site, level, type);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Return an integer value representing the hidden information about a location for a specific who.
   */
  public static siteHiddenBitsetInteger(
    context: IHiddenContext,
    cs: ContainerState,
    site: number,
    level: number,
    who: number,
    type: SiteType,
  ): number {
    let hiddenInteger = 0;
    if (who !== 0) {
      hiddenInteger += HiddenUtil.siteHidden(context, cs, site, level, who, type) ? 1 : 0;
      hiddenInteger += (HiddenUtil.siteWhatHidden(context, cs, site, level, who, type) ? 1 : 0) * Math.pow(2, HiddenUtil.hiddenWhatIndex);
      hiddenInteger += (HiddenUtil.siteWhoHidden(context, cs, site, level, who, type) ? 1 : 0) * Math.pow(2, HiddenUtil.hiddenWhoIndex);
      hiddenInteger += (HiddenUtil.siteStateHidden(context, cs, site, level, who, type) ? 1 : 0) * Math.pow(2, HiddenUtil.hiddenStateIndex);
      hiddenInteger += (HiddenUtil.siteValueHidden(context, cs, site, level, who, type) ? 1 : 0) * Math.pow(2, HiddenUtil.hiddenValueIndex);
      hiddenInteger += (HiddenUtil.siteCountHidden(context, cs, site, level, who, type) ? 1 : 0) * Math.pow(2, HiddenUtil.hiddenCountIndex);
      hiddenInteger += (HiddenUtil.siteRotationHidden(context, cs, site, level, who, type) ? 1 : 0) * Math.pow(2, HiddenUtil.hiddenRotationIndex);
    }
    return hiddenInteger;
  }

  // -------------------------------------------------------------------------

  /**
   * Converts a hidden integer value into a BitSet (represented as a number[]).
   * The bit at index i is true if the i-th bit of valueInput is set.
   *
   * Mirrors Java BitSet semantics: bit indices map 1:1 with the hidden index constants.
   */
  public static intToBitSet(valueInput: number): boolean[] {
    let value = valueInput;
    const bits: boolean[] = [];
    let index = 0;
    while (value !== 0) {
      if (value % 2 !== 0) {
        bits[index] = true;
      }
      ++index;
      value = value >>> 1;
    }
    return bits;
  }

  // -------------------------------------------------------------------------
}
