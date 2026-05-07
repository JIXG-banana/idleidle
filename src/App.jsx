import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import Decimal from "break_infinity.js";
import { useTranslation } from "react-i18next";
import AdMax from "./AdMax";
import AccessCounter from "./AccessCounter";

// 巨大な数字を読みやすくフォーマットする関数
const formatNumber = (val) => {
  const dec = new Decimal(val);
  if (dec.lt(1000)) return dec.floor().toNumber().toString();
  return dec.toExponential(2).replace("+", "");
};

// 階乗を計算するヘルパー
const getFactorial = (n) => {
  let res = new Decimal(1);
  for (let i = 2; i <= n; i++) res = res.times(i);
  return res;
};

// ★ 最適化1: React.memo で包み、プロパティが変わらない限り再描画しないようにする
const TabButton = memo(({ active, onClick, children }) => {
  const baseClass = "text-white font-bold py-2 px-4 rounded transition-colors";
  const activeClass = active ? "bg-green-800" : "bg-gray-500 hover:bg-blue-600";
  return (
    <button onClick={onClick} className={`${baseClass} ${activeClass}`}>
      {children}
    </button>
  );
});

const ActionButton = memo(
  ({
    onClick,
    disabled,
    children,
    colorClass = "bg-blue-500 hover:bg-blue-600",
  }) => {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`mt-2 ${colorClass} text-white font-bold py-1 px-1 rounded disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors`}
      >
        {children}
      </button>
    );
  },
);

const AchievementCard = memo(({ number, title, icon, isLocked }) => {
  const baseStyles =
    "w-32 h-32 relative rounded-xl border-2 flex flex-col justify-center items-center font-bold shadow-sm transition-all duration-200";
  const stateStyles = isLocked
    ? "bg-gray-100 border-gray-300 text-gray-400 grayscale"
    : "bg-white border-gray-200 text-gray-800 hover:-translate-y-1 hover:border-yellow-400 hover:shadow-md cursor-pointer";

  return (
    <div className={`${baseStyles} ${stateStyles}`}>
      <span className="absolute top-2 left-2 text-[10px] font-mono opacity-50">
        {String(number).padStart(3, "0")}
      </span>
      <span className="text-3xl mb-1">{isLocked ? "🔒" : icon}</span>
      <span className="text-[11px] px-2 text-center leading-tight">
        {isLocked ? "???" : title}
      </span>
    </div>
  );
});

// ★ 最適化2: 激重の原因になりやすい iframe や広告を別コンポーネント化して memo 化
// これにより、毎フレームの更新時にブラウザが iframe を再評価するのを完全に防ぎます。
const StaticAdsAndForm = memo(() => (
  <>
    <div className="mt-4">
      <div className="block md:hidden flex flex-col items-center leading-[0]">
        <AdMax url="/ad-mobile.html" width="320" height="50" />
        <AdMax url="/ad-mobile2.html" width="320" height="50" />
      </div>
      <div className="hidden md:flex justify-center">
        <AdMax url="/ad.html" width="300" height="250" />
      </div>
    </div>
    <div className="w-full mt-4 rounded-md overflow-hidden bg-gray-50">
      <iframe
        title="Google Form"
        src="https://docs.google.com/forms/d/e/1FAIpQLSeRzoCLdOouLOmvHB8CneGfsPhwGZueCeXQBubKn2pZqohobQ/viewform?embedded=true"
        width="100%"
        height="868"
      >
        読み込んでいます…
      </iframe>
    </div>
  </>
));

const SideAds = memo(() => (
  <div className="hidden md:flex justify-center">
    <AdMax url="/ad-side.html" width="160" height="600" />
  </div>
));

