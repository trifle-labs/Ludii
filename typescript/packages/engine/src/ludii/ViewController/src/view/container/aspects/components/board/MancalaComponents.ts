// @java ViewController/src/view/container/aspects/components/board/MancalaComponents.java

import {
	BasicStroke,
	Color,
	Font,
	CAP_BUTT,
	JOIN_MITER,
	BOLD,
} from '../../../../../../../awt/index.js';
import type { Graphics2D, Point, Rectangle } from '../../../../../../../awt/index.js';
import { ContainerComponents } from '../ContainerComponents.js';

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/** @java bridge.Bridge */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Bridge = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java view.container.styles.board.MancalaStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MancalaStyle = any;

/** @java other.topology.Topology */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Topology = any;

/** @java game.equipment.container.board.Board */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Board = any;

/** @java game.equipment.component.Component */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Component = any;

/** @java other.state.container.ContainerState */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContainerState = any;

// ---------------------------------------------------------------------------
// Lazy-loaded utilities
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMathRoutines(): any {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return (require('../../../../../../../ludemes/main/math/MathRoutines.js') as { MathRoutines: unknown }).MathRoutines;
	} catch { return null; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getImageProcessing(): any {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return (require('../../../../../../../ludemes/graphics/ImageProcessing.js') as { ImageProcessing: unknown }).ImageProcessing;
	} catch { return null; }
}

// ---------------------------------------------------------------------------

/**
 * Mancala components properties.
 *
 * Faithful 1:1 port of view.container.aspects.components.board.MancalaComponents.
 *
 * @author Matthew.Stephenson and cambolbro and Eric.Piette (Java original)
 * @java view.container.aspects.components.board.MancalaComponents
 */
export class MancalaComponents extends ContainerComponents {

	/** @java MancalaComponents#boardStyle */
	private readonly boardStyle: MancalaStyle;

	// -------------------------------------------------------------------------

	/** @java MancalaComponents#seedColour */
	private readonly seedColour = new Color(255, 255, 230);

	/** @java MancalaComponents#offsets — piece placements */
	private readonly offsets: Array<Array<{ x: number; y: number }>> = [
		[],
		// 1 seed
		[{ x: 0, y: 0 }],
		// 2 seeds
		[{ x: -1, y: 0 }, { x: 1, y: 0 }],
		// 3 seeds
		[{ x: -1.0, y: -0.8 }, { x: 1.0, y: -0.8 }, { x: 0.0, y: 1.0 }],
		// 4 seeds
		[{ x: -1.0, y: -1.0 }, { x: 1.0, y: -1.0 }, { x: -1.0, y: 1.0 }, { x: 1.0, y: 1.0 }],
		// 5 seeds
		[{ x: -1.0, y: -1.0 }, { x: 1.0, y: -1.0 }, { x: -1.0, y: 1.0 }, { x: 1.0, y: 1.0 }, { x: 0.0, y: 0.0 }],
	];

	// -------------------------------------------------------------------------

	/**
	 * @java MancalaComponents#MancalaComponents(bridge.Bridge, view.container.styles.board.MancalaStyle)
	 */
	constructor(bridge: Bridge, containerStyle: MancalaStyle) {
		super(bridge, containerStyle);
		this.boardStyle = containerStyle;
	}

	// -------------------------------------------------------------------------

