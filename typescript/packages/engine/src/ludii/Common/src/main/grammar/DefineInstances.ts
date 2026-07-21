// @java Common/src/main/grammar/DefineInstances.java

/**
 * Record of a define instances in a game description.
 *
 * @java main/grammar/DefineInstances.java
 * @author cambolbro
 */

// Define is not yet ported — minimal escape-hatch interface.
export interface IDefine {
  tag(): string;
  expression(): string;
  parameterised(): boolean;
  isKnown(): boolean;
}

export class DefineInstances {
  /** @java DefineInstances.define */
  private readonly _define: IDefine;

  /** @java DefineInstances.instances */
  private readonly _instances: string[] = [];

  // -------------------------------------------------------------------------

  /**
   * @param define The define in entry.
   *
   * @java DefineInstances(Define)
   */
  public constructor(define: IDefine) {
    this._define = define;
  }

  // -------------------------------------------------------------------------

  /** @java DefineInstances.define() */
  public define(): IDefine {
    return this._define;
  }

  /** @java DefineInstances.instances() */
  public instances(): readonly string[] {
    return this._instances;
  }

  // -------------------------------------------------------------------------

  /** @java DefineInstances.addInstance(String) */
  public addInstance(instance: string): void {
    this._instances.push(instance);
  }

  // -------------------------------------------------------------------------

  /** @java DefineInstances.toString() */
  public toString(): string {
    let sb = "";

    sb += "~~~~~~~~~~~~~~~~~~~~\nDefine: " + this._define;
    for (const instance of this._instances) {
      sb += "\nInstance: " + instance;
    }

    return sb;
  }

  // -------------------------------------------------------------------------
}
