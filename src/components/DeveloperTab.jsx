import React, { useState, useEffect, useRef, useMemo } from "react";
import spritesheet from "../assets/spritesheet.png";

const FRAME_SIZE = 16;
const SCALE = 4;
const SPRITE_SIZE = FRAME_SIZE * SCALE;

const QUOTES_JA = [
  "あと1行だけ...",
  "Coffee.exeが見つかりません",
  "ローカル環境では動いたのに！",
  "このコード書いたの誰だ？あ、俺か...",
  "定時まだかな...",
  "タブ派？スペース派？",
  "バグを直してバグを作る仕事",
  "git commit -m 'いろいろ修正'",
  "StackOverflowが落ちてる...",
  "睡眠もコンパイルの一部です",
  "モチベーションをロード中...",
  "バグは仕様です"
];

const QUOTES_EN = [
  "Just one more line...",
  "Coffee.exe not found.",
  "It works on my machine!",
  "Who wrote this code? Oh, me.",
  "Is it launch time yet?",
  "Tabs or spaces?",
  "Solving bugs, creating bugs...",
  "Git commit -m 'fixed things'",
  "StackOverflow is down!",
  "Sleeping is compiling...",
  "Loading motivation...",
  "It's not a bug, it's a feature."
];

const SKILLS = [
  {
    id: "basics",
    nameJa: "クリーンコード",
    nameEn: "Clean Code",
    descJa: "読みやすく整理されたコード。すべてのプログラミングの基礎であり、すべてのスキルの起点です。",
    descEn: "Write well-structured code. The absolute foundation of all programming skills.",
    icon: "💻",
    cost: 1,
    x: 50,
    y: 12,
    requires: [],
  },
  {
    id: "frontend",
    nameJa: "フロントエンド開発",
    nameEn: "Frontend Dev",
    descJa: "美しく反応の良いUI。プレイヤーの目に見えるインターフェースとアニメーションを磨きます。",
    descEn: "Build beautiful and responsive interfaces. Polishes layouts and visual feedback.",
    icon: "🎨",
    cost: 1,
    x: 30,
    y: 32,
    requires: ["basics"],
  },
  {
    id: "backend",
    nameJa: "バックエンド開発",
    nameEn: "Backend Dev",
    descJa: "サーバーの設計とロジック。ゲームデータやAPIのリクエスト処理を高速化します。",
    descEn: "Manage server endpoints and application logic. Optimizes API response times.",
    icon: "🗄️",
    cost: 1,
    x: 70,
    y: 32,
    requires: ["basics"],
  },
  {
    id: "css_magic",
    nameJa: "CSSの魔術",
    nameEn: "CSS Wizardry",
    descJa: "FlexboxやGridを自在に操り、どんな要素も検索することなく一瞬で中央揃えにします。",
    descEn: "Understand layout styling perfectly. Allows centering a div instantly without searching.",
    icon: "🪄",
    cost: 2,
    x: 18,
    y: 54,
    requires: ["frontend"],
  },
  {
    id: "react_ninja",
    nameJa: "Reactの真髄",
    nameEn: "React Mastery",
    descJa: "レンダリングの最適化とカスタムフックの構築。無駄な再レンダリングを完全に防ぎます。",
    descEn: "Master custom hooks and state updates. Prevents redundant browser paint cycles.",
    icon: "⚛️",
    cost: 2,
    x: 42,
    y: 54,
    requires: ["frontend"],
  },
  {
    id: "sql_opt",
    nameJa: "DBチューニング",
    nameEn: "Database Tuning",
    descJa: "インデックスの追加と効率的なクエリ作成。重いJOIN処理を電光石火の速さで終わらせます。",
    descEn: "Optimize slow DB indexes and schema design. Executes heavy queries in milliseconds.",
    icon: "⚡",
    cost: 2,
    x: 58,
    y: 54,
    requires: ["backend"],
  },
  {
    id: "cloud_scale",
    nameJa: "クラウド設計",
    nameEn: "Cloud Architect",
    descJa: "サーバーレスアーキテクチャの導入。アクセス急増に耐えうる拡張設計を構築します。",
    descEn: "Deploy flexible serverless infrastructure. Builds auto-scaling server groups.",
    icon: "☁️",
    cost: 2,
    x: 82,
    y: 54,
    requires: ["backend"],
  },
  {
    id: "fullstack",
    nameJa: "フルスタック統合",
    nameEn: "Fullstack Unity",
    descJa: "フロントとバックエンドのシームレスな通信。両者の壁を取り除き、高速なデータ通信を実現します。",
    descEn: "Bridge frontend and backend seamlessly. Eliminates latency between client and DB.",
    icon: "🚀",
    cost: 3,
    x: 50,
    y: 74,
    requires: ["react_ninja", "sql_opt"],
  },
  {
    id: "ai_copilot",
    nameJa: "AIアシスタント",
    nameEn: "AI Copilot",
    descJa: "開発環境にAIコパイロットを導入。関数やテストコードを一瞬で自動生成します。",
    descEn: "Integrate powerful local AI models. Auto-generates functions and boilerplate code.",
    icon: "🤖",
    cost: 4,
    x: 35,
    y: 90,
    requires: ["fullstack"],
  },
  {
    id: "caffeine",
    nameJa: "無限コーヒー",
    nameEn: "Caffeine Infusion",
    descJa: "カフェインをコードへ変換する効率を200%向上。徹夜をしてもバグが出なくなります。",
    descEn: "Converts caffeine into lines of working code at a 200% efficiency. Sleep is optional.",
    icon: "☕",
    cost: 4,
    x: 65,
    y: 90,
    requires: ["fullstack"],
  },
];