	/**
	 * @java MancalaComponents#drawComponents(java.awt.Graphics2D, other.context.Context)
	 */
	override drawComponents(g2d: Graphics2D, context: Context): void {
		const stackingGame: boolean = context.game().isStacking();
		const placement: Rectangle = this.boardStyle.placement();
		const cellRadiusPixels: number = this.boardStyle.cellRadiusPixels();

		// Concept.CircleTiling id
		const circleTiling: boolean = context.game().booleanConcepts().get(
			(context.game().booleanConcepts().get as unknown as { length: number }).length === undefined
				? 'CircleTiling'
				: context.game().concept?.('CircleTiling') ?? false
		);

		// Determine hole index for seed size
		const board: Board = context.board();
		// StoreType.None check — escape-hatched
		const withStore = true; // default conservative
		const indexHoleBL: number = withStore ? 1 : 0;

		const topology: Topology = this.boardStyle.topology();
		const ptA: Point = this.boardStyle.screenPosn(topology.vertices()[circleTiling ? 0 : indexHoleBL].centroid());
		const ptB: Point = this.boardStyle.screenPosn(topology.vertices()[circleTiling ? 1 : (indexHoleBL + 1)].centroid());

		const mathRoutines = getMathRoutines();
		const unit: number = mathRoutines
			? mathRoutines.distance(ptA, ptB)
			: Math.hypot(ptB.x - ptA.x, ptB.y - ptA.y);

		// Set rendering hints — escape-hatched (not applicable in SVG renderer)
		// g2d.setRenderingHint(...)

		const graphics = context.metadata().graphics();

		const shadeBase  = this.seedColour;
		const shadeDark  = mathRoutines ? mathRoutines.shade(shadeBase, 0.75)  : new Color(191, 191, 172);
		const shadeLight = mathRoutines ? mathRoutines.shade(shadeBase, 1.5)   : new Color(255, 255, 255);

		// This game has a board
		const state = context.state();
		const cs: ContainerState = state.containerStates()[0];
		const imageProcessing = getImageProcessing();

		for (let site = 0; site < topology.vertices().length; site++) {
			const pt: Point = this.boardStyle.screenPosn(topology.vertices()[site].centroid());
			const count: number = stackingGame
				? cs.sizeStack(site, 'Vertex')
				: cs.count(site, 'Vertex');

			const cx: number = pt.x;
			const cy: number = pt.y;

			const swRing: number = Math.trunc(this.boardStyle.cellRadius() * placement.width / 10.0);
			const strokeRink = new BasicStroke(swRing, CAP_BUTT, JOIN_MITER);
			g2d.setStroke(strokeRink);

			// Code for drawing the tuz (ring around holes coloured based on player value)
			if (context.game().metadata().graphics().showPlayerHoles()) {
				for (let i = 1; i <= context.game().players().count(); i++) {
					if (state.getValue(i) === site) {
						const r: number = cellRadiusPixels;
						g2d.setColor(this.bridge.settingsColour().playerColour(context, i));
						(g2d as unknown as { drawArc(x: number, y: number, w: number, h: number, start: number, arc: number): void })
							.drawArc(cx - r, cy - r, 2 * r, 2 * r, 0, 360);
					}
				}
			}

			// Code for drawing the tuz (ring around holes coloured based on local state)
			if (context.game().metadata().graphics().holesUseLocalState()) {
				for (let i = 1; i <= context.game().players().count(); i++) {
					if (i === cs.stateVertex(site)) {
						const r: number = cellRadiusPixels;
						g2d.setColor(this.bridge.settingsColour().playerColour(context, i));
						(g2d as unknown as { drawArc(x: number, y: number, w: number, h: number, start: number, arc: number): void })
							.drawArc(cx - r, cy - r, 2 * r, 2 * r, 0, 360);
					}
				}
			}

			// Code for drawing rings around each kalah
			if (context.game().metadata().graphics().showPits()) {
				if (context.game().equipment().maps().length !== 0) {
					const map = context.game().equipment().maps()[0];
					for (let p = 1; p <= context.game().players().count(); p++) {
						const ownedSite: number = map.to(p);
						if (ownedSite === site) {
							const r: number = cellRadiusPixels;
							g2d.setColor(this.bridge.settingsColour().playerColour(context, p));
							(g2d as unknown as { drawArc(x: number, y: number, w: number, h: number, start: number, arc: number): void })
								.drawArc(cx - r, cy - r, 2 * r, 2 * r, 0, 360);
						}
					}
				}
			}

			if (stackingGame) {
				if (count > 0) {
					const group: number = Math.min(count, this.offsets.length - 1);

					for (let level = 0; level < count; level++) {
						const what: number = cs.what(site, level, 'Vertex');
						const who: number  = cs.who(site, level, 'Vertex');
						const component: Component | null = (what > 0) ? context.components()[what] : null;
						let scale: number = (component == null)
							? 1.0
							: graphics.pieceScale(context, who, component.name(), this.boardStyle.container().index(),
								cs.state(site, 'Vertex'), cs.value(site, 'Vertex')).getX();
						scale = (scale === 0.0) ? 1.0 : scale;
						const seedRadius: number = Math.max(Math.trunc(1 * scale), Math.trunc(0.19 * unit * scale));
						let colorWho: Color = graphics.playerColour(context, who);
						colorWho = (colorWho == null) ? this.seedColour : colorWho;

						const defaultSeed: boolean = (component == null) ? true : component.name() === 'Seed';

						if (defaultSeed) {
							if (level < 5) {
								const groupIndex: number = Math.min(5, level);
								const off = (this.offsets[group] ?? [])[groupIndex] ?? { x: 0, y: 0 };
								const x: number = cx + Math.trunc(off.x * seedRadius + 0.5) - seedRadius + 1;
								const y: number = cy - Math.trunc(off.y * seedRadius + 0.5) - seedRadius + 1;
								if (imageProcessing)
									imageProcessing.ballImage(g2d, x, y, seedRadius, colorWho);
							}
						} else {
							const groupIndex: number = Math.min(4, level);
							const off = (this.offsets[group] ?? [])[groupIndex] ?? { x: 0, y: 0 };
							const x: number = cx + Math.trunc(off.x * seedRadius + 0.5) - seedRadius + 1;
							const y: number = cy - Math.trunc(off.y * seedRadius + 0.5) - seedRadius + 1;
							if (imageProcessing)
								imageProcessing.ballImage(g2d, x, y, seedRadius, colorWho);
						}
					}

					if (count > 5) {
						// Draw piece count
						const oldFont: Font = g2d.getFont();
						const font = new Font(oldFont.getFontName(), BOLD, Math.trunc(0.45 * this.boardStyle.cellRadius() * placement.width));
						g2d.setFont(font);

						const str: string = String(count);
						const fm = g2d.getFontMetrics();
						const strW = fm.stringWidth(str);
						const strH = fm.getHeight();

						const tx: number = cx - Math.trunc(0.5 * strW + 0.5);
						const ty: number = cy + Math.trunc(0.4 * strH + 0.5);

						g2d.setColor(new Color(0, 0, 0));
						(g2d as unknown as { drawString(s: string, x: number, y: number): void }).drawString(str, tx, ty - 1);

						g2d.setColor(shadeLight);
						(g2d as unknown as { drawString(s: string, x: number, y: number): void }).drawString(str, tx, ty + 1);

						g2d.setColor(shadeDark);
						(g2d as unknown as { drawString(s: string, x: number, y: number): void }).drawString(str, tx, ty);

						g2d.setFont(oldFont);
					}
				}
			} else {
				if (count > 0) {
					const what: number = cs.what(site, 'Vertex');
					const who: number  = cs.who(site, 'Vertex');
					const component: Component | null = (what > 0) ? context.components()[what] : null;
					let scale: number = (component == null)
						? 1.0
						: graphics.pieceScale(context, who, component.name(), this.boardStyle.container().index(),
							cs.state(site, 'Vertex'), cs.value(site, 'Vertex')).getX();
					scale = (scale === 0.0) ? 1.0 : scale;
					const seedRadius: number = Math.max(Math.trunc(1 * scale), Math.trunc(0.19 * unit * scale));
					let colorWho: Color = graphics.playerColour(context, who);
					colorWho = (colorWho == null) ? this.seedColour : colorWho;

					// Draw pieces
					const group: number = Math.min(count, this.offsets.length - 1);
					const groupOffsets = this.offsets[group] ?? [];
					for (let s = 0; s < groupOffsets.length; s++) {
						const off = groupOffsets[s] ?? { x: 0, y: 0 };
						const x: number = cx + Math.trunc(off.x * seedRadius + 0.5) - seedRadius + 1;
						const y: number = cy - Math.trunc(off.y * seedRadius + 0.5) - seedRadius + 1;
						if (imageProcessing)
							imageProcessing.ballImage(g2d, x, y, seedRadius, colorWho);
					}

					if (count > 5) {
						// Draw piece count
						const oldFont: Font = g2d.getFont();
						const font = new Font(oldFont.getFontName(), BOLD, Math.trunc(0.45 * this.boardStyle.cellRadius() * placement.width));
						g2d.setFont(font);

						const str: string = String(count);
						const fm = g2d.getFontMetrics();
						const strW = fm.stringWidth(str);
						const strH = fm.getHeight();

						const tx: number = cx - Math.trunc(0.5 * strW + 0.5);
						const ty: number = cy + Math.trunc(0.4 * strH + 0.5);

						g2d.setColor(new Color(0, 0, 0));
						(g2d as unknown as { drawString(s: string, x: number, y: number): void }).drawString(str, tx, ty - 1);

						g2d.setColor(shadeLight);
						(g2d as unknown as { drawString(s: string, x: number, y: number): void }).drawString(str, tx, ty + 1);

						g2d.setColor(shadeDark);
						(g2d as unknown as { drawString(s: string, x: number, y: number): void }).drawString(str, tx, ty);

						g2d.setFont(oldFont);
					}
				}
			}
		}
	}

	// -------------------------------------------------------------------------
}
