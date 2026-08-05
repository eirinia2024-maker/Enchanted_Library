"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Question = {
  prompt: string;
  options: string[];
  correct: string;
};

const QUESTIONS: Question[] = [
  { prompt: "The witch ___ in the library.", options: ["works", "work", "working"], correct: "works" },
  { prompt: "I ___ my cat every morning.", options: ["feed", "feeds", "feeding"], correct: "feed" },
  { prompt: "The black cat ___ on old books.", options: ["sleeps", "sleep", "sleeping"], correct: "sleeps" },
  { prompt: "We ___ English after school.", options: ["study", "studies", "studying"], correct: "study" },
  { prompt: "She ___ a magic book every day.", options: ["reads", "read", "reading"], correct: "reads" },
  { prompt: "They ___ tea in the evening.", options: ["drink", "drinks", "drinking"], correct: "drink" },
  { prompt: "My friend ___ to school by bus.", options: ["goes", "go", "going"], correct: "goes" },
  { prompt: "The library ___ at nine o'clock.", options: ["opens", "open", "opening"], correct: "opens" },
  { prompt: "I ___ new words in my notebook.", options: ["write", "writes", "writing"], correct: "write" },
  { prompt: "The owl ___ at night.", options: ["flies", "fly", "flying"], correct: "flies" },
  { prompt: "___ you like adventure stories?", options: ["Do", "Does", "Are"], correct: "Do" },
  { prompt: "___ the witch live in the tower?", options: ["Does", "Do", "Is"], correct: "Does" },
  { prompt: "___ your friends play games?", options: ["Do", "Does", "Are"], correct: "Do" },
  { prompt: "___ the cat sleep in the library?", options: ["Does", "Do", "Is"], correct: "Does" },
  { prompt: "Where ___ you keep your books?", options: ["do", "does", "are"], correct: "do" },
  { prompt: "When ___ she make potions?", options: ["does", "do", "is"], correct: "does" },
  { prompt: "The cat ___ like cold rain.", options: ["doesn't", "don't", "isn't"], correct: "doesn't" },
  { prompt: "I ___ play outside at night.", options: ["don't", "doesn't", "am not"], correct: "don't" },
  { prompt: "We ___ have lessons on Sunday.", options: ["don't", "doesn't", "aren't"], correct: "don't" },
  { prompt: "The witch ___ eat meat.", options: ["doesn't", "don't", "isn't"], correct: "doesn't" },
  { prompt: "Tom ___ know this word.", options: ["doesn't", "don't", "isn't"], correct: "doesn't" },
  { prompt: "My cats ___ drink milk.", options: ["don't", "doesn't", "aren't"], correct: "don't" },
  { prompt: "She always ___ her homework.", options: ["does", "do", "doing"], correct: "does" },
  { prompt: "I usually ___ home at five.", options: ["come", "comes", "coming"], correct: "come" },
  { prompt: "The wizard often ___ us stories.", options: ["tells", "tell", "telling"], correct: "tells" },
  { prompt: "We sometimes ___ in the library.", options: ["meet", "meets", "meeting"], correct: "meet" },
  { prompt: "Anna never ___ late.", options: ["arrives", "arrive", "arriving"], correct: "arrives" },
  { prompt: "The cat usually ___ under the table.", options: ["sits", "sit", "sitting"], correct: "sits" },
  { prompt: "My brother ___ two black cats.", options: ["has", "have", "having"], correct: "has" },
  { prompt: "These books ___ on the top shelf.", options: ["belong", "belongs", "belonging"], correct: "belong" },
];

const WORLD = { width: 900, height: 500 };
const CAT = { width: 34, height: 30 };
const START = { x: 62, y: 423 };
const PLATFORMS = [
  { x: 0, y: 458, w: 180 }, { x: 255, y: 458, w: 185 }, { x: 540, y: 458, w: 360 },
  { x: 210, y: 397, w: 135 }, { x: 388, y: 336, w: 142 }, { x: 570, y: 276, w: 145 },
  { x: 415, y: 216, w: 130 }, { x: 245, y: 156, w: 130 }, { x: 440, y: 100, w: 145 },
  { x: 650, y: 70, w: 190 },
];

type Phase = "playing" | "quiz" | "won";

