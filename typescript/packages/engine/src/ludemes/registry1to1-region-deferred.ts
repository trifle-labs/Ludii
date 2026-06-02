/**
 * registry1to1-region-deferred.ts
 *
 * Barrel: imports all 1:1 region/sites ludeme classes ported in the
 * "deferred" wave (previously deferred topology/radial ludemes).
 * Side-effectful imports trigger self-registration via registerRegion1to1().
 *
 * Registry keys added by this barrel:
 *   sites:distance      (SitesDistance1to1) — BFS distance from a site
 *   sites:walk          (SitesWalk1to1)     — turtle-walk landing sites
 *   sites:crossing      (SitesCrossing1to1) — edges crossing a given edge
 *   sites:loop          (SitesLoop1to1)     — sites forming a closed loop
 *   sites:pattern       (SitesPattern1to1)  — turtle-walk pattern match
 *   sites:concavecorners (SitesConcaveCorners1to1) — concave corner sites
 *   sites:convexcorners  (SitesConvexCorners1to1)  — convex corner sites
 *
 * Deferred (missing API / risk of clobbering):
 *   sites:direction  — already handled inline in compiler1to1.ts (working for
 *                      ~153 games); registering would clobber that. The full
 *                      Java SitesDirection supports multiple-origin From: and
 *                      stop/stopIncluded/included params not in the inline
 *                      version, but the inline is sufficient for passing games.
 *   sites:side       — already handled inline in compiler1to1.ts with angle-based
 *                      classification; defer to avoid clobbering.
 *   sites:track      — Equipment1to1 has no `tracks` field; track concept only
 *                      exists in the legacy eval-context path.
 *   sites:largePiece — requires largePieceFootprint + componentWalkById from the
 *                      legacy eval path; not available in the 1:1 context.
 *   SitesDistance stepMove arm — requires Java Step direction conversion +
 *                      Component/rotation logic not yet in the 1:1 path.
 */

// distance/**
import "./game/functions/region/sites/distance/SitesDistance1to1.js";

// walk/**
import "./game/functions/region/sites/walk/SitesWalk1to1.js";

// crossing/**
import "./game/functions/region/sites/crossing/SitesCrossing1to1.js";

// loop/**
import "./game/functions/region/sites/loop/SitesLoop1to1.js";

// pattern/**
import "./game/functions/region/sites/pattern/SitesPattern1to1.js";

// simple/concave+convex corners
import "./game/functions/region/sites/simple/SitesConcaveConvexCorners1to1.js";

export {};
