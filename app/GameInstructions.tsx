"use client";

import { useId } from "react";

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

  if (!open) return null;

  return (
    <div className="instructions-layer" onMouseDown={onClose}>
      <section
        className="instructions-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="instructions-close" onClick={onClose} aria-label="Закрыть инструкции">×</button>
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
    </div>
  );
}
