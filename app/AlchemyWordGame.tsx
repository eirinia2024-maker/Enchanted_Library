"use client";

import { useMemo, useState, type CSSProperties } from "react";

type Word = { en: string; ru: string };
type Topic = { id: string; title: string; icon: string; color: string; words: Word[] };
type Phase = "topics" | "playing" | "won" | "lost";
type Effect = "idle" | "pour" | "fire" | "success";

const TOPICS: Topic[] = [
  {
    id: "animals", title: "Животные", icon: "🐾", color: "#62d7d2",
    words: [
      { en: "dolphin", ru: "дельфин" }, { en: "kangaroo", ru: "кенгуру" },
      { en: "kitten", ru: "котёнок" }, { en: "lion", ru: "лев" },
      { en: "panda", ru: "панда" }, { en: "parrot", ru: "попугай" },
      { en: "penguin", ru: "пингвин" }, { en: "rabbit", ru: "кролик" },
      { en: "shark", ru: "акула" }, { en: "whale", ru: "кит" },
    ],
  },
  {
    id: "food", title: "Еда и напитки", icon: "🥞", color: "#f1a95d",
    words: [
      { en: "cheese", ru: "сыр" }, { en: "coffee", ru: "кофе" },
      { en: "noodles", ru: "лапша" }, { en: "pancake", ru: "блин" },
      { en: "pasta", ru: "паста" }, { en: "salad", ru: "салат" },
      { en: "sandwich", ru: "бутерброд" }, { en: "sauce", ru: "соус" },
      { en: "soup", ru: "суп" }, { en: "vegetable", ru: "овощ" },
    ],
  },
  {
    id: "places", title: "Места и природа", icon: "🌲", color: "#83c778",
    words: [
      { en: "city", ru: "город" }, { en: "country", ru: "страна" },
      { en: "farm", ru: "ферма" }, { en: "field", ru: "поле" },
      { en: "forest", ru: "лес" }, { en: "island", ru: "остров" },
      { en: "jungle", ru: "джунгли" }, { en: "lake", ru: "озеро" },
      { en: "mountain", ru: "гора" }, { en: "waterfall", ru: "водопад" },
    ],
  },
  {
    id: "home", title: "Дом", icon: "🏠", color: "#d38adf",
    words: [
      { en: "address", ru: "адрес" }, { en: "balcony", ru: "балкон" },
      { en: "basement", ru: "подвал" }, { en: "blanket", ru: "одеяло" },
      { en: "building", ru: "здание" }, { en: "floor", ru: "этаж" },
      { en: "roof", ru: "крыша" }, { en: "shower", ru: "душ" },
      { en: "stairs", ru: "лестница" }, { en: "towel", ru: "полотенце" },
    ],
  },
  {
    id: "people", title: "Люди и семья", icon: "👨‍👩‍👧", color: "#e98787",
    words: [
      { en: "aunt", ru: "тётя" }, { en: "daughter", ru: "дочь" },
      { en: "dentist", ru: "стоматолог" }, { en: "doctor", ru: "врач" },
      { en: "driver", ru: "водитель" }, { en: "farmer", ru: "фермер" },
      { en: "grandson", ru: "внук" }, { en: "parent", ru: "родитель" },
      { en: "nurse", ru: "медсестра" }, { en: "uncle", ru: "дядя" },
    ],
  },
  {
    id: "clothes", title: "Одежда и внешность", icon: "🧣", color: "#779be8",
    words: [
      { en: "beard", ru: "борода" }, { en: "blonde", ru: "светловолосый" },
      { en: "coat", ru: "пальто" }, { en: "curly", ru: "кудрявый" },
      { en: "helmet", ru: "шлем" }, { en: "moustache", ru: "усы" },
      { en: "scarf", ru: "шарф" }, { en: "sweater", ru: "свитер" },
      { en: "swimsuit", ru: "купальник" }, { en: "towel", ru: "полотенце" },
    ],
  },
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const ROUND_SIZE = 6;

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function AlchemyWordGame({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("topics");
  const [topic, setTopic] = useState<Topic | null>(null);
  const [round, setRound] = useState<Word[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [progress, setProgress] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [effect, setEffect] = useState<Effect>("idle");
  const [activeLetter, setActiveLetter] = useState("");
  const [message, setMessage] = useState("Выбери первую букву");
  const currentWord = round[wordIndex];

  const tubeColors = useMemo(() => ALPHABET.map((_, index) => ({
    liquid: `hsl(${(index * 47 + 178) % 360} 76% 57%)`,
    glow: `hsl(${(index * 47 + 178) % 360} 90% 72%)`,
  })), []);

  const startTopic = (selected: Topic) => {
    setTopic(selected);
    setRound(shuffle(selected.words).slice(0, ROUND_SIZE));
    setWordIndex(0);
    setProgress("");
    setMistakes(0);
    setEffect("idle");
    setMessage("Выбери первую букву");
    setPhase("playing");
  };

  const restart = () => topic && startTopic(topic);

  const chooseLetter = (letter: string) => {
    if (phase !== "playing" || effect !== "idle" || !currentWord) return;
    const lower = letter.toLowerCase();
    const expected = currentWord.en[progress.length];
    setActiveLetter(letter);
    if (lower === expected) {
      const next = progress + lower;
      setProgress(next);
      setEffect(next === currentWord.en ? "success" : "pour");
      setMessage(next === currentWord.en ? "Зелье готово!" : "Верно — добавляй дальше");
      if (next === currentWord.en) {
        window.setTimeout(() => {
          if (wordIndex + 1 >= round.length) {
            setPhase("won");
          } else {
            setWordIndex((value) => value + 1);
            setProgress("");
            setEffect("idle");
            setActiveLetter("");
            setMessage("Новое слово — начинаем");
          }
        }, 950);
      } else {
        window.setTimeout(() => { setEffect("idle"); setActiveLetter(""); }, 360);
      }
      return;
    }

    const nextMistakes = mistakes + 1;
    setMistakes(nextMistakes);
    setEffect("fire");
    setMessage("Неверный ингредиент — рецепт сброшен!");
    window.setTimeout(() => {
      setProgress("");
      setActiveLetter("");
      if (nextMistakes >= 5) setPhase("lost");
      else setEffect("idle");
    }, 900);
  };

  return (
    <div className="alchemy-layer">
      <section className="alchemy-shell" role="dialog" aria-modal="true" aria-label="Собери слово">
        <header className="alchemy-header">
          <div><span>ENCHANTED LIBRARY · A1 MOVERS</span><h2>Собери слово</h2></div>
          <p>{phase === "topics" ? "Выбери раздел словаря" : "Добавляй ингредиенты в правильном порядке"}</p>
          <button onClick={onClose} aria-label="Закрыть игру">×</button>
        </header>

        {phase === "topics" ? (
          <div className="alchemy-topics">
            <div className="alchemy-topic-intro">
              <span>✦ ЛАБОРАТОРИЯ СЛОВ ✦</span>
              <h3>Какую книгу откроем?</h3>
              <p>Выбери тему. Алхимик приготовит шесть случайных слов из списка Cambridge A1 Movers.</p>
            </div>
            <div className="alchemy-topic-grid">
              {TOPICS.map((item) => (
                <button key={item.id} onClick={() => startTopic(item)} style={{ "--topic": item.color } as CSSProperties}>
                  <i>{item.icon}</i><span><strong>{item.title}</strong><small>{item.words.length} слов</small></span><b>→</b>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={`alchemy-lab effect-${effect}`}>
            <div className="alchemy-status">
              <span>{topic?.icon} {topic?.title}</span>
              <strong>Слово {Math.min(wordIndex + 1, ROUND_SIZE)} / {ROUND_SIZE}</strong>
              <div className="alchemy-lives" aria-label={`Ошибок: ${mistakes} из 5`}>
                {Array.from({ length: 5 }, (_, index) => <i className={index < mistakes ? "spent" : ""} key={index}>✦</i>)}
              </div>
            </div>

            {currentWord && (
              <>
                <div className="alchemy-scroll-copy">
                  <small>ПЕРЕВЕДИ НА АНГЛИЙСКИЙ</small>
                  <strong>{currentWord.ru}</strong>
                  <span>{currentWord.en.length} букв</span>
                </div>

                <div className={`alchemy-cauldron-word ${effect === "success" ? "complete" : ""}`}>
                  {currentWord.en.split("").map((letter, index) => (
                    <span className={index < progress.length ? "filled" : ""} key={`${letter}-${index}`}>
                      {index < progress.length ? letter.toUpperCase() : "·"}
                    </span>
                  ))}
                </div>

                <div className="alchemy-fire" aria-hidden="true"><i /><i /><i /><i /><i /></div>
                {activeLetter && <div className="alchemy-pour" aria-hidden="true"><span>{activeLetter}</span></div>}

                <div className="alchemy-hint">{message}</div>

                <div className="tube-rack" aria-label="Пробирки с буквами английского алфавита">
                  {ALPHABET.map((letter, index) => (
                    <button
                      key={letter}
                      onClick={() => chooseLetter(letter)}
                      disabled={effect !== "idle"}
                      aria-label={`Добавить букву ${letter}`}
                      className={activeLetter === letter ? "active" : ""}
                      style={{ "--liquid": tubeColors[index].liquid, "--glow": tubeColors[index].glow } as CSSProperties}
                    >
                      <span className="tube-letter">{letter}</span><i className="tube-glass"><b /></i>
                    </button>
                  ))}
                </div>
              </>
            )}

            {(phase === "won" || phase === "lost") && (
              <div className={`alchemy-result ${phase}`}>
                <span>{phase === "won" ? "🏆" : "🔥"}</span>
                <h3>{phase === "won" ? "Все слова сварены!" : "Котёл перегрелся"}</h3>
                <p>{phase === "won" ? "Шесть зелий готовы. Алхимик вами доволен." : "Пять неверных ингредиентов. Попробуй ещё раз."}</p>
                <div><button onClick={restart}>Повторить тему</button><button onClick={() => setPhase("topics")}>Выбрать другую</button></div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
