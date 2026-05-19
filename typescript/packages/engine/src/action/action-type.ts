/**
 * Java parity:
 * - Core/src/other/action/ActionType.java — enum-shape port (one
 *   string-literal-union member per Java enum value, declaration order
 *   preserved).
 *
 * The set of different action categories the engine recognises.
 */

export const ACTION_TYPES = [
  "Add",
  "Pass",
  "NextInstance",
  "Noop",
  "Forfeit",
  "Note",
  "Propose",
  "Vote",
  "SetValueOfPlayer",
  "SetTrumpSuit",
  "UseDie",
  "SetDiceAllEqual",
  "SetStateAndUpdateDice",
  "SetCost",
  "SetPhase",
  "SetVisible",
  "SetMasked",
  "SetInvisible",
  "Remove",
  "Select",
  "Insert",
  "Promote",
  "AddPlayerToTeam",
  "Bet",
  "SetPot",
  "SetAmount",
  "SetCount",
  "Move",
  "MoveN",
  "StackMove",
  "Copy",
  "SetHidden",
  "SetHiddenCount",
  "SetHiddenRotation",
  "SetHiddenState",
  "SetHiddenValue",
  "SetHiddenWhat",
  "SetHiddenWho",
  "SetCounter",
  "SetNextPlayer",
  "SetPending",
  "Swap",
  "Reset",
  "SetValuePuzzle",
  "Toggle",
  "Forget",
  "Remember",
  "SetRotation",
  "SetValue",
  "SetState",
  "SetScore",
  "SetTemp",
  "SetVar",
  "StoreState",
  "Trigger",
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

export function isActionType(value: string): value is ActionType {
  return (ACTION_TYPES as readonly string[]).includes(value);
}
