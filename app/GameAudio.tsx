"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GameSound = "jump" | "fall" | "correct" | "wrong" | "pour" | "book" | "move" | "win";

type Note = { frequency: number; end?: number; delay?: number; duration: number; type?: OscillatorType };

const SOUND_PATTERNS: Record<GameSound, Note[]> = {
  jump: [{ frequency: 360, end: 690, duration: .13, type: "sine" }],
  fall: [{ frequency: 420, end: 105, duration: .34, type: "sawtooth" }],
  correct: [{ frequency: 520, duration: .08 }, { frequency: 690, delay: .09, duration: .13 }],
  wrong: [{ frequency: 180, end: 92, duration: .27, type: "square" }],
  pour: [{ frequency: 210, end: 125, duration: .12, type: "sine" }, { frequency: 160, end: 90, delay: .08, duration: .16, type: "sine" }],
  book: [{ frequency: 440, duration: .09 }, { frequency: 660, delay: .07, duration: .11 }, { frequency: 920, delay: .15, duration: .16 }],
  move: [{ frequency: 230, end: 390, duration: .15, type: "triangle" }],
  win: [{ frequency: 523, duration: .13 }, { frequency: 659, delay: .11, duration: .13 }, { frequency: 784, delay: .22, duration: .13 }, { frequency: 1047, delay: .34, duration: .3 }],
};

export function useGameAudio(src: string) {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const [volume, setVolumeState] = useState(.18);
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
    music.volume = volume;
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
