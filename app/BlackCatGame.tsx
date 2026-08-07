"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import GameInstructions from "./GameInstructions";
import { GameAudioControls, useGameAudio } from "./GameAudio";
import { assetPath } from "./assetPath";

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

function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

const WORLD = { width: 1000, height: 560 };
const CAT = { width: 38, height: 32 };
const GROUND_Y = 519;
const STACK_STEP = 42;
const PROP_HEIGHT = 56;

type Phase = "playing" | "quiz" | "won" | "paused";
type Platform = { id: string; x: number; y: number; w: number; kind: "ground" | "stack" | "fence" | "rope" | "ledge" };
type Projectile = { x: number; y: number; vx: number; vy: number; kind: number };
type MouseHazard = { x: number; y: number; direction: number };
type SceneWindow = { x: number; y: number; w: number; h: number; row: number; column: number };

const LEVELS = [
  { label: "1–1", stacks: [{ x: 120, height: 1 }, { x: 240, height: 2 }, { x: 360, height: 3 }], fenceY: 338, ropes: [290, 220], floors: 2, windowX: 716, windowY: 150, windowW: 108, windowH: 88, windowTop: 62, targetColumn: 3, ropeSway: 3, dogSpeed: 1.3, dogCount: 1, mouseDivisor: 14, mouseCount: 2, throwMin: 3500, throwRange: 1700, projectileGravity: .1 },
  { label: "1–2", stacks: [{ x: 720, height: 1 }, { x: 590, height: 2 }, { x: 455, height: 3 }], fenceY: 338, ropes: [300, 240, 180], floors: 3, windowX: 244, windowY: 120, windowW: 92, windowH: 76, windowTop: 44, targetColumn: 0, ropeSway: 4, dogSpeed: 1.5, dogCount: 1, mouseDivisor: 12, mouseCount: 3, throwMin: 3100, throwRange: 1500, projectileGravity: .11 },
  { label: "1–3", stacks: [{ x: 105, height: 1 }, { x: 270, height: 2 }, { x: 430, height: 3 }], fenceY: 338, ropes: [305, 255, 205, 155], floors: 4, windowX: 569, windowY: 105, windowW: 82, windowH: 68, windowTop: 37, targetColumn: 2, ropeSway: 6, dogSpeed: 1.7, dogCount: 1, mouseDivisor: 10, mouseCount: 4, throwMin: 2600, throwRange: 1250, projectileGravity: .13 },
  { label: "1–4", stacks: [{ x: 735, height: 1 }, { x: 610, height: 2 }, { x: 470, height: 3 }, { x: 320, height: 4 }], fenceY: 338, ropes: [305, 263, 221, 179, 137], floors: 5, windowX: 414, windowY: 90, windowW: 72, windowH: 60, windowTop: 30, targetColumn: 1, ropeSway: 8, dogSpeed: 1.95, dogCount: 2, mouseDivisor: 9, mouseCount: 5, throwMin: 2200, throwRange: 1000, projectileGravity: .15 },
  { label: "1–5", stacks: [{ x: 100, height: 1 }, { x: 255, height: 2 }, { x: 430, height: 3 }, { x: 610, height: 4 }], fenceY: 338, ropes: [305, 268, 231, 194, 157, 120], floors: 6, windowX: 741, windowY: 75, windowW: 58, windowH: 48, windowTop: 27, targetColumn: 3, ropeSway: 10, dogSpeed: 2.25, dogCount: 2, mouseDivisor: 8, mouseCount: 6, throwMin: 1750, throwRange: 800, projectileGravity: .17 },
];

