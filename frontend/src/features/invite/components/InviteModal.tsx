"use client";

import { Copy01Icon, Tick02Icon, Ticket01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Button, FormAlert, Icon, Modal, ModalCloseButton } from "@/shared/ui";
import { createInviteCode } from "../api/invite-api";
import { INVITE_CODE_LENGTH } from "../lib/invite-code";
import styles from "./InviteModal.module.css";

const TITLE_ID = "invite-title";
const COPIED_FEEDBACK_MS = 2000;

type CodeState = { status: "loading" } | { status: "ready"; code: string } | { status: "error" };
type CopyState = "idle" | "copied" | "failed";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
}

export function InviteModal({ open, onClose }: InviteModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy={TITLE_ID}>
      <InvitePanel onClose={onClose} />
    </Modal>
  );
}

/** Монтируется при каждом открытии модалки — и каждый раз запрашивает свежий код */
function InvitePanel({ onClose }: { onClose: () => void }) {
  const [codeState, setCodeState] = useState<CodeState>({ status: "loading" });
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    createInviteCode().then(
      (code) => {
        if (!isCancelled) setCodeState({ status: "ready", code });
      },
      () => {
        if (!isCancelled) setCodeState({ status: "error" });
      },
    );

    return () => {
      isCancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (copyState !== "copied") return;

    const timeoutId = setTimeout(() => setCopyState("idle"), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timeoutId);
  }, [copyState]);

  function retry() {
    setCodeState({ status: "loading" });
    setAttempt((current) => current + 1);
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
    } catch {
      // Clipboard API недоступен вне защищённого контекста или запрещён браузером
      setCopyState("failed");
    }
  }

  return (
    <div className={styles.panel}>
      <ModalCloseButton onClose={onClose} className={styles.close} />

      <span className={styles.badge}>
        <Icon icon={Ticket01Icon} size={26} />
      </span>
      <h2 id={TITLE_ID} className={styles.title}>
        Пригласительный код
      </h2>
      <p className={styles.description}>Отправьте код другу — он понадобится при регистрации в Talkie</p>

      <div className={styles.code} aria-live="polite">
        {codeState.status === "ready" && (
          <output
            className={styles.characters}
            aria-label={`Пригласительный код: ${codeState.code.split("").join(" ")}`}
          >
            {Array.from(codeState.code, (character, index) => (
              <span key={index} className={styles.character}>
                {character}
              </span>
            ))}
          </output>
        )}

        {codeState.status === "loading" && (
          <div className={styles.characters} aria-label="Создаём код">
            {Array.from({ length: INVITE_CODE_LENGTH }, (_, index) => (
              <span key={index} className={cn(styles.character, styles.skeleton)} />
            ))}
          </div>
        )}

        {codeState.status === "error" && <FormAlert variant="error">Не удалось получить код</FormAlert>}
      </div>

      {codeState.status === "error" ? (
        <Button onClick={retry} className={styles.action}>
          Попробовать снова
        </Button>
      ) : (
        <Button
          onClick={() => codeState.status === "ready" && copyCode(codeState.code)}
          disabled={codeState.status !== "ready"}
          className={styles.action}
        >
          <Icon icon={copyState === "copied" ? Tick02Icon : Copy01Icon} size={20} />
          {copyState === "copied" ? "Скопировано" : "Скопировать"}
        </Button>
      )}

      {copyState === "failed" && (
        <p role="alert" className={styles.copyError}>
          Не удалось скопировать автоматически — выделите код и скопируйте вручную
        </p>
      )}
    </div>
  );
}
