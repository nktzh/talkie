"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import styles from "./MarkdownTableGrid.module.css";

const MAX_ROWS = 5;
const MAX_COLUMNS = 5;

interface MarkdownTableGridProps {
  /** rows считает и строку заголовка */
  onPick: (rows: number, columns: number) => void;
}

/** Выбор размера таблицы наведением — как в текстовых редакторах */
export function MarkdownTableGrid({ onPick }: MarkdownTableGridProps) {
  const [hovered, setHovered] = useState({ rows: 0, columns: 0 });

  return (
    <div className={styles.picker}>
      <div
        className={styles.grid}
        role="group"
        aria-label="Размер таблицы"
        onPointerLeave={() => setHovered({ rows: 0, columns: 0 })}
      >
        {Array.from({ length: MAX_ROWS }, (_, rowIndex) =>
          Array.from({ length: MAX_COLUMNS }, (_, columnIndex) => {
            const rows = rowIndex + 1;
            const columns = columnIndex + 1;
            const isFilled = rows <= hovered.rows && columns <= hovered.columns;

            return (
              <button
                key={`${rows}-${columns}`}
                type="button"
                className={cn(styles.cell, isFilled && styles.cellFilled)}
                aria-label={`Таблица ${rows} × ${columns}`}
                onPointerEnter={() => setHovered({ rows, columns })}
                onFocus={() => setHovered({ rows, columns })}
                onClick={() => onPick(rows, columns)}
              />
            );
          }),
        )}
      </div>

      <p className={styles.hint}>
        {hovered.rows > 0 ? `${hovered.rows} × ${hovered.columns}` : "Выберите размер"}
      </p>
    </div>
  );
}
