/** Сколько держим временную ссылку на файл: скачивание начинается не сразу после клика */
const OBJECT_URL_LIFETIME_MS = 60_000;

/**
 * Сохраняет файл на устройство.
 * Атрибут download браузер игнорирует для адресов с чужого домена, поэтому такие файлы
 * сначала загружаются в blob. Если загрузить не вышло — открываем ссылку как есть.
 */
export async function downloadFile(url: string, fileName: string): Promise<void> {
  let href = url;
  let objectUrl: string | null = null;

  if (!url.startsWith("data:") && !url.startsWith("blob:")) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        objectUrl = URL.createObjectURL(await response.blob());
        href = objectUrl;
      }
    } catch {
      // Файл без CORS: браузер скачает или откроет его сам
    }
  }

  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();

  if (objectUrl) {
    const urlToRevoke = objectUrl;
    setTimeout(() => URL.revokeObjectURL(urlToRevoke), OBJECT_URL_LIFETIME_MS);
  }
}
