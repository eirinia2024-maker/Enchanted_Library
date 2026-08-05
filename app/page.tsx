"use client";

import { useEffect, useMemo, useState } from "react";

type Game = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  level: string;
  skill: string;
  time: string;
  icon: string;
  accent: string;
  imagePosition: string;
};

const games: Game[] = [
  {
    id: "word-quest",
    title: "Word Quest",
    subtitle: "Собери сокровища слов",
    description: "Соединяй английские слова со значениями и открывай сундуки.",
    level: "A1–A2",
    skill: "Vocabulary",
    time: "5 мин",
    icon: "🗝️",
    accent: "#ef9d4a",
    imagePosition: "left center",
  },
  {
    id: "spellbound",
    title: "Spellbound",
    subtitle: "Расколдуй буквы",
    description: "Составляй слова из перепутанных букв, пока песок не истёк.",
    level: "A2–B1",
    skill: "Spelling",
    time: "7 мин",
    icon: "✨",
    accent: "#9b75d4",
    imagePosition: "center center",
  },
  {
    id: "story-trail",
    title: "Story Trail",
    subtitle: "Проложи путь истории",
    description: "Выбирай верные фразы и помоги герою добраться до башни.",
    level: "B1–B2",
    skill: "Grammar",
    time: "10 мин",
    icon: "🧭",
    accent: "#49a78c",
    imagePosition: "right center",
  },
];

const challenges: Record<string, { prompt: string; answers: string[]; correct: string }> = {
  "word-quest": {
    prompt: "Какое слово означает «любопытный»?",
    answers: ["curious", "careless", "crowded"],
    correct: "curious",
  },
  spellbound: {
    prompt: "Расставь буквы:  K O B O",
    answers: ["book", "boon", "boot"],
    correct: "book",
  },
  "story-trail": {
    prompt: "If I had a map, I ___ the hidden tower.",
    answers: ["would find", "will found", "find"],
    correct: "would find",
  },
};

export default function Home() {
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredGames = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return games;
    return games.filter((game) =>
      [game.title, game.subtitle, game.skill, game.level].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [search]);

  useEffect(() => {
    if (!activeGame) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveGame(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeGame]);

  const openGame = (game: Game) => {
    setAnswer(null);
    setActiveGame(game);
  };

  const challenge = activeGame ? challenges[activeGame.id] : null;

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Wordlore — на главную">
          <span className="brand-mark">W</span>
          <span><strong>WORDLORE</strong><small>english adventures</small></span>
        </a>
        <nav aria-label="Основная навигация">
          <a className="nav-active" href="#games">Игры</a>
          <a href="#how">Как играть</a>
          <a href="#progress">Мой прогресс</a>
        </nav>
        <div className="profile"><span>★</span><b>120</b><button aria-label="Профиль игрока">АЯ</button></div>
      </header>

      <section className="hero" id="top">
        <div className="glow glow-one" /><div className="glow glow-two" />
        <div className="hero-copy">
          <span className="eyebrow">ВОЛШЕБНАЯ БИБЛИОТЕКА АНГЛИЙСКОГО</span>
          <h1>Играй со словами.<br /><em>Говори увереннее.</em></h1>
          <p>Три коротких приключения, чтобы учить лексику, правописание и грамматику без скучных упражнений.</p>
          <a className="primary-button" href="#games">Выбрать игру <span>→</span></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="moon" />
          <div className="book book-back">ABC</div>
          <div className="book book-main"><span>Once upon<br />a word...</span></div>
          <i className="spark s1">✦</i><i className="spark s2">✧</i><i className="spark s3">✦</i>
        </div>
        <div className="hero-note"><span>✦</span><p><b>5 минут в день</b><br />достаточно для прогресса</p></div>
      </section>

      <section className="games-section" id="games">
        <div className="section-heading">
          <div><span className="kicker">ВЫБЕРИ ПРИКЛЮЧЕНИЕ</span><h2>Твоя следующая глава</h2></div>
          <label className="search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Найти игру или навык" aria-label="Найти игру" /></label>
        </div>

        <div className="game-grid">
          {filteredGames.map((game, index) => (
            <article className="game-card" key={game.id} style={{ "--accent": game.accent } as React.CSSProperties}>
              <button className="card-image" onClick={() => openGame(game)} aria-label={`Открыть игру ${game.title}`}>
                <span className={`fallback-art art-${index + 1}`} aria-hidden="true"><b>{game.icon}</b><i>✦</i></span>
                <span className="generated-art" style={{ backgroundPosition: game.imagePosition }} />
                <span className="level">{game.level}</span>
                <span className="play"><span>▶</span></span>
              </button>
              <div className="card-body">
                <div className="card-title"><div><h3>{game.title}</h3><p>{game.subtitle}</p></div><span>{game.icon}</span></div>
                <p className="description">{game.description}</p>
                <div className="card-meta"><span>{game.skill}</span><span>◷ {game.time}</span><button onClick={() => openGame(game)} aria-label={`Начать ${game.title}`}>→</button></div>
              </div>
            </article>
          ))}
        </div>
        {filteredGames.length === 0 && <p className="empty">Такой игры пока нет — попробуй другой запрос.</p>}
      </section>

      <section className="how" id="how">
        <div><span>01</span><b>Выбери историю</b><p>Найди навык и уровень под себя.</p></div>
        <div><span>02</span><b>Играй 5–10 минут</b><p>Короткие раунды легко встроить в день.</p></div>
        <div id="progress"><span>03</span><b>Собирай звёзды</b><p>Возвращайся и открывай новые главы.</p></div>
      </section>

      <footer><a className="brand footer-brand" href="#top"><span className="brand-mark">W</span><span><strong>WORDLORE</strong><small>english adventures</small></span></a><p>Маленькие игры. Большой английский.</p><span>© 2026</span></footer>

      {activeGame && challenge && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setActiveGame(null)}>
          <section className="game-modal" role="dialog" aria-modal="true" aria-labelledby="game-title" onMouseDown={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setActiveGame(null)} aria-label="Закрыть игру">×</button>
            <div className="modal-top" style={{ "--accent": activeGame.accent } as React.CSSProperties}>
              <span>{activeGame.icon}</span><div><small>{activeGame.skill} · {activeGame.level}</small><h2 id="game-title">{activeGame.title}</h2></div>
            </div>
            <div className="challenge">
              <span className="round">ПРОБНЫЙ РАУНД</span>
              <h3>{challenge.prompt}</h3>
              <div className="answers">
                {challenge.answers.map((item) => {
                  const state = answer === item ? (item === challenge.correct ? "correct" : "wrong") : "";
                  return <button className={state} key={item} onClick={() => setAnswer(item)}>{item}<span>{state === "correct" ? "✓" : state === "wrong" ? "×" : "→"}</span></button>;
                })}
              </div>
              {answer && <p className={`feedback ${answer === challenge.correct ? "ok" : "no"}`}>{answer === challenge.correct ? "Верно! Звезда твоя ✦" : "Почти! Попробуй ещё раз."}</p>}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
