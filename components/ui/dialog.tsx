"use client";

import { useId, useRef, type ReactNode, type KeyboardEvent } from "react";
import { Button } from "./primitives";
import { Icon } from "./icon";

export function Dialog({ triggerLabel, title, description, children }: { triggerLabel: string; title: string; description: string; children?: ReactNode }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  function keepFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const elements = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    )).filter((element) => element.getClientRects().length > 0);
    const first = elements[0];
    const last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  return <>
    <Button ref={trigger} variant="secondary" onClick={() => dialog.current?.showModal()}>{triggerLabel}</Button>
    <dialog ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} className="dialog" onKeyDown={keepFocus} onClose={() => trigger.current?.focus()}>
      <div className="dialog__header"><h2 id={`${id}-title`}>{title}</h2><Button variant="ghost" aria-label="Закрыть диалог" onClick={() => dialog.current?.close()}><Icon name="close" /></Button></div>
      <p id={`${id}-description`} className="text-muted">{description}</p>
      {children && <div className="dialog__content">{children}</div>}
      <div className="dialog__footer"><Button onClick={() => dialog.current?.close()}>Понятно</Button></div>
    </dialog>
  </>;
}
