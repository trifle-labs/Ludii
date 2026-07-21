// @java Core/src/other/BaseCardImages.java BaseCardImages
/**
 * Faithful 1:1 transliteration of other.BaseCardImages.
 *
 * Java parity: other/BaseCardImages.java
 *
 * Loads (and caches) base card-image paths once per deck. All path strings
 * are SVG resource paths identical to those in the Java source.
 *
 * No external dependencies – fully self-contained.
 *
 * @author cambolbro (Java)
 * TypeScript transliteration.
 */

// ---------------------------------------------------------------------------
// Playing card constants
// ---------------------------------------------------------------------------

// @java public static final int SUIT_LARGE  = 0;
export const SUIT_LARGE  = 0 as const;

// @java public static final int SUIT_SMALL  = 1;
export const SUIT_SMALL  = 1 as const;

// @java public static final int BLACK_ROYAL = 2;
export const BLACK_ROYAL = 2 as const;

// @java public static final int RED_ROYAL   = 3;
export const RED_ROYAL   = 3 as const;

// @java public static final int CLUBS    = 1;
export const CLUBS    = 1 as const;

// @java public static final int SPADES   = 2;
export const SPADES   = 2 as const;

// @java public static final int DIAMONDS = 3;
export const DIAMONDS = 3 as const;

// @java public static final int HEARTS   = 4;
export const HEARTS   = 4 as const;

// @java public static final int JOKER =  0;
export const JOKER =  0 as const;

// @java public static final int ACE   =  1;
export const ACE   =  1 as const;

// @java public static final int JACK  = 11;
export const JACK  = 11 as const;

// @java public static final int QUEEN = 12;
export const QUEEN = 12 as const;

// @java public static final int KING  = 13;
export const KING  = 13 as const;

// ---------------------------------------------------------------------------
// BaseCardImages
// ---------------------------------------------------------------------------

/**
 * Class for loading base card images ONCE per deck.
 *
 * @author cambolbro (Java)
 * TypeScript transliteration.
 */
export class BaseCardImages {

  // @java private String[][] baseCardImagePaths = null;
  private _baseCardImagePaths: (string | undefined)[][] | null = null;

  // @java private int cardSize;
  private _cardSize: number = 0;

  // -------------------------------------------------------------------------

  /**
   * @return The small size of the suit (uses stored cardSize).
   * @java public int getSuitSizeSmall()
   */
  getSuitSizeSmall(): number;
  /**
   * @param cardSizeInput The size of the card.
   * @return The small size of the suit.
   * @java public int getSuitSizeSmall(final int cardSizeInput)
   */
  getSuitSizeSmall(cardSizeInput: number): number;
  getSuitSizeSmall(cardSizeInput?: number): number {
    const sz = cardSizeInput ?? this._cardSize;
    return Math.trunc(0.100 * sz);
  }

  /**
   * @return The big size of the suit (uses stored cardSize).
   * @java public int getSuitSizeBig()
   */
  getSuitSizeBig(): number;
  /**
   * @param cardSizeInput The size of the card.
   * @return The big size of the suit.
   * @java public int getSuitSizeBig(final int cardSizeInput)
   */
  getSuitSizeBig(cardSizeInput: number): number;
  getSuitSizeBig(cardSizeInput?: number): number {
    const sz = cardSizeInput ?? this._cardSize;
    return Math.trunc(0.160 * sz);
  }

  // -------------------------------------------------------------------------

  /**
   * Return the SVG path for a given card type/value combination.
   *
   * @param type  The type index (SUIT_LARGE, SUIT_SMALL, BLACK_ROYAL, RED_ROYAL).
   * @param which The card value index (suit or face-card constant).
   * @return The path string, or null if not found.
   *
   * @java public String getPath(final int type, final int which)
   */
  getPath(type: number, which: number): string | null {
    if (
      this._baseCardImagePaths === null ||
      type >= this._baseCardImagePaths.length ||
      this._baseCardImagePaths[type] === undefined ||
      which >= this._baseCardImagePaths[type]!.length
    ) {
      console.log(`** Failed to find base card image type ${type} value ${which}.`);
      return null;
    }
    return this._baseCardImagePaths[type]![which] ?? null;
  }

  // -------------------------------------------------------------------------

  /**
   * Clear all loaded image paths.
   * @java public void clear()
   */
  clear(): void {
    this._baseCardImagePaths = null;
  }

  /**
   * @return True if images have been loaded.
   * @java public boolean areLoaded()
   */
  areLoaded(): boolean {
    return this._baseCardImagePaths !== null;
  }

  // -------------------------------------------------------------------------

  /**
   * Load (or reload) the image paths for a given card size.
   *
   * @param cardSizeInput The card size.
   * @java public void loadImages(final int cardSizeInput)
   */
  loadImages(cardSizeInput: number): void {
    this._baseCardImagePaths = Array.from({ length: 4 }, () =>
      new Array<string | undefined>(15).fill(undefined)
    );

    this._cardSize = cardSizeInput;

    // Large suit images
    this._baseCardImagePaths[SUIT_LARGE]![CLUBS]    = "/svg/cards/card-suit-club.svg";
    this._baseCardImagePaths[SUIT_LARGE]![SPADES]   = "/svg/cards/card-suit-spade.svg";
    this._baseCardImagePaths[SUIT_LARGE]![DIAMONDS] = "/svg/cards/card-suit-diamond.svg";
    this._baseCardImagePaths[SUIT_LARGE]![HEARTS]   = "/svg/cards/card-suit-heart.svg";

    // Small suit images
    this._baseCardImagePaths[SUIT_SMALL]![CLUBS]    = "/svg/cards/card-suit-club.svg";
    this._baseCardImagePaths[SUIT_SMALL]![SPADES]   = "/svg/cards/card-suit-spade.svg";
    this._baseCardImagePaths[SUIT_SMALL]![DIAMONDS] = "/svg/cards/card-suit-diamond.svg";
    this._baseCardImagePaths[SUIT_SMALL]![HEARTS]   = "/svg/cards/card-suit-heart.svg";

    // Royal card figures (black)
    this._baseCardImagePaths[BLACK_ROYAL]![JACK]  = "/svg/cards/card-jack.svg";
    this._baseCardImagePaths[BLACK_ROYAL]![QUEEN] = "/svg/cards/card-queen.svg";
    this._baseCardImagePaths[BLACK_ROYAL]![KING]  = "/svg/cards/card-king.svg";

    // Royal card figures (red)
    this._baseCardImagePaths[RED_ROYAL]![JACK]  = "/svg/cards/card-jack.svg";
    this._baseCardImagePaths[RED_ROYAL]![QUEEN] = "/svg/cards/card-queen.svg";
    this._baseCardImagePaths[RED_ROYAL]![KING]  = "/svg/cards/card-king.svg";
  }

  // -------------------------------------------------------------------------
}
