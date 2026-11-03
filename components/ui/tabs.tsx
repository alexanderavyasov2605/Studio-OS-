"use client";

import { useId, useRef, useState, type ReactNode, type KeyboardEvent } from "react";
import { cx } from "@/lib/ui";
import { Icon, type IconName } from "./icon";

export type TabItem = { id: string; label: string; content: ReactNode; disabled?: boolean; icon?: IconName };
export function Tabs({ label, items, variant = "default" }: { label: string; items: ReadonlyArray<TabItem>; variant?: "default" | "mobile" }) {
  const prefix = useId();
  const [selected, setSelected] = useState(items.find((item) => !item.disabled)?.id);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = items.findIndex((item) => item.id === selected && !item.disabled);
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const enabled = items.map((item, i) => item.disabled ? -1 : i).filter((i) => i >= 0);
    let target: number | undefined;
    if (event.key === "ArrowRight") target = enabled[(enabled.indexOf(index) + 1) % enabled.length];
    if (event.key === "ArrowLeft") target = enabled[(enabled.indexOf(index) - 1 + enabled.length) % enabled.length];
    if (event.key === "Home") target = enabled[0];
    if (event.key === "End") target = enabled.at(-1);
    if (target !== undefined) {
      event.preventDefault();
      setSelected(items[target].id);
      refs.current[target]?.focus();
    }
  }
  return <div className={cx("tabs", `tabs--${variant}`)}>
    <div role="tablist" aria-label={label} className="tabs__list">{items.map((item, index) =>
      <button key={item.id} ref={(element) => { refs.current[index] = element; }} type="button" role="tab" id={`${prefix}-tab-${index}`} aria-controls={`${prefix}-panel-${index}`} aria-selected={activeIndex === index} tabIndex={activeIndex === index ? 0 : -1} disabled={item.disabled} onClick={() => setSelected(item.id)} onKeyDown={(event) => onKeyDown(event, index)} className="tabs__tab">
        {item.icon && <Icon name={item.icon} />}{item.label}
      </button>)}</div>
    {items.map((item, index) => <div key={item.id} role="tabpanel" id={`${prefix}-panel-${index}`} aria-labelledby={`${prefix}-tab-${index}`} hidden={activeIndex !== index} tabIndex={0} className="tabs__panel">{item.content}</div>)}
  </div>;
}
