"use client";

import { Modal, ModalCloseButton } from "@/shared/ui";
import { ContactsPanel } from "./ContactsPanel";
import styles from "./ContactsModal.module.css";

const TITLE_ID = "contacts-title";

interface ContactsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ContactsModal({ open, onClose }: ContactsModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy={TITLE_ID} className={styles.modal}>
      <ContactsPanel titleId={TITLE_ID} action={<ModalCloseButton onClose={onClose} />} onOpenChat={onClose} />
    </Modal>
  );
}
