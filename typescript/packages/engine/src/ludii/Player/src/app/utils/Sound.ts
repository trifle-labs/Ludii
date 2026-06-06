// @java Player/src/app/utils/Sound.java

/**
 * Functions relating to the playing of sounds/music.
 *
 * Faithful 1:1 port of app.utils.Sound.
 * In the browser environment, javax.sound.sampled is unavailable; we use the
 * Web Audio API (HTMLAudioElement) as the runtime equivalent.  The method
 * signature is preserved exactly.
 *
 * @author Matthew.Stephenson (Java original)
 * @java app.utils.Sound
 */
export class Sound {

  // -------------------------------------------------------------------------

  /**
   * Play a specific sound once.
   * Java loads /<soundName>.wav from the classpath.
   * In the browser we attempt to fetch the same path as an audio URL.
   * @java Sound#playSound(String)
   */
  static playSound(soundName: string): void {
    const soundPath = "/" + soundName + ".wav";

    // Browser environment: HTMLAudioElement
    const AudioCtor = (typeof globalThis !== "undefined" && "Audio" in globalThis)
      ? (globalThis as unknown as { Audio: new (src: string) => { play(): Promise<void> } }).Audio
      : null;
    if (AudioCtor !== null) {
      try {
        const audio = new AudioCtor(soundPath);
        audio.play().catch(() => {
          // Ignore playback errors (autoplay policy, missing file, etc.)
        });
      } catch (_e) {
        // Ignore
      }
    }
    // Node/headless: no-op (javax.sound.sampled unavailable)
  }

  // -------------------------------------------------------------------------
}
