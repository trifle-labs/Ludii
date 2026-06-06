// @java Common/src/graphics/qr_codes/DataTooLongException.java

/*
 * Fast QR Code generator library
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-qr-code-generator-library
 */

/**
 * Thrown when the supplied data does not fit any QR Code version.
 *
 * @java graphics/qr_codes/DataTooLongException.java
 */
export class DataTooLongException extends Error {
  /** @java DataTooLongException.serialVersionUID */
  // static readonly serialVersionUID: bigint = 1n;  // Java field, not needed in TS

  /** @java DataTooLongException() */
  public constructor(msg?: string) {
    super(msg ?? "");
    this.name = "DataTooLongException";
    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