const achievementsList = [
  { key: "first-game", icon: "🐣", condition: (state) => state.games.gte(1) },
  { key: "100-game", icon: "💰", condition: (state) => state.games.gte(100) },
  { key: "1000-game", icon: "💰", condition: (state) => state.games.gte(1000) },
  { key: "100-money", icon: "🪙", condition: (state) => state.money.gt(100) },
  {
    key: "1000-money",
    icon: "💰",
    condition: (state) => state.money.gte(1000),
  },
  {
    key: "100000-money",
    icon: "👑",
    condition: (state) => state.money.gte(100000),
  },
  {
    key: "many-money",
    icon: "🤑",
    condition: (state) => state.money.gte(1000000000),
  },
  { key: "1-indie-dev", icon: "🤝", condition: (state) => state.indieDev >= 1 },
  { key: "1-company", icon: "💼", condition: (state) => state.company >= 1 },
  { key: "10-company", icon: "", condition: (state) => state.company >= 10 },
  { key: "100-company", icon: "", condition: (state) => state.company >= 100 },
  {
    key: "1000-company",
    icon: "",
    condition: (state) => state.company >= 1000,
  },
  {
    key: "first-upgrade",
    icon: "",
    condition: (state) => state.currentCompanyGrade >= 1,
  },
  {
    key: "last-upgrade",
    icon: "",
    condition: (state) => state.currentCompanyGrade >= 9,
  },
];

