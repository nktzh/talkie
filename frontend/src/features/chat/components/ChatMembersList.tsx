"use client";

import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { usePrefetchOnIntent } from "@/shared/lib/usePrefetchOnIntent";
import { Avatar } from "@/shared/ui";
import { useDirectChat } from "../hooks/useDirectChat";
import { pluralize } from "../lib/format";
import type { GroupConversation, User, UserId } from "../model/types";
import styles from "./ChatMembersList.module.css";

interface ChatMembersListProps {
  conversation: GroupConversation;
  currentUserId: UserId;
}

/** Содержимое вкладки «Участники»: общее число стоит под названием группы, здесь — сами люди */
export function ChatMembersList({ conversation, currentUserId }: ChatMembersListProps) {
  const { members, membersCount } = conversation;
  const hiddenCount = Math.max(0, membersCount - members.length);

  return (
    <>
      <ul role="list" className={styles.list}>
        {members.map((member) => (
          <li key={member.id}>
            {member.id === currentUserId ? (
              // Переписки с самим собой нет — своя строка никуда не ведёт
              <div className={styles.item}>
                <MemberInfo member={member} isCurrentUser />
              </div>
            ) : (
              <MemberLink member={member} />
            )}
          </li>
        ))}
      </ul>

      {hiddenCount > 0 && (
        <p className={styles.more}>
          и ещё {hiddenCount} {pluralize(hiddenCount, { one: "участник", few: "участника", many: "участников" })}
        </p>
      )}
    </>
  );
}

/** Участник ведёт в личную переписку с ним, как контакт в «Контактах» */
function MemberLink({ member }: { member: User }) {
  const { href, open, isPending } = useDirectChat(member);
  const className = cn(styles.item, styles.interactive, isPending && styles.pending);
  const label = `Написать ${member.displayName}`;
  const { prefetch, intentHandlers } = usePrefetchOnIntent();

  if (href) {
    return (
      <Link href={href} prefetch={prefetch} className={className} title={label} {...intentHandlers}>
        <MemberInfo member={member} />
      </Link>
    );
  }

  return (
    <button type="button" className={className} title={label} aria-busy={isPending || undefined} onClick={open}>
      <MemberInfo member={member} />
    </button>
  );
}

function MemberInfo({ member, isCurrentUser = false }: { member: User; isCurrentUser?: boolean }) {
  return (
    <>
      <Avatar id={member.id} name={member.displayName} size={38} className={styles.avatar} />
      <span className={styles.info}>
        <span className={styles.name}>
          {member.displayName}
          {isCurrentUser && <span className={styles.you}>вы</span>}
        </span>
        <span className={styles.username}>@{member.username}</span>
      </span>
    </>
  );
}
