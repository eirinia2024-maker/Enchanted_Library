"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import BlackCatGame from "./BlackCatGame";

type Game = {
  id: string;
  title: string;
  category: string;
  level: string;
  description: string;
  image: string;
  challenge: string;
  answers: string[];
  correct: string;
};

const games: Game[] = [
  {
    id: "word-workshop",
    title: "Midnight Return",
    category: "Present Simple",
    level: "A1",
    description: "Help the black cat climb back to the witch's window.",
    image: "/assets/witch-workshop-v2.png",
    challenge: "Which word means «волшебный»?",
    answers: ["magical", "careful", "ordinary"],
    correct: "magical",
  },
  {
    id: "spellbound-scrolls",
    title: "Spellbound Scrolls",
    category: "Spelling",
    level: "A2–B1",
    description: "Help the owl restore words hidden in enchanted scrolls.",
    image: "/assets/owl-scrolls-v2.png",
    challenge: "Put the letters in order:  R A B R I L Y",
    answers: ["library", "bravely", "brilliant"],
    correct: "library",
  },
  {
    id: "story-path",
    title: "Story Path",
    category: "Grammar",
    level: "B1–B2",
    description: "Choose the right phrase and guide the heroes to the castle.",
    image: "/assets/story-path-v2.png",
    challenge: "If we had a map, we ___ the castle faster.",
    answers: ["would find", "will found", "find"],
    correct: "would find",
  },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);

  const visibleGames = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return games;
    return games.filter((game) =>
      [game.title, game.category, game.level, game.description].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [search]);

  useEffect(() => {
    if (!activeGame) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setActiveGame(null);
    window.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [activeGame]);

  function openGame(game: Game) {
    setAnswer(null);
    setActiveGame(game);
  }

  return (
    <main className="site-shell" id="home">
      <header className="header">
        <a className="logo" href="#home" aria-label="Enchanted Library home">
          <span className="crest" aria-hidden="true"><i>★</i><b>📖</b></span>
          <span className="logo-copy"><strong>Enchanted<br />Library</strong><small>Your adventure. Your story.</small></span>
        </a>
        <nav aria-label="Main navigation">
          <a className="active" href="#home"><span>♜</span> Home</a>
          <a href="#games"><span>♟</span> Games</a>
          <a href="#about"><span>♢</span> About</a>
        </nav>
        <a className="play-header" href="#games">Play now <span>→</span></a>
      </header>

      <div className="page-content">
        <label className="search-bar">
          <span aria-hidden="true">⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search games, skills, or levels..."
            aria-label="Search games"
          />
          <kbd>⌘ K</kbd>
        </label>

        <section className="featured" aria-labelledby="featured-title">
          <Image src="/assets/dragon-library-v2.png" alt="A young blue dragon reading a glowing book" fill priority sizes="(max-width: 900px) 100vw, 1320px" />
          <div className="featured-shade" />
          <div className="featured-copy">
            <span className="featured-label"><i>★</i> Featured adventure</span>
            <small>READING · BEGINNER FRIENDLY</small>
            <h1 id="featured-title">The Dragon&apos;s<br />Library</h1>
            <p>Read the clues, find the hidden words,<br />and earn the young dragon&apos;s trust.</p>
            <button onClick={() => document.getElementById("games")?.scrollIntoView({ behavior: "smooth" })}><span>⚔</span> Explore games</button>
          </div>
          <div className="banner-dots" aria-hidden="true"><i /><i /><i /></div>
        </section>

        <section className="library-panel" id="games">
          <div className="panel-top">
            <div>
              <span className="section-kicker">THE GAME SHELF</span>
              <h2>Choose your next adventure</h2>
            </div>
            <p>Learn English one magical chapter at a time.</p>
          </div>

          <div className="cards">
            {visibleGames.map((game, index) => (
              <article className="game-card" key={game.id}>
                <button className="cover" onClick={() => openGame(game)} aria-label={`Open ${game.title}`}>
                  <Image src={game.image} alt="" fill sizes="(max-width: 700px) 100vw, 390px" />
                  <span className="number">0{index + 1}</span>
                  <span className="cover-play">▶</span>
                </button>
                <div className="game-info">
                  <div className="game-tags"><span>{game.category}</span><span>{game.level}</span></div>
                  <h3>{game.title}</h3>
                  <p>{game.description}</p>
                  <button className="card-action" onClick={() => openGame(game)}>Open game <span>→</span></button>
                </div>
              </article>
            ))}
          </div>
          {visibleGames.length === 0 && <p className="nothing-found">No adventures found. Try another search.</p>}
        </section>

        <section className="trust-strip" id="about">
          <div><span>✦</span><p><strong>Play for 5 minutes</strong><small>Short, focused adventures</small></p></div>
          <div><span>♛</span><p><strong>Learn as you play</strong><small>Vocabulary, spelling & grammar</small></p></div>
          <div><span>★</span><p><strong>Grow with every chapter</strong><small>Three levels to explore</small></p></div>
        </section>
      </div>

      {activeGame?.id === "word-workshop" && <BlackCatGame onClose={() => setActiveGame(null)} />}

      {activeGame && activeGame.id !== "word-workshop" && (
        <div className="modal-layer" onMouseDown={() => setActiveGame(null)}>
          <section className="game-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="dialog-image"><Image src={activeGame.image} alt="" fill sizes="560px" /><button onClick={() => setActiveGame(null)} aria-label="Close">×</button></div>
            <div className="dialog-content">
              <span className="round-label">A QUICK QUEST · {activeGame.level}</span>
              <h2 id="dialog-title">{activeGame.title}</h2>
              <h3>{activeGame.challenge}</h3>
              <div className="answers">
                {activeGame.answers.map((item) => {
                  const result = answer === item ? (item === activeGame.correct ? "correct" : "wrong") : "";
                  return <button className={result} key={item} onClick={() => setAnswer(item)}><span>{item}</span><i>{result === "correct" ? "✓" : result === "wrong" ? "×" : "→"}</i></button>;
                })}
              </div>
              {answer && <p className={`result ${answer === activeGame.correct ? "success" : "retry"}`}>{answer === activeGame.correct ? "Correct! You earned a star. ★" : "Not quite — try another answer."}</p>}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
