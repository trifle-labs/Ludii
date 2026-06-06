// @java ViewController/src/view/component/custom/CardStyle.java

/**
 * Implementation of card component style.
 *
 * NOTE: The body of getSVGImageFromFilePath is commented out in the Java source;
 * only the shell (constructor delegating to PieceStyle) remains active.
 *
 * @author cambolbro (Java original)
 * @java view.component.custom.CardStyle
 */

import type { Bridge } from '../../../bridge/Bridge.js';
import type { Component } from '../../../../../../ludemes/game/equipment/component/Component.js';

// PieceStyle lives in batch 18 — not yet ported.  Use a minimal structural
// interface so this file compiles independently.
/** @java view.component.custom.PieceStyle */
interface PieceStyleLike {
  new (bridge: Bridge, component: Component): PieceStyleLike;
}

// We need a concrete base class to extend.  Since PieceStyle is not yet
// ported we forward-declare a minimal abstract base here and cast at
// construction time.  When batch 18 is ported, this shim can be replaced
// with a real import.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PieceStyleBase: any = class {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(..._args: any[]) { /* batch-18 shim */ }
};

export class CardStyle extends PieceStyleBase {

  /**
   * @java view.component.custom.CardStyle#CardStyle(Bridge, Component)
   */
  constructor(bridge: Bridge, component: Component) {
    super(bridge, component);
  }

  // --------------------------------------------------------------------------
  // The original getSVGImageFromFilePath override was entirely commented out
  // in the Java source (see CardStyle.java).  No active drawing logic exists.
  // --------------------------------------------------------------------------
}
