"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameInstructions from "./GameInstructions";
import { GameAudioControls, useGameAudio } from "./GameAudio";
import { assetPath } from "./assetPath";

type Props = { onClose: () => void };
type TopicId = "have-got" | "there-is" | "present-continuous";
type LocationId = "entrance" | "portcullis" | "fork2" | "fork3" | "deadEnd" | "treasure";
type Direction = "left" | "forward" | "right" | "back";
type View = "book" | "topic" | "question" | "routes" | "ghost" | "failed" | "final";

type Question = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
};

type RouteStep = {
  location: Exclude<LocationId, "entrance" | "deadEnd" | "treasure">;
  correctDirection: Direction;
};

const TOPICS: { id: TopicId; title: string; subtitle: string }[] = [
  { id: "have-got", title: "Have got", subtitle: "владение и описание" },
  { id: "there-is", title: "There is / are", subtitle: "место и предлоги" },
  { id: "present-continuous", title: "Present Continuous", subtitle: "действия прямо сейчас" },
];

const QUESTIONS: Record<TopicId, Question[]> = {
  "have-got": [
    { id: "hg01", prompt: "I ___ a blue backpack.", options: ["have got", "has got", "am got"], answer: "have got" },
    { id: "hg02", prompt: "Anna ___ a little brother.", options: ["has got", "have got", "is got"], answer: "has got" },
    { id: "hg03", prompt: "___ you got a pet?", options: ["Have", "Has", "Are"], answer: "Have" },
    { id: "hg04", prompt: "___ Tom got a bike?", options: ["Has", "Have", "Is"], answer: "Has" },
    { id: "hg05", prompt: "We ___ any homework today.", options: ["haven't got", "hasn't got", "not have got"], answer: "haven't got" },
    { id: "hg06", prompt: "My cat ___ green eyes.", options: ["has got", "have got", "got has"], answer: "has got" },
    { id: "hg07", prompt: "They ___ a big garden.", options: ["have got", "has got", "are got"], answer: "have got" },
    { id: "hg08", prompt: "She ___ a red dress.", options: ["has got", "have got", "got"], answer: "has got" },
    { id: "hg09", prompt: "I ___ any sisters.", options: ["haven't got", "hasn't got", "am not got"], answer: "haven't got" },
    { id: "hg10", prompt: "___ your school got a library?", options: ["Has", "Have", "Is"], answer: "Has" },
    { id: "hg11", prompt: "You ___ a nice smile.", options: ["have got", "has got", "is got"], answer: "have got" },
    { id: "hg12", prompt: "Ben and Lucy ___ two cousins.", options: ["have got", "has got", "are got"], answer: "have got" },
    { id: "hg13", prompt: "My teacher ___ curly hair.", options: ["has got", "have got", "got have"], answer: "has got" },
    { id: "hg14", prompt: "___ we got enough pencils?", options: ["Have", "Has", "Do"], answer: "Have" },
    { id: "hg15", prompt: "The house ___ three windows.", options: ["has got", "have got", "is got"], answer: "has got" },
    { id: "hg16", prompt: "He ___ any money.", options: ["hasn't got", "haven't got", "not has got"], answer: "hasn't got" },
    { id: "hg17", prompt: "Our friends ___ a new game.", options: ["have got", "has got", "got has"], answer: "have got" },
    { id: "hg18", prompt: "___ Mia got a camera?", options: ["Has", "Have", "Does"], answer: "Has" },
    { id: "hg19", prompt: "I ___ an idea!", options: ["have got", "has got", "am got"], answer: "have got" },
    { id: "hg20", prompt: "The dog ___ a long tail.", options: ["has got", "have got", "is got"], answer: "has got" },
  ],
  "there-is": [
    { id: "ti01", prompt: "___ a lamp on the desk.", options: ["There is", "There are", "It are"], answer: "There is" },
    { id: "ti02", prompt: "___ three books in my bag.", options: ["There are", "There is", "They is"], answer: "There are" },
    { id: "ti03", prompt: "The cat is ___ the table.", options: ["under", "between", "above"], answer: "under" },
    { id: "ti04", prompt: "The clock is ___ the wall.", options: ["on", "in", "under"], answer: "on" },
    { id: "ti05", prompt: "The ball is ___ the box.", options: ["in", "on", "behind"], answer: "in" },
    { id: "ti06", prompt: "The school is ___ the park and the shop.", options: ["between", "under", "in front of"], answer: "between" },
    { id: "ti07", prompt: "The chair is ___ the desk.", options: ["next to", "above", "in"], answer: "next to" },
    { id: "ti08", prompt: "The tree is ___ the house.", options: ["behind", "between", "on"], answer: "behind" },
    { id: "ti09", prompt: "The car is ___ the house.", options: ["in front of", "under", "in"], answer: "in front of" },
    { id: "ti10", prompt: "The picture is ___ the sofa.", options: ["above", "between", "in"], answer: "above" },
    { id: "ti11", prompt: "___ any milk in the fridge?", options: ["Is there", "Are there", "There is"], answer: "Is there" },
    { id: "ti12", prompt: "___ two windows in the room?", options: ["Are there", "Is there", "There are"], answer: "Are there" },
    { id: "ti13", prompt: "There ___ a dog in the garden.", options: ["is", "are", "be"], answer: "is" },
    { id: "ti14", prompt: "There ___ four apples on the plate.", options: ["are", "is", "am"], answer: "are" },
    { id: "ti15", prompt: "The shoes are ___ the bed.", options: ["under", "above", "between"], answer: "under" },
    { id: "ti16", prompt: "There ___ a computer next to the books.", options: ["is", "are", "have"], answer: "is" },
    { id: "ti17", prompt: "The rabbit is ___ the two boxes.", options: ["between", "behind", "on"], answer: "between" },
    { id: "ti18", prompt: "___ five children in the classroom.", options: ["There are", "There is", "Is there"], answer: "There are" },
    { id: "ti19", prompt: "The keys are ___ the bag, not outside it.", options: ["in", "on", "above"], answer: "in" },
    { id: "ti20", prompt: "There isn't ___ chair by the window.", options: ["a", "any", "some"], answer: "a" },
  ],
  "present-continuous": [
    { id: "pc01", prompt: "I ___ a book now.", options: ["am reading", "is reading", "read"], answer: "am reading" },
    { id: "pc02", prompt: "She ___ in the garden.", options: ["is playing", "are playing", "plays now"], answer: "is playing" },
    { id: "pc03", prompt: "They ___ to school.", options: ["are running", "is running", "runs"], answer: "are running" },
    { id: "pc04", prompt: "Look! The dog ___!", options: ["is swimming", "are swimming", "swim"], answer: "is swimming" },
    { id: "pc05", prompt: "We ___ now.", options: ["aren't sleeping", "isn't sleeping", "don't sleeping"], answer: "aren't sleeping" },
    { id: "pc06", prompt: "___ he cooking dinner?", options: ["Is", "Are", "Does"], answer: "Is" },
    { id: "pc07", prompt: "___ you listening to me?", options: ["Are", "Is", "Do"], answer: "Are" },
    { id: "pc08", prompt: "Tom and Ben ___ football.", options: ["are playing", "is playing", "play now"], answer: "are playing" },
    { id: "pc09", prompt: "Mum ___ tea at the moment.", options: ["is making", "are making", "makes now"], answer: "is making" },
    { id: "pc10", prompt: "The baby ___ now.", options: ["is crying", "are crying", "cry"], answer: "is crying" },
    { id: "pc11", prompt: "I ___ my new jacket today.", options: ["am wearing", "is wearing", "wearing"], answer: "am wearing" },
    { id: "pc12", prompt: "The cat ___ its food.", options: ["isn't eating", "aren't eating", "doesn't eating"], answer: "isn't eating" },
    { id: "pc13", prompt: "What ___ they doing?", options: ["are", "is", "do"], answer: "are" },
    { id: "pc14", prompt: "Where ___ Anna going?", options: ["is", "are", "does"], answer: "is" },
    { id: "pc15", prompt: "You ___ very fast!", options: ["are walking", "is walking", "walks"], answer: "are walking" },
    { id: "pc16", prompt: "Dad ___ a book right now.", options: ["is reading", "are reading", "reads now"], answer: "is reading" },
    { id: "pc17", prompt: "The birds ___ in the tree.", options: ["are singing", "is singing", "sing now"], answer: "are singing" },
    { id: "pc18", prompt: "It ___ outside.", options: ["is raining", "are raining", "rains now"], answer: "is raining" },
    { id: "pc19", prompt: "We ___ English now.", options: ["are learning", "is learning", "learns"], answer: "are learning" },
    { id: "pc20", prompt: "___ I speaking too quietly?", options: ["Am", "Is", "Are"], answer: "Am" },
  ],
};

