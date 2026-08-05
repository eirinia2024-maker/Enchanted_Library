"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Question = { prompt: string; options: string[]; correct: string };

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

const WORLD = { width: 1000, height: 560 };
const CAT = { width: 38, height: 32 };
const CHECKPOINTS = [
  { x: 48, y: 487 },
  { x: 85, y: 338 },
  { x: 115, y: 255 },
  { x: 120, y: 158 },
];

type Phase = "playing" | "quiz" | "won" | "paused";
type Platform = { id: string; x: number; y: number; w: number; kind: "ground" | "bin" | "fence" | "rope" | "ledge" };
type Projectile = { x: number; y: number; vx: number; vy: number; kind: number };

export default function BlackCatGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const keysRef = useRef({ left: false, right: false });
  const phaseRef = useRef<Phase>("playing");
  const checkpointRef = useRef(0);
  const hazardsRef = useRef<Projectile[]>([]);
  const nextThrowRef = useRef(2400);
  const warningRef = useRef<{ x: number; y: number; until: number } | null>(null);
  const startTimeRef = useRef(0);
  const dogRef = useRef({ x: 710, direction: 1 });
  const playerRef = useRef({ x: 48, y: 487, vx: 0, vy: 0, grounded: true, support: "ground", facing: 1, invincibleUntil: 0 });
  const questionBag = useRef<number[]>([]);
  const [phase, setPhaseState] = useState<Phase>("playing");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [falls, setFalls] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [score, setScore] = useState(0);

  const setPhase = useCallback((value: Phase) => {
    phaseRef.current = value;
    setPhaseState(value);
  }, []);

  const nextQuestion = useCallback(() => {
    if (questionBag.current.length === 0) questionBag.current = QUESTIONS.map((_, i) => i).sort(() => Math.random() - 0.5);
    setQuestionIndex(questionBag.current.pop() ?? 0);
    setSelected(null);
  }, []);

  const resetCat = useCallback((checkpoint = checkpointRef.current) => {
    const start = CHECKPOINTS[checkpoint];
    playerRef.current = { x: start.x, y: start.y, vx: 0, vy: 0, grounded: true, support: checkpoint === 0 ? "ground" : checkpoint === 1 ? "fence" : checkpoint === 2 ? "rope-low" : "rope-high", facing: 1, invincibleUntil: performance.now() + 1100 };
    hazardsRef.current = [];
    warningRef.current = null;
  }, []);

  const loseTurn = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    nextQuestion();
    setFalls((value) => value + 1);
    setHearts((value) => {
      if (value <= 1) { checkpointRef.current = 0; return 3; }
      return value - 1;
    });
    setPhase("quiz");
  }, [nextQuestion, setPhase]);

  const jump = useCallback(() => {
    const cat = playerRef.current;
    if (phaseRef.current === "playing" && cat.grounded) {
      cat.vy = -11.1;
      cat.grounded = false;
      cat.support = "";
    }
  }, []);

  useEffect(() => {
    const image = new Image();
    image.src = "/assets/alley-library-yard-v2.png";
    image.onload = () => { backgroundRef.current = image; };
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "a", "A", "d", "D", "w", "W"].includes(event.key)) event.preventDefault();
      if (["ArrowLeft", "a", "A"].includes(event.key)) keysRef.current.left = true;
      if (["ArrowRight", "d", "D"].includes(event.key)) keysRef.current.right = true;
      if (["ArrowUp", " ", "w", "W"].includes(event.key)) jump();
      if (event.key.toLowerCase() === "p" && ["playing", "paused"].includes(phaseRef.current)) setPhase(phaseRef.current === "playing" ? "paused" : "playing");
    };
    const up = (event: KeyboardEvent) => {
      if (["ArrowLeft", "a", "A"].includes(event.key)) keysRef.current.left = false;
      if (["ArrowRight", "d", "D"].includes(event.key)) keysRef.current.right = false;
    };
    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [jump, setPhase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    startTimeRef.current = performance.now();

    const platformsAt = (time: number): Platform[] => {
      const lowY = 285 + Math.sin(time / 720) * 5;
      const highY = 188 + Math.sin(time / 820 + 1.4) * 5;
      return [
        { id: "ground", x: 0, y: 519, w: 1000, kind: "ground" },
        { id: "bin-1", x: 115, y: 474, w: 75, kind: "bin" },
        { id: "bin-2", x: 218, y: 440, w: 75, kind: "bin" },
        { id: "bin-3", x: 324, y: 405, w: 75, kind: "bin" },
        { id: "fence", x: 28, y: 370, w: 915, kind: "fence" },
        { id: "rope-low", x: 80, y: lowY, w: 820, kind: "rope" },
        { id: "rope-high", x: 80, y: highY, w: 820, kind: "rope" },
        { id: "ledge", x: 700, y: 112, w: 180, kind: "ledge" },
      ];
    };

    const circleHitsCat = (x: number, y: number, radius: number) => {
      const cat = playerRef.current;
      const closestX = Math.max(cat.x, Math.min(x, cat.x + CAT.width));
      const closestY = Math.max(cat.y, Math.min(y, cat.y + CAT.height));
      return (x - closestX) ** 2 + (y - closestY) ** 2 < radius ** 2;
    };

    const drawCat = (x: number, y: number, facing: number, blinking: boolean) => {
      if (blinking) ctx.globalAlpha = .35;
      ctx.save(); ctx.translate(x + CAT.width / 2, y + CAT.height / 2); ctx.scale(facing, 1); ctx.translate(-CAT.width / 2, -CAT.height / 2);
      ctx.strokeStyle = "#080910"; ctx.lineWidth = 7; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(9, 22); ctx.quadraticCurveTo(-10, 12, 4, 2); ctx.stroke();
      ctx.fillStyle = "#0b0d16"; ctx.beginPath(); ctx.ellipse(19, 21, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(28, 10, 10, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(20, 5); ctx.lineTo(23, -6); ctx.lineTo(29, 4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(29, 4); ctx.lineTo(36, -5); ctx.lineTo(37, 7); ctx.fill();
      ctx.fillStyle = "#82ee9f"; ctx.beginPath(); ctx.ellipse(31, 9, 2.2, 3.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e0b749"; ctx.fillRect(21, 17, 15, 3); ctx.beginPath(); ctx.arc(29, 21, 2.7, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); ctx.globalAlpha = 1;
    };

    const drawBin = (p: Platform) => {
      ctx.fillStyle = "#28313b"; ctx.fillRect(p.x + 7, p.y, p.w - 14, 48);
      ctx.fillStyle = "#4c5964"; ctx.fillRect(p.x + 2, p.y - 6, p.w - 4, 9);
      ctx.strokeStyle = "#89939a"; ctx.lineWidth = 2;
      for (let x = p.x + 17; x < p.x + p.w - 9; x += 16) { ctx.beginPath(); ctx.moveTo(x, p.y + 5); ctx.lineTo(x, p.y + 43); ctx.stroke(); }
    };

    const drawLaundry = (y: number, time: number, row: number) => {
      ctx.strokeStyle = "#c9ae7a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(80, y); ctx.quadraticCurveTo(490, y + 10, 900, y); ctx.stroke();
      const colors = ["#d5b4ce", "#8da6c5", "#7b518e", "#d9cfad", "#5a85a4"];
      for (let i = 0; i < 7; i += 1) {
        const base = 115 + i * 112;
        const x = base + Math.sin(time / 900 + i * .8 + row) * 17;
        const w = i % 3 === 0 ? 54 : 40;
        ctx.fillStyle = colors[(i + row) % colors.length];
        ctx.fillRect(x, y + 5, w, 28 + (i % 2) * 11);
        ctx.fillStyle = "#e8c46b"; ctx.fillRect(x + 5, y - 2, 4, 7); ctx.fillRect(x + w - 9, y - 2, 4, 7);
      }
    };

    const drawMouse = (x: number, y: number, direction: number) => {
      ctx.save(); ctx.translate(x, y); ctx.scale(direction, 1);
      ctx.strokeStyle = "#a9959b"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, -2); ctx.quadraticCurveTo(-18, -12, -24, -5); ctx.stroke();
      ctx.fillStyle = "#91828a"; ctx.beginPath(); ctx.ellipse(0, -5, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(8, -8, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e4b1b8"; ctx.beginPath(); ctx.arc(5, -14, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f5cf5b"; ctx.fillRect(11, -10, 2, 2); ctx.restore();
    };

    const drawDog = (x: number, direction: number) => {
      ctx.save(); ctx.translate(x, 500); ctx.scale(direction, 1);
      ctx.fillStyle = "#59483f"; ctx.beginPath(); ctx.ellipse(0, 0, 29, 17, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(24, -10, 17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#302824"; ctx.beginPath(); ctx.moveTo(15, -21); ctx.lineTo(9, -35); ctx.lineTo(26, -24); ctx.fill();
      ctx.fillStyle = "#d6c1aa"; ctx.beginPath(); ctx.ellipse(34, -5, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#181719"; ctx.beginPath(); ctx.arc(42, -8, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#d8c9bb"; ctx.fillRect(-22, 8, 8, 13); ctx.fillRect(12, 8, 8, 13);
      ctx.strokeStyle = "#a94b42"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(10, -18); ctx.lineTo(37, -13); ctx.stroke(); ctx.restore();
    };

    const draw = (time: number, platforms: Platform[], mouseLow: number, mouseHigh: number) => {
      if (backgroundRef.current) ctx.drawImage(backgroundRef.current, 0, 0, WORLD.width, WORLD.height);
      else { ctx.fillStyle = "#091a3a"; ctx.fillRect(0, 0, WORLD.width, WORLD.height); }
      ctx.fillStyle = "#030a1825"; ctx.fillRect(0, 0, WORLD.width, WORLD.height);

      platforms.filter((p) => p.kind === "bin").forEach(drawBin);
      const fence = platforms.find((p) => p.kind === "fence")!;
      ctx.fillStyle = "#5d4050"; ctx.fillRect(fence.x, fence.y - 3, fence.w, 10);
      ctx.strokeStyle = "#c18d54"; ctx.lineWidth = 2; ctx.strokeRect(fence.x, fence.y - 3, fence.w, 10);
      drawLaundry(platforms.find((p) => p.id === "rope-low")!.y, time, 0);
      drawLaundry(platforms.find((p) => p.id === "rope-high")!.y, time, 1);
      const ledge = platforms.find((p) => p.kind === "ledge")!;
      ctx.fillStyle = "#6d3e55"; ctx.fillRect(ledge.x, ledge.y, ledge.w, 9);
      ctx.fillStyle = "#f0bd55"; ctx.fillRect(ledge.x, ledge.y, ledge.w, 3);

      drawMouse(mouseLow, platforms.find((p) => p.id === "rope-low")!.y, 1);
      drawMouse(mouseHigh, platforms.find((p) => p.id === "rope-high")!.y, -1);
      drawDog(dogRef.current.x, dogRef.current.direction);

      const windowGlow = ctx.createRadialGradient(795, 72, 5, 795, 72, 85);
      windowGlow.addColorStop(0, "#ffe27c99"); windowGlow.addColorStop(1, "#ffcf5000");
      ctx.fillStyle = windowGlow; ctx.fillRect(690, 0, 210, 155);
      ctx.fillStyle = "#351b52"; ctx.beginPath(); ctx.moveTo(758, 74); ctx.lineTo(781, 34); ctx.lineTo(807, 76); ctx.fill();
      ctx.fillStyle = "#f0c37c"; ctx.beginPath(); ctx.arc(790, 76, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#191021"; ctx.beginPath(); ctx.arc(786, 72, 14, Math.PI, Math.PI * 2); ctx.fill();

      if (warningRef.current) {
        ctx.fillStyle = "#d5a076"; ctx.beginPath(); ctx.arc(warningRef.current.x, warningRef.current.y - 8, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#332238"; ctx.beginPath(); ctx.arc(warningRef.current.x, warningRef.current.y - 15, 13, Math.PI, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#d5a076"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(warningRef.current.x + 8, warningRef.current.y - 2); ctx.lineTo(warningRef.current.x + 21, warningRef.current.y + 8); ctx.stroke();
        const pulse = 11 + Math.sin(time / 65) * 4;
        ctx.strokeStyle = "#ffda66"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(warningRef.current.x, warningRef.current.y, pulse, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#fff0a8"; ctx.font = "bold 16px Arial"; ctx.fillText("!", warningRef.current.x - 3, warningRef.current.y + 5);
      }
      hazardsRef.current.forEach((item) => {
        ctx.save(); ctx.translate(item.x, item.y); ctx.rotate(time / 220);
        ctx.fillStyle = item.kind === 0 ? "#6e84a5" : item.kind === 1 ? "#7e4f31" : "#87935a";
        if (item.kind === 0) { ctx.fillRect(-8, -5, 16, 10); ctx.strokeStyle = "#d5e0ec"; ctx.strokeRect(-8, -5, 16, 10); }
        else { ctx.beginPath(); ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      });

      const cat = playerRef.current;
      drawCat(cat.x, cat.y, cat.facing, performance.now() < cat.invincibleUntil && Math.floor(time / 90) % 2 === 0);

      ctx.fillStyle = "#f7ead7ed"; ctx.fillRect(17, 16, 184, 74);
      ctx.strokeStyle = "#bf8d3f"; ctx.lineWidth = 3; ctx.strokeRect(17, 16, 184, 74);
      ctx.fillStyle = "#5b347a"; ctx.fillRect(28, 9, 108, 23);
      ctx.fillStyle = "#ffe19a"; ctx.font = "bold 11px Georgia"; ctx.fillText("★  OBJECTIVE", 39, 25);
      ctx.fillStyle = "#31263a"; ctx.font = "bold 14px Georgia"; ctx.fillText("Reach the glowing", 35, 54); ctx.fillText("witch's window", 35, 73);

      ctx.fillStyle = "#091932df"; ctx.fillRect(725, 17, 255, 46);
      ctx.strokeStyle = "#d5a84f"; ctx.strokeRect(725, 17, 255, 46);
      ctx.fillStyle = "#f4c85f"; ctx.font = "bold 18px Arial"; ctx.fillText("★", 742, 47);
      ctx.fillStyle = "#fff0c2"; ctx.font = "bold 19px Georgia"; ctx.fillText(String(score).padStart(3, "0"), 770, 47);
      ctx.font = "18px Arial"; ctx.fillStyle = "#e66e91"; ctx.fillText("♥".repeat(hearts), 890, 46);
    };

    let last = performance.now();
    const tick = (time: number) => {
      const dt = Math.min((time - last) / 16.67, 2); last = time;
      const platforms = platformsAt(time);
      const mouseLow = 100 + ((time / 10) % 770);
      const mouseHigh = 880 - ((time / 12) % 770);

      if (phaseRef.current === "playing") {
        const cat = playerRef.current;
        const support = platforms.find((p) => p.id === cat.support);
        if (cat.grounded && support) cat.y = support.y - CAT.height;
        const previousBottom = cat.y + CAT.height;
        if (keysRef.current.left) { cat.vx = Math.max(cat.vx - .55 * dt, -5.1); cat.facing = -1; }
        else if (keysRef.current.right) { cat.vx = Math.min(cat.vx + .55 * dt, 5.1); cat.facing = 1; }
        else cat.vx *= Math.pow(.78, dt);
        cat.x += cat.vx * dt; cat.vy += .51 * dt; cat.y += cat.vy * dt;
        if (cat.x < -CAT.width) cat.x = WORLD.width; if (cat.x > WORLD.width) cat.x = -CAT.width;
        cat.grounded = false; cat.support = "";
        if (cat.vy >= 0) {
          for (const p of platforms) {
            const nextBottom = cat.y + CAT.height;
            if (previousBottom <= p.y + 5 && nextBottom >= p.y && cat.x + CAT.width - 6 > p.x && cat.x + 6 < p.x + p.w) {
              cat.y = p.y - CAT.height; cat.vy = 0; cat.grounded = true; cat.support = p.id;
              const reached = p.id === "fence" ? 1 : p.id === "rope-low" ? 2 : p.id === "rope-high" ? 3 : checkpointRef.current;
              if (reached > checkpointRef.current) { checkpointRef.current = reached; setScore((value) => value + 25); }
              break;
            }
          }
        }

        dogRef.current.x += dogRef.current.direction * 1.65 * dt;
        if (dogRef.current.x > 900) dogRef.current.direction = -1;
        if (dogRef.current.x < 500) dogRef.current.direction = 1;

        if (time > nextThrowRef.current) {
          const sources = [{ x: 340, y: 142 }, { x: 535, y: 235 }, { x: 655, y: 142 }];
          const source = sources[Math.floor(Math.random() * sources.length)];
          warningRef.current = { ...source, until: time + 720 };
          nextThrowRef.current = time + 2600 + Math.random() * 1500;
        }
        if (warningRef.current && time > warningRef.current.until) {
          const warning = warningRef.current;
          hazardsRef.current.push({ x: warning.x, y: warning.y, vx: (Math.random() - .5) * 2.2, vy: .8, kind: Math.floor(Math.random() * 3) });
          warningRef.current = null;
        }
        hazardsRef.current.forEach((item) => { item.x += item.vx * dt; item.vy += .12 * dt; item.y += item.vy * dt; });
        hazardsRef.current = hazardsRef.current.filter((item) => item.y < 555);

        const vulnerable = time > cat.invincibleUntil;
        if (vulnerable && cat.y > 466 && Math.abs((cat.x + 19) - dogRef.current.x) < 48) loseTurn();
        if (vulnerable && circleHitsCat(mouseLow, platforms.find((p) => p.id === "rope-low")!.y - 6, 15)) loseTurn();
        if (vulnerable && circleHitsCat(mouseHigh, platforms.find((p) => p.id === "rope-high")!.y - 6, 15)) loseTurn();
        if (vulnerable && hazardsRef.current.some((item) => circleHitsCat(item.x, item.y, 11))) loseTurn();
        if (cat.y > WORLD.height + 25) loseTurn();
        if (cat.x > 710 && cat.x < 865 && cat.y + CAT.height <= 118) { setScore((value) => value + 100); setPhase("won"); }
      }

      draw(time, platforms, mouseLow, mouseHigh);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [hearts, loseTurn, score, setPhase]);

  const answerQuestion = (answer: string) => {
    setSelected(answer);
    if (answer === QUESTIONS[questionIndex].correct) window.setTimeout(() => { resetCat(); setPhase("playing"); setSelected(null); }, 650);
  };

  const setDirection = (direction: "left" | "right", pressed: boolean) => { keysRef.current[direction] = pressed; };
  const restart = () => { checkpointRef.current = 0; setFalls(0); setHearts(3); setScore(0); resetCat(0); setPhase("playing"); };

  return (
    <div className="arcade-layer">
      <section className="arcade-shell" role="dialog" aria-modal="true" aria-label="Midnight Return game">
        <header className="arcade-header">
          <div><span>ENCHANTED LIBRARY · PRESENT SIMPLE A1</span><h2>Midnight Return</h2></div>
          <p>Climb from the courtyard to the witch&apos;s open window.</p>
          <div className="arcade-actions"><button disabled={!['playing', 'paused'].includes(phase)} onClick={() => setPhase(phaseRef.current === "paused" ? "playing" : "paused")} aria-label="Pause game">{phase === "paused" ? "▶" : "Ⅱ"}</button><button onClick={onClose} aria-label="Close game">×</button></div>
        </header>
        <div className="game-stage">
          <canvas ref={canvasRef} width={WORLD.width} height={WORLD.height} aria-label="Guide the black cat across bins, fence, clotheslines and into the witch's window" />
          {phase === "paused" && <div className="pause-screen"><span>PAUSED</span><button onClick={() => setPhase("playing")}>Continue</button></div>}
          {phase === "quiz" && (
            <div className="fall-quiz">
              <span>THE CAT FELL · QUESTION {falls} · PRESENT SIMPLE</span>
              <h3>{QUESTIONS[questionIndex].prompt}</h3>
              <p>Choose the correct answer to return to your last checkpoint.</p>
              <div>{QUESTIONS[questionIndex].options.map((option) => {
                const state = selected === option ? (option === QUESTIONS[questionIndex].correct ? "correct" : "wrong") : "";
                return <button className={state} key={option} onClick={() => answerQuestion(option)}>{option}<i>{state === "correct" ? "✓" : state === "wrong" ? "×" : "→"}</i></button>;
              })}</div>
              {selected && selected !== QUESTIONS[questionIndex].correct && <small>Not quite. Look at the subject and try again.</small>}
            </div>
          )}
          {phase === "won" && <div className="win-screen"><span>★</span><h3>Home at last!</h3><p>The black cat is back with the witch. Score: {score}</p><button onClick={restart}>Play again</button></div>}
        </div>
        <footer className="game-controls">
          <div className="keys-guide"><span><kbd>←</kbd><kbd>→</kbd> move</span><span><kbd>SPACE</kbd> jump</span><span><kbd>P</kbd> pause</span></div>
          <div className="touch-controls"><button onPointerDown={() => setDirection("left", true)} onPointerUp={() => setDirection("left", false)} onPointerLeave={() => setDirection("left", false)}>←</button><button onPointerDown={() => setDirection("right", true)} onPointerUp={() => setDirection("right", false)} onPointerLeave={() => setDirection("right", false)}>→</button><button onPointerDown={jump}>↑</button></div>
          <p>Bins → fence → lower line → upper line → window</p>
        </footer>
      </section>
    </div>
  );
}
