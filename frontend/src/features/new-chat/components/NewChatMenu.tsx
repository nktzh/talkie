"use client";

import {
  ArrowRight01Icon,
  BotIcon,
  Megaphone01Icon,
  Message01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/shared/lib/cn";
import { Icon, Modal, ModalCloseButton, type IconSvgElement } from "@/shared/ui";
import styles from "./NewChatMenu.module.css";

const TITLE_ID = "new-chat-menu-title";

interface NewChatMenuProps {
  open: boolean;
  onClose: () => void;
  onWriteContact: () => void;
  onCreateGroup: () => void;
  onCreateChannel: () => void;
}

/** Выбор, что создать. На десктопе — компактное окно, на мобильных — лист снизу */
export function NewChatMenu({ open, onClose, onWriteContact, onCreateGroup, onCreateChannel }: NewChatMenuProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy={TITLE_ID} size="sheet">
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 id={TITLE_ID} className={styles.title}>
            Новый чат
          </h2>
          <ModalCloseButton onClose={onClose} />
        </header>

        <ul role="list" className={styles.options}>
          <li>
            <MenuOption
              icon={Message01Icon}
              title="Написать контакту"
              description="Выберите собеседника или добавьте нового"
              onClick={onWriteContact}
            />
          </li>
          <li>
            <MenuOption
              icon={UserGroupIcon}
              title="Создать группу"
              description="Общий чат, в котором пишут все участники"
              onClick={onCreateGroup}
            />
          </li>
          <li>
            <MenuOption
              icon={Megaphone01Icon}
              title="Создать канал"
              description="Лента постов для подписчиков"
              onClick={onCreateChannel}
            />
          </li>
          <li>
            <MenuOption icon={BotIcon} title="Создать бота" description="Пока в разработке" isDisabled />
          </li>
        </ul>
      </div>
    </Modal>
  );
}

interface MenuOptionProps {
  icon: IconSvgElement;
  title: string;
  description: string;
  isDisabled?: boolean;
  onClick?: () => void;
}

function MenuOption({ icon, title, description, isDisabled = false, onClick }: MenuOptionProps) {
  return (
    <button
      type="button"
      className={styles.option}
      disabled={isDisabled}
      aria-haspopup={isDisabled ? undefined : "dialog"}
      onClick={onClick}
    >
      <span className={styles.optionIcon}>
        <Icon icon={icon} size={22} />
      </span>
      <span className={styles.optionText}>
        <span className={styles.optionTitle}>
          {title}
          {isDisabled && <span className={styles.soon}>Скоро</span>}
        </span>
        <span className={styles.optionDescription}>{description}</span>
      </span>
      <Icon icon={ArrowRight01Icon} size={18} className={cn(styles.chevron, isDisabled && styles.chevronHidden)} />
    </button>
  );
}
