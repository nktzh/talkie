/**
 * Одновременно звучит только одно сообщение. Беззвучные кружки в ленте играют по кругу
 * и не мешают — их не трогаем.
 */
export function pauseOtherPlayback(current: HTMLMediaElement) {
  document.querySelectorAll<HTMLMediaElement>("audio, video").forEach((media) => {
    if (media !== current && !media.muted) media.pause();
  });
}
