// @java Core/src/other/action/ActionType.java ActionType
/**
 * The different type of actions.
 *
 * Faithful 1:1 transliteration of other.action.ActionType (Java enum).
 *
 * @author Eric.Piette  (Java original)
 */

export const ACTION_TYPE_VALUES = [
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

export type ActionType = (typeof ACTION_TYPE_VALUES)[number];
