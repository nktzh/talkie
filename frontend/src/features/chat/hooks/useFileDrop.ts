import { useRef, useState, type DragEvent } from "react";

function containsFiles(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes("Files");
}

/**
 * Перетаскивание файлов на область. dragenter/dragleave срабатывают и на дочерних элементах,
 * поэтому считаем глубину вложенности, чтобы подсветка не мигала.
 */
export function useFileDrop(onFiles: (files: File[]) => void, isEnabled: boolean) {
  const [isDragging, setIsDragging] = useState(false);
  const depthRef = useRef(0);

  const dropHandlers = {
    onDragEnter(event: DragEvent<HTMLElement>) {
      if (!isEnabled || !containsFiles(event)) return;
      event.preventDefault();
      depthRef.current += 1;
      setIsDragging(true);
    },
    onDragOver(event: DragEvent<HTMLElement>) {
      // Без preventDefault браузер не разрешит бросить файл
      if (isEnabled && containsFiles(event)) event.preventDefault();
    },
    onDragLeave(event: DragEvent<HTMLElement>) {
      if (!isEnabled || !containsFiles(event)) return;
      depthRef.current = Math.max(0, depthRef.current - 1);
      if (depthRef.current === 0) setIsDragging(false);
    },
    onDrop(event: DragEvent<HTMLElement>) {
      if (!isEnabled || !containsFiles(event)) return;
      event.preventDefault();
      depthRef.current = 0;
      setIsDragging(false);
      onFiles(Array.from(event.dataTransfer.files));
    },
  };

  return { isDragging, dropHandlers };
}
