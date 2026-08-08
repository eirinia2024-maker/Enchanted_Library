"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GameSound =
  | "jump"
  | "fall"
  | "correct"
  | "wrong"
  | "pour"
  | "book"
  | "move"
  | "win"
  | "topicSelect"
  | "wizardHappy"
  | "wizardWrong"
  | "wordComplete"
  | "steam"
  | "scrollOpen"
  | "routeReveal"
  | "stepForward"
  | "deadEnd"
  | "ghostAppear"
  | "treasure"
  | "spellDissolve";

type Note = { frequency: number; end?: number; delay?: number; duration: number; type?: OscillatorType };
type NoisePattern = { duration: number; delay?: number; filter?: number; gain?: number };

const SOUND_PATTERNS: Record<GameSound, Note[]> = {
  jump: [{ frequency: 360, end: 690, duration: .13, type: "sine" }],
  fall: [{ frequency: 420, end: 105, duration: .34, type: "sawtooth" }],
  correct: [{ frequency: 520, duration: .08 }, { frequency: 690, delay: .09, duration: .13 }],
  wrong: [{ frequency: 180, end: 92, duration: .27, type: "square" }],
  pour: [{ frequency: 210, end: 125, duration: .12, type: "sine" }, { frequency: 160, end: 90, delay: .08, duration: .16, type: "sine" }],
  book: [{ frequency: 440, duration: .09 }, { frequency: 660, delay: .07, duration: .11 }, { frequency: 920, delay: .15, duration: .16 }],
  move: [{ frequency: 230, end: 390, duration: .15, type: "triangle" }],
  win: [{ frequency: 523, duration: .13 }, { frequency: 659, delay: .11, duration: .13 }, { frequency: 784, delay: .22, duration: .13 }, { frequency: 1047, delay: .34, duration: .3 }],
  topicSelect: [{ frequency: 392, duration: .08 }, { frequency: 587, delay: .08, duration: .1 }, { frequency: 784, delay: .17, duration: .16 }],
  wizardHappy: [{ frequency: 620, duration: .08 }, { frequency: 830, delay: .07, duration: .1 }],
  wizardWrong: [{ frequency: 210, end: 120, duration: .22, type: "square" }],
  wordComplete: [{ frequency: 440, duration: .07 }, { frequency: 554, delay: .07, duration: .08 }, { frequency: 659, delay: .14, duration: .09 }, { frequency: 880, delay: .23, duration: .18 }],
  steam: [],
  scrollOpen: [{ frequency: 330, end: 480, duration: .18, type: "triangle" }],
  routeReveal: [{ frequency: 480, duration: .08 }, { frequency: 720, delay: .08, duration: .12 }],
  stepForward: [{ frequency: 260, end: 520, duration: .2, type: "triangle" }],
  deadEnd: [{ frequency: 160, end: 80, duration: .28, type: "sawtooth" }],
  ghostAppear: [{ frequency: 260, end: 410, duration: .45, type: "sine" }, { frequency: 520, end: 380, delay: .08, duration: .42, type: "triangle" }],
  treasure: [{ frequency: 659, duration: .08 }, { frequency: 988, delay: .08, duration: .12 }, { frequency: 1318, delay: .18, duration: .2 }],
  spellDissolve: [{ frequency: 420, end: 140, duration: .26, type: "triangle" }],
};

const NOISE_PATTERNS: Partial<Record<GameSound, NoisePattern[]>> = {
  steam: [{ duration: .32, filter: 1500, gain: .16 }],
  scrollOpen: [{ duration: .2, filter: 2200, gain: .1 }],
  stepForward: [{ duration: .18, filter: 900, gain: .08 }],
  deadEnd: [{ duration: .22, filter: 500, gain: .12 }],
  ghostAppear: [{ duration: .5, filter: 1800, gain: .08 }],
  spellDissolve: [{ duration: .28, filter: 2600, gain: .1 }],
};

const INITIAL_VOLUME = .18;

