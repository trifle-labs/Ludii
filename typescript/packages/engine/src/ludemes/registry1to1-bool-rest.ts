/**
 * registry1to1-bool-rest.ts
 *
 * Barrel that imports the remaining boolean ludeme 1:1 class files ported in
 * this slice so they self-register via registerBool1to1() side effects at
 * module load time.
 *
 * Covered Java packages:
 *   all/sites/AllDifferent.java    → all:different
 *   all/values/AllValues.java      → all:values
 *   ToBool.java                    → tobool
 *
 * Deferred (missing Context / puzzle API):
 *   all/groups/AllGroups.java      — needs topology DirectionsFunction
 *   was/WasPass.java               — compiler has no was:<sub> dispatch path
 *   deductionPuzzle/** (all 7)     — needs puzzle ContainerState.isResolved(),
 *                                    context.hint/edge/setHint/setEdge,
 *                                    equipment.regions(), convertStaticRegionOnLocs,
 *                                    game.constraintVariables(), TempContext, etc.
 */

// all
import "./game/functions/booleans/all1to1/AllDifferent1to1.js";
import "./game/functions/booleans/all1to1/AllValues1to1.js";

// root booleans
import "./game/functions/booleans/ToBool1to1.js";

export {};