export default function BlackCatGame({ onClose }: { onClose: () => void }) {
  const gameAudio = useGameAudio(assetPath("/assets/midnight-return-theme.mp3"));
  const playEffect = gameAudio.playEffect;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundRef = useRef<HTMLImageElement | null>(null);
  const spritesRef = useRef<Record<string, HTMLCanvasElement>>({});
  const frameRef = useRef<number | null>(null);
  const keysRef = useRef({ left: false, right: false });
  const phaseRef = useRef<Phase>("playing");
  const levelRef = useRef(1);
  const checkpointRef = useRef(0);
  const hazardsRef = useRef<Projectile[]>([]);
  const nextThrowRef = useRef(2400);
  const warningRef = useRef<(SceneWindow & { until: number; resident: number }) | null>(null);
  const startTimeRef = useRef(0);
  const dogsRef = useRef([{ x: 710, direction: 1 }]);
  const playerRef = useRef({ x: 48, y: 487, vx: 0, vy: 0, grounded: true, support: "ground", facing: 1, invincibleUntil: 0 });
  const safePositionRef = useRef({ x: 48, y: 487, support: "ground", facing: 1 });
  const questionBag = useRef<number[]>([]);
  const [phase, setPhaseState] = useState<Phase>("playing");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionOptions, setQuestionOptions] = useState<string[]>(() => [...QUESTIONS[0].options]);
  const [selected, setSelected] = useState<string | null>(null);
  const [falls, setFalls] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const resumeAfterInstructionsRef = useRef(false);

  const setPhase = useCallback((value: Phase) => {
    phaseRef.current = value;
    setPhaseState(value);
  }, []);

  const openInstructions = () => {
    resumeAfterInstructionsRef.current = phaseRef.current === "playing";
    if (resumeAfterInstructionsRef.current) setPhase("paused");
    setShowInstructions(true);
  };

  const closeInstructions = () => {
    setShowInstructions(false);
    if (resumeAfterInstructionsRef.current) setPhase("playing");
    resumeAfterInstructionsRef.current = false;
  };

  const nextQuestion = useCallback(() => {
    if (questionBag.current.length === 0) questionBag.current = shuffle(QUESTIONS.map((_, index) => index));
    const nextIndex = questionBag.current.pop() ?? 0;
    setQuestionIndex(nextIndex);
    setQuestionOptions(shuffle(QUESTIONS[nextIndex].options));
    setSelected(null);
  }, []);

  const resetCat = useCallback((checkpoint = checkpointRef.current) => {
    const layout = LEVELS[levelRef.current - 1];
    const startsRight = layout.stacks[0].x > 500;
    const ropeIndex = checkpoint === 2 ? 0 : layout.ropes.length - 1;
    const start = checkpoint === 0
      ? { x: startsRight ? 910 : 48, y: 487, support: "ground" }
      : checkpoint === 1
        ? { x: startsRight ? 880 : 70, y: layout.fenceY - CAT.height, support: "fence" }
        : checkpoint === 2
          ? { x: startsRight ? 850 : 100, y: layout.ropes[0] - CAT.height, support: "rope-0" }
          : { x: layout.windowX > 500 ? 120 : 820, y: layout.ropes[ropeIndex] - CAT.height, support: `rope-${ropeIndex}` };
    playerRef.current = { x: start.x, y: start.y, vx: 0, vy: 0, grounded: true, support: start.support, facing: startsRight ? -1 : 1, invincibleUntil: performance.now() + 1100 };
    safePositionRef.current = { x: start.x, y: start.y, support: start.support, facing: startsRight ? -1 : 1 };
    hazardsRef.current = [];
    warningRef.current = null;
  }, []);

  const restoreSafeCat = useCallback(() => {
    const safe = safePositionRef.current;
    playerRef.current = { ...safe, vx: 0, vy: 0, grounded: true, invincibleUntil: performance.now() + 1100 };
    hazardsRef.current = [];
    warningRef.current = null;
  }, []);

  const loseTurn = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    playEffect("fall");
    nextQuestion();
    setFalls((value) => value + 1);
    setHearts((value) => {
      if (value <= 1) return 3;
      return value - 1;
    });
    setPhase("quiz");
  }, [nextQuestion, playEffect, setPhase]);

  const jump = useCallback(() => {
    const cat = playerRef.current;
    if (phaseRef.current === "playing" && cat.grounded) {
      playEffect("jump");
      cat.vy = -8.8;
      cat.grounded = false;
      cat.support = "";
    }
  }, [playEffect]);

  useEffect(() => {
    const image = new Image();
    image.src = assetPath("/assets/library-facade-clean-v3.png");
    image.onload = () => { backgroundRef.current = image; };

    const keyImage = (sprite: HTMLImageElement) => {
      const layer = document.createElement("canvas");
      layer.width = sprite.naturalWidth;
      layer.height = sprite.naturalHeight;
      const layerContext = layer.getContext("2d", { willReadFrequently: true });
      if (!layerContext) return layer;
      layerContext.drawImage(sprite, 0, 0);
      const pixels = layerContext.getImageData(0, 0, layer.width, layer.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const red = pixels.data[i];
        const green = pixels.data[i + 1];
        const blue = pixels.data[i + 2];
        if (green > 145 && green > red * 1.38 && green > blue * 1.25) {
          const dominance = green - Math.max(red, blue);
          pixels.data[i + 3] = dominance > 105 ? 0 : Math.max(0, 255 - dominance * 2.35);
        }
      }
      layerContext.putImageData(pixels, 0, 0);
      return layer;
    };

    const trimSprite = (source: HTMLCanvasElement, startX = 0, endX = source.width) => {
      const context = source.getContext("2d", { willReadFrequently: true });
      if (!context) return source;
      const left = Math.max(0, Math.floor(startX));
      const right = Math.min(source.width, Math.ceil(endX));
      const pixels = context.getImageData(left, 0, right - left, source.height);
      let minX = pixels.width; let minY = pixels.height; let maxX = -1; let maxY = -1;
      for (let y = 0; y < pixels.height; y += 1) {
        for (let x = 0; x < pixels.width; x += 1) {
          if (pixels.data[(y * pixels.width + x) * 4 + 3] > 20) {
            minX = Math.min(minX, x); minY = Math.min(minY, y);
            maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
          }
        }
      }
      if (maxX < minX || maxY < minY) return source;
      const padding = 5;
      minX = Math.max(0, minX - padding); minY = Math.max(0, minY - padding);
      maxX = Math.min(pixels.width - 1, maxX + padding); maxY = Math.min(pixels.height - 1, maxY + padding);
      const trimmed = document.createElement("canvas");
      trimmed.width = maxX - minX + 1; trimmed.height = maxY - minY + 1;
      trimmed.getContext("2d")?.drawImage(source, left + minX, minY, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
      return trimmed;
    };

    const loadSprite = (key: string, src: string, trim = false) => {
      const sprite = new Image();
      sprite.src = src;
      sprite.onload = () => {
        const layer = keyImage(sprite);
        spritesRef.current[key] = trim ? trimSprite(layer) : layer;
      };
    };

    const loadSheet = (key: string, src: string, cuts: number[]) => {
      const sprite = new Image();
      sprite.src = src;
      sprite.onload = () => {
        const layer = keyImage(sprite);
        for (let frame = 0; frame < cuts.length - 1; frame += 1) {
          spritesRef.current[`${key}-${frame}`] = trimSprite(layer, layer.width * cuts[frame], layer.width * cuts[frame + 1]);
        }
      };
    };

    loadSprite("cat-idle", assetPath("/assets/cat-idle-source-v3.png"), true);
    loadSheet("cat", assetPath("/assets/cat-run-sheet-v2.png"), [0, .31, .62, 1]);
    loadSheet("dog", assetPath("/assets/bulldog-run-sheet-v2.png"), [0, .32, .635, 1]);
    loadSheet("mouse", assetPath("/assets/mouse-run-sheet-v2.png"), [0, .333, .64, 1]);
    loadSprite("crate", assetPath("/assets/library-crate-source-v1.png"), true);
    loadSprite("barrel", assetPath("/assets/library-barrel-source-v1.png"), true);
    loadSprite("window-open", assetPath("/assets/library-window-open-source-v1.png"), true);
    loadSprite("window-closed", assetPath("/assets/library-window-closed-source-v2.png"), true);
    loadSprite("fence-rail", assetPath("/assets/library-fence-rail-source-v1.png"), true);
    loadSheet("laundry", assetPath("/assets/library-laundry-line-source-v1.png"), [0, .235, .36, .5, .65, .79, 1]);
    loadSprite("witch", assetPath("/assets/witch-source-v2.png"), true);
    loadSprite("residents", assetPath("/assets/residents-source-v2.png"));
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
    const difficulty = LEVELS[level - 1];
    if (dogsRef.current.length !== difficulty.dogCount) {
      dogsRef.current = difficulty.dogCount === 2
        ? [{ x: 245, direction: 1 }, { x: 755, direction: -1 }]
        : [{ x: 710, direction: 1 }];
    }
    nextThrowRef.current = performance.now() + 1700;

    const platformsAt = (time: number): Platform[] => {
      const stacks: Platform[] = difficulty.stacks.map((stack, index) => ({ id: `stack-${index}`, x: stack.x, y: GROUND_Y - PROP_HEIGHT - (stack.height - 1) * STACK_STEP, w: 64, kind: "stack" }));
      const ropes: Platform[] = difficulty.ropes.map((baseY, index) => ({
        id: `rope-${index}`,
        x: 80,
        y: baseY + Math.sin(time / (720 + index * 55) + index * .75) * difficulty.ropeSway,
        w: 820,
        kind: "rope",
      }));
      return [
        { id: "ground", x: 0, y: GROUND_Y, w: 1000, kind: "ground" },
        ...stacks,
        { id: "fence", x: 28, y: difficulty.fenceY, w: 915, kind: "fence" },
        ...ropes,
        { id: "ledge", x: difficulty.windowX, y: difficulty.windowY, w: difficulty.windowW, kind: "ledge" },
      ];
    };

    const windowsForLevel = (): SceneWindow[] => {
      const centers = [290, 450, 610, 770];
      const lastTop = difficulty.fenceY - difficulty.windowH - 18;
      return Array.from({ length: difficulty.floors }, (_, row) => {
        const y = difficulty.floors === 1
          ? difficulty.windowTop
          : difficulty.windowTop + (lastTop - difficulty.windowTop) * row / (difficulty.floors - 1);
        return centers.map((center, column) => ({
          x: center - difficulty.windowW / 2,
          y,
          w: difficulty.windowW,
          h: difficulty.windowH,
          row,
          column,
        }));
      }).flat();
    };

    const circleHitsCat = (x: number, y: number, radius: number) => {
      const cat = playerRef.current;
      const closestX = Math.max(cat.x, Math.min(x, cat.x + CAT.width));
      const closestY = Math.max(cat.y, Math.min(y, cat.y + CAT.height));
      return (x - closestX) ** 2 + (y - closestY) ** 2 < radius ** 2;
    };

    const drawCat = (x: number, y: number, facing: number, blinking: boolean, frame: number) => {
      const sprite = spritesRef.current[frame < 0 ? "cat-idle" : `cat-${frame}`];
      if (sprite) {
        const drawHeight = frame < 0 ? 67 : 62;
        const drawWidth = drawHeight * sprite.width / sprite.height;
        ctx.save();
        if (blinking) ctx.globalAlpha = .35;
        ctx.translate(x + CAT.width / 2, 0); ctx.scale(facing, 1);
        ctx.drawImage(sprite, -drawWidth / 2, y + CAT.height - drawHeight, drawWidth, drawHeight);
        ctx.restore();
        return;
      }
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

    const drawStack = (p: Platform, stackIndex: number) => {
      const count = difficulty.stacks[stackIndex].height;
      for (let layer = 0; layer < count; layer += 1) {
        const isCrate = (stackIndex + layer) % 3 !== 1;
        const sprite = spritesRef.current[isCrate ? "crate" : "barrel"];
        const height = PROP_HEIGHT;
        const width = sprite ? height * sprite.width / sprite.height : isCrate ? 60 : 46;
        const bottom = GROUND_Y - layer * STACK_STEP;
        if (sprite) ctx.drawImage(sprite, p.x + (p.w - width) / 2, bottom - height, width, height);
        else {
          ctx.fillStyle = isCrate ? "#6d4329" : "#553523";
          ctx.fillRect(p.x + (p.w - width) / 2, bottom - height, width, height);
          ctx.strokeStyle = "#c28a48"; ctx.lineWidth = 3;
          ctx.strokeRect(p.x + (p.w - width) / 2, bottom - height, width, height);
        }
      }
    };

    const drawLaundry = (y: number, time: number, row: number) => {
      const sag = 7 + Math.sin(time / 1100 + row) * 2;
      ctx.strokeStyle = "#35243a"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(78, y); ctx.quadraticCurveTo(490, y + sag, 902, y); ctx.stroke();
      ctx.strokeStyle = "#c49b66"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(78, y - 1); ctx.quadraticCurveTo(490, y + sag - 1, 902, y - 1); ctx.stroke();
      const lowerLine = row === 0 ? difficulty.fenceY : difficulty.ropes[row - 1];
      const available = Math.max(28, lowerLine - difficulty.ropes[row] - 8);
      const garmentHeight = Math.min(55, available * .82);
      for (let i = 0; i < 4; i += 1) {
        const sprite = spritesRef.current[`laundry-${(row * 2 + i) % 6}`];
        if (!sprite) continue;
        const height = garmentHeight * (i % 2 === 0 ? 1 : .86);
        const width = height * sprite.width / sprite.height;
        const center = 170 + i * 210 + Math.sin(time / 850 + i + row) * 7;
        const top = y - height * .12 + Math.sin(time / 720 + i * .9) * 1.5;
        ctx.drawImage(sprite, center - width / 2, top, width, height);
      }
    };

    const drawMouse = (x: number, y: number, direction: number, time: number) => {
      const frame = Math.floor(time / 95 + x / 48) % 3;
      const sprite = spritesRef.current[`mouse-${frame}`];
      if (sprite) {
        const drawHeight = 39;
        const drawWidth = drawHeight * sprite.width / sprite.height;
        ctx.save(); ctx.translate(x, 0); ctx.scale(direction, 1);
        ctx.drawImage(sprite, -drawWidth / 2, y - drawHeight, drawWidth, drawHeight); ctx.restore();
        return;
      }
      ctx.save(); ctx.translate(x, y); ctx.scale(direction, 1);
      ctx.strokeStyle = "#a9959b"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, -2); ctx.quadraticCurveTo(-18, -12, -24, -5); ctx.stroke();
      ctx.fillStyle = "#91828a"; ctx.beginPath(); ctx.ellipse(0, -5, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(8, -8, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e4b1b8"; ctx.beginPath(); ctx.arc(5, -14, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f5cf5b"; ctx.fillRect(11, -10, 2, 2); ctx.restore();
    };

    const drawDog = (x: number, direction: number, time: number) => {
      const frame = Math.floor(time / 115) % 3;
      const sprite = spritesRef.current[`dog-${frame}`];
      if (sprite) {
        const drawHeight = 73;
        const drawWidth = drawHeight * sprite.width / sprite.height;
        ctx.save(); ctx.translate(x, 0); ctx.scale(direction, 1);
        ctx.drawImage(sprite, -drawWidth / 2, GROUND_Y - drawHeight, drawWidth, drawHeight); ctx.restore();
        return;
      }
      ctx.save(); ctx.translate(x, 500); ctx.scale(direction, 1);
      ctx.fillStyle = "#59483f"; ctx.beginPath(); ctx.ellipse(0, 0, 29, 17, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(24, -10, 17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#302824"; ctx.beginPath(); ctx.moveTo(15, -21); ctx.lineTo(9, -35); ctx.lineTo(26, -24); ctx.fill();
      ctx.fillStyle = "#d6c1aa"; ctx.beginPath(); ctx.ellipse(34, -5, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#181719"; ctx.beginPath(); ctx.arc(42, -8, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#d8c9bb"; ctx.fillRect(-22, 8, 8, 13); ctx.fillRect(12, 8, 8, 13);
      ctx.strokeStyle = "#a94b42"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(10, -18); ctx.lineTo(37, -13); ctx.stroke(); ctx.restore();
    };

    const innerWindow = (slot: SceneWindow) => ({ x: slot.x + slot.w * .29, y: slot.y + slot.h * .17, w: slot.w * .42, h: slot.h * .68 });

    const drawClosedWindow = (slot: SceneWindow) => {
      const sprite = spritesRef.current["window-closed"];
      if (sprite) {
        const width = slot.h * sprite.width / sprite.height;
        ctx.drawImage(sprite, slot.x + slot.w / 2 - width / 2, slot.y, width, slot.h);
        return;
      }
      const radius = Math.max(4, slot.w * .15);
      ctx.fillStyle = "#766080"; ctx.beginPath(); ctx.roundRect(slot.x + slot.w * .25, slot.y + slot.h * .05, slot.w * .5, slot.h * .91, radius); ctx.fill();
      ctx.fillStyle = "#17142d"; ctx.beginPath(); ctx.roundRect(slot.x + slot.w * .29, slot.y + slot.h * .11, slot.w * .42, slot.h * .76, radius * .7); ctx.fill();
      const inner = innerWindow(slot);
      const gap = Math.max(1, slot.w * .018);
      ctx.fillStyle = "#30224d"; ctx.fillRect(inner.x, inner.y, inner.w / 2 - gap, inner.h);
      ctx.fillStyle = "#3d2858"; ctx.fillRect(inner.x + inner.w / 2 + gap, inner.y, inner.w / 2 - gap, inner.h);
      ctx.strokeStyle = "#9b795d"; ctx.lineWidth = Math.max(1, slot.w * .018); ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
      ctx.strokeStyle = "#b38a56"; ctx.beginPath(); ctx.moveTo(slot.x + slot.w * .22, slot.y + slot.h * .9); ctx.lineTo(slot.x + slot.w * .78, slot.y + slot.h * .9); ctx.stroke();
    };

    const drawOpenWindow = (slot: SceneWindow) => {
      const frame = spritesRef.current["window-open"];
      if (frame) ctx.drawImage(frame, slot.x, slot.y, slot.w, slot.h);
      else {
        ctx.fillStyle = "#090d20"; ctx.fillRect(slot.x + slot.w * .25, slot.y + slot.h * .12, slot.w * .5, slot.h * .78);
        ctx.strokeStyle = "#725378"; ctx.lineWidth = 3; ctx.strokeRect(slot.x + slot.w * .22, slot.y + slot.h * .08, slot.w * .56, slot.h * .84);
      }
    };

    const drawWitch = (time: number, slot: SceneWindow) => {
      const sprite = spritesRef.current.witch;
      const centerX = slot.x + slot.w / 2;
      const centerY = slot.y + slot.h / 2;
      const glow = ctx.createRadialGradient(centerX, centerY, 3, centerX, centerY, slot.w * .9);
      glow.addColorStop(0, "#ffe27ca8"); glow.addColorStop(1, "#ffcf5000");
      ctx.fillStyle = glow; ctx.fillRect(slot.x - slot.w * .45, slot.y - slot.h * .45, slot.w * 1.9, slot.h * 1.9);
      drawOpenWindow(slot);
      if (!sprite) return;
      const inner = innerWindow(slot);
      const bob = Math.sin(time / 420) * Math.max(1, slot.h * .018);
      const height = inner.h * 1.05;
      const width = height * sprite.width / sprite.height;
      ctx.save(); ctx.beginPath(); ctx.rect(inner.x, inner.y, inner.w, inner.h); ctx.clip();
      ctx.drawImage(sprite, inner.x + inner.w / 2 - width / 2, inner.y + inner.h - height + bob, width, height);
      ctx.restore();
    };

    const drawResident = (slot: SceneWindow, resident: number, time: number) => {
      const sprite = spritesRef.current.residents;
      drawOpenWindow(slot);
      if (!sprite) return;
      const cellWidth = sprite.width / 3;
      const inner = innerWindow(slot);
      const rise = Math.sin(time / 180) * Math.max(.5, slot.h * .018);
      ctx.save(); ctx.beginPath(); ctx.rect(inner.x, inner.y, inner.w, inner.h); ctx.clip();
      ctx.drawImage(sprite, resident * cellWidth, 0, cellWidth, sprite.height, inner.x - inner.w * .1, inner.y - inner.h * .03 + rise, inner.w * 1.2, inner.h * 1.22);
      ctx.restore();
    };

    const draw = (time: number, platforms: Platform[], mice: MouseHazard[]) => {
      if (backgroundRef.current) ctx.drawImage(backgroundRef.current, 0, 0, WORLD.width, WORLD.height);
      else { ctx.fillStyle = "#091a3a"; ctx.fillRect(0, 0, WORLD.width, WORLD.height); }
      ctx.fillStyle = "#030a1825"; ctx.fillRect(0, 0, WORLD.width, WORLD.height);

      const fence = platforms.find((p) => p.kind === "fence")!;
      const ledge = platforms.find((p) => p.kind === "ledge")!;
      const windows = windowsForLevel();
      const targetWindow = windows.find((slot) => slot.row === 0 && slot.column === difficulty.targetColumn)!;
      const rowTops = windows.filter((slot) => slot.column === 0).map((slot) => slot.y);
      for (let row = 0; row < rowTops.length - 1; row += 1) {
        const bandY = (rowTops[row] + difficulty.windowH + rowTops[row + 1]) / 2;
        const band = ctx.createLinearGradient(185, bandY, 895, bandY);
        band.addColorStop(0, "#51415a00"); band.addColorStop(.15, "#66506caa"); band.addColorStop(.85, "#66506caa"); band.addColorStop(1, "#51415a00");
        ctx.fillStyle = band; ctx.fillRect(185, bandY, 710, Math.max(2, 5 - level * .45));
      }
      windows.forEach((slot) => {
        const isTarget = slot.row === 0 && slot.column === difficulty.targetColumn;
        const isActive = warningRef.current && slot.row === warningRef.current.row && slot.column === warningRef.current.column;
        if (!isTarget && !isActive) drawClosedWindow(slot);
      });
      drawWitch(time, targetWindow);
      if (warningRef.current) drawResident(warningRef.current, warningRef.current.resident, time);

      ctx.fillStyle = "#241b36";
      for (let x = fence.x + 5, index = 0; x < fence.x + fence.w - 24; x += 31, index += 1) {
        ctx.fillStyle = index % 3 === 0 ? "#302343" : index % 3 === 1 ? "#292039" : "#352541";
        ctx.beginPath(); ctx.moveTo(x, fence.y + 13); ctx.lineTo(x + 13, fence.y + 3); ctx.lineTo(x + 26, fence.y + 13); ctx.lineTo(x + 26, GROUND_Y); ctx.lineTo(x, GROUND_Y); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#5d4663"; ctx.lineWidth = 1; ctx.stroke();
      }
      const fenceSprite = spritesRef.current["fence-rail"];
      if (fenceSprite) {
        const railHeight = fence.w * fenceSprite.height / fenceSprite.width;
        ctx.drawImage(fenceSprite, fence.x, fence.y - 2, fence.w, railHeight);
      } else {
        ctx.fillStyle = "#4a3155"; ctx.fillRect(fence.x, fence.y, fence.w, 18);
        ctx.strokeStyle = "#b18458"; ctx.lineWidth = 2; ctx.strokeRect(fence.x, fence.y, fence.w, 18);
      }

      platforms.filter((p) => p.kind === "stack").forEach(drawStack);
      platforms.filter((p) => p.kind === "rope").forEach((rope, index) => drawLaundry(rope.y, time, index));
      ctx.fillStyle = "#c09b73"; ctx.fillRect(ledge.x + ledge.w * .27, ledge.y - 2, ledge.w * .46, 3);

      mice.forEach((mouse) => drawMouse(mouse.x, mouse.y, mouse.direction, time));
      dogsRef.current.forEach((dog, index) => drawDog(dog.x, dog.direction, time + index * 145));

      if (warningRef.current) {
        const centerX = warningRef.current.x + warningRef.current.w / 2;
        const centerY = warningRef.current.y + warningRef.current.h / 2;
        const pulse = warningRef.current.w * .24 + Math.sin(time / 65) * 3;
        ctx.strokeStyle = "#ffda66"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(centerX, centerY, pulse, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#fff0a8"; ctx.font = `bold ${Math.max(11, warningRef.current.w * .15)}px Arial`; ctx.fillText("!", centerX - 3, centerY + 5);
      }
      hazardsRef.current.forEach((item) => {
        ctx.save(); ctx.translate(item.x, item.y); ctx.rotate(time / 220);
        ctx.fillStyle = item.kind === 0 ? "#6e84a5" : item.kind === 1 ? "#7e4f31" : "#87935a";
        if (item.kind === 0) { ctx.fillRect(-8, -5, 16, 10); ctx.strokeStyle = "#d5e0ec"; ctx.strokeRect(-8, -5, 16, 10); }
        else { ctx.beginPath(); ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      });

      const cat = playerRef.current;
      const catFrame = !cat.grounded ? 2 : Math.abs(cat.vx) > .5 ? Math.floor(time / 105) % 3 : -1;
      drawCat(cat.x, cat.y, cat.facing, performance.now() < cat.invincibleUntil && Math.floor(time / 90) % 2 === 0, catFrame);

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
      ctx.fillStyle = "#ffe5a1"; ctx.font = "bold 12px Georgia"; ctx.fillText(`LEVEL ${LEVELS[level - 1].label}`, 525, 36);
    };

    let last = performance.now();
    const tick = (time: number) => {
      const dt = Math.min((time - last) / 16.67, 2); last = time;
      const platforms = platformsAt(time);
      const ropePlatforms = platforms.filter((p) => p.kind === "rope");
      const mice: MouseHazard[] = Array.from({ length: difficulty.mouseCount }, (_, index) => {
        const ropeIndex = difficulty.mouseCount === 1 ? 0 : Math.round(index * (ropePlatforms.length - 1) / (difficulty.mouseCount - 1));
        const rope = ropePlatforms[ropeIndex];
        const direction = index % 2 === 0 ? 1 : -1;
        const travel = (time / (difficulty.mouseDivisor + index)) % 770;
        return { x: direction === 1 ? 100 + travel : 880 - travel, y: rope.y, direction };
      });

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
              safePositionRef.current = { x: cat.x, y: cat.y, support: p.id, facing: cat.facing };
              const ropeIndex = p.kind === "rope" ? Number(p.id.split("-")[1]) : -1;
              const reached = p.id === "fence" ? 1 : ropeIndex === 0 ? 2 : ropeIndex === difficulty.ropes.length - 1 ? 3 : checkpointRef.current;
              if (reached > checkpointRef.current) { checkpointRef.current = reached; setScore((value) => value + 25); }
              break;
            }
          }
        }

        dogsRef.current.forEach((dog) => {
          dog.x += dog.direction * difficulty.dogSpeed * dt;
          if (dog.x > 928) { dog.x = 928; dog.direction = -1; }
          if (dog.x < 72) { dog.x = 72; dog.direction = 1; }
        });

        if (time > nextThrowRef.current) {
          const neighborWindows = windowsForLevel().filter((slot) => !(slot.row === 0 && slot.column === difficulty.targetColumn));
          const source = neighborWindows[Math.floor(Math.random() * neighborWindows.length)];
          warningRef.current = { ...source, resident: Math.floor(Math.random() * 3), until: time + 720 };
          nextThrowRef.current = time + difficulty.throwMin + Math.random() * difficulty.throwRange;
        }
        if (warningRef.current && time > warningRef.current.until) {
          const warning = warningRef.current;
          hazardsRef.current.push({ x: warning.x + warning.w / 2, y: warning.y + warning.h * .72, vx: (Math.random() - .5) * 2.2, vy: .8, kind: Math.floor(Math.random() * 3) });
          warningRef.current = null;
        }
        hazardsRef.current.forEach((item) => { item.x += item.vx * dt; item.vy += difficulty.projectileGravity * dt; item.y += item.vy * dt; });
        hazardsRef.current = hazardsRef.current.filter((item) => item.y < 555);

        const vulnerable = time > cat.invincibleUntil;
        const dogCanReach = cat.y + CAT.height > GROUND_Y - 73;
        if (vulnerable && dogCanReach && dogsRef.current.some((dog) => Math.abs((cat.x + CAT.width / 2) - dog.x) < 55)) loseTurn();
        if (vulnerable && mice.some((mouse) => circleHitsCat(mouse.x, mouse.y - 6, 16))) loseTurn();
        if (vulnerable && hazardsRef.current.some((item) => circleHitsCat(item.x, item.y, 11))) loseTurn();
        if (cat.y > WORLD.height + 25) loseTurn();
        if (cat.x + CAT.width > difficulty.windowX && cat.x < difficulty.windowX + difficulty.windowW && cat.y + CAT.height <= difficulty.windowY + 6) { playEffect("win"); setScore((value) => value + 100 + level * 25); setPhase("won"); }
      }

      draw(time, platforms, mice);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [hearts, level, loseTurn, playEffect, score, setPhase]);

  const answerQuestion = (answer: string) => {
    if (selected) return;
    setSelected(answer);
    const isCorrect = answer === QUESTIONS[questionIndex].correct;
    playEffect(isCorrect ? "correct" : "wrong");
    window.setTimeout(() => {
      if (isCorrect) restoreSafeCat();
      else {
        checkpointRef.current = 0;
        resetCat(0);
      }
      setPhase("playing");
      setSelected(null);
    }, 650);
  };

  const setDirection = (direction: "left" | "right", pressed: boolean) => { keysRef.current[direction] = pressed; };
  const restart = () => { checkpointRef.current = 0; levelRef.current = 1; setLevel(1); setFalls(0); setHearts(3); setScore(0); setShowLevelSelect(false); resetCat(0); setPhase("playing"); };
  const startLevel = (selectedLevel: number) => {
    checkpointRef.current = 0;
    levelRef.current = selectedLevel;
    setLevel(selectedLevel);
    setFalls(0);
    setHearts(3);
    setScore(0);
    setShowLevelSelect(false);
    resetCat(0);
    setPhase("playing");
  };
  const continueJourney = () => {
    if (level >= LEVELS.length) { restart(); return; }
    checkpointRef.current = 0;
    const nextLevel = level + 1;
    levelRef.current = nextLevel;
    setLevel(nextLevel);
    setHearts(3);
    setShowLevelSelect(false);
    resetCat(0);
    setPhase("playing");
  };

  return (
    <div className="arcade-layer" style={{ "--midnight-finale": `url("${assetPath("/assets/midnight-return-finale-v1.png")}")` } as CSSProperties}>
      <section className="arcade-shell" role="dialog" aria-modal="true" aria-label="Midnight Return game">
        <header className="arcade-header">
          <div><span>ENCHANTED LIBRARY · PRESENT SIMPLE A1</span><h2>Midnight Return</h2></div>
          <p>{phase === "won" && level === LEVELS.length ? "The black cat made it home." : "Climb from the courtyard to the witch's open window."}</p>
          <div className="arcade-actions"><GameAudioControls audio={gameAudio} label="Музыка Midnight Return" /><button className="instructions-trigger" onClick={openInstructions} aria-label="Инструкции">?</button><button disabled={!['playing', 'paused'].includes(phase)} onClick={() => setPhase(phaseRef.current === "paused" ? "playing" : "paused")} aria-label="Pause game">{phase === "paused" ? "▶" : "Ⅱ"}</button><button onClick={onClose} aria-label="Close game">×</button></div>
        </header>
        <div className="game-stage">
          <canvas ref={canvasRef} width={WORLD.width} height={WORLD.height} aria-label="Guide the black cat across stacked crates and barrels, the fence, clotheslines and into the witch's window" />
          {phase === "paused" && <div className="pause-screen"><span>PAUSED</span><button onClick={() => setPhase("playing")}>Continue</button></div>}
          {phase === "quiz" && (
            <div className="fall-quiz">
              <span>THE CAT FELL · QUESTION {falls} · PRESENT SIMPLE</span>
              <h3>{QUESTIONS[questionIndex].prompt}</h3>
              <p>A correct answer keeps your height. A wrong answer returns you to the courtyard.</p>
              <div>{questionOptions.map((option) => {
                const state = selected === option ? (option === QUESTIONS[questionIndex].correct ? "correct" : "wrong") : "";
                return <button className={state} disabled={selected !== null} key={option} onClick={() => answerQuestion(option)}>{option}<i>{state === "correct" ? "✓" : state === "wrong" ? "×" : "→"}</i></button>;
              })}</div>
              {selected && selected !== QUESTIONS[questionIndex].correct && <small>Wrong answer — returning to the courtyard.</small>}
            </div>
          )}
          {phase === "won" && level < LEVELS.length && (
            <div className="level-complete-screen">
              {!showLevelSelect ? (
                <div className="level-complete-copy">
                  <span className="level-complete-star" aria-hidden="true">★</span>
                  <h3>{`Level ${LEVELS[level - 1].label} complete!`}</h3>
                  <p>The next courtyard is faster and more dangerous.</p>
                  <button className="next-level-button" onClick={continueJourney}>Next level</button>
                  <button className="back-to-map-button" onClick={() => setShowLevelSelect(true)}>Back to map</button>
                </div>
              ) : (
                <div className="level-map-panel">
                  <span>MIDNIGHT ROUTE</span>
                  <h3>Choose a courtyard</h3>
                  <p>Replay a courtyard or continue with the next one.</p>
                  <div className="level-map-nodes">
                    {LEVELS.map((item, index) => (
                      <button className={index + 1 === level ? "current" : ""} key={item.label} onClick={() => startLevel(index + 1)}>
                        <i>{index + 1 <= level ? "★" : "•"}</i>
                        <strong>{item.label}</strong>
                      </button>
                    ))}
                  </div>
                  <button className="map-back-button" onClick={() => setShowLevelSelect(false)}>← Back to result</button>
                </div>
              )}
            </div>
          )}
          {phase === "won" && level === LEVELS.length && (
            <div className="final-win-screen">
              {!showLevelSelect ? (
                <div className="final-win-copy">
                  <span className="final-win-star" aria-hidden="true">★</span>
                  <h3>Home at last!</h3>
                  <p>The black cat has returned safely to the witch.</p>
                  <div className="final-score">Score: <strong>{score}</strong></div>
                  <div className="dragon-secret"><span>DRAGON&apos;S SECRET</span><strong>His favourite sweets are <mark>chocolate candies</mark>.</strong></div>
                  <div className="final-win-actions">
                    <button className="primary" onClick={restart}>Play again</button>
                    <button onClick={() => setShowLevelSelect(true)}>Level select</button>
                    <button className="library" onClick={onClose}>Back to library</button>
                  </div>
                </div>
              ) : (
                <div className="final-level-select">
                  <span>CHOOSE A COURTYARD</span>
                  <h3>Level select</h3>
                  <p>Return to any part of the midnight journey.</p>
                  <div>{LEVELS.map((item, index) => <button key={item.label} onClick={() => startLevel(index + 1)}>{item.label}</button>)}</div>
                  <button className="level-select-back" onClick={() => setShowLevelSelect(false)}>← Back</button>
                </div>
              )}
            </div>
          )}
        </div>
        <footer className="game-controls">
          <div className="keys-guide"><span><kbd>←</kbd><kbd>→</kbd> move</span><span><kbd>SPACE</kbd> jump</span><span><kbd>P</kbd> pause</span></div>
          <div className="touch-controls"><button onPointerDown={() => setDirection("left", true)} onPointerUp={() => setDirection("left", false)} onPointerLeave={() => setDirection("left", false)}>←</button><button onPointerDown={() => setDirection("right", true)} onPointerUp={() => setDirection("right", false)} onPointerLeave={() => setDirection("right", false)}>→</button><button onPointerDown={jump}>↑</button></div>
          <p>{LEVELS[level - 1].stacks.length} prop stacks → fence → {LEVELS[level - 1].ropes.length} lines → window</p>
        </footer>
      </section>
      <GameInstructions
        open={showInstructions}
        onClose={closeInstructions}
        kicker="PRESENT SIMPLE A1 · ПРАВИЛА"
        title="Как вернуть кота домой"
        intro="Доберись от двора до светящегося окна ведьмочки и пройди все пять ночных уровней."
        steps={[
          { icon: "↔", title: "Беги и прыгай", text: "Стрелки или A / D двигают кота, Space, W или ↑ — прыжок. Клавиша P ставит игру на паузу." },
          { icon: "▤", title: "Поднимайся выше", text: "Используй ящики и бочки, затем забор и бельевые верёвки. С нижней опоры сразу на забор не допрыгнуть." },
          { icon: "!", title: "Избегай помех", text: "Бульдоги патрулируют двор, мыши бегут по верёвкам, а соседи выбрасывают вещи из открытых окон." },
          { icon: "A", title: "Ответь после падения", text: "Выбери верный ответ по Present Simple. Тогда кот вернётся к последней достигнутой точке маршрута." },
          { icon: "★", title: "Пройди 5 уровней", text: "С каждым двором дом становится выше, верёвок и противников — больше, а опасности движутся быстрее." },
        ]}
      />
    </div>
  );
}