function Sprite({ index, className = "", style = {} }) {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return (
    <div
      className={`pixelated ${className}`}
      style={{
        width: FRAME_SIZE,
        height: FRAME_SIZE,
        backgroundImage: `url(${spritesheet})`,
        backgroundPosition: `-${col * FRAME_SIZE}px -${row * FRAME_SIZE}px`,
        transform: `scale(${SCALE})`,
        transformOrigin: "top left",
        imageRendering: "pixelated",
        ...style,
      }}
    />
  );
}

function DeveloperDesk({ id, isSleeping = false, sleepFrame = 0, lang = "ja" }) {
  const [isVisible, setIsVisible] = useState(false);
  const deskRef = useRef(null);

  useEffect(() => {
    const currentDesk = deskRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (currentDesk) {
      observer.observe(currentDesk);
    }

    return () => {
      if (currentDesk) {
        observer.unobserve(currentDesk);
      }
    };
  }, []);

  const [isNaked] = useState(() => Math.random() < 0.02);
  const charIndex = isSleeping ? (14 + sleepFrame) : (isNaked ? 17 : 13);

  const quotes = lang === "ja" ? QUOTES_JA : QUOTES_EN;
  const quote = quotes[id % quotes.length];

  return (
    <div
      ref={deskRef}
      className="relative m-2 group cursor-pointer"
      style={{ width: SPRITE_SIZE, height: SPRITE_SIZE }}
    >
      {isVisible && (
        <>
          {/* Desk background (index 12) */}
          <Sprite index={12} className="absolute inset-0" />
          {/* Character sitting/sleeping */}
          <Sprite index={charIndex} className="absolute inset-0" />
          
          {isSleeping && (
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 text-blue-500 font-bold text-xl select-none pointer-events-none animate-sway-z"
              style={{ zIndex: 20 }}
            >
              Z
            </div>
          )}

          {/* Tooltip on hover */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900/95 text-white text-[10px] rounded-lg px-2.5 py-1.5 shadow-2xl border border-slate-700 w-36 text-center z-30 pointer-events-none transition-all duration-200">
            <div className="font-bold text-indigo-400">Developer X #{id + 1}</div>
            <div className="text-gray-300 font-mono text-[9px] mt-0.5">{isSleeping ? (lang === "ja" ? "💤 睡眠中..." : "💤 Sleeping") : (lang === "ja" ? "💻 開発中..." : "💻 Coding...")}</div>
            <div className="text-gray-400 italic text-[8px] mt-1 leading-tight border-t border-slate-700/50 pt-1">"{quote}"</div>
          </div>
        </>
      )}
    </div>
  );
}

function WalkingDeveloper({ containerRect }) {
  const elRef = useRef(null);
  const posRef = useRef({
    x: 0,
    y: 0,
    direction: 0,
    animStep: 0,
    isWalking: false,
  });

  const velocityRef = useRef({ x: 0, y: 0 });
  const frameCounterRef = useRef(0);
  const stateTimerRef = useRef(0);
  const lastTimeRef = useRef(0);

  const [spriteIndex, setSpriteIndex] = useState(0);

  useEffect(() => {
    let requestRef;

    if (lastTimeRef.current === 0) {
      posRef.current = {
        x: Math.random() * (containerRect.width - SPRITE_SIZE),
        y: Math.random() * (containerRect.height - SPRITE_SIZE),
        direction: 0,
        animStep: 0,
        isWalking: false,
      };
      stateTimerRef.current = Math.random() * 2000;
      lastTimeRef.current = performance.now();
      if (elRef.current) {
        elRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
      }
    }

    const move = (time) => {
      const deltaTime = Math.min(time - lastTimeRef.current, 100);
      lastTimeRef.current = time;

      const pos = posRef.current;
      const maxX = containerRect.width - SPRITE_SIZE;
      const maxY = containerRect.height - SPRITE_SIZE;

      pos.x += velocityRef.current.x * (deltaTime / 10);
      pos.y += velocityRef.current.y * (deltaTime / 10);

      if (pos.x < 0) { pos.x = 0; velocityRef.current.x *= -1; }
      if (pos.x > maxX) { pos.x = maxX; velocityRef.current.x *= -1; }
      if (pos.y < 0) { pos.y = 0; velocityRef.current.y *= -1; }
      if (pos.y > maxY) { pos.y = maxY; velocityRef.current.y *= -1; }

      const vx = velocityRef.current.x;
      const vy = velocityRef.current.y;
      
      let newDirection = pos.direction;
      let newIsWalking = pos.isWalking;
      let newAnimStep = pos.animStep;

      if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
        newIsWalking = true;
        if (Math.abs(vx) > Math.abs(vy)) {
          newDirection = vx > 0 ? 2 : 3;
        } else {
          newDirection = vy > 0 ? 0 : 1;
        }
      } else {
        newIsWalking = false;
      }

      if (newIsWalking) {
        frameCounterRef.current += deltaTime;
        const speed = Math.sqrt(vx * vx + vy * vy);
        const frameDuration = speed > 0 ? 150 / speed : 150;

        if (frameCounterRef.current > frameDuration) {
          newAnimStep = (newAnimStep + 1) % 4;
          frameCounterRef.current = 0;
        }
      } else {
        newAnimStep = 0;
      }

      pos.direction = newDirection;
      pos.isWalking = newIsWalking;
      pos.animStep = newAnimStep;

      if (elRef.current) {
        elRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      }

      const col = [0, 1, 0, 2][newAnimStep];
      const nextSpriteIndex = newDirection * 3 + col;
      
      setSpriteIndex((prev) => {
        if (prev !== nextSpriteIndex) {
          return nextSpriteIndex;
        }
        return prev;
      });

      stateTimerRef.current -= deltaTime;
      if (stateTimerRef.current <= 0) {
        const isIdle = velocityRef.current.x === 0 && velocityRef.current.y === 0;
        if (isIdle) {
          const speed = 0.5 + Math.random() * 0.5;
          const rand = Math.random();
          if (rand < 0.25) velocityRef.current = { x: speed, y: 0 };
          else if (rand < 0.5) velocityRef.current = { x: -speed, y: 0 };
          else if (rand < 0.75) velocityRef.current = { x: 0, y: speed };
          else velocityRef.current = { x: 0, y: -speed };
          stateTimerRef.current = 2000 + Math.random() * 3000;
        } else {
          velocityRef.current = { x: 0, y: 0 };
          stateTimerRef.current = 1000 + Math.random() * 2000;
        }
      }

      requestRef = requestAnimationFrame(move);
    };

    requestRef = requestAnimationFrame(move);
    return () => cancelAnimationFrame(requestRef);
  }, [containerRect]);

  return (
    <div 
      ref={elRef}
      className="absolute z-20 pointer-events-none"
      style={{
        width: SPRITE_SIZE,
        height: SPRITE_SIZE,
        willChange: "transform",
        transform: "translate3d(0px, 0px, 0)"
      }}
    >
      <Sprite index={spriteIndex} />
    </div>
  );
}