const LOCATION_SLUG: Record<LocationId, string> = {
  entrance: "entrance",
  portcullis: "portcullis",
  fork2: "fork-2",
  fork3: "fork-3",
  deadEnd: "dead-end",
  treasure: "treasure",
};

const LOCATION_NAMES: Record<LocationId, string> = {
  entrance: "Вход в лабиринт",
  portcullis: "Подъёмная решётка",
  fork2: "Развилка двух путей",
  fork3: "Развилка трёх путей",
  deadEnd: "Тупик",
  treasure: "Комната сокровищ",
};

const DIRECTIONS: Record<RouteStep["location"], Direction[]> = {
  portcullis: ["forward"],
  fork2: ["left", "right"],
  fork3: ["left", "forward", "right"],
};

const DIRECTION_LABELS: Record<Direction, string> = {
  left: "Налево",
  forward: "Вперёд",
  right: "Направо",
  back: "Назад",
};

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function buildRoute(): RouteStep[] {
  const length = 7 + Math.floor(Math.random() * 3);
  const locations: RouteStep["location"][] = ["portcullis", "fork2", "fork3"];
  return Array.from({ length }, (_, index) => {
    let location = randomItem(locations);
    if (index > 0 && location === "portcullis" && Math.random() > 0.45) location = randomItem(["fork2", "fork3"]);
    return { location, correctDirection: randomItem(DIRECTIONS[location]) };
  });
}

