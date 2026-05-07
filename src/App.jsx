import React, { useState, useEffect, useRef } from "react";
import Decimal from "break_infinity.js"; // 追加
import { useTranslation } from 'react-i18next'; 
import AdMax from './AdMax';
import AccessCounter from './AccessCounter';

//自分では無理だったごめん🙏
// 巨大な数字を読みやすくフォーマットする関数 (例: 1.23e4)
const formatNumber = (val) => {
  const dec = new Decimal(val);
  if (dec.lt(1000)) return dec.floor().toNumber().toString(); // 1000未満はそのまま
  return dec.toExponential(2).replace('+', ''); // 1.23e+4 を 1.23e4 にする
};

// 階乗を計算するヘルパー (Decimal用)
const getFactorial = (n) => {
  let res = new Decimal(1);
  for(let i = 2; i <= n; i++) res = res.times(i);
  return res;
};

const TabButton = ({ active, onClick, children }) => {
  const baseClass = "text-white font-bold py-2 px-4 rounded transition-colors";
  const activeClass = active ? "bg-green-800" : "bg-gray-500 hover:bg-blue-600";
  return (
    <button onClick={onClick} className={`${baseClass} ${activeClass}`}>
      {children}
    </button>
  );
};

const ActionButton = ({
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
};

const AchievementCard = ({ number, title, icon, isLocked }) => {
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
};

// 条件を Decimal(.gte(), .gt()) に変更
const achievementsList = [
  { key: "first-game", icon: "🐣", condition: (state) => state.games.gte(1) },
  { key: "100-game", icon: "💰", condition: (state) => state.games.gte(100) },
  { key: "1000-game", icon: "💰", condition: (state) => state.games.gte(1000) },
  { key: "100-money", icon: "🪙", condition: (state) => state.money.gt(100) },
  { key: "1000-money", icon: "💰", condition: (state) => state.money.gte(1000) },
  { key: "100000-money", icon: "👑", condition: (state) => state.money.gte(100000) },
  { key: "many-money", icon: "🤑", condition: (state) => state.money.gte(1000000000) },
  { key: "1-indie-dev", icon: "🤝", condition: (state) => state.indieDev >= 1 },
  { key: "1-company", icon: "💼", condition: (state) => state.company >= 1 },
  { key: "10-company", icon: "", condition: (state) => state.company >= 10 },
  { key: "100-company", icon: "", condition: (state) => state.company >= 100 },
  { key: "1000-company", icon: "", condition: (state) => state.company >= 1000 },
  { key: "first-upgrade", icon: "", condition: (state) => state.currentCompanyGrade >= 1 },
  { key: "last-upgrade", icon: "", condition: (state) => state.currentCompanyGrade >= 9 }
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
      language: 'en'
    };

    try {
      const saveData = localStorage.getItem("save");
      if (saveData) {
        const parsed = JSON.parse(saveData);
        return {
          ...defaultState,
          ...parsed,
          // 旧バージョンの gold を money に引き継ぐ
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
    i18n.changeLanguage(gameState.language)
  }, [gameState.language, i18n])

  useEffect(() => {
    document.documentElement.lang = gameState.language;
  }, [gameState.language])

  // 価格の計算を Decimal に置き換え
  const indieDevPrice = new Decimal(1.15).pow(gameState.indieDev).times(10).floor();
  
  const companyGrades = {
    1: t('company_grades.small'),
    2: t('company_grades.normal'),
    3: t('company_grades.big'),
    4: t('company_grades.huge'),
    5: t('company_grades.legal'),
    6: t("compmay_grades.illegal"),
    7: t('company_grades.ultimet'),
    8: t("company_grades.extreme"),
    9: t('company_grades.endless'),
    10: t("'company_grades.JIXG's")
  };
  
  // Math.floor(10 * 2.5 * 1.2 ** company * math.factorial(grade + 1))
  const companyPrice = new Decimal(1.2).pow(gameState.company || 0)
    .times(25) // 10 * 2.5
    .times(getFactorial(gameState.currentCompanyGrade + 1))
    .floor();

  // (money / 1.5) + (grade ** 5) + 1000
  const upgradeCompanyPrice = gameState.money.div(1.5)
    .plus(new Decimal(gameState.currentCompanyGrade).pow(5))
    .plus(1000)
    .floor();

  const buyIndieDev = () => {
    if (gameState.money.gte(indieDevPrice)) {
      setGameState((prev) => ({
        ...prev,
        money: prev.money.minus(indieDevPrice),
        indieDev: prev.indieDev + 1,
      }));
    }
  };

  const buyCompany = () => {
    if (gameState.money.gte(companyPrice)) {
      setGameState((prev) => ({
        ...prev,
        money: prev.money.minus(companyPrice),
        company: prev.company + 1,
      }));
    }
  };

  const upgradeCompany = () => {
    if (gameState.money.gte(upgradeCompanyPrice) && gameState.company >= 1) {
      setGameState((prev) => ({
        ...prev,
        games: new Decimal(0),
        money: new Decimal(20),
        indieDev: 0,
        company: 0,
        currentCompanyGrade: prev.currentCompanyGrade + 1,
      }))
    }
  }

  const lastTimeRef = useRef(null);

  useEffect(() => {
    let animationFrameId;

    const gameLoop = (currentTime) => {
      if (lastTimeRef.current !== null) {
        const deltaTime = new Decimal((currentTime - lastTimeRef.current) / 1000);
        
        setGameState((prev) => {
          // gamesPerSec = indieDev * (1/6) + (grade^3) * (company * (1/3.5))
          const devProd = new Decimal(prev.indieDev).div(6);
          const compProd = new Decimal(prev.currentCompanyGrade).pow(3).times(prev.company).div(3.5);
          const gamesPerSec = devProd.plus(compProd);

          const newGames = prev.games.plus(gamesPerSec.times(deltaTime));
          // money = money + Math.floor(games) * deltaTime
          const newMoney = prev.money.plus(prev.games.floor().times(deltaTime));
  
          const nextState = {
            ...prev,
            games: newGames,
            money: newMoney,
          };

          const newlyUnlocked = achievementsList.filter(
            (ach) => !nextState.unlockedAchievements.includes(ach.key) && ach.condition(nextState)
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
        })
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
        // DecimalオブジェクトはJSON.stringifyで自動的に保存可能な形式に変換されます
        const stateToSave = { ...currentState, lastSavedTime: Date.now() };
        localStorage.setItem("save", JSON.stringify(stateToSave));
        console.log("saved");
        return stateToSave;
      });
    }, 10000);

    return () => clearInterval(autoSaveInterval);
  }, []);

  return (
    <div className="p-3 md:p-5 pb-24 md:pb-5">
      <div className="flex flex-col md:flex-row">

        <div className="flex-1 border-2 md:border-4 border-gray-300 p-3 md:p-5 md:mr-5 rounded-lg overflow-hidden">
          {activeTab === "idle2" && (
            <div className="flex flex-col gap-2 break-words">
              <div className="flex md:items-center gap-3 md:gap-4 w-full my-2">
              <h1 className="text-3xl md:text-5xl font-bold">{t('ui.games', {count: formatNumber(gameState.games)})}</h1>
                <div className="w-[25%] md:w-[50%] bg-gray-200 rounded-full h-6 my-2 ml-auto shadow-inner overflow-hidden border border-gray-300 relative">
                <div 
                  className="bg-green-500 h-full" 
                  style={{ 
                    width: `${gameState.games.minus(gameState.games.floor()).times(100).toNumber()}%` 
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 drop-shadow-md">
                  {gameState.games.minus(gameState.games.floor()).times(100).floor().toNumber()}%
                </div>
              </div>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold mb-2">{t('ui.money', {count: formatNumber(gameState.money)})}</h1>
              
              <ActionButton
                onClick={buyIndieDev}
                disabled={gameState.money.lt(indieDevPrice)}
              >
                {t('actions.buy_indie', {price: formatNumber(indieDevPrice), count: gameState.indieDev})}
              </ActionButton>
              
              <ActionButton
                onClick={buyCompany}
                disabled={gameState.money.lt(companyPrice)}
              >
                {t('actions.buy_company', {price: formatNumber(companyPrice), count: gameState.company, grade: companyGrades[gameState.currentCompanyGrade]})}
              </ActionButton>
              
              <ActionButton
                onClick={upgradeCompany}
                disabled={gameState.money.lt(upgradeCompanyPrice) || gameState.company <= 0 || gameState.currentCompanyGrade >= 9}
              >
                {t('actions.upgrade_company', {price: formatNumber(upgradeCompanyPrice)})}
              </ActionButton>
                          
              {/*ad*/}
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
                  src="https://docs.google.com/forms/d/e/1FAIpQLSeRzoCLdOouLOmvHB8CneGfsPhwGZueCeXQBubKn2pZqohobQ/viewform?embedded=true" 
                  width="100%" 
                  height="868">
                  読み込んでいます…
                </iframe>
              </div>
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
                <label htmlFor="language-select" className="font-bold whitespace-nowrap">
                  Language / 言語:
                </label>
                <select
                  id="language-select"
                  value={i18n.language}
                  onChange={(e) => {
                    i18n.changeLanguage(e.target.value);

                    setGameState(prev => {
                      return {
                        ...prev,
                        language: e.target.value
                      }
                    })
                  
                  }}
                  className="flex-1 p-2 border border-gray-400 rounded bg-white text-black font-bold cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                  <option value="zh-CN">简体中文</option>
                </select>
              </div>
              <a href="https://www.buymeacoffee.com/jiaxianglif"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=jiaxianglif&button_colour=5F7FFF&font_colour=ffffff&font_family=Lato&outline_colour=000000&coffee_colour=FFDD00" /></a>
              <ActionButton
                onClick={() =>
                  localStorage.setItem("save", JSON.stringify(gameState))
                }
                colorClass="bg-green-700"
              >
                {t('actions.save')}
              </ActionButton>
              <ActionButton
                onClick={() => {
                  localStorage.clear();
                  location.reload();
                }}
                colorClass="bg-red-800"
              >
                {t('actions.clear_save')}
              </ActionButton>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-300 p-3 z-50 md:static md:w-40 md:bg-transparent md:border-t-0 md:p-0 flex flex-col gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none">
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto">
            <TabButton
              active={activeTab === "idle2"}
              onClick={() => setActiveTab("idle2")}
            >
              {t('tabs.idle2')}
            </TabButton>
            <TabButton
              active={activeTab === "achievements"}
              onClick={() => setActiveTab("achievements")}
            >
              {t('tabs.achievements')}
            </TabButton>
            <TabButton
              active={activeTab === "setting"}
              onClick={() => setActiveTab("setting")}
            >
              {t('tabs.setting')}
            </TabButton>
          </div>
          <div className="hidden md:flex justify-center">
          <AccessCounter />
          </div>
          <div className="hidden md:flex justify-center">
            <AdMax url="/ad-side.html" width="160" height="600" />
          </div>
        </div>

      </div>
    </div>
  );
}
