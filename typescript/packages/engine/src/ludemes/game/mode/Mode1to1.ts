/**
 * Mode1to1.ts
 *
 * @java game/mode/Mode.java
 *
 * Describes the mode of play for a game (Alternating, Simultaneous, Simulation).
 *
 * Data/structure class — no eval(ctx), not registered in the 1:1 eval registry.
 * The mode value is used by the compiler and runtime to select the game model.
 */

import type { ModeType } from "../types/play/ModeType.js";

/**
 * Describes the mode of play.
 * @java game/mode/Mode.java
 */
export class Mode1to1 {
  /**
   * The control type.
   * @java Mode.mode
   */
  private _mode: ModeType;

  /**
   * @java game/mode/Mode.java — constructor(ModeType mode)
   */
  public constructor(mode: ModeType) {
    this._mode = mode;
  }

  /**
   * @java Mode.mode()
   */
  public mode(): ModeType {
    return this._mode;
  }

  /**
   * @java Mode.setMode(ModeType)
   */
  public setMode(modeType: ModeType): void {
    this._mode = modeType;
  }

  /**
   * Returns the model name implied by this mode.
   *
   * @java Mode.createModel() — switch on ModeType
   */
  public modelName(): "AlternatingMove" | "SimultaneousMove" | "SimulationMove" {
    switch (this._mode) {
      case "Alternating":
        return "AlternatingMove";
      case "Simultaneous":
        return "SimultaneousMove";
      case "Simulation":
        return "SimulationMove";
    }
  }
}