function playNoise(context: AudioContext, pattern: NoisePattern, volume: number, now: number) {
  const start = now + (pattern.delay ?? 0);
  const sampleCount = Math.max(1, Math.floor(context.sampleRate * pattern.duration));
  const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
  const output = buffer.getChannelData(0);
  for (let index = 0; index < sampleCount; index += 1) output[index] = Math.random() * 2 - 1;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(pattern.filter ?? 1200, start);
  gain.gain.setValueAtTime(Math.min(.12, volume * (pattern.gain ?? .12)), start);
  gain.gain.exponentialRampToValueAtTime(.0001, start + pattern.duration);
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start(start);
  source.stop(start + pattern.duration);
}

export function useGameAudio(src: string) {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const [volume, setVolumeState] = useState(INITIAL_VOLUME);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);

  const startMusic = useCallback(() => {
    const music = musicRef.current;
    if (!music) return;
    void music.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, []);

  useEffect(() => {
    const music = new Audio(src);
    music.loop = true;
    music.preload = "auto";
    music.volume = INITIAL_VOLUME;
    musicRef.current = music;

    const activate = () => {
      void music.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    };

    document.addEventListener("pointerdown", activate, { once: true });
    document.addEventListener("keydown", activate, { once: true });
    void music.play().then(() => setPlaying(true)).catch(() => undefined);

    return () => {
      document.removeEventListener("pointerdown", activate);
      document.removeEventListener("keydown", activate);
      music.pause();
      music.src = "";
      musicRef.current = null;
      if (contextRef.current) void contextRef.current.close();
      contextRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    if (!musicRef.current) return;
    musicRef.current.volume = volume;
    musicRef.current.muted = muted;
  }, [muted, volume]);

  const setVolume = (next: number) => {
    const safeVolume = Math.max(0, Math.min(1, next));
    setVolumeState(safeVolume);
    setMuted(false);
    if (musicRef.current) {
      musicRef.current.volume = safeVolume;
      musicRef.current.muted = false;
    }
    startMusic();
  };

  const toggleMuted = () => {
    const next = !muted;
    setMuted(next);
    if (musicRef.current) musicRef.current.muted = next;
    if (!next) startMusic();
  };

  const playEffect = useCallback((sound: GameSound) => {
    if (muted || volume === 0 || typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const context = contextRef.current ?? new AudioContextClass();
    contextRef.current = context;
    if (context.state === "suspended") void context.resume();
    const now = context.currentTime;

    SOUND_PATTERNS[sound].forEach((note) => {
      const start = now + (note.delay ?? 0);
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = note.type ?? "sine";
      oscillator.frequency.setValueAtTime(note.frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(note.end ?? note.frequency, start + note.duration);
      gain.gain.setValueAtTime(Math.min(.14, volume * .55), start);
      gain.gain.exponentialRampToValueAtTime(.0001, start + note.duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + note.duration + .02);
    });
    NOISE_PATTERNS[sound]?.forEach((pattern) => playNoise(context, pattern, volume, now));
  }, [muted, volume]);

  return { volume, muted, playing, setVolume, toggleMuted, startMusic, playEffect };
}

type AudioState = ReturnType<typeof useGameAudio>;

export function GameAudioControls({ audio, label }: { audio: AudioState; label: string }) {
  const isSilent = audio.muted || audio.volume === 0;
  return (
    <div className="game-audio-controls" title={label}>
      <button
        className={isSilent ? "is-muted" : ""}
        onClick={audio.toggleMuted}
        aria-label={isSilent ? "Включить звук" : "Выключить звук"}
      >
        <span aria-hidden="true">{isSilent ? "♪̸" : "♪"}</span>
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={audio.volume}
        onChange={(event) => audio.setVolume(Number(event.target.value))}
        aria-label={`Громкость: ${Math.round(audio.volume * 100)}%`}
      />
      <small>{Math.round(audio.volume * 100)}</small>
    </div>
  );
}
