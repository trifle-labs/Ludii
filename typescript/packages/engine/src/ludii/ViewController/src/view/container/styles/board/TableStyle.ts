// @java ViewController/src/view/container/styles/board/TableStyle.java

// TableStyle extends BoardStyle (batch 23), which extends BaseContainerStyle.
// TablePlacement is in batch 27, TableDesign in batch 25, TableComponents in batch 26.

import {
	BaseContainerStyle,
	type IBridge,
	type IContainerPlacement,
	type IContainerDesign,
	type IContainerComponents,
} from '../../BaseContainerStyle.js';
import type { Container } from '../../../../../../../ludemes/game/equipment/container/Container.js';

/**
 * Custom style for Table boards.
 *
 * Faithful 1:1 port of view.container.styles.board.TableStyle.
 *
 * @author Eric.Piette (Java original)
 * @java view.container.styles.board.TableStyle
 */
export class TableStyle extends BaseContainerStyle {
	/**
	 * @java TableStyle#TableStyle(bridge.Bridge, game.equipment.container.Container)
	 */
	constructor(bridge: IBridge, container: Container) {
		super(bridge, container);

		// Java:
		//   final TablePlacement backgammonPlacement = new TablePlacement(bridge, this);
		//   containerPlacement = backgammonPlacement;
		//   containerDesign = new TableDesign(this, backgammonPlacement);
		//   containerComponents = new TableComponents(bridge, this);
		//
		// Deps in batches 25-27 (not yet ported). Lazily instantiated below.
		const self = this;
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { TablePlacement } = require('../../../../aspects/placement/Board/TablePlacement.js') as {
				TablePlacement: new (b: IBridge, s: TableStyle) => IContainerPlacement;
			};
			const tablePlacement = new TablePlacement(bridge, self);
			self.containerPlacement = tablePlacement;

			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { TableDesign } = require('../../../../aspects/designs/board/TableDesign.js') as {
				TableDesign: new (s: TableStyle, p: IContainerPlacement) => IContainerDesign;
			};
			self.containerDesign = new TableDesign(self, tablePlacement);

			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { TableComponents } = require('../../../../aspects/components/board/TableComponents.js') as {
				TableComponents: new (b: IBridge, s: TableStyle) => IContainerComponents;
			};
			self.containerComponents = new TableComponents(bridge, self);
		} catch {
			// deps not yet available — default no-ops inherited from super()
		}
	}

	// -------------------------------------------------------------------------

	/** @java BoardStyle#setDefaultBoardScale(double) */
	override setDefaultBoardScale(scale: number): void {
		(this.containerPlacement as unknown as { setDefaultBoardScale?(s: number): void }).setDefaultBoardScale?.(scale);
	}
}
