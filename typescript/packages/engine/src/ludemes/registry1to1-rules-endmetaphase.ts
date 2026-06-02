/**
 * registry1to1-rules-endmetaphase.ts
 *
 * Barrel that imports all faithfully-ported 1:1 class files for:
 *   game/rules/end/**   — end rules (ByScore, ForEach, Payoffs, EndRule, BaseEndRule)
 *   game/rules/meta/**  — meta rules (Automove, Gravity, PassEnd, Pin, Swap,
 *                         NoStackOn, No, NoRepeat, NoSuicide, enums)
 *   game/rules/phase/** — phase rules (Phase, NextPhase — already fully ported)
 *
 * These classes are data-holder / EndRuleFunction implementations. They do NOT
 * register in a registry (end rules are compiled inline in compiler1to1.ts).
 * This barrel exists so the module graph is reachable; all exports are re-exported
 * for consumers that want direct access to the classes.
 *
 * Note: Phase and NextPhase are already imported by compiler1to1.ts directly;
 * they are listed here for completeness but do not need to be re-imported.
 */

// end/**
export { EndRule } from "./game/rules/end/EndRule.js";
export { BaseEndRule } from "./game/rules/end/BaseEndRule.js";
export { ByScore } from "./game/rules/end/ByScore.js";
export { ForEach } from "./game/rules/end/ForEach.js";
export { Payoffs } from "./game/rules/end/Payoffs.js";
// End, If, Result are already imported directly in compiler1to1.ts

// meta/**
export { MetaRule } from "./game/rules/meta/MetaRule.js";
export { Meta } from "./game/rules/meta/Meta.js";
export { Automove } from "./game/rules/meta/Automove.js";
export { Gravity } from "./game/rules/meta/Gravity.js";
export { PassEnd } from "./game/rules/meta/PassEnd.js";
export { Pin } from "./game/rules/meta/Pin.js";
export { Swap } from "./game/rules/meta/Swap.js";
export { NoStackOn } from "./game/rules/meta/NoStackOn.js";
export { No } from "./game/rules/meta/no/No.js";
export type { NoRepeatType } from "./game/rules/meta/no/NoRepeatType.js";
export type { NoSimpleType } from "./game/rules/meta/no/NoSimpleType.js";
export { NoRepeat } from "./game/rules/meta/no/repeat/NoRepeat.js";
export { NoSuicide } from "./game/rules/meta/no/simple/NoSuicide.js";

// phase/** — Phase and NextPhase are already fully ported; re-export for completeness
export { Phase } from "./game/rules/phase/Phase.js";
export { NextPhase } from "./game/rules/phase/NextPhase.js";