function assetFor(view: View, location: LocationId): string {
  let state = "book";
  if (view === "topic" || view === "question" || view === "final") state = "scroll";
  if (view === "routes") state = "arrows";
  if (view === "ghost") state = "ghost";
  return assetPath(`/assets/library-labyrinth-${state}-${LOCATION_SLUG[location]}-wide-v1.png`);
}

export default function LibraryLabyrinthGame({ onClose }: Props) {
  const gameAudio = useGameAudio(assetPath("/assets/library-labyrinth-theme.mp3"));
  const playEffect = gameAudio.playEffect;
  const [topic, setTopic] = useState<TopicId | null>(null);
  const [route, setRoute] = useState<RouteStep[]>([]);
  const [routeIndex, setRouteIndex] = useState(0);
  const [location, setLocation] = useState<LocationId>("entrance");
  const [view, setView] = useState<View>("book");
  const [question, setQuestion] = useState<Question | null>(null);
  const [usedQuestions, setUsedQuestions] = useState<string[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [dissolving, setDissolving] = useState(false);
  const [blockedDirections, setBlockedDirections] = useState<Direction[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const timers = useRef<number[]>([]);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const id = window.setTimeout(callback, delay);
    timers.current.push(id);
  }, []);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const activeTopic = useMemo(() => TOPICS.find((item) => item.id === topic) ?? null, [topic]);
  const frameStyle = useMemo(() => {
    return {
      backgroundImage: `url(${assetFor(view, location)})`,
    };
  }, [location, view]);

  const chooseQuestion = useCallback((topicId: TopicId, avoidId?: string) => {
    const bank = QUESTIONS[topicId];
    let available = bank.filter((item) => !usedQuestions.includes(item.id) && item.id !== avoidId);
    if (!available.length) available = bank.filter((item) => item.id !== avoidId);
    const next = randomItem(available);
    setQuestion({ ...next, options: shuffle(next.options) });
    setUsedQuestions((previous) => previous.includes(next.id) ? previous : [...previous, next.id]);
    setSelectedAnswer(null);
    setFeedback(null);
  }, [usedQuestions]);

  function resetGame() {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setTopic(null);
    setRoute([]);
    setRouteIndex(0);
    setLocation("entrance");
    setView("book");
    setQuestion(null);
    setUsedQuestions([]);
    setWrongAnswers(0);
    setCorrectAnswers(0);
    setSelectedAnswer(null);
    setFeedback(null);
    setDissolving(false);
    setBlockedDirections([]);
  }

  function selectTopic(topicId: TopicId) {
    playEffect("book");
    setTopic(topicId);
    setRoute(buildRoute());
    setRouteIndex(0);
    setWrongAnswers(0);
    setCorrectAnswers(0);
    setUsedQuestions([]);
    setBlockedDirections([]);
    setView("routes");
  }

  function openBook() {
    if (view !== "book") return;
    playEffect(location === "treasure" ? "win" : "book");
    if (location === "entrance") {
      setView("topic");
      return;
    }
    if (location === "treasure") {
      setView("final");
      return;
    }
    if (!topic) return;
    chooseQuestion(topic);
    setView("question");
  }

  function answerQuestion(option: string) {
    if (!question || feedback || !topic) return;
    setSelectedAnswer(option);
    if (option === question.answer) {
      playEffect("correct");
      setFeedback("correct");
      setCorrectAnswers((count) => count + 1);
      schedule(() => {
        setSelectedAnswer(null);
        setFeedback(null);
        setView("routes");
      }, 650);
      return;
    }

    const nextWrongCount = wrongAnswers + 1;
    playEffect("wrong");
    setWrongAnswers(nextWrongCount);
    setFeedback("wrong");
    setDissolving(true);
    if (nextWrongCount >= 3) {
      schedule(() => {
        setDissolving(false);
        setQuestion(null);
        setView("ghost");
      }, 520);
      schedule(() => {
        setLocation("entrance");
        setView("failed");
      }, 2350);
      return;
    }

    schedule(() => {
      chooseQuestion(topic, question.id);
      setDissolving(false);
    }, 620);
  }

  function move(direction: Direction) {
    if (view !== "routes") return;
    playEffect("move");

    if (location === "entrance") {
      const first = route[0];
      if (!first) return;
      setLocation(first.location);
      setView("book");
      return;
    }

    if (location === "deadEnd") {
      const returnStep = route[routeIndex];
      if (!returnStep) return;
      setLocation(returnStep.location);
      setView("routes");
      return;
    }

    const currentStep = route[routeIndex];
    if (!currentStep) return;
    if (direction !== currentStep.correctDirection) {
      setBlockedDirections((items) => items.includes(direction) ? items : [...items, direction]);
      setLocation("deadEnd");
      setView("book");
      return;
    }

    const nextIndex = routeIndex + 1;
    setBlockedDirections([]);
    if (nextIndex >= route.length) {
      setLocation("treasure");
      setView("book");
      return;
    }
    setRouteIndex(nextIndex);
    setLocation(route[nextIndex].location);
    setView("book");
  }

  const directionOptions = useMemo<Direction[]>(() => {
    if (location === "entrance") return ["forward"];
    if (location === "deadEnd") return ["back"];
    const current = route[routeIndex];
    return current ? DIRECTIONS[current.location] : [];
  }, [location, route, routeIndex]);

  return (
    <div className="labyrinth-layer" role="dialog" aria-modal="true" aria-label="Library Labyrinth">
      <div className="labyrinth-shell">
        <header className="labyrinth-header">
          <div>
            <span>ENCHANTED LIBRARY · GRAMMAR A1</span>
            <strong>Library Labyrinth</strong>
          </div>
          <div className="labyrinth-status">
            {activeTopic && <span>{activeTopic.title}</span>}
            <span className="labyrinth-progress">✦ {correctAnswers} / {route.length || 7}</span>
            <span className="labyrinth-mistakes" aria-label={`${wrongAnswers} mistakes out of 3`}>
              {[0, 1, 2].map((index) => <i className={index < wrongAnswers ? "lost" : ""} key={index}>◆</i>)}
            </span>
            <GameAudioControls audio={gameAudio} label="Музыка лабиринта" />
            <button className="instructions-trigger" onClick={() => setShowInstructions(true)} aria-label="Инструкции">?</button>
            <button onClick={onClose} aria-label="Закрыть игру">×</button>
          </div>
        </header>

        <main className={`labyrinth-stage view-${view} location-${location}`} style={frameStyle}>
          <span className="labyrinth-room-name">{LOCATION_NAMES[location]}</span>

          {view === "book" && (
            <button className="labyrinth-book-hitbox" onClick={openBook} aria-label="Открыть волшебную книгу">
              <span>Открыть книгу</span>
            </button>
          )}

          {view === "topic" && (
            <section className="labyrinth-scroll-content topic-select">
              <span className="scroll-kicker">ВЫБЕРИ ПУТЬ ЗНАНИЙ</span>
              <h2>Какую грамматику<br />возьмём в лабиринт?</h2>
              <div className="labyrinth-topic-list">
                {TOPICS.map((item) => (
                  <button key={item.id} onClick={() => selectTopic(item.id)}>
                    <strong>{item.title}</strong>
                    <small>{item.subtitle}</small>
                    <i>→</i>
                  </button>
                ))}
              </div>
            </section>
          )}

          {view === "question" && question && (
            <section className={`labyrinth-scroll-content question-card ${dissolving ? "is-dissolving" : ""}`}>
              <span className="scroll-kicker">ВОПРОС {correctAnswers + 1} · {activeTopic?.title}</span>
              <h2>{question.prompt}</h2>
              <div className="labyrinth-answers">
                {question.options.map((option, index) => {
                  const state = selectedAnswer === option ? feedback : null;
                  return (
                    <button className={state ? `is-${state}` : ""} key={option} onClick={() => answerQuestion(option)}>
                      <span>{String.fromCharCode(65 + index)}</span>{option}
                    </button>
                  );
                })}
              </div>
              <p className={`labyrinth-feedback ${feedback ?? ""}`}>
                {feedback === "correct" ? "Верно! Путь открылся." : feedback === "wrong" ? "Заклинание рассеялось… Новый вопрос уже появляется." : `Ошибки: ${wrongAnswers} из 3`}
              </p>
            </section>
          )}

          {view === "routes" && (
            <div className={`labyrinth-direction-grid at-${location}`}>
              {directionOptions.map((direction) => (
                <button
                  className={`direction-${direction}`}
                  disabled={blockedDirections.includes(direction)}
                  key={direction}
                  onClick={() => move(direction)}
                  aria-label={DIRECTION_LABELS[direction]}
                >
                  <span>{blockedDirections.includes(direction) ? "Этот путь — тупик" : DIRECTION_LABELS[direction]}</span>
                </button>
              ))}
            </div>
          )}

          {view === "ghost" && (
            <div className="labyrinth-ghost-copy">
              <strong>Три заклинания рассеялись…</strong>
              <span>Хранитель возвращает тебя ко входу.</span>
            </div>
          )}

          {view === "failed" && (
            <button className="labyrinth-failure-sign" onClick={resetGame}>
              <span>Испытание окончено</span>
              <strong>Кажется, пока лабиринт тебе не по силам.</strong>
              <p>Наберись знаний и возвращайся заново.</p>
              <i>Нажми, чтобы попробовать снова</i>
            </button>
          )}

          {view === "final" && (
            <section className="labyrinth-scroll-content labyrinth-final">
              <span className="scroll-kicker">СОКРОВИЩНИЦА ОТКРЫТА</span>
              <h2>Знание стало ключом!</h2>
              <p>Ты прошёл лабиринт и ответил правильно на <strong>{correctAnswers}</strong> вопросов.</p>
              <div className="dragon-secret"><span>DRAGON&apos;S SECRET</span><strong>The word that opens the oldest library door is <mark>starlight</mark>.</strong></div>
              <div>
                <button onClick={resetGame}>Пройти ещё раз</button>
                <button onClick={onClose}>Вернуться в библиотеку</button>
              </div>
            </section>
          )}
        </main>

        <footer className="labyrinth-footer">
          <span>Нажми на книгу → ответь на вопрос → выбери путь</span>
          <span>До сокровищ: минимум {route.length || 7} вопросов</span>
        </footer>
      </div>
      <GameInstructions
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        kicker="GRAMMAR A1 · ПРАВИЛА"
        title="Как пройти библиотечный лабиринт"
        intro="Открывай волшебные книги, отвечай на вопросы и находи дорогу к комнате сокровищ."
        steps={[
          { icon: "◇", title: "Открой книгу", text: "Во входном зале нажми на светящуюся книгу и выбери одну из трёх грамматических тем." },
          { icon: "?", title: "Решай задания", text: "В каждой новой локации снова открой книгу и выбери правильный вариант ответа на свитке." },
          { icon: "↗", title: "Выбирай путь", text: "После верного ответа появятся стрелки. Нажми на одну из них, чтобы перейти в следующий зал." },
          { icon: "↩", title: "Исследуй тупики", text: "Неверный маршрут может привести в тупик и добавить ещё одно задание, после которого можно вернуться назад." },
          { icon: "3", title: "Береги три попытки", text: "После трёх ошибок появится призрак хранителя и вернёт тебя ко входу. До сокровищ нужно решить минимум семь заданий." },
        ]}
      />
    </div>
  );
}
