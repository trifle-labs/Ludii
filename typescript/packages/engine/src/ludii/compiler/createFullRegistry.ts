// Aggregates every keyword-factory batch into one LudemeRegistry for the
// faithful grammar-driven Compiler. The TTT core factories are overlaid LAST so
// the proven structural ludemes (game/equipment/board/...) win over any
// batch-authored duplicate while the batches converge.
import { LudemeRegistry } from "./LudemeRegistry.js";
import { registerBatch0 } from "./factories/batch0/index.js";
import { registerBatch1 } from "./factories/batch1/index.js";
import { registerBatch2 } from "./factories/batch2/index.js";
import { registerBatch3 } from "./factories/batch3/index.js";
import { registerBatch4 } from "./factories/batch4/index.js";
import { registerBatch5 } from "./factories/batch5/index.js";
import { registerBatch6 } from "./factories/batch6/index.js";
import { registerBatch7 } from "./factories/batch7/index.js";
import { registerBatch8 } from "./factories/batch8/index.js";
import { registerBatch9 } from "./factories/batch9/index.js";
import { createTicTacToeRegistry } from "./factories/tic-tac-toe.js";

export function createFullRegistry(): LudemeRegistry {
  const r = new LudemeRegistry();
  registerBatch0(r);
  registerBatch1(r);
  registerBatch2(r);
  registerBatch3(r);
  registerBatch4(r);
  registerBatch5(r);
  registerBatch6(r);
  registerBatch7(r);
  registerBatch8(r);
  registerBatch9(r);
  // Overlay only hand-specialised factories that fill gaps in the batch registry.
  // Broad TTT factories such as board/equipment/rules are intentionally excluded:
  // they assume Tic-Tac-Toe shapes and shadow the general batch factories.
  r.overlayKeysFrom(createTicTacToeRegistry(), [
    "move:add",
    "sites:empty",
    "is:line",
  ]);
  return r;
}
