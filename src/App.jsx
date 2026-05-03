import React, { useState, useEffect, useRef } from "react";
import * as math from "mathjs"
import AdMax from './AdMax';

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
      className={`mt-2 ${colorClass} text-white font-bold py-2 px-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors`}
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
        {title}
      </span>
    </div>
  );
};

const achievementsList = [
  {
    key: "first-game",
    title: "First Game",
    icon: "🐣",
    condition: (state) => state.games >= 1,
  },
  {
    key: "100-game",
    title: "100!!",
    icon: "💰",
    condition: (state) => state.games >= 100,
  },
  {
    key: "1000-game",
    title: "1000 is too big",
    icon: "💰",
    condition: (state) => state.games >= 1000,
  },
  { 
    key: "100-gold",
    title: "Rich", 
    icon: "🪙", 
    condition: (state) => state.gold > 100,
  },
  {
    key: "1000-gold",
    title: "Very Rich",
    icon: "💰",
    condition: (state) => state.gold >= 1000,
  },
  {
    key: "many-gold",
    title: "Elon Musk",
    icon: "🤑",
    condition: (state) => state.gold >= 1000000000,
  },
  {
    key: "1-indie-dev",
    title: "Team Setup",
    icon: "🤝",
    condition: (state) => state.indieDev >= 1,
  },
  {
    key: "1-company",
    title: "The company",
    icon: "💼",
    condition: (state) => state.company >= 1,
  },
  {
    key: "10000000-gold",
    title: "わーいピカピカ！",
    icon: "👑",
    condition: (state) => state.gold >= 10000000,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("idle2");
  const [gameState, setGameState] = useState(() => {
    try {
      const saveData = localStorage.getItem("save");
      return saveData
        ? JSON.parse(saveData)
        : {
            gold: 20,
            games: 0,
            dp: 0,
            players: 0,
            indieDev: 0,
            company: 0,
            currentCompanyGrade: 1,
            unlockedAchievements: [],
          };
    } catch {
      return {
        gold: 20,
        games: 0,
        dp: 0,
        players: 0,
        indieDev: 0,
        company: 0,
        currentCompanyGrade: 1,
        unlockedAchievements: [],
      };
    }
  });
  const indieDevPrice = Math.floor(10 * 1.15 * gameState.indieDev);
  const companyGrades = {
    1: "small",
    2: "normal",
    3: "big",
    4: "huge",
    5: "legal",
    6: "JIXG's",
  };
  // const currentCompanyGrade = 1
  const companyPrice = Math.floor(10 * 2.5 * 1.2 ** (gameState.company || 0) * math.factorial((gameState.currentCompanyGrade) + 1));
  const upgradeCompanyPrice = Math.floor((gameState.gold / 1.5) + (gameState.currentCompanyGrade ** 3)) + 500;

  const buyIndieDev = () => {
    if (gameState.gold >= indieDevPrice) {
      setGameState((prev) => ({
        ...prev,
        gold: prev.gold - indieDevPrice,
        indieDev: prev.indieDev + 1,
      }));
    }
  };

  const buyCompany = () => {
    if (gameState.gold >= companyPrice) {
      setGameState((prev) => ({
        ...prev,
        gold: prev.gold - companyPrice,
        company: prev.company + 1,
      }));
    }
  };

  const upgradeCompany = () => {
    if (gameState.gold >= upgradeCompanyPrice && gameState.company >= 1) {
      setGameState((prev) => ({
        ...prev,
        gold: 0,
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
        const deltaTime = (currentTime - lastTimeRef.current) / 1000;
        /*
        setGameState((prev) => ({
          ...prev,
          games: prev.games + prev.indieDev * (1 / 6) * deltaTime,
          gold: prev.gold + Math.floor(prev.games) * deltaTime,
        }));
        */
       // 正しい書き方
        setGameState((prev) => {
          const newGames = prev.games + (prev.indieDev * (1 / 6) + (prev.currentCompanyGrade ** 3) * (prev.company * (1 / 3.5))) * deltaTime;
          const newGold = prev.gold + Math.floor(prev.games) * deltaTime;
  
          const nextState = {
            ...prev,
            games: newGames,
            gold: newGold,
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
        const stateToSave = { ...currentState, lastSavedTime: Date.now() };
        localStorage.setItem("save", JSON.stringify(stateToSave));
        console.log("saved")
        return stateToSave;
      });
    }, 60000);

    return () => clearInterval(autoSaveInterval);
  }, []);

  return (
    <div className="p-3 md:p-5 pb-24 md:pb-5">
      <div className="flex flex-col md:flex-row">

        <div className="flex-1 border-2 md:border-4 border-gray-300 p-3 md:p-5 md:mr-5 rounded-lg overflow-hidden">
          {activeTab === "idle2" && (
            <div className="flex flex-col gap-2 break-words">
              <h1 className="text-3xl md:text-5xl font-bold">Games: {Math.floor(gameState.games)}</h1>
              <h1 className="text-2xl md:text-4xl font-bold mb-2">Gold: {Math.floor(gameState.gold)}</h1>
              
              <ActionButton
                onClick={buyIndieDev}
                disabled={gameState.gold < indieDevPrice}
              >
                Buy indieDev ({indieDevPrice} gold) You have{" "}
                {gameState.indieDev} indieDev
              </ActionButton>
              
              <ActionButton
                onClick={buyCompany}
                disabled={gameState.gold < companyPrice}
              >
                Buy {companyGrades[gameState.currentCompanyGrade]} company (
                {companyPrice} gold) You have {gameState.company} company
              </ActionButton>
              
              <ActionButton
                onClick={upgradeCompany}
                disabled={gameState.gold < upgradeCompanyPrice}
              >
                Reset your compnies and games to upgrade company (request at least {upgradeCompanyPrice} gold)
              </ActionButton>
                          
              {/*ad*/}
              <div className="mt-4">               
                <div className="block md:hidden flex justify-center">
                  <AdMax url="/ad-mobile.html" width="320" height="50" /> <br />
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
                  height="400" 
                  frameBorder="0" 
                  marginHeight="0" 
                  marginWidth="0">
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
                  {...item}
                  isLocked={!gameState.unlockedAchievements.includes(item.key)}
                />
              ))}
            </div>
          )}
          {activeTab === "setting" && (
            <div className="flex flex-col gap-4">
              <ActionButton
                onClick={() =>
                  localStorage.setItem("save", JSON.stringify(gameState))
                }
                colorClass="bg-green-700"
              >
                Save
              </ActionButton>
              <ActionButton
                onClick={() => {
                  localStorage.clear();
                  location.reload();
                }}
                colorClass="bg-red-800"
              >
                Clear Save
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
              idle²
            </TabButton>
            <TabButton
              active={activeTab === "achievements"}
              onClick={() => setActiveTab("achievements")}
            >
              achievements
            </TabButton>
            <TabButton
              active={activeTab === "setting"}
              onClick={() => setActiveTab("setting")}
            >
              setting
            </TabButton>
          </div>
          <div className="hidden md:flex justify-center">
            <AdMax url="/ad-side.html" width="160" height="600" />
          </div>
        </div>

      </div>
    </div>
  );


}
