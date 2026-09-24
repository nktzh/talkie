import { Image01Icon } from "@hugeicons/core-free-icons";
import { isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui";
import { CopyTextButton } from "./CopyTextButton";
import styles from "./MarkdownText.module.css";

/*
 * Отрисовка markdown в сообщении.
 * Сырой HTML не подключён намеренно: react-markdown без rehype-raw не пропускает теги,
 * поэтому чужое сообщение не может ничего исполнить.
 */

const COMPONENTS: Components = {
  a: ({ children, ...props }) => (
    // Ссылка ведёт наружу, поэтому открываем в новой вкладке и не отдаём referrer
    <a {...props} className={styles.link} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  ),
  // Таблица шире пузыря не растягивает его, а прокручивается внутри
  table: ({ children }) => (
    <div className={styles.tableScroll}>
      <table className={styles.table}>{children}</table>
    </div>
  ),
  /*
   * Код выделять мышью неудобно — у блока своя кнопка копирования в углу.
   * Оборачиваем в контейнер: сам блок прокручивается, а кнопка стоит на месте
   */
  pre: ({ children }) => (
    <div className={styles.codeBlockWrap}>
      <pre className={styles.codeBlock}>{children}</pre>
      <CopyTextButton text={getPlainText(children)} className={styles.codeCopy} />
    </div>
  ),
  code: ({ children, className }) => <code className={cn(styles.code, className)}>{children}</code>,
  blockquote: ({ children }) => <blockquote className={styles.quote}>{children}</blockquote>,
  hr: () => <hr className={styles.rule} />,
  /*
   * Изображения пока не поддерживаем: картинку не загружаем, но и не выбрасываем молча —
   * на её месте остаётся заметка с подписью, чтобы читатель понимал, что здесь было.
   */
  img: ({ alt }) => (
    <span className={styles.imageStub}>
      <Icon icon={Image01Icon} size={15} />
      {alt || "изображение"}
    </span>
  ),
};

/** Текст блока кода: у react-markdown он лежит строкой внутри <code> — без служебного перевода строки в конце */
function getPlainText(node: ReactNode): string {
  if (typeof node === "string") return node.replace(/\n$/, "");
  if (Array.isArray(node)) return node.map(getPlainText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return getPlainText(node.props.children);
  return "";
}

interface MarkdownTextProps {
  source: string;
  className?: string;
}

export function MarkdownText({ source, className }: MarkdownTextProps) {
  return (
    <div className={cn(styles.markdown, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={COMPONENTS}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
