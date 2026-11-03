import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/ui";
import { Icon } from "./icon";

export type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";
export function Button({ variant = "primary", size = "md", loading = false, disabled, className, children, type = "button", ...props }: ComponentPropsWithRef<"button"> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md"; loading?: boolean }) {
  return <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={cx("button", `button--${variant}`, `button--${size}`, className)}>
    {loading && <span className="spinner" aria-hidden="true" />}{children}
  </button>;
}
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("card", className)} />;
}
export function Badge({ tone = "neutral", children, className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span {...props} className={cx("badge", `tone--${tone}`, className)}>{children}</span>;
}
export function Alert({ tone = "info", title, children, className, ...props }: Omit<HTMLAttributes<HTMLDivElement>, "title"> & { tone?: Tone; title: string }) {
  const urgent = tone === "danger";
  return <div {...props} role={urgent ? "alert" : "status"} className={cx("alert", `tone--${tone}`, className)}>
    <Icon name={tone === "success" ? "check" : urgent || tone === "warning" ? "alert" : "info"} />
    <div><p className="alert__title">{title}</p>{children && <div className="alert__body">{children}</div>}</div>
  </div>;
}
export function EmptyState({ title, description, action, compact = false }: { title: string; description: string; action?: ReactNode; compact?: boolean }) {
  return <div className={cx("empty-state", compact && "empty-state--compact")}>
    <span className="empty-state__icon"><Icon name="layers" size={24} /></span>
    <h2>{title}</h2><p>{description}</p>{action && <div className="empty-state__action">{action}</div>}
  </div>;
}
export function Skeleton({ label = "Загрузка содержимого", className, ...props }: HTMLAttributes<HTMLDivElement> & { label?: string }) {
  return <div {...props} role="status" aria-busy="true" className={cx("skeleton-group", className)}><span className="sr-only">{label}</span><span className="skeleton skeleton--short" /><span className="skeleton" /><span className="skeleton skeleton--medium" /></div>;
}
export type TableColumn<T> = { key: string; header: ReactNode; render: (row: T) => ReactNode };
export function Table<T>({ caption, columns, rows, rowKey, emptyMessage = "Нет данных для отображения" }: { caption: string; columns: ReadonlyArray<TableColumn<T>>; rows: ReadonlyArray<T>; rowKey: (row: T) => string; emptyMessage?: string }) {
  return <div className="table-region" role="region" aria-label={caption} tabIndex={0}>
    <table className="table"><caption>{caption}</caption><thead><tr>{columns.map((column) => <th key={column.key} scope="col">{column.header}</th>)}</tr></thead>
      <tbody>{rows.length ? rows.map((row) => <tr key={rowKey(row)}>{columns.map((column) => <td key={column.key}>{column.render(row)}</td>)}</tr>) : <tr><td colSpan={columns.length} className="table__empty">{emptyMessage}</td></tr>}</tbody>
    </table>
  </div>;
}