export default function BlackCatGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const backgroundRef = useRef<HTMLImageElement | null>(null);
  const keysRef = useRef({ left: false, right: false });
  const playerRef = useRef({ x: START.x, y: START.y, vx: 0, vy: 0, grounded: true, facing: 1 });
  const questionBag = useRef<number[]>([]);
  const [phase, setPhase] = useState<Phase>("playing");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [falls, setFalls] = useState(0);

  const nextQuestion = useCallback(() => {
    if (questionBag.current.length === 0) {
      questionBag.current = QUESTIONS.map((_, index) => index).sort(() => Math.random() - 0.5);
    }
    setQuestionIndex(questionBag.current.pop() ?? 0);
    setSelected(null);
  }, []);

  const resetCat = useCallback(() => {
    playerRef.current = { x: START.x, y: START.y, vx: 0, vy: 0, grounded: true, facing: 1 };
  }, []);

  const fall = useCallback(() => {
    setFalls((value) => value + 1);
    nextQuestion();
    setPhase("quiz");
  }, [nextQuestion]);

  const jump = useCallback(() => {
    const player = playerRef.current;
    if (phase === "playing" && player.grounded) {
      player.vy = -10.4;
      player.grounded = false;
    }
  }, [phase]);

  useEffect(() => {
    const image = new Image();
    image.src = "/assets/enchanted-library-bg-v2.png";
    image.onload = () => { backgroundRef.current = image; };
  }, []);

  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "a", "A", "d", "D", "w", "W"].includes(event.key)) event.preventDefault();
      if (["ArrowLeft", "a", "A"].includes(event.key)) keysRef.current.left = true;
      if (["ArrowRight", "d", "D"].includes(event.key)) keysRef.current.right = true;
      if (["ArrowUp", " ", "w", "W"].includes(event.key)) jump();
    };
    const onUp = (event: KeyboardEvent) => {
      if (["ArrowLeft", "a", "A"].includes(event.key)) keysRef.current.left = false;
      if (["ArrowRight", "d", "D"].includes(event.key)) keysRef.current.right = false;
    };
    window.addEventListener("keydown", onDown, { passive: false });
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawBook = (x: number, y: number, w: number, index: number) => {
      const colors = ["#70418e", "#235d82", "#7f3d4b"];
      ctx.fillStyle = "#3a241d";
      ctx.fillRect(x, y, w, 13);
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(x + 3, y - 7, w - 6, 10);
      ctx.strokeStyle = "#e2ad4f";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 3, y - 7, w - 6, 10);
      ctx.fillStyle = "#f8df9a";
      ctx.fillRect(x, y + 12, w, 4);
    };

    const drawCat = (x: number, y: number, facing: number) => {
      ctx.save();
      ctx.translate(x + CAT.width / 2, y + CAT.height / 2);
      ctx.scale(facing, 1);
      ctx.translate(-CAT.width / 2, -CAT.height / 2);
      ctx.strokeStyle = "#0a0a12";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(7, 21); ctx.quadraticCurveTo(-8, 12, 4, 3); ctx.stroke();
      ctx.fillStyle = "#10111c";
      ctx.beginPath(); ctx.ellipse(17, 20, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(25, 9, 9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(19, 4); ctx.lineTo(21, -5); ctx.lineTo(26, 3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(27, 3); ctx.lineTo(33, -4); ctx.lineTo(34, 6); ctx.fill();
      ctx.fillStyle = "#82e6a6";
      ctx.beginPath(); ctx.ellipse(27, 8, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#d9b451";
      ctx.fillRect(20, 16, 13, 3);
      ctx.fillStyle = "#ffe17b";
      ctx.beginPath(); ctx.arc(27, 20, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const draw = () => {
      if (backgroundRef.current) ctx.drawImage(backgroundRef.current, 0, 0, WORLD.width, WORLD.height);
      else { ctx.fillStyle = "#081936"; ctx.fillRect(0, 0, WORLD.width, WORLD.height); }
      ctx.fillStyle = "#03112699"; ctx.fillRect(0, 0, WORLD.width, WORLD.height);

      const glow = ctx.createRadialGradient(745, 72, 5, 745, 72, 105);
      glow.addColorStop(0, "#ffe9a9bb"); glow.addColorStop(1, "#a65ae000");
      ctx.fillStyle = glow; ctx.fillRect(625, 0, 240, 185);
      ctx.fillStyle = "#37214d"; ctx.fillRect(688, 15, 117, 62);
      ctx.strokeStyle = "#edc76f"; ctx.lineWidth = 5; ctx.strokeRect(688, 15, 117, 62);
      ctx.fillStyle = "#f7dc91"; ctx.font = "bold 13px Georgia"; ctx.fillText("WITCH'S WINDOW", 691, 92);
      ctx.fillStyle = "#1d102b";
      ctx.beginPath(); ctx.arc(750, 48, 16, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(726, 36); ctx.lineTo(748, 4); ctx.lineTo(772, 38); ctx.fill();
      ctx.fillStyle = "#f0c57b"; ctx.beginPath(); ctx.arc(755, 50, 7, 0, Math.PI * 2); ctx.fill();

      PLATFORMS.forEach((platform, index) => drawBook(platform.x, platform.y, platform.w, index));
      for (let i = 0; i < 16; i += 1) {
        const x = (i * 137 + 51) % WORLD.width;
        const y = (i * 83 + 41) % 430;
        ctx.fillStyle = i % 2 ? "#f7d67188" : "#b77aff66";
        ctx.fillRect(x, y, 2, 2);
      }

      const player = playerRef.current;
      drawCat(player.x, player.y, player.facing);
      ctx.fillStyle = "#07172dcc"; ctx.fillRect(14, 13, 240, 43);
      ctx.strokeStyle = "#cda247"; ctx.lineWidth = 1; ctx.strokeRect(14, 13, 240, 43);
      ctx.fillStyle = "#ffe6a1"; ctx.font = "bold 14px Georgia"; ctx.fillText("MIDNIGHT RETURN", 28, 32);
      ctx.fillStyle = "#b8c9dc"; ctx.font = "11px Arial"; ctx.fillText("Reach the witch's window  ↑", 28, 47);
      ctx.fillStyle = "#ffe08a"; ctx.font = "bold 12px Arial"; ctx.fillText(`FALLS  ${falls}`, 808, 31);
    };

    const tick = () => {
      if (phase === "playing") {
        const player = playerRef.current;
        const previousBottom = player.y + CAT.height;
        if (keysRef.current.left) { player.vx = Math.max(player.vx - .55, -4.6); player.facing = -1; }
        else if (keysRef.current.right) { player.vx = Math.min(player.vx + .55, 4.6); player.facing = 1; }
        else player.vx *= .78;
        player.x += player.vx;
        player.vy += .47;
        player.y += player.vy;
        if (player.x < -CAT.width) player.x = WORLD.width;
        if (player.x > WORLD.width) player.x = -CAT.width;
        player.grounded = false;
        if (player.vy >= 0) {
          for (const platform of PLATFORMS) {
            const nextBottom = player.y + CAT.height;
            if (previousBottom <= platform.y && nextBottom >= platform.y && player.x + CAT.width - 5 > platform.x && player.x + 5 < platform.x + platform.w) {
              player.y = platform.y - CAT.height;
              player.vy = 0;
              player.grounded = true;
              break;
            }
          }
        }
        if (player.y < 62 && player.x > 675 && player.x < 820) setPhase("won");
        else if (player.y > WORLD.height + 35) fall();
      }
      draw();
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [fall, falls, phase]);

  const answerQuestion = (option: string) => {
    setSelected(option);
    if (option === QUESTIONS[questionIndex].correct) {
      window.setTimeout(() => { resetCat(); setPhase("playing"); setSelected(null); }, 650);
    }
  };

  const setDirection = (direction: "left" | "right", pressed: boolean) => { keysRef.current[direction] = pressed; };

  return (
    <div className="arcade-layer">
      <section className="arcade-shell" role="dialog" aria-modal="true" aria-label="Midnight Return game">
        <header className="arcade-header">
          <div><span>GAME 01 · PRESENT SIMPLE · A1</span><h2>Midnight Return</h2></div>
          <p>Help the black cat return to the witch&apos;s window.</p>
          <button onClick={onClose} aria-label="Close game">×</button>
        </header>
        <div className="game-stage">
          <canvas ref={canvasRef} width={WORLD.width} height={WORLD.height} aria-label="Platform game: guide the black cat to the witch's window" />
          {phase === "quiz" && (
            <div className="fall-quiz">
              <span>THE CAT FELL! · PRESENT SIMPLE</span>
              <h3>{QUESTIONS[questionIndex].prompt}</h3>
              <p>Choose the correct answer to try again.</p>
              <div>
                {QUESTIONS[questionIndex].options.map((option) => {
                  const state = selected === option ? (option === QUESTIONS[questionIndex].correct ? "correct" : "wrong") : "";
                  return <button className={state} key={option} onClick={() => answerQuestion(option)}>{option}<i>{state === "correct" ? "✓" : state === "wrong" ? "×" : "→"}</i></button>;
                })}
              </div>
              {selected && selected !== QUESTIONS[questionIndex].correct && <small>Not quite. Look at the subject and try again.</small>}
            </div>
          )}
          {phase === "won" && (
            <div className="win-screen"><span>★</span><h3>Back where you belong!</h3><p>The cat reached the witch&apos;s window.</p><button onClick={() => { resetCat(); setFalls(0); setPhase("playing"); }}>Play again</button></div>
          )}
        </div>
        <footer className="game-controls">
          <div className="keys-guide"><span><kbd>←</kbd><kbd>→</kbd> move</span><span><kbd>SPACE</kbd> jump</span></div>
          <div className="touch-controls">
            <button onPointerDown={() => setDirection("left", true)} onPointerUp={() => setDirection("left", false)} onPointerLeave={() => setDirection("left", false)} aria-label="Move left">←</button>
            <button onPointerDown={() => setDirection("right", true)} onPointerUp={() => setDirection("right", false)} onPointerLeave={() => setDirection("right", false)} aria-label="Move right">→</button>
            <button onPointerDown={jump} aria-label="Jump">↑</button>
          </div>
          <p>Tip: books are your steps. Falling opens a grammar question.</p>
        </footer>
      </section>
    </div>
  );
}
