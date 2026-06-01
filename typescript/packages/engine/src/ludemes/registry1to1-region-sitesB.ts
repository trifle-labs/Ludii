/**
 * registry1to1-region-sitesB.ts
 *
 * Barrel file for 1:1 region/sites port — Agent B slice (SECOND half):
 *   sites/group/**, sites/coords/**,
 *   (foreach, math, last, root all deferred — see report)
 *
 * Import this to trigger self-registration side-effects for all
 * region/sites ludeme classes in this slice.
 *
 * Registry keys added by this barrel:
 *   sites:group   (SitesGroup1to1) — BFS flood-fill connected group
 *   sites:coords  (SitesCoords1to1) — algebraic coord list to site indices
 */

// group/**
import "./game/functions/region/sites/group/SitesGroup1to1.js";

// coords/**
import "./game/functions/region/sites/coords/SitesCoords1to1.js";

export {};
