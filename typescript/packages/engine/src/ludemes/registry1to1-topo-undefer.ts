/**
 * registry1to1-topo-undefer.ts
 *
 * Barrel: imports all topology-dependent 1:1 ludeme classes ported in the
 * topo-undefer wave. Side-effectful imports trigger self-registration in the
 * 1:1 registry via registerInt1to1 / registerRegion1to1 / registerBool1to1.
 *
 * Keys ported:
 *   INT:    count:edges, count:vertices, count:off
 *   REGION: sites:cell, sites:edge, sites:major, sites:minor
 *   BOOL:   is:related, is:crossing
 *
 * Deferred (specific missing datum):
 *   REGION: sites:concaveCorners — Trajectories/Graph exposes only the combined
 *           cornerSites() set; convex vs concave scores are computed internally
 *           in cornersFromPerimeter() (graph.ts) but are not exported. Porting
 *           would require duplicating that scoring logic without a public API.
 *   REGION: sites:convexCorners  — same reason as sites:concaveCorners above.
 */

// INT
import "./game/functions/ints1to1/count/CountEdges1to1.js";
import "./game/functions/ints1to1/count/CountVertices1to1.js";
import "./game/functions/ints1to1/count/CountOff1to1.js";

// REGION — index-based topology lookups
import "./game/functions/region/sites/index/SitesCell1to1.js";
import "./game/functions/region/sites/index/SitesEdge1to1.js";

// REGION — board topology classifications
import "./game/functions/region/sites/simple/SitesMajor1to1.js";
import "./game/functions/region/sites/simple/SitesMinor1to1.js";

// BOOL — topology predicates
import "./game/functions/booleans/is/related/IsRelated1to1.js";
import "./game/functions/booleans/is/edge/IsCrossing1to1.js";

export {};
