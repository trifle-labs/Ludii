/**
 * registry1to1-region-sitesA.ts
 *
 * Barrel file for 1:1 region/sites port — Agent A slice:
 *   simple/**, index/**, edges/**, hidden/**, player/**, moves/**
 *
 * Import this to trigger self-registration side-effects for all
 * region/sites ludeme classes in this slice.
 *
 * Registry keys added by this barrel:
 *   sites:lastto        (SitesLastTo1to1)
 *   sites:lastfrom      (SitesLastFrom1to1)
 *   sites:toclear       (SitesToClear1to1)
 *   sites:pending       (SitesPending1to1)
 *   sites:perimeter     (SitesPerimeter1to1)
 *   sites:angled        (SitesAngled1to1)
 *   sites:axial         (SitesAxial1to1)
 *   sites:horizontal    (SitesHorizontal1to1)
 *   sites:vertical      (SitesVertical1to1)
 *   sites:slash         (SitesSlash1to1)
 *   sites:slosh         (SitesSlosh1to1)
 *   sites:hidden        (SitesHidden1to1 / dispatch on HiddenData)
 */

// simple/**
import "./game/functions/region/sites/simple/SitesLastTo1to1.js";
import "./game/functions/region/sites/simple/SitesLastFrom1to1.js";
import "./game/functions/region/sites/simple/SitesToClear1to1.js";
import "./game/functions/region/sites/simple/SitesPending1to1.js";
import "./game/functions/region/sites/simple/SitesPerimeter1to1.js";

// edges/**
import "./game/functions/region/sites/edges/SitesEdge1to1.js";

// hidden/**
import "./game/functions/region/sites/hidden/SitesHidden1to1.js";

export {};
