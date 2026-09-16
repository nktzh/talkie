import { useEffect, useRef, useState } from "react";
import { createOutgoingAttachment, selectAcceptableFiles } from "../lib/attachments";
import type { OutgoingAttachment } from "../model/types";

export interface AttachmentsDraft {
  items: OutgoingAttachment[];
  error: string | null;
  add: (files: File[]) => void;
  remove: (id: string) => void;
  /** Убирает все вложения из черновика и освобождает их превью */
  removeAll: () => void;
  /** Очищает черновик после отправки — превью уже принадлежат сообщению в ленте */
  clear: () => void;
  dismissError: () => void;
}

/** Вложения, выбранные для следующего сообщения */
export function useAttachmentsDraft(): AttachmentsDraft {
  const [items, setItems] = useState<OutgoingAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Object URL неотправленных превью: освобождаем при удалении вложения и при уходе из чата
  const pendingUrlsRef = useRef(new Set<string>());

  useEffect(() => {
    const pendingUrls = pendingUrlsRef.current;

    return () => {
      pendingUrls.forEach((url) => URL.revokeObjectURL(url));
      pendingUrls.clear();
    };
  }, []);

  function releasePreview(attachment: OutgoingAttachment) {
    URL.revokeObjectURL(attachment.url);
    pendingUrlsRef.current.delete(attachment.url);
  }

  async function add(files: File[]) {
    if (files.length === 0) return;

    const { accepted, error: selectionError } = selectAcceptableFiles(files, items.length);
    setError(selectionError);
    if (accepted.length === 0) return;

    const prepared = await Promise.all(accepted.map(createOutgoingAttachment));
    prepared.forEach((attachment) => pendingUrlsRef.current.add(attachment.url));
    setItems((current) => [...current, ...prepared]);
  }

  function remove(id: string) {
    const attachment = items.find((item) => item.id === id);
    if (attachment) releasePreview(attachment);
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function removeAll() {
    items.forEach(releasePreview);
    setItems([]);
    setError(null);
  }

  function clear() {
    items.forEach((item) => pendingUrlsRef.current.delete(item.url));
    setItems([]);
    setError(null);
  }

  return {
    items,
    error,
    add: (files) => void add(files),
    remove,
    removeAll,
    clear,
    dismissError: () => setError(null),
  };
}
