// @java AI/src/optimisers/OptimiserFactory.java

/**
 * Can create Optimizers based on strings / files
 *
 * @java optimisers.OptimiserFactory
 * @author Dennis Soemers
 */

import { Optimiser } from "./Optimiser.js";
import { SGD } from "./SGD.js";
import { DeepmindRMSProp } from "./DeepmindRMSProp.js";
import { AMSGrad } from "./AMSGrad.js";

// ---------------------------------------------------------------------------

/**
 * Can create Optimizers based on strings / files.
 * Constructor should not be used — use static factory method only.
 *
 * @java optimisers.OptimiserFactory
 */
export class OptimiserFactory {

  // -------------------------------------------------------------------------

  /**
   * Constructor should not be used.
   * @java OptimiserFactory() — private, not intended to be used
   */
  private constructor() {
    // not intended to be used
  }

  // -------------------------------------------------------------------------

  /**
   * @param string String representation of optimizer,
   *   or filename from which to load optimizer
   *
   * @return Created Optimiser
   * @java OptimiserFactory.createOptimiser(String)
   */
  public static createOptimiser(string: string): Optimiser {
    if (string.toLowerCase() === "sgd") {
      return new SGD(0.05);
    } else if (string.toLowerCase() === "rmsprop") {
      return new DeepmindRMSProp();
    } else if (string.toLowerCase() === "amsgrad") {
      // the Karpathy constant:
      // https://twitter.com/karpathy/status/801621764144971776
      return new AMSGrad(3.0e-4);
    }

    // try to interpret the given string as a resource or some other kind of file
    let lines: string[] = [];

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs") as typeof import("fs");
      if (fs.existsSync(string)) {
        const content = fs.readFileSync(string, "utf8");
        lines = content.split(/\r?\n/).filter(l => l.length > 0);
      } else {
        // assume semicolon-separated lines directly passed as command line arg
        lines = string.split(";");
      }
    } catch (_e) {
      // assume semicolon-separated lines directly passed as command line arg
      lines = string.split(";");
    }

    if (lines.length === 0) {
      console.warn(
        `Warning: cannot convert string "${string}" to Optimiser; ` +
        "defaulting to vanilla SGD."
      );
      return new SGD(0.05);
    }

    const firstLine = lines[0]!;
    if (firstLine.startsWith("optimiser=")) {
      const optimiserName = firstLine.substring("optimiser=".length);

      if (optimiserName.toLowerCase() === "sgd") {
        // UCT is the default implementation of MCTS,
        // so both cases are the same
        return SGD.fromLines(lines);
      } else if (optimiserName.toLowerCase() === "rmsprop") {
        return DeepmindRMSProp.fromLines(lines);
      } else if (optimiserName.toLowerCase() === "amsgrad") {
        return AMSGrad.fromLines(lines);
      } else {
        console.error("Unknown optimizer name: " + optimiserName);
      }
    } else {
      console.error(
        'Expecting Optimizer file to start with "optimiser=", ' +
        "but it starts with " + firstLine
      );
    }

    console.warn(
      `Warning: cannot convert string "${string}" to Optimiser; ` +
      "defaulting to vanilla SGD."
    );
    return new SGD(0.05);
  }

  // -------------------------------------------------------------------------
}
