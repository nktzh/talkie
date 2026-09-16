"use client";

import { useState, type KeyboardEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon, Modal, ModalCloseButton } from "@/shared/ui";
import { SETTINGS_TABS } from "../config/tabs";
import type { SettingsTabId } from "../types";
import { SettingsSection } from "./SettingsSection";
import styles from "./SettingsModal.module.css";

const TITLE_ID = "settings-title";
const PANEL_ID = "settings-panel";

function getTabId(tabId: SettingsTabId): string {
  return `settings-tab-${tabId}`;
}

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy={TITLE_ID} size="lg">
      <SettingsLayout onClose={onClose} />
    </Modal>
  );
}

/** Настройки на десктопе: слева — разделы, справа — содержимое. На мобильных вместо модалки — вкладка «Аккаунт» */
function SettingsLayout({ onClose }: { onClose: () => void }) {
  const [activeTabId, setActiveTabId] = useState<SettingsTabId>("profile");
  const activeTab = SETTINGS_TABS.find((tab) => tab.id === activeTabId) ?? SETTINGS_TABS[0];

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;

    event.preventDefault();
    const currentIndex = SETTINGS_TABS.findIndex((tab) => tab.id === activeTabId);
    const nextTab = SETTINGS_TABS[(currentIndex + step + SETTINGS_TABS.length) % SETTINGS_TABS.length];
    setActiveTabId(nextTab.id);
    document.getElementById(getTabId(nextTab.id))?.focus();
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <h2 id={TITLE_ID} className={styles.title}>
          Настройки
        </h2>

        <div
          role="tablist"
          aria-orientation="vertical"
          aria-labelledby={TITLE_ID}
          className={styles.tabs}
          onKeyDown={handleKeyDown}
        >
          {SETTINGS_TABS.map((tab) => {
            const isSelected = tab.id === activeTabId;

            return (
              <button
                key={tab.id}
                id={getTabId(tab.id)}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={PANEL_ID}
                tabIndex={isSelected ? 0 : -1}
                className={cn(styles.tab, isSelected && styles.tabSelected)}
                onClick={() => setActiveTabId(tab.id)}
              >
                <Icon icon={tab.icon} size={20} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </aside>

      <section id={PANEL_ID} role="tabpanel" aria-labelledby={getTabId(activeTab.id)} className={styles.panel}>
        <header className={styles.panelHeader}>
          <div>
            <h3 className={styles.panelTitle}>{activeTab.label}</h3>
            <p className={styles.panelDescription}>{activeTab.description}</p>
          </div>
          <ModalCloseButton onClose={onClose} />
        </header>

        <div className={styles.panelBody}>
          <SettingsSection key={activeTab.id} tabId={activeTab.id} />
        </div>
      </section>
    </div>
  );
}
