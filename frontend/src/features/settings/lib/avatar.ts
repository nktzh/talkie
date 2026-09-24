/*
 * Фото профиля обрабатывается целиком в браузере: пока бэкенда нет, обрезанный квадрат
 * остаётся в памяти вкладки, поэтому и уменьшать картинку приходится здесь же.
 */

/** Форматы, которые браузеры надёжно открывают и умеют рисовать на canvas */
export const AVATAR_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif";
const SUPPORTED_TYPES = /^image\/(png|jpe?g|webp|gif|avif)$/;

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/** Сторона сохранённого квадрата: больше не нужно даже самому крупному аватару в интерфейсе */
const OUTPUT_SIZE = 512;
const OUTPUT_QUALITY = 0.92;

export interface ImageSize {
  width: number;
  height: number;
}

export interface PickedImage extends ImageSize {
  /** object URL выбранного файла; освобождает его тот, кто картинку запросил */
  url: string;
}

/** Сдвиг картинки относительно центра окна кадрирования, в его же пикселях */
export interface AvatarOffset {
  x: number;
  y: number;
}

export interface AvatarView {
  /** Сторона видимого квадрата в CSS-пикселях */
  viewportSize: number;
  /** Во сколько раз картинка увеличена относительно вписанной в квадрат */
  zoom: number;
  offset: AvatarOffset;
}

/** Читает выбранный файл. Бросает Error с понятным пользователю сообщением */
export async function readImageFile(file: File): Promise<PickedImage> {
  if (!SUPPORTED_TYPES.test(file.type)) {
    throw new Error("Подойдёт изображение в формате PNG, JPEG, WebP, GIF или AVIF");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Файл больше ${MAX_FILE_SIZE_MB} МБ — выберите картинку полегче`);
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    return { url, width: image.naturalWidth, height: image.naturalHeight };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      image.naturalWidth > 0 ? resolve(image) : reject(new Error("Не удалось открыть изображение"));
    image.onerror = () => reject(new Error("Не удалось открыть изображение"));
    image.src = url;
  });
}

/** Масштаб, при котором картинка ровно закрывает квадрат, умноженный на выбранное увеличение */
export function getAvatarScale(size: ImageSize, { viewportSize, zoom }: Omit<AvatarView, "offset">): number {
  return (viewportSize / Math.min(size.width, size.height)) * zoom;
}

/** Картинка не отходит от краёв квадрата: за ними не из чего собрать аватар */
export function clampAvatarOffset(offset: AvatarOffset, size: ImageSize, view: AvatarView): AvatarOffset {
  const scale = getAvatarScale(size, view);
  const limitX = Math.max(0, (size.width * scale - view.viewportSize) / 2);
  const limitY = Math.max(0, (size.height * scale - view.viewportSize) / 2);

  return {
    x: Math.min(limitX, Math.max(-limitX, offset.x)),
    y: Math.min(limitY, Math.max(-limitY, offset.y)),
  };
}

/** Вырезает выбранный квадрат и уменьшает его до размера аватара */
export async function cropToAvatar(image: HTMLImageElement, view: AvatarView): Promise<Blob> {
  const size: ImageSize = { width: image.naturalWidth, height: image.naturalHeight };
  const scale = getAvatarScale(size, view);
  // Сторона выреза и его угол — в пикселях исходника: экранные делим на масштаб показа
  const source = view.viewportSize / scale;
  const left = clampSource((size.width - source) / 2 - view.offset.x / scale, size.width - source);
  const top = clampSource((size.height - source) / 2 - view.offset.y / scale, size.height - source);

  // Маленькую картинку не растягиваем: лишние пиксели не добавят ей чёткости
  const side = Math.min(OUTPUT_SIZE, Math.round(source));
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Не удалось обработать изображение");

  context.imageSmoothingQuality = "high";
  context.drawImage(image, left, top, source, source, 0, 0, side, side);
  return toBlob(canvas);
}

function clampSource(value: number, max: number): number {
  return Math.min(Math.max(0, max), Math.max(0, value));
}

/** WebP заметно легче JPEG при той же картинке; браузер без его кодировщика вернёт PNG — тогда берём JPEG */
function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    function fail() {
      reject(new Error("Не удалось обработать изображение"));
    }

    canvas.toBlob(
      (webp) => {
        if (webp?.type === "image/webp") resolve(webp);
        else canvas.toBlob((jpeg) => (jpeg ? resolve(jpeg) : fail()), "image/jpeg", OUTPUT_QUALITY);
      },
      "image/webp",
      OUTPUT_QUALITY,
    );
  });
}
