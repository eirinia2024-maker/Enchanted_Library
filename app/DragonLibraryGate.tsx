"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const QUESTIONS = [
  {
    question: "What are my favourite sweets?",
    hint: "The black cat discovers this secret after returning home.",
    answer: "chocolate candies",
    accepted: ["chocolate candies", "chocolate candy"],
  },
  {
    question: "What colour makes a reading potion glow?",
    hint: "A skilled word alchemist learns this after brewing every word.",
    answer: "moonlight blue",
    accepted: ["moonlight blue"],
  },
  {
    question: "What magic word opens the oldest library door?",
    hint: "The answer waits inside the treasure room of the labyrinth.",
    answer: "starlight",
    accepted: ["starlight"],
  },
];

type Stage = "question" | "feedback" | "success";

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[.!?,;:'"-]/g, "").replace(/\s+/g, " ");
}

export default function DragonLibraryGate({ onClose, onFinish }: { onClose: () => void; onFinish: () => void }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [stage, setStage] = useState<Stage>("question");
  const [correct, setCorrect] = useState(false);
  const question = QUESTIONS[questionIndex];

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", closeOnEscape, true);
    return () => window.removeEventListener("keydown", closeOnEscape, true);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const checkAnswer = (event: React.FormEvent) => {
    event.preventDefault();
    if (!answer.trim()) return;
    const isCorrect = question.accepted.some((item) => normalize(item) === normalize(answer));
    setCorrect(isCorrect);
    setStage("feedback");
  };

  const continueQuest = () => {
    if (!correct) {
      setAnswer("");
      setStage("question");
      return;
    }
    if (questionIndex === QUESTIONS.length - 1) {
      setStage("success");
      return;
    }
    setQuestionIndex((index) => index + 1);
    setAnswer("");
    setStage("question");
  };

  return createPortal(
    <div className="dragon-gate-layer" onClick={onClose}>
      <section className={`dragon-gate-card stage-${stage}`} role="dialog" aria-modal="true" aria-label="The dragon librarian's questions" onClick={(event) => event.stopPropagation()}>
        <button className="dragon-gate-close" onClick={onClose} aria-label="Close the dragon's questions">×</button>

        {stage === "question" && (
          <>
            <Image className="dragon-gate-background" src="/assets/dragon-gate-question.png" alt="A young dragon librarian beside an enchanted parchment" fill priority sizes="min(1180px, 96vw)" />
            <div className="dragon-question-copy">
              <span>THE DRAGON LIBRARIAN · RIDDLE {questionIndex + 1} OF {QUESTIONS.length}</span>
              <div className="dragon-progress" aria-label={`${questionIndex} correct answers out of 3`}>
                {QUESTIONS.map((_, index) => <i className={index < questionIndex ? "done" : index === questionIndex ? "current" : ""} key={index}>◆</i>)}
              </div>
              <h2>{question.question}</h2>
              <p>{question.hint}</p>
            </div>
            <form className="dragon-answer-form" onSubmit={checkAnswer}>
              <label htmlFor="dragon-answer">Your answer</label>
              <input id="dragon-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type in English…" autoComplete="off" autoFocus />
              <button type="submit" disabled={!answer.trim()}>Check answer</button>
            </form>
          </>
        )}

        {stage === "feedback" && (
          <>
            <Image className="dragon-feedback-image" src={correct ? "/assets/dragon-gate-happy.png" : "/assets/dragon-gate-sad.png"} alt={correct ? "The dragon is happy with the correct answer" : "The dragon is sad about the wrong answer"} fill sizes="min(980px, 96vw)" />
            <div className={`dragon-feedback-copy ${correct ? "correct" : "wrong"}`}>
              <span>{correct ? "✦ CORRECT ✦" : "NOT QUITE YET"}</span>
              <h2>{correct ? "Brilliant answer!" : "The old books disagree…"}</h2>
              <p>{correct ? <><strong>{question.answer}</strong> is exactly right.</> : "Find the secret on the victory screen of the matching game and try once more."}</p>
              <button onClick={continueQuest}>{correct ? (questionIndex === QUESTIONS.length - 1 ? "See the dragon's message" : "Next riddle") : "Try again"}</button>
            </div>
          </>
        )}

        {stage === "success" && (
          <>
            <Image className="dragon-feedback-image" src="/assets/dragon-gate-happy.png" alt="The happy dragon welcomes the player" fill priority sizes="min(980px, 96vw)" />
            <div className="dragon-feedback-copy success">
              <span>✦ ALL THREE RIDDLES SOLVED ✦</span>
              <h2>Now you&apos;re welcome to the magic library!</h2>
              <p>Well done! The dragon librarian trusts you with every enchanted shelf.</p>
              <button onClick={onFinish}>Enter the library</button>
            </div>
          </>
        )}
      </section>
    </div>,
    document.body,
  );
}