export default function DeveloperTab({ developerCount = 0, developerXStates = [], normalDeveloperCount = 0, onWakeAll, t }) {
  const containerRef = useRef(null);
  const treeRef = useRef(null);
  const [subTab, setSubTab] = useState("office");
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const lang = t && t("tabs.developer") ? (t("tabs.developer").includes("開発者") ? "ja" : "en") : "ja";

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.scrollWidth,
          height: containerRef.current.scrollHeight,
        });
      }
    };
    updateSize();
    const timer = setTimeout(updateSize, 500);
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
      clearTimeout(timer);
    };
  }, [developerCount, subTab]);

  useEffect(() => {
    if (treeRef.current) {
      const handleResize = () => {
        setDimensions({
          width: treeRef.current.clientWidth,
          height: treeRef.current.clientHeight,
        });
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      const timer = setTimeout(handleResize, 100);
      return () => {
        window.removeEventListener("resize", handleResize);
        clearTimeout(timer);
      };
    }
  }, [subTab]);

  const displayCount = Math.min(Math.floor(developerCount), 100);
  const devs = useMemo(() => Array.from({ length: displayCount }, (_, i) => i), [displayCount]);

  const walkingCount = Math.min(Math.floor(developerCount / 10), 5);
  const walkingDevs = useMemo(() => Array.from({ length: walkingCount }, (_, i) => i), [walkingCount]);

  const anySleeping = useMemo(() => {
    return (developerXStates || []).some((dev) => dev.isSleeping);
  }, [developerXStates]);

  const wakeUpText = t ? t("ui.wake_up_all") : "Wake Up!";
  const awakeText = t ? t("ui.awake") : "Awake";

  const isSkillsUnlocked = normalDeveloperCount >= 1000;

  // Local state for interactive skill tree
  const [unlockedSkills, setUnlockedSkills] = useState(() => {
    try {
      const saved = localStorage.getItem("dev_skills");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("dev_skills", JSON.stringify(unlockedSkills));
  }, [unlockedSkills]);

  const maxPoints = Math.max(0, Math.floor(normalDeveloperCount / 100) - 9);
  const spentPoints = useMemo(() => {
    return SKILLS.filter(s => unlockedSkills.includes(s.id)).reduce((sum, s) => sum + s.cost, 0);
  }, [unlockedSkills]);
  const availablePoints = Math.max(0, maxPoints - spentPoints);

  const unlockSkill = (skill) => {
    if (unlockedSkills.includes(skill.id)) return;
    const canUnlock = skill.requires.every(reqId => unlockedSkills.includes(reqId)) && availablePoints >= skill.cost;
    if (canUnlock) {
      setUnlockedSkills(prev => [...prev, skill.id]);
    }
  };

  const resetSkills = () => {
    setUnlockedSkills([]);
  };

  const connections = useMemo(() => {
    const list = [];
    SKILLS.forEach(skill => {
      skill.requires.forEach(reqId => {
        const parent = SKILLS.find(s => s.id === reqId);
        if (parent) {
          list.push({
            from: parent,
            to: skill,
            active: unlockedSkills.includes(parent.id) && unlockedSkills.includes(skill.id),
            halfActive: unlockedSkills.includes(parent.id),
          });
        }
      });
    });
    return list;
  }, [unlockedSkills]);

  return (
    <div className="w-full h-[550px] bg-slate-950 rounded-2xl relative border-2 border-slate-800 shadow-2xl flex flex-col overflow-hidden text-white transition-all duration-300">
      {/* Header Tabs */}
      <div className="flex justify-between items-center bg-slate-900 border-b border-slate-800 px-4 py-2 z-30">
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab("office")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border-b-2 ${
              subTab === "office"
                ? "bg-slate-800/80 text-white border-indigo-500"
                : "text-slate-400 border-transparent hover:text-white"
            }`}
          >
            {lang === "ja" ? "オフィス 👩‍💻" : "Office 👩‍💻"}
          </button>
          <button
            onClick={() => setSubTab("skills")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border-b-2 flex items-center gap-1 ${
              subTab === "skills"
                ? "bg-slate-800/80 text-white border-indigo-500"
                : "text-slate-400 border-transparent hover:text-white"
            }`}
          >
            {lang === "ja" ? "スキルツリー ⚡" : "Skill Tree ⚡"}
            {!isSkillsUnlocked && (
              <span className="text-[10px] bg-slate-800 text-slate-500 border border-slate-700 px-1 py-0.5 rounded flex items-center gap-0.5">
                🔒 Locked
              </span>
            )}
          </button>
        </div>

        {subTab === "office" ? (
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
            Capacity: {displayCount} / {Math.floor(developerCount)}
          </span>
        ) : (
          isSkillsUnlocked && (
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-indigo-300">
                {lang === "ja" ? `開発者ポイント (DP): ${availablePoints} / ${maxPoints}` : `Developer Points (DP): ${availablePoints} / ${maxPoints}`}
              </span>
              <button
                onClick={resetSkills}
                className="px-2 py-0.5 border border-slate-700 hover:border-red-500 hover:text-red-400 text-slate-400 rounded text-[10px] font-bold transition-colors"
              >
                {lang === "ja" ? "リセット" : "Reset"}
              </button>
            </div>
          )
        )}
      </div>

      {subTab === "office" ? (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-900 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px]">
          {/* Visual background guide */}
          <div className="absolute inset-0 flex items-center justify-center text-slate-850 font-black text-4xl uppercase tracking-widest pointer-events-none select-none opacity-10">
            Developer Office
          </div>

          <div className="p-2 border-b border-slate-850 bg-slate-950/80 flex justify-between items-center z-10 shadow-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {lang === "ja" ? `通常開発者: ${normalDeveloperCount}人` : `Normal Devs: ${normalDeveloperCount}`}
            </span>
            {developerCount > 0 && onWakeAll && (
              <button
                onClick={onWakeAll}
                disabled={!anySleeping}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-b-4 transition-all shadow-md group ${
                  anySleeping
                    ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-950 border-yellow-600 active:border-b-0 active:translate-y-[4px] cursor-pointer"
                    : "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-50"
                }`}
                title={anySleeping ? "Wake up all developers!" : "Everyone is awake!"}
              >
                <div className={`relative w-6 h-6 flex items-center justify-center ${anySleeping ? "animate-wobble-bell" : ""}`}>
                  <Sprite index={18} style={{ transform: "scale(1.5)", transformOrigin: "top left" }} />
                </div>
                <span className={anySleeping ? "group-hover:underline" : ""}>
                  {anySleeping ? wakeUpText : awakeText}
                </span>
              </button>
            )}
          </div>
          
          <div 
            ref={containerRef}
            className="flex-1 overflow-y-auto p-4 flex flex-wrap justify-center content-start gap-3 relative"
          >
            {devs.map((id) => {
              const devState = developerXStates[id] || { isSleeping: false, sleepFrame: 0 };
              return (
                <DeveloperDesk
                  key={id}
                  id={id}
                  isSleeping={devState.isSleeping}
                  sleepFrame={devState.sleepFrame}
                  lang={lang}
                />
              );
            })}
            
            {containerSize.width > 0 && walkingDevs.map((id) => (
              <WalkingDeveloper key={`walk-${id}`} containerRect={containerSize} />
            ))}

            {displayCount === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 font-bold italic z-10 gap-2 mt-20">
                <span className="text-4xl opacity-40">💻</span>
                <span>No developers summoned yet...</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        // SKILL TREE SUBTAB
        <div className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden">
          {!isSkillsUnlocked ? (
            /* LOCKED CONTAINER */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-25 relative bg-slate-900/60 backdrop-blur-sm">
              <div className="absolute inset-0 bg-slate-950 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
              <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-700/50 flex items-center justify-center text-4xl shadow-2xl relative mb-6 animate-pulse">
                🔒
              </div>
              <h2 className="text-xl font-bold text-slate-200 mb-2">
                {lang === "ja" ? "開発者スキルツリー未解放" : "Developer Skill Tree Locked"}
              </h2>
              <p className="text-slate-400 text-xs max-w-sm mb-6 leading-relaxed">
                {lang === "ja"
                  ? "開発者の可能性は無限大です。チームをさらに成長させて、高度な技術ツリーを解放しましょう！"
                  : "The potential of developers is infinite. Grow your team further to unlock the advanced tech tree!"}
              </p>
              
              {/* Unlock criteria progress bar */}
              <div className="w-64 flex flex-col gap-1 text-left">
                <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                  <span>PROGRESS</span>
                  <span>{normalDeveloperCount} / 1,000</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                    style={{ width: `${Math.min((normalDeveloperCount / 1000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* UNLOCKED MOCK SKILL TREE */
            <div ref={treeRef} className="flex-1 w-full relative overflow-hidden bg-slate-900/40">
              <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />
              
              {/* Connection lines using SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {dimensions.width > 0 && connections.map((conn, idx) => {
                  const x1 = (conn.from.x / 100) * dimensions.width;
                  const y1 = (conn.from.y / 100) * dimensions.height;
                  const x2 = (conn.to.x / 100) * dimensions.width;
                  const y2 = (conn.to.y / 100) * dimensions.height;
                  
                  const pathData = `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`;
                  
                  let strokeColor = "#1e293b"; // Dim slate for locked
                  let glowColor = "transparent";
                  let strokeWidth = 2;
                  
                  if (conn.active) {
                    strokeColor = "#fbbf24"; // Bright gold for active
                    glowColor = "rgba(251, 191, 36, 0.3)";
                    strokeWidth = 3;
                  } else if (conn.halfActive) {
                    strokeColor = "#6366f1"; // Indigo for partial paths
                    glowColor = "rgba(99, 102, 241, 0.15)";
                    strokeWidth = 2;
                  }
                  
                  return (
                    <g key={idx}>
                      {glowColor !== "transparent" && (
                        <path
                          d={pathData}
                          stroke={glowColor}
                          strokeWidth={strokeWidth + 4}
                          fill="none"
                          className="transition-all duration-300"
                        />
                      )}
                      <path
                        d={pathData}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        fill="none"
                        className="transition-all duration-300"
                        strokeDasharray={conn.active ? "none" : conn.halfActive ? "3,3" : "none"}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Render nodes */}
              {SKILLS.map((skill) => {
                const isUnlocked = unlockedSkills.includes(skill.id);
                const isParentUnlocked = skill.requires.every(reqId => unlockedSkills.includes(reqId));
                const canAfford = availablePoints >= skill.cost;
                const isAvailable = isParentUnlocked && !isUnlocked;
                
                let borderStyle = "border-slate-800 bg-slate-950/90 text-slate-600";
                let glowStyle = "";
                
                if (isUnlocked) {
                  borderStyle = "border-yellow-400 bg-yellow-950/30 text-yellow-300 ring-2 ring-yellow-400/20";
                  glowStyle = "shadow-[0_0_15px_rgba(250,204,21,0.25)]";
                } else if (isAvailable) {
                  if (canAfford) {
                    borderStyle = "border-indigo-400 bg-slate-900/90 text-white cursor-pointer hover:border-indigo-350 hover:bg-slate-800/90";
                    glowStyle = "shadow-[0_0_10px_rgba(99,102,241,0.3)] hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse";
                  } else {
                    borderStyle = "border-indigo-900 bg-slate-950/95 text-indigo-500 cursor-not-allowed";
                  }
                }
                
                return (
                  <div
                    key={skill.id}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl transition-all duration-200 select-none z-10 ${borderStyle} ${glowStyle}`}
                    style={{ left: `${skill.x}%`, top: `${skill.y}%` }}
                    onClick={() => isAvailable && canAfford && unlockSkill(skill)}
                  >
                    {skill.icon}
                    
                    {/* Node level badge / checkmark */}
                    {isUnlocked && (
                      <span className="absolute -bottom-1 -right-1 bg-yellow-500 text-yellow-950 rounded-full w-4 h-4 text-[9px] font-bold flex items-center justify-center">
                        ✓
                      </span>
                    )}

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col bg-slate-900/95 text-white text-xs rounded-xl p-3 shadow-2xl border border-slate-700 w-56 text-left z-35 pointer-events-none transition-all duration-200">
                      <div className="flex justify-between items-center border-b border-slate-700 pb-1.5 mb-1.5">
                        <span className="font-bold text-indigo-400">{lang === "ja" ? skill.nameJa : skill.nameEn}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${isUnlocked ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-800 text-slate-400"}`}>
                          {isUnlocked ? (lang === "ja" ? "解放済" : "Unlocked") : `${skill.cost} DP`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal">{lang === "ja" ? skill.descJa : skill.descEn}</p>
                      {!isUnlocked && (
                        <div className="mt-2 text-[10px] font-bold border-t border-slate-850 pt-1.5">
                          {isAvailable ? (
                            canAfford ? (
                              <span className="text-green-400 animate-pulse">👉 {lang === "ja" ? "クリックして解放" : "Click to Unlock"}</span>
                            ) : (
                              <span className="text-red-400">❌ {lang === "ja" ? "ポイント不足" : "Not enough DP"}</span>
                            )
                          ) : (
                            <span className="text-slate-500">🔒 {lang === "ja" ? "前提スキルが必要" : "Locked (Prerequisites required)"}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Skill Tree Bottom Info Message */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl text-center z-20 pointer-events-none shadow-md max-w-sm">
                <span className="text-[9px] font-mono text-slate-400">
                  {lang === "ja"
                    ? "⚠️ スキルツリーはシミュレーションです。効果は今後の追加アップデートをお待ちください。"
                    : "⚠️ Skill tree is a preview simulation. Upgrades effects will be active in a future release."}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