export default function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("idle2");
  const [gameState, setGameState] = useState(() => {
    const defaultState = {
      money: new Decimal(20),
      games: new Decimal(0),
      dp: 0,
      players: 0,
      indieDev: 0,
      company: 0,
      currentCompanyGrade: 1,
      unlockedAchievements: [],
      language: "en",
    };

    try {
      const saveData = localStorage.getItem("save");
      if (saveData) {
        const parsed = JSON.parse(saveData);
        return {
          ...defaultState,
          ...parsed,
          money: new Decimal(parsed.money ?? parsed.gold ?? 20),
          games: new Decimal(parsed.games ?? 0),
        };
      }
      return defaultState;
    } catch {
      return defaultState;
    }
  });

  useEffect(() => {
    i18n.changeLanguage(gameState.language);
  }, [gameState.language, i18n]);

  useEffect(() => {
    document.documentElement.lang = gameState.language;
  }, [gameState.language]);

  // 価格の計算
  const indieDevPrice = new Decimal(1.15)
    .pow(gameState.indieDev)
    .times(10)
    .floor();

  const companyGrades = {
    1: t("company_grades.small"),
    2: t("company_grades.normal"),
    3: t("company_grades.big"),
    4: t("company_grades.huge"),
    5: t("company_grades.legal"),
    6: t("company_grades.illegal"),
    7: t("company_grades.ultimet"),
    8: t("company_grades.extreme"),
    9: t("company_grades.endless"),
    10: t("'company_grades.JIXG's"),
  };

  const companyPrice = new Decimal(1.2)
    .pow(gameState.company || 0)
    .times(100)
    .times(getFactorial(gameState.currentCompanyGrade + 1))
    .floor();

  const upgradeCompanyPrice = gameState.money
    .div(1.5)
    .plus(new Decimal(gameState.currentCompanyGrade).pow(5))
    .plus(1000)
    .floor();

  // ★ 最適化3: useCallbackを使って関数の再生成を防ぐ（子コンポーネントの再描画を抑えるため）
  const buyIndieDev = useCallback(() => {
    setGameState((prev) => {
      // 最新のステートを使って価格を再計算して判定（こうすることで依存配列を空にできる）
      const currentPrice = new Decimal(1.15)
        .pow(prev.indieDev)
        .times(10)
        .floor();
      if (prev.money.gte(currentPrice)) {
        return {
          ...prev,
          money: prev.money.minus(currentPrice),
          indieDev: prev.indieDev + 1,
        };
      }
      return prev;
    });
  }, []);

  const buyCompany = useCallback(() => {
    setGameState((prev) => {
      const currentPrice = new Decimal(1.2)
        .pow(prev.company || 0)
        .times(25)
        .times(getFactorial(prev.currentCompanyGrade + 1))
        .floor();
      if (prev.money.gte(currentPrice)) {
        return {
          ...prev,
          money: prev.money.minus(currentPrice),
          company: prev.company + 1,
        };
      }
      return prev;
    });
  }, []);

  const upgradeCompany = useCallback(() => {
    setGameState((prev) => {
      const currentPrice = prev.money
        .div(1.5)
        .plus(new Decimal(prev.currentCompanyGrade).pow(5))
        .plus(1000)
        .floor();
      if (
        prev.money.gte(currentPrice) &&
        prev.company >= 1 &&
        prev.currentCompanyGrade < 9
      ) {
        return {
          ...prev,
          games: new Decimal(0),
          currentCompanyGrade: prev.currentCompanyGrade + 1,
        };
      }
      return prev;
    });
  }, []);

  // ★ 最適化4: gameLoopの更新頻度の調整（スロットリング）
  const lastTimeRef = useRef(null);

  useEffect(() => {
    let animationFrameId;
    let accumulatedTime = 0;
    const RENDER_INTERVAL = 50; // 50msごとに画面を更新 (1秒間に約20回)

    const gameLoop = (currentTime) => {
      if (lastTimeRef.current !== null) {
        const deltaMs = currentTime - lastTimeRef.current;
        accumulatedTime += deltaMs;

        if (accumulatedTime >= RENDER_INTERVAL) {
          const deltaTime = new Decimal(accumulatedTime / 1000);

          setGameState((prev) => {
            const devProd = new Decimal(prev.indieDev).div(6);
            const compProd = new Decimal(prev.currentCompanyGrade)
              .pow(2.25)
              .times(prev.company)
            const gamesPerSec = devProd.plus(compProd);

            const newGames = prev.games.plus(gamesPerSec.times(deltaTime));
            const newMoney = prev.money.plus(
              prev.games.floor().times(deltaTime),
            );

            const nextState = {
              ...prev,
              games: newGames,
              money: newMoney,
            };

            const newlyUnlocked = achievementsList.filter(
              (ach) =>
                !nextState.unlockedAchievements.includes(ach.key) &&
                ach.condition(nextState),
            );

            if (newlyUnlocked.length > 0) {
              return {
                ...nextState,
                unlockedAchievements: [
                  ...nextState.unlockedAchievements,
                  ...newlyUnlocked.map((a) => a.key),
                ],
              };
            }
            return nextState;
          });

          accumulatedTime = accumulatedTime % RENDER_INTERVAL;
        }
      }

      lastTimeRef.current = currentTime;
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // オートセーブ
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      setGameState((currentState) => {
        const stateToSave = { ...currentState, lastSavedTime: Date.now() };
        localStorage.setItem("save", JSON.stringify(stateToSave));
        console.log("saved");
        return currentState; // ステート自体は変更しない
      });
    }, 1000);

    return () => clearInterval(autoSaveInterval);
  }, []);

  // タブ切り替え用のハンドラも useCallback で安定化
  const handleTabIdle2 = useCallback(() => setActiveTab("idle2"), []);
  const handleTabAchievements = useCallback(
    () => setActiveTab("achievements"),
    [],
  );
  const handleTabSetting = useCallback(() => setActiveTab("setting"), []);

  return (
    <div className="p-3 md:p-5 pb-24 md:pb-5">
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 border-2 md:border-4 border-gray-300 p-3 md:p-5 md:mr-5 rounded-lg overflow-hidden">
          {activeTab === "idle2" && (
            <div className="flex flex-col gap-2 break-words">
              <div className="flex md:items-center gap-3 md:gap-4 w-full my-2">
                <h1 className="text-3xl md:text-5xl font-bold">
                  {t("ui.games", { count: formatNumber(gameState.games) })}
                </h1>
                <div className="w-[25%] md:w-[50%] bg-gray-200 rounded-full h-6 my-2 ml-auto shadow-inner overflow-hidden border border-gray-300 relative">
                  <div
                    className="bg-green-500 h-full transition-all duration-75 ease-linear"
                    style={{
                      width: `${gameState.games.minus(gameState.games.floor()).times(100).toNumber()}%`,
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 drop-shadow-md">
                    {gameState.games
                      .minus(gameState.games.floor())
                      .times(100)
                      .floor()
                      .toNumber()}
                    %
                  </div>
                </div>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold mb-2">
                {t("ui.money", { count: formatNumber(gameState.money) })}
              </h1>

              <ActionButton
                onClick={buyIndieDev}
                disabled={gameState.money.lt(indieDevPrice)}
              >
                {t("actions.buy_indie", {
                  price: formatNumber(indieDevPrice),
                  count: gameState.indieDev,
                })}
              </ActionButton>

              <ActionButton
                onClick={buyCompany}
                disabled={gameState.money.lt(companyPrice)}
              >
                {t("actions.buy_company", {
                  price: formatNumber(companyPrice),
                  count: gameState.company,
                  grade: companyGrades[gameState.currentCompanyGrade],
                })}
              </ActionButton>

              <ActionButton
                onClick={upgradeCompany}
                disabled={
                  gameState.money.lt(upgradeCompanyPrice) ||
                  gameState.company <= 0 ||
                  gameState.currentCompanyGrade >= 9
                }
              >
                {t("actions.upgrade_company", {
                  price: formatNumber(upgradeCompanyPrice),
                })}
              </ActionButton>

              {/* iframeと広告のコンポーネント呼び出し */}
              <StaticAdsAndForm />
            </div>
          )}
          {activeTab === "achievements" && (
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              {achievementsList.map((item, index) => (
                <AchievementCard
                  key={item.key}
                  number={index}
                  icon={item.icon}
                  title={t(`achievements.${item.key}`)}
                  isLocked={!gameState.unlockedAchievements.includes(item.key)}
                />
              ))}
            </div>
          )}
          {activeTab === "setting" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3 rounded">
                <label
                  htmlFor="language-select"
                  className="font-bold whitespace-nowrap"
                >
                  Language / 言語:
                </label>
                <select
                  id="language-select"
                  value={i18n.language}
                  onChange={(e) => {
                    i18n.changeLanguage(e.target.value);
                    setGameState((prev) => ({
                      ...prev,
                      language: e.target.value,
                    }));
                  }}
                  className="flex-1 p-2 border border-gray-400 rounded bg-white text-black font-bold cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                  <option value="zh-CN">简体中文</option>
                </select>
              </div>
              <a href="https://www.buymeacoffee.com/jiaxianglif">
                <img
                  src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=jiaxianglif&button_colour=5F7FFF&font_colour=ffffff&font_family=Lato&outline_colour=000000&coffee_colour=FFDD00"
                  alt="Buy me a coffee"
                />
              </a>
              <ActionButton
                onClick={() =>
                  localStorage.setItem("save", JSON.stringify(gameState))
                }
                colorClass="bg-green-700"
              >
                {t("actions.save")}
              </ActionButton>
              <ActionButton
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                colorClass="bg-red-800"
              >
                {t("actions.clear_save")}
              </ActionButton>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-300 p-3 z-50 md:static md:w-40 md:bg-transparent md:border-t-0 md:p-0 flex flex-col gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none">
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto">
            <TabButton active={activeTab === "idle2"} onClick={handleTabIdle2}>
              {t("tabs.idle2")}
            </TabButton>
            <TabButton
              active={activeTab === "achievements"}
              onClick={handleTabAchievements}
            >
              {t("tabs.achievements")}
            </TabButton>
            <TabButton
              active={activeTab === "setting"}
              onClick={handleTabSetting}
            >
              {t("tabs.setting")}
            </TabButton>
          </div>
          <div className="hidden md:flex justify-center">
            <AccessCounter />
          </div>

          {/* サイド広告コンポーネント呼び出し */}
          <SideAds />
        </div>
      </div>
    </div>
  );
}
