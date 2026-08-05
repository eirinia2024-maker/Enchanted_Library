"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

type InstructionStep = {
  icon: string;
  title: string;
  text: string;
};

type Props = {
  open: boolean;
  kicker: string;
  title: string;
  intro: string;
  steps: InstructionStep[];
  onClose: () => void;
};

export default function GameInstructions({ open, kicker, title, intro, steps, onClose }: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const blockGameKeys = (event: KeyboardEvent) => {
      event.stopImmediatePropagation();
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", blockGameKeys, true);
    return () => window.removeEventListener("keydown", blockGameKeys, true);
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="instructions-layer" onClick={onClose}>
      <section
        className="instructions-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="instructions-close" onClick={onClose} aria-label="Закрыть инструкции" autoFocus>×</button>
        <div className="instructions-seal" aria-hidden="true">?</div>
        <span className="instructions-kicker">{kicker}</span>
        <h2 id={titleId}>{title}</h2>
        <p className="instructions-intro">{intro}</p>
        <ol className="instructions-list">
          {steps.map((step) => (
            <li key={step.title}>
              <i aria-hidden="true">{step.icon}</i>
              <div><strong>{step.title}</strong><span>{step.text}</span></div>
            </li>
          ))}
        </ol>
        <button className="instructions-confirm" onClick={onClose}>Понятно, играть</button>
      </section>
    </div>,
    document.body,
  );
}
