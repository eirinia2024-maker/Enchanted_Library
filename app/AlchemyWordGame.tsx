"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import GameInstructions from "./GameInstructions";
import { GameAudioControls, useGameAudio } from "./GameAudio";
import { assetPath } from "./assetPath";

type Word = { en: string; ru: string };
type Topic = { id: string; title: string; icon: string; color: string; words: Word[] };
type Phase = "topics" | "playing" | "won" | "lost";
type Effect = "idle" | "pour" | "fire" | "success";
type LetterCase = "upper" | "lower";

const TOPICS: Topic[] = [
  {
    id: "animals", title: "Животные", icon: assetPath("/assets/topic-animals-v1.png"), color: "#62d7d2",
    words: [
      { en: "dolphin", ru: "дельфин" }, { en: "kangaroo", ru: "кенгуру" },
      { en: "kitten", ru: "котёнок" }, { en: "lion", ru: "лев" },
      { en: "panda", ru: "панда" }, { en: "parrot", ru: "попугай" },
      { en: "penguin", ru: "пингвин" }, { en: "rabbit", ru: "кролик" },
      { en: "shark", ru: "акула" }, { en: "whale", ru: "кит" },
    ],
  },
  {
    id: "food", title: "Еда и напитки", icon: assetPath("/assets/topic-food-v1.png"), color: "#f1a95d",
    words: [
      { en: "cheese", ru: "сыр" }, { en: "coffee", ru: "кофе" },
      { en: "noodles", ru: "лапша" }, { en: "pancake", ru: "блин" },
      { en: "pasta", ru: "паста" }, { en: "salad", ru: "салат" },
      { en: "sandwich", ru: "бутерброд" }, { en: "sauce", ru: "соус" },
      { en: "soup", ru: "суп" }, { en: "vegetable", ru: "овощ" },
    ],
  },
  {
    id: "places", title: "Места и природа", icon: assetPath("/assets/topic-places-v1.png"), color: "#83c778",
    words: [
      { en: "city", ru: "город" }, { en: "country", ru: "страна" },
      { en: "farm", ru: "ферма" }, { en: "field", ru: "поле" },
      { en: "forest", ru: "лес" }, { en: "island", ru: "остров" },
      { en: "jungle", ru: "джунгли" }, { en: "lake", ru: "озеро" },
      { en: "mountain", ru: "гора" }, { en: "waterfall", ru: "водопад" },
    ],
  },
  {
    id: "home", title: "Дом", icon: assetPath("/assets/topic-home-v1.png"), color: "#d38adf",
    words: [
      { en: "address", ru: "адрес" }, { en: "balcony", ru: "балкон" },
      { en: "basement", ru: "подвал" }, { en: "blanket", ru: "одеяло" },
      { en: "building", ru: "здание" }, { en: "floor", ru: "этаж" },
      { en: "roof", ru: "крыша" }, { en: "shower", ru: "душ" },
      { en: "stairs", ru: "лестница" }, { en: "towel", ru: "полотенце" },
    ],
  },
  {
    id: "people", title: "Люди и семья", icon: assetPath("/assets/topic-people-v1.png"), color: "#e98787",
    words: [
      { en: "aunt", ru: "тётя" }, { en: "daughter", ru: "дочь" },
      { en: "dentist", ru: "стоматолог" }, { en: "doctor", ru: "врач" },
      { en: "driver", ru: "водитель" }, { en: "farmer", ru: "фермер" },
      { en: "grandson", ru: "внук" }, { en: "parent", ru: "родитель" },
      { en: "nurse", ru: "медсестра" }, { en: "uncle", ru: "дядя" },
    ],
  },
  {
    id: "clothes", title: "Одежда и внешность", icon: assetPath("/assets/topic-clothes-v1.png"), color: "#779be8",
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
  const gameAudio = useGameAudio(assetPath("/assets/words-potion-theme.mp3"));
  const playEffect = gameAudio.playEffect;
  const [phase, setPhase] = useState<Phase>("topics");
  const [topic, setTopic] = useState<Topic | null>(null);
  const [round, setRound] = useState<Word[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [progress, setProgress] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [effect, setEffect] = useState<Effect>("idle");
  const [activeLetter, setActiveLetter] = useState("");
  const [message, setMessage] = useState("Выбери пробирку или нажми букву");
  const [letterCase, setLetterCase] = useState<LetterCase>("upper");
  const [showInstructions, setShowInstructions] = useState(false);
  const currentWord = round[wordIndex];

  const tubeColors = useMemo(() => ALPHABET.map((_, index) => ({
    liquid: `hsl(${(index * 47 + 178) % 360} 76% 57%)`,
    glow: `hsl(${(index * 47 + 178) % 360} 90% 72%)`,
  })), []);

  const startTopic = (selected: Topic) => {
    playEffect("book");
    setTopic(selected);
    setRound(shuffle(selected.words).slice(0, ROUND_SIZE));
    setWordIndex(0);
    setProgress("");
    setMistakes(0);
    setEffect("idle");
    setMessage("Выбери пробирку или нажми букву");
    setPhase("playing");
  };

  const restart = () => topic && startTopic(topic);
  const displayLetter = (letter: string) => letterCase === "upper" ? letter.toUpperCase() : letter.toLowerCase();

  const chooseLetter = useCallback((letter: string) => {
    if (phase !== "playing" || effect !== "idle" || !currentWord) return;
    const lower = letter.toLowerCase();
    const expected = currentWord.en[progress.length];
    setActiveLetter(letter);
    if (lower === expected) {
      playEffect("pour");
      const next = progress + lower;
      setProgress(next);
      setEffect(next === currentWord.en ? "success" : "pour");
      setMessage(next === currentWord.en ? "Зелье готово!" : "Верно — добавляй дальше");
      if (next === currentWord.en) {
        window.setTimeout(() => {
          if (wordIndex + 1 >= round.length) {
            playEffect("win");
            setPhase("won");
          } else {
            setWordIndex((value) => value + 1);
            setProgress("");
            setEffect("idle");
            setActiveLetter("");
            setMessage("Новое слово — выбери пробирку или нажми букву");
          }
        }, 950);
      } else {
        window.setTimeout(() => { setEffect("idle"); setActiveLetter(""); }, 360);
      }
      return;
    }

    const nextMistakes = mistakes + 1;
    playEffect("wrong");
    setMistakes(nextMistakes);
    setEffect("fire");
    setMessage("Неверный ингредиент — рецепт сброшен!");
    window.setTimeout(() => {
      setProgress("");
      setActiveLetter("");
      if (nextMistakes >= 5) setPhase("lost");
      else setEffect("idle");
    }, 900);
  }, [currentWord, effect, mistakes, phase, playEffect, progress, round.length, wordIndex]);

  useEffect(() => {
    const handleKeyboardLetter = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
      if (!/^[a-z]$/i.test(event.key)) return;
      event.preventDefault();
      chooseLetter(event.key.toUpperCase());
    };
    window.addEventListener("keydown", handleKeyboardLetter);
    return () => window.removeEventListener("keydown", handleKeyboardLetter);
  }, [chooseLetter]);

  const renderTube = (letter: string, index: number) => (
    <button
      key={letter}
      onClick={() => chooseLetter(letter)}
      disabled={effect !== "idle"}
      aria-label={`Добавить букву ${displayLetter(letter)}`}
      className={activeLetter === letter ? "active" : ""}
      style={{ "--liquid": tubeColors[index].liquid, "--glow": tubeColors[index].glow, "--hue": `${index * 29}deg` } as CSSProperties}
    >
      <i className="vial-art" aria-hidden="true" style={{ backgroundImage: `url("${assetPath("/assets/alchemy-vial-v2.png")}")` }} />
      <span className="tube-letter">{displayLetter(letter)}</span>
    </button>
  );

  return (
    <div className="alchemy-layer" style={{
      "--alchemy-lab-background": `url("${assetPath("/assets/alchemist-word-lab-v1.png")}")`,
      "--alchemy-flame-one": `url("${assetPath("/assets/alchemy-flame-1-v1.png")}")`,
      "--alchemy-flame-two": `url("${assetPath("/assets/alchemy-flame-2-v1.png")}")`,
      "--alchemy-flame-three": `url("${assetPath("/assets/alchemy-flame-3-v1.png")}")`,
      "--alchemy-finale": `url("${assetPath("/assets/alchemy-finale-v1.png")}")`,
    } as CSSProperties}>
      <section className="alchemy-shell" role="dialog" aria-modal="true" aria-label="Собери слово">
        <header className="alchemy-header">
          <div><span>ENCHANTED LIBRARY · A1 MOVERS</span><h2>Собери слово</h2></div>
          <p>{phase === "topics" ? "Выбери раздел словаря" : "Выбирай пробирки или набирай слово на клавиатуре"}</p>
          <div className="alchemy-header-actions"><GameAudioControls audio={gameAudio} label="Музыка лаборатории" /><button className="instructions-trigger" onClick={() => setShowInstructions(true)} aria-label="Инструкции">?</button><button onClick={onClose} aria-label="Закрыть игру">×</button></div>
        </header>

        {phase === "topics" ? (
          <div className="alchemy-topics">
            <div className="alchemy-topic-intro">
              <span>✦ ЛАБОРАТОРИЯ СЛОВ ✦</span>
              <h3>Какую книгу откроем?</h3>
              <p>Выбери тему. Алхимик приготовит шесть случайных слов из списка Cambridge A1 Movers.</p>
              <div className="alchemy-case-picker" aria-label="Выбор регистра букв">
                <small>КАКИЕ БУКВЫ ИСПОЛЬЗУЕМ?</small>
                <div>
                  <button className={letterCase === "upper" ? "selected" : ""} onClick={() => setLetterCase("upper")}><b>ABC</b><span>заглавные</span></button>
                  <button className={letterCase === "lower" ? "selected" : ""} onClick={() => setLetterCase("lower")}><b>abc</b><span>строчные</span></button>
                </div>
              </div>
            </div>
            <div className="alchemy-topic-grid">
              {TOPICS.map((item) => (
                <button key={item.id} onClick={() => startTopic(item)} style={{ "--topic": item.color } as CSSProperties}>
                  <i><Image src={item.icon} alt="" width={74} height={74} /></i><span><strong>{item.title}</strong><small>{item.words.length} слов</small></span><b>→</b>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={`alchemy-lab effect-${effect}`}>
            <div className="alchemy-status">
              <span>{topic && <Image src={topic.icon} alt="" width={28} height={28} />} {topic?.title}</span>
              <strong>Слово {Math.min(wordIndex + 1, ROUND_SIZE)} / {ROUND_SIZE}</strong>
              <div className="alchemy-lives" aria-label={`Ошибок: ${mistakes} из 5`}>
                {Array.from({ length: 5 }, (_, index) => <i className={index < mistakes ? "spent" : ""} key={index}>✦</i>)}
              </div>
              <div className="alchemy-case-mini" aria-label="Регистр букв">
                <button className={letterCase === "upper" ? "selected" : ""} onClick={() => setLetterCase("upper")}>ABC</button>
                <button className={letterCase === "lower" ? "selected" : ""} onClick={() => setLetterCase("lower")}>abc</button>
              </div>
            </div>

            {currentWord && (
              <>
                <div className="alchemy-scroll-copy">
                  <small>ПЕРЕВЕДИ НА АНГЛИЙСКИЙ</small>
                  <strong className={currentWord.ru.length >= 12 ? "very-long" : currentWord.ru.length >= 9 ? "long" : ""}>{currentWord.ru}</strong>
                  <span>{currentWord.en.length} букв</span>
                </div>

                <div className={`alchemy-cauldron-word ${effect === "success" ? "complete" : ""}`}>
                  {currentWord.en.split("").map((letter, index) => (
                    <span className={index < progress.length ? "filled" : ""} key={`${letter}-${index}`}>
                      {index < progress.length ? displayLetter(letter) : "·"}
                    </span>
                  ))}
                </div>

                <div className="alchemy-fire" aria-hidden="true"><i className="flame-one" /><i className="flame-two" /><i className="flame-three" /></div>
                {activeLetter && <div className="alchemy-pour" aria-hidden="true"><span>{displayLetter(activeLetter)}</span></div>}

                <div className="alchemy-hint">{message}</div>

                <div className="tube-group tube-group-left" aria-label="Пробирки A–M">{ALPHABET.slice(0, 13).map((letter, index) => renderTube(letter, index))}</div>
                <div className="tube-group tube-group-right" aria-label="Пробирки N–Z">{ALPHABET.slice(13).map((letter, index) => renderTube(letter, index + 13))}</div>
              </>
            )}

            {(phase === "won" || phase === "lost") && (
              <div className={`alchemy-result ${phase}`}>
                <div className="alchemy-result-copy">
                  <span className="alchemy-result-seal">{phase === "won" ? "★" : "×"}</span>
                  <small>{phase === "won" ? "РЕЦЕПТ ЗАВЕРШЁН" : "ЛАБОРАТОРИЯ ЖДЁТ"}</small>
                  <h3>{phase === "won" ? "Все слова сварены!" : "Котёл перегрелся"}</h3>
                  <p>{phase === "won" ? "Шесть слов превратились в настоящее словарное зелье." : "Пять неверных ингредиентов. Начни рецепт ещё раз."}</p>
                  {phase === "won" && <div className="dragon-secret"><span>DRAGON&apos;S SECRET</span><strong>A reading potion glows <mark>moonlight blue</mark>.</strong></div>}
                  <div className="alchemy-result-stats"><span>{topic?.title}</span><strong>{phase === "won" ? `${ROUND_SIZE} / ${ROUND_SIZE} слов` : `${mistakes} ошибок`}</strong><b>{letterCase === "upper" ? "ABC" : "abc"}</b></div>
                  <div className="alchemy-result-actions"><button onClick={restart}>Повторить тему</button><button onClick={() => setPhase("topics")}>Выбрать другую</button><button onClick={onClose}>В библиотеку</button></div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      <GameInstructions
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        kicker="A1 MOVERS · ПРАВИЛА"
        title="Как сварить английское слово"
        intro="Переводи слова со свитка и добавляй буквенные ингредиенты в котёл в правильном порядке."
        steps={[
          { icon: "1", title: "Выбери тему и регистр", text: "Открой один из шести разделов словаря и реши, играть с заглавными или строчными буквами." },
          { icon: "⌨", title: "Собирай слово", text: "Нажимай на пробирки на боковых столах или вводи английские буквы прямо с клавиатуры." },
          { icon: "✓", title: "Следи за котлом", text: "Каждая верная буква появляется на котле. Ингредиенты нужно добавлять строго слева направо." },
          { icon: "☁", title: "Не ошибайся", text: "Неверная буква вызывает магический выброс и полностью сбрасывает прогресс текущего слова." },
          { icon: "★", title: "Свари 6 слов", text: "Пять ошибок завершают попытку. Собери все шесть случайных слов, чтобы закончить рецепт." },
        ]}
      />
    </div>
  );
}
