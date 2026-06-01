/**
 * registry1to1-region.ts
 *
 * Barrel that imports all 1:1 region ludeme class files so they
 * self-register via registerRegion1to1() side effects at module load time.
 *
 * Import this from compiler1to1.ts to wire the region registry.
 * Each ported package adds its own sub-barrel import line here.
 */

// (region package sub-barrels are added here as they are ported)
import "./registry1to1-region-sitesA.js";
import "./registry1to1-region-sitesB.js";
export {};
