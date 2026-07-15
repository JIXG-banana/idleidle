import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import Decimal from "break_infinity.js";
import CryptoJS from "crypto-js";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import AccessCounter from "./AccessCounter";
import bgm from "./assets/idleidle.mp3";
import LoadingScreen from "./components/LoadingScreen";
import { formatNumber, formatTime } from "./utils/format";
import { SECRET_KEY, achievementsList, DIMENSIONS, EXPANSION_LINE, AUTOMATORS, CP_SHOP } from "./constants/gameData";
import { TabButton, ActionButton } from "./components/Buttons";
import { InfoToast, AchievementToast } from "./components/Toasts";
import {
  StaticAdsAndForm,
  SideAds,
} from "./components/GameUI";

// 定数をコンポーネント外へ移動
const BUY_AMOUNTS = [1, 2, 5, 10, 50, 100, 200];

// 等比級数の和の公式を使用して一括購入価格を計算する: a(r^n - 1) / (r - 1)
const calculateBulkPrice = (baseCost, scale, currentCount, amount) => {
  const r = new Decimal(scale);
  const a = new Decimal(baseCost).times(r.pow(currentCount));
  if (r.eq(1)) return a.times(amount);
  return a.times(r.pow(amount).minus(1)).div(r.minus(1)).floor();
};

// ティアごとの倍率計算（エボリューションとレボリューションの効果を集約）
const getTierMultiplier = (tier, evolution, cpUpgrades) => {
  const level = evolution[`tier${tier}`] || 0;
  const revLevel = Math.max(0, level - 10);
  // 自己倍率: エボリューション10回までは2^n、それ以降はレボリューション5倍
  let mult = new Decimal(2).pow(Math.min(level, 10));
  if (revLevel > 0) mult = mult.times(new Decimal(5).pow(revLevel));

  // 「一つ上のティア」へのレボリューション効果（自分より下のティアが革命している場合、自分に5倍）
  if (tier > 1) {
    const prevRev = Math.max(0, (evolution[`tier${tier - 1}`] || 0) - 10);
    if (prevRev > 0) mult = mult.times(new Decimal(5).pow(prevRev));
  }
  // 特殊ルール: エイリアン未解放時、国連(Tier 4)の革命は開発者(Tier 1)を強化
  if (tier === 1 && !cpUpgrades?.aliens) {
    const unRev = Math.max(0, (evolution.tier4 || 0) - 10);
    if (unRev > 0) mult = mult.times(new Decimal(5).pow(unRev));
  }
  return mult;
};

// Lazy load tab components
const AchievementsTab = React.lazy(
  () => import("./components/AchievementsTab"),
);
const SettingTab = React.lazy(() => import("./components/SettingTab"));
const GraphTab = React.lazy(() => import("./components/GraphTab"));
const AutomationTab = React.lazy(() => import("./components/AutomationTab"));
const CapacityTab = React.lazy(() => import("./components/CapacityTab"));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-center flex flex-col gap-4 bg-red-50 rounded-2xl border-2 border-red-200">
          <h2 className="text-xl font-bold text-red-600">
            Something went wrong.
          </h2>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold"
          >
            Reload Game
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const achievementTabRef = useRef(null);
  const moneyRef = useRef(null);
  const containerRef = useRef(null);
  // Audioインスタンスを遅延初期化
  const bgmRef = useRef(null);
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });

  // bgmRefの初期化
  useEffect(() => {
    if (!bgmRef.current) {
      bgmRef.current = new Audio(bgm);
      bgmRef.current.loop = true;
    }
  }, []);

  const updateTargetPos = useCallback(() => {
    if (achievementTabRef.current) {
      const rect = achievementTabRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      setTargetPos({
        x: centerX - window.innerWidth / 2,
        y: centerY - window.innerHeight / 2,
      });
    }
  }, [achievementTabRef]);

  useEffect(() => {
    const timer = setTimeout(updateTargetPos, 500);
    window.addEventListener("resize", updateTargetPos);
    return () => {
      window.removeEventListener("resize", updateTargetPos);
      clearTimeout(timer);
    };
  }, [updateTargetPos]);

  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("idle2");
  const [toastQueue, setToastQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [moneyEffects, setMoneyEffects] = useState([]);
  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const [offlinePopupData, setOfflinePopupData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const removeToast = useCallback((id) => {
    setToastQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const preventAutoSave = useRef(true);
  const [showHelp, setShowHelp] = useState(false);
  const offlineProcessedRef = useRef(false);

  const [gameState, setGameState] = useState(() => {
    const defaultState = {
      money: new Decimal(100),
      totalGames: new Decimal(0),
      currentGames: new Decimal(0),
      dimensions: {
        tier1: 0,
        tier2: 0,
        tier3: 0,
        tier4: 0,
        tier5: 0,
        tier6: 0,
      },
      manualDimensions: {
        tier1: 0,
        tier2: 0,
        tier3: 0,
        tier4: 0,
        tier5: 0,
        tier6: 0,
      },
      expansionLines: 0,
      automation: {
        expansion: false,
        tier1: false,
        tier2: false,
        tier3: false,
        tier4: false,
        tier5: false,
        tier6: false,
      },
      automationEnabled: {
        expansion: true,
        tier1: true,
        tier2: true,
        tier3: true,
        tier4: true,
        tier5: true,
        tier6: true,
      },
      capacityPoints: 0,
      cpUpgrades: {
        ssd: false,
        fiber: false,
        macro: false,
        aliens: false,
        satellite: false,
      },
      unlockedAchievements: [],
      languageSelected: false,
      useScientific: false,
      bgmEnabled: true,
      lastTimestamp: Date.now(),
      language: "en",
      usedLanguages: ["en"],
      resetPromptShown: false,
      evolution: {
        tier1: 0,
        tier2: 0,
        tier3: 0,
        tier4: 0,
        tier5: 0,
        tier6: 0,
      },
      buyAmountIndex: 0,
      activePromotionKey: null,
      activePromotionEndTime: 0,
      promotionCooldowns: {},
    };

    try {
      const saveData = localStorage.getItem("save");
      if (saveData) {
        let parsed;
        try {
          const bytes = CryptoJS.AES.decrypt(saveData, SECRET_KEY);
          const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
          if (!decryptedData) throw new Error("error");
          parsed = JSON.parse(decryptedData);
        } catch {
          parsed = JSON.parse(saveData);
        }
        
        const money = new Decimal(parsed.money ?? 100);
        const totalGames = new Decimal(parsed.totalGames ?? parsed.games ?? 0);
        const currentGames = new Decimal(parsed.currentGames ?? parsed.games ?? 0);

        const dimensions = parsed.dimensions ?? {
          tier1: parsed.developer ?? 0,
          tier2: parsed.company ?? 0,
          tier3: parsed.conglomerate ?? 0,
          tier4: parsed.government ?? 0,
          tier5: 0,
          tier6: 0,
        };

        const manualDimensions = parsed.manualDimensions ?? dimensions;

        return {
          ...defaultState,
          ...parsed,
          money,
          totalGames,
          currentGames,
          dimensions,
          manualDimensions,
          automation: parsed.automation ?? defaultState.automation,
          automationEnabled: parsed.automationEnabled ?? defaultState.automationEnabled,
          cpUpgrades: parsed.cpUpgrades ?? defaultState.cpUpgrades,
          evolution: parsed.evolution ?? defaultState.evolution,
        };
      }
    } catch (e) {
      console.error(e);
    }
    return { ...defaultState, resetPromptShown: true };
  });

  useEffect(() => {
    const hasSave = localStorage.getItem("save");
    if (hasSave && !gameState.resetPromptShown) {
      setShowResetPrompt(true);
    }
  }, [gameState.resetPromptShown]);

  useEffect(() => {
    i18n.changeLanguage(gameState.language);
  }, [gameState.language, i18n]);

  useEffect(() => {
    document.documentElement.lang = gameState.language;
  }, [gameState.language]);

  const format = useCallback(
    (val, decimals = 0) =>
      formatNumber(val, gameState.useScientific, gameState.language, decimals),
    [gameState.useScientific, gameState.language],
  );

  // ロード画面を一定時間後に非表示にする
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const triggerMoneyEffect = useCallback(
    (amount) => {
      if (!moneyRef.current || !containerRef.current) return;
      const rect = moneyRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const id = Date.now() + Math.random();
      const newEffect = {
        id,
        amount: `+${format(amount)}`,
        x:
          rect.left -
          containerRect.left +
          rect.width / 2 +
          (Math.random() - 0.5) * 40,
        y: rect.top - containerRect.top,
      };
      setMoneyEffects((prev) => [...prev, newEffect]);
      setTimeout(() => {
        setMoneyEffects((prev) => prev.filter((e) => e.id !== id));
      }, 2000);
    },
    [format],
  );

  const triggerRef = useRef(null);
  useEffect(() => {
    triggerRef.current = triggerMoneyEffect;
  }, [triggerMoneyEffect]);

  const getDimensionPrice = useCallback((count, tier) => {
    const dim = DIMENSIONS.find(d => d.tier === tier);
    if (!dim) return new Decimal(Infinity);
    return new Decimal(dim.baseCost).times(new Decimal(dim.scale).pow(count)).floor();
  }, []);

  const getExpansionLinePrice = useCallback((count) => {
    return new Decimal(EXPANSION_LINE.baseCost).times(new Decimal(EXPANSION_LINE.scale).pow(count)).floor();
  }, []);

  const buyAmounts = React.useMemo(() => [1, 2, 5, 10, 50, 100, 200], []);
  const currentBuyAmount = React.useMemo(() => {
    return buyAmounts[gameState.buyAmountIndex || 0] || 1;
  }, [gameState.buyAmountIndex, buyAmounts]);

  const cycleBuyAmount = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      buyAmountIndex: ((prev.buyAmountIndex || 0) + 1) % buyAmounts.length,
    }));
  }, [buyAmounts.length]);

  const getBulkPrice = useCallback(
    (priceFunc, currentCount, amount, ...extraArgs) => {
      let total = new Decimal(0);
      for (let i = 0; i < amount; i++) {
        total = total.plus(priceFunc(currentCount + i, ...extraArgs));
      }
      return total;
    },
    [],
  );

  const buyDimension = useCallback((tier) => {
    setGameState((prev) => {
      const amount = currentBuyAmount;
      const key = `tier${tier}`;
      const currentCount = prev.manualDimensions[key];
      const totalCost = getBulkPrice(getDimensionPrice, currentCount, amount, tier);
      if (prev.money.gte(totalCost)) {
        return {
          ...prev,
          money: prev.money.minus(totalCost),
          dimensions: {
            ...prev.dimensions,
            [key]: prev.dimensions[key] + amount,
          },
          manualDimensions: {
            ...prev.manualDimensions,
            [key]: currentCount + amount,
          },
        };
      }
      return prev;
    });
  }, [currentBuyAmount]);

  const buyExpansionLine = useCallback(() => {
    setGameState((prev) => {
      const amount = currentBuyAmount;
      const totalCost = calculateBulkPrice(EXPANSION_LINE.baseCost, EXPANSION_LINE.scale, prev.expansionLines, amount);
      if (prev.money.gte(totalCost)) {
        return {
          ...prev,
          money: prev.money.minus(totalCost),
          expansionLines: prev.expansionLines + amount,
        };
      }
      return prev;
    });
  }, [currentBuyAmount]);

  const buyAutomator = useCallback((key, cost) => {
    setGameState((prev) => {
      if (prev.currentGames.gte(cost) && !prev.automation[key]) {
        return {
          ...prev,
          currentGames: prev.currentGames.minus(cost),
          automation: {
            ...prev.automation,
            [key]: true,
          },
          automationEnabled: {
            ...prev.automationEnabled,
            [key]: true,
          },
        };
      }
      return prev;
    });
  }, []);

  const toggleAutomator = useCallback((key) => {
    setGameState((prev) => ({
      ...prev,
      automationEnabled: {
        ...prev.automationEnabled,
        [key]: prev.automationEnabled ? (prev.automationEnabled[key] === false ? true : false) : false,
      },
    }));
  }, []);

  const toggleAllAutomators = useCallback((enable) => {
    setGameState((prev) => {
      const nextEnabled = { ...(prev.automationEnabled || {}) };
      Object.keys(prev.automation).forEach((key) => {
        if (prev.automation[key]) {
          nextEnabled[key] = enable;
        }
      });
      return { ...prev, automationEnabled: nextEnabled };
    });
  }, []);

  const evolveTier = useCallback((tier) => {
    setGameState((prev) => {
      const currentLevel = prev.evolution[`tier${tier}`] || 0;
      // レボリューション以降は価格を指数関数的に跳ね上げる
      const req = currentLevel < 10 
        ? new Decimal(10).times(Decimal.pow(10, currentLevel))
        : new Decimal(1e11).times(Decimal.pow(1000, currentLevel - 9));

      if (new Decimal(prev.dimensions[`tier${tier}`]).gte(req)) {
        return {
          ...prev,
          manualDimensions: { ...prev.manualDimensions, [`tier${tier}`]: 0 }, // リセット
          dimensions: { ...prev.dimensions, [`tier${tier}`]: 0 },
          evolution: { ...prev.evolution, [`tier${tier}`]: currentLevel + 1 },
        };
      }
      return prev;
    });
  }, []);

  const buyCPUpgrade = useCallback((id, cost) => {
    setGameState((prev) => {
      if (prev.capacityPoints >= cost && !prev.cpUpgrades[id]) {
        return {
          ...prev,
          capacityPoints: prev.capacityPoints - cost,
          cpUpgrades: {
            ...prev.cpUpgrades,
            [id]: true,
          },
        };
      }
      return prev;
    });
  }, []);

  const unlockAchievement = useCallback((key) => {
    setGameState((prev) => {
      if (prev.unlockedAchievements.includes(key)) return prev;
      return {
        ...prev,
        unlockedAchievements: [...prev.unlockedAchievements, key],
      };
    });
  }, []);

  const resetCapacity = useCallback(() => {
    setGameState((prev) => {
      if (!prev.money.gte("1e60")) return prev;
      
      const newCP = prev.capacityPoints + 1;
      return {
        ...prev,
        money: new Decimal(100),
        totalGames: new Decimal(0),
        currentGames: new Decimal(0),
        dimensions: {
          tier1: 0,
          tier2: 0,
          tier3: 0,
          tier4: 0,
          tier5: 0,
        },
        manualDimensions: {
          tier1: 0,
          tier2: 0,
          tier3: 0,
          tier4: 0,
          tier5: 0,
        },
        expansionLines: 0,
        automation: {
          expansion: prev.cpUpgrades.ssd,
          tier1: prev.cpUpgrades.macro,
          tier2: false,
          tier3: false,
          tier4: false,
          tier5: false,
          tier6: false,
        },
        capacityPoints: newCP,
        lastTimestamp: Date.now(),
      };
    });
    setActiveTab("idle2");
    setToastQueue((q) => [
      ...q,
      {
        id: `capacity-reset-${Date.now()}`,
        icon: "🌐",
        type: "info",
        title: "Capacity Reset Successful! +1 CP",
      },
    ]);
  }, []);

  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // BGM control effect (Moved here to fix ReferenceError)
  useEffect(() => {
    if (!bgmRef.current) return;
    const audio = bgmRef.current;
    audio.loop = true;

    if (activeTab === "capacity") {
      audio.playbackRate = 0.7;
    } else {
      audio.playbackRate = 1.0;
    }

    if (gameState.bgmEnabled) {
      audio.play().catch((err) => {
        console.log("Audio play deferred until user interaction");
      });
    } else {
      audio.pause();
    }
    return () => audio.pause();
  }, [gameState.bgmEnabled, activeTab]);

  const gps = React.useMemo(() => {
    const devCount = new Decimal(gameState.dimensions.tier1);
    const expansionMult = new Decimal(1).plus(gameState.expansionLines);
    const evolutionMult = getTierMultiplier(1, gameState.evolution, gameState.cpUpgrades);
    return devCount.times(expansionMult).times(evolutionMult);
  }, [gameState.dimensions.tier1, gameState.expansionLines, gameState.evolution, gameState.cpUpgrades]);

  const mps = React.useMemo(() => {
    let rate = gameState.cpUpgrades.fiber ? 0.15 : 0.05;
    return gameState.totalGames.times(rate);
  }, [gameState.totalGames, gameState.cpUpgrades.fiber]);

  useEffect(() => {
    if (offlineProcessedRef.current) return;
    offlineProcessedRef.current = true;
    
    if (gameState.lastTimestamp) {
      const now = Date.now();
      const diffMs = now - gameState.lastTimestamp;
      
      // Only simulate if offline for more than 1 minute
      if (diffMs >= 60000) {
        const diffSeconds = diffMs / 1000;
        const simSeconds = diffSeconds;
        
        // We simulate in discrete chunks to allow higher tiers to produce lower tiers
        // which then produce resources. More chunks = more accuracy but slower start.
        const numTicks = 100; 
        const tickTime = simSeconds / numTicks;
        
        setGameState((prev) => {
          let tempState = { ...prev };
          let totalGoldGained = new Decimal(0);
          let totalGamesGained = new Decimal(0);
          
          for (let i = 0; i < numTicks; i++) {
            const { dimensions, manualDimensions, expansionLines, automation, automationEnabled, evolution, cpUpgrades } = tempState;
            
            // 1. Production Chain
            const mult = (t) => getTierMultiplier(t, evolution, cpUpgrades);
            const prodTier5 = (dimensions.tier6 * manualDimensions.tier5 * mult(6)) * tickTime;
            const prodTier4 = (dimensions.tier5 * manualDimensions.tier4 * mult(5)) * tickTime;
            const prodTier3 = (dimensions.tier4 * manualDimensions.tier3 * mult(4)) * tickTime;
            const prodTier2 = (dimensions.tier3 * manualDimensions.tier2 * mult(3)) * tickTime;
            const prodTier1 = (dimensions.tier2 * manualDimensions.tier1 * mult(2)) * tickTime;
            
            // 2. Resource Generation
            const currentGps = new Decimal(dimensions.tier1).times(new Decimal(1).plus(expansionLines)).times(mult(1));
            const gamesTick = currentGps.times(tickTime);
            totalGamesGained = totalGamesGained.plus(gamesTick);
            
            let goldRate = tempState.cpUpgrades.fiber ? 0.15 : 0.05;
            const goldTick = tempState.totalGames.plus(gamesTick.div(2)).times(goldRate).times(tickTime);
            totalGoldGained = totalGoldGained.plus(goldTick);
            
            // Update counts
            tempState.dimensions = {
              tier1: dimensions.tier1 + prodTier1,
              tier2: dimensions.tier2 + prodTier2,
              tier3: dimensions.tier3 + prodTier3,
              tier4: dimensions.tier4 + prodTier4,
              tier5: dimensions.tier5 + prodTier5,
              tier6: dimensions.tier6,
            };
            tempState.totalGames = tempState.totalGames.plus(gamesTick);
            tempState.currentGames = tempState.currentGames.plus(gamesTick);
            tempState.money = tempState.money.plus(goldTick);

            // 3. Simple Automation (once per tick to keep it manageable)
            if (automation.expansion) {
              const price = getExpansionLinePrice(tempState.expansionLines);
              if (tempState.money.gte(price)) {
                tempState.money = tempState.money.minus(price);
                tempState.expansionLines++;
              }
            }
            
            const autoTiers = [1, 2, 3, 4, 5];
            autoTiers.forEach(t => {
              if (automation[`tier${t}`] && automationEnabled?.[`tier${t}`] !== false) {
                const price = getDimensionPrice(tempState.manualDimensions[`tier${t}`], t);
                if (tempState.money.gte(price)) {
                  tempState.money = tempState.money.minus(price);
                  tempState.manualDimensions[`tier${t}`]++;
                  tempState.dimensions[`tier${t}`]++;
                }
              }
            });

            // Tier 6 (Aliens) requires CP upgrade
            if (automation.tier6 && tempState.cpUpgrades.aliens && automationEnabled?.tier6 !== false) {
              const price = getDimensionPrice(tempState.manualDimensions.tier6, 6);
              if (tempState.money.gte(price)) {
                tempState.money = tempState.money.minus(price);
                tempState.manualDimensions.tier6++;
                tempState.dimensions.tier6++;
              }
            }
            // (Other automations omitted in sim for stability/simplicity, or could be added)
          }
          
          setOfflinePopupData({ 
            time: diffMs, 
            gold: totalGoldGained, 
            games: totalGamesGained 
          });
          
          return { ...tempState, lastTimestamp: now };
        });
      } else {
        setGameState(prev => ({ ...prev, lastTimestamp: now }));
      }
    }
  }, [getDimensionPrice, getExpansionLinePrice, gameState.lastTimestamp, gameState.evolution, gameState.cpUpgrades]);

  const lastTimeRef = useRef(null);
  const gpsRef = useRef(gps);
  useEffect(() => {
    gpsRef.current = gps;
  }, [gps]);

  const accumulatedTimeRef = useRef(0);

  useEffect(() => {
    let animationFrameId;
    const RENDER_INTERVAL = 50;

    const gameLoop = (currentTime) => {
      if (lastTimeRef.current !== null) {
        let deltaMs = currentTime - lastTimeRef.current;
        accumulatedTimeRef.current += deltaMs;

        if (accumulatedTimeRef.current >= RENDER_INTERVAL) {
          const deltaTime = accumulatedTimeRef.current / 1000;
          accumulatedTimeRef.current = 0;

          setGameState((prev) => {
            const { dimensions, manualDimensions, expansionLines, automation, automationEnabled, evolution, cpUpgrades } = prev;
            
            // Production Chain: (Above Total * Current Manual)
            const mult = (t) => getTierMultiplier(t, evolution, cpUpgrades);
            const newTier5 = dimensions.tier5 + (dimensions.tier6 * manualDimensions.tier5 * mult(6)) * deltaTime;
            const newTier4 = dimensions.tier4 + (newTier5 * manualDimensions.tier4 * mult(5)) * deltaTime;
            const newTier3 = dimensions.tier3 + (newTier4 * manualDimensions.tier3 * mult(4)) * deltaTime;
            const newTier2 = dimensions.tier2 + (newTier3 * manualDimensions.tier2 * mult(3)) * deltaTime;
            const newTier1 = dimensions.tier1 + (newTier2 * manualDimensions.tier1 * mult(2)) * deltaTime;
            
            const currentGps = new Decimal(newTier1).times(new Decimal(1).plus(expansionLines)).times(mult(1));
            const gamesGained = currentGps.times(deltaTime);
            
            const newTotalGames = prev.totalGames.plus(gamesGained);
            const newCurrentGames = prev.currentGames.plus(gamesGained);
            
            let goldRate = prev.cpUpgrades.fiber ? 0.15 : 0.05;
            const goldGained = newTotalGames.times(goldRate).times(deltaTime);
            const newMoney = prev.money.plus(goldGained);
            
            let updatedMoney = newMoney;
            let updatedDimensions = { ...dimensions, tier1: newTier1, tier2: newTier2, tier3: newTier3, tier4: newTier4, tier5: newTier5, tier6: dimensions.tier6 };
            let updatedManualDimensions = { ...manualDimensions };
            let updatedExpansionLines = expansionLines;

            // Automation (Now updates both manual and total)
            if (automation.expansion && automationEnabled?.expansion !== false) {
              const price = getExpansionLinePrice(updatedExpansionLines);
              if (updatedMoney.gte(price)) {
                updatedMoney = updatedMoney.minus(price);
                updatedExpansionLines++;
              }
            }
            if (automation.tier1 && automationEnabled?.tier1 !== false) {
              const price = getDimensionPrice(updatedManualDimensions.tier1, 1);
              if (updatedMoney.gte(price)) {
                updatedMoney = updatedMoney.minus(price);
                updatedManualDimensions.tier1++;
                updatedDimensions.tier1++;
              }
            }
            if (automation.tier2 && automationEnabled?.tier2 !== false) {
              const price = getDimensionPrice(updatedManualDimensions.tier2, 2);
              if (updatedMoney.gte(price)) {
                updatedMoney = updatedMoney.minus(price);
                updatedManualDimensions.tier2++;
                updatedDimensions.tier2++;
              }
            }
            if (automation.tier3 && automationEnabled?.tier3 !== false) {
              const price = getDimensionPrice(updatedManualDimensions.tier3, 3);
              if (updatedMoney.gte(price)) {
                updatedMoney = updatedMoney.minus(price);
                updatedManualDimensions.tier3++;
                updatedDimensions.tier3++;
              }
            }
            if (automation.tier4 && automationEnabled?.tier4 !== false) {
              const price = getDimensionPrice(updatedManualDimensions.tier4, 4);
              if (updatedMoney.gte(price)) {
                updatedMoney = updatedMoney.minus(price);
                updatedManualDimensions.tier4++;
                updatedDimensions.tier4++;
              }
            }
            if (automation.tier5 && automationEnabled?.tier5 !== false) {
              const price = getDimensionPrice(updatedManualDimensions.tier5, 5);
              if (updatedMoney.gte(price)) {
                updatedMoney = updatedMoney.minus(price);
                updatedManualDimensions.tier5++;
                updatedDimensions.tier5++;
              }
            }
            if (automation.tier6 && prev.cpUpgrades.aliens && automationEnabled?.tier6 !== false) {
              const price = getDimensionPrice(updatedManualDimensions.tier6, 6);
              if (updatedMoney.gte(price)) {
                updatedMoney = updatedMoney.minus(price);
                updatedManualDimensions.tier6++;
                updatedDimensions.tier6++;
              }
            }

            return {
              ...prev,
              money: updatedMoney,
              totalGames: newTotalGames,
              currentGames: newCurrentGames,
              dimensions: updatedDimensions,
              manualDimensions: updatedManualDimensions,
              expansionLines: updatedExpansionLines,
            };
          });
        }
      }
      lastTimeRef.current = currentTime;
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [getDimensionPrice, getExpansionLinePrice]);

  useEffect(() => {
    const recordInterval = setInterval(() => {
      const state = gameStateRef.current;
      setHistory((prev) => {
        const newData = {
          time: Date.now(),
          games: state.totalGames.toNumber(),
          money: state.money.toNumber(),
          developer: state.dimensions.tier1,
          company: state.dimensions.tier2,
          conglomerate: state.dimensions.tier3,
        };
        const next = [...prev, newData];
        return next.slice(-100);
      });
    }, 1000);
    return () => clearInterval(recordInterval);
  }, []);

  useEffect(() => {
    const enableTimer = setTimeout(() => { preventAutoSave.current = false; }, 2000);
    const autoSaveInterval = setInterval(() => {
      if (preventAutoSave.current) return;
      const currentState = gameStateRef.current;
      const stateToSave = { ...currentState, lastTimestamp: Date.now() };
      setTimeout(() => {
        try {
          const encrypted = CryptoJS.AES.encrypt(JSON.stringify(stateToSave), SECRET_KEY).toString();
          localStorage.setItem("save", encrypted);
        } catch (e) { console.error("Auto-save failed:", e); }
      }, 0);
    }, 20000);
    return () => {
      clearTimeout(enableTimer);
      clearInterval(autoSaveInterval);
    };
  }, []);

  const handleManualSave = useCallback(() => {
    const stateToSave = {
      ...gameStateRef.current,
      lastTimestamp: Date.now(),
    };
    try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(stateToSave), SECRET_KEY).toString();
      localStorage.setItem("save", encrypted);
      alert(t("messages.save_success"));
    } catch (e) {
      console.error("Manual save failed:", e);
    }
  }, [t]);

  const handleTabIdle2 = useCallback(() => { setActiveTab("idle2"); setTimeout(updateTargetPos, 50); }, [updateTargetPos]);
  const handleTabGraph = useCallback(() => { setActiveTab("graph"); setTimeout(updateTargetPos, 50); }, [updateTargetPos]);
  const handleTabAchievements = useCallback(() => { setActiveTab("achievements"); setTimeout(updateTargetPos, 50); }, [updateTargetPos]);
  const handleTabSetting = useCallback(() => { setActiveTab("setting"); setTimeout(updateTargetPos, 50); }, [updateTargetPos]);
  const handleTabAutomation = useCallback(() => { setActiveTab("automation"); setTimeout(updateTargetPos, 50); }, [updateTargetPos]);
  const handleTabCapacity = useCallback(() => { setActiveTab("capacity"); setTimeout(updateTargetPos, 50); }, [updateTargetPos]);

  const seenAchievementsRef = useRef(new Set());
  useEffect(() => {
    if (gameState.unlockedAchievements) {
      gameState.unlockedAchievements.forEach((key) => seenAchievementsRef.current.add(key));
    }
  }, [gameState.unlockedAchievements]);

  useEffect(() => {
    const checkAchievements = setInterval(() => {
      const currentState = gameStateRef.current;
      const newlyUnlocked = achievementsList.filter(
        (ach) => !currentState.unlockedAchievements.includes(ach.key) && !seenAchievementsRef.current.has(ach.key) && ach.condition(currentState),
      );

      if (newlyUnlocked.length > 0) {
        newlyUnlocked.forEach((ach) => seenAchievementsRef.current.add(ach.key));
        const timestamp = Date.now();
        const newToasts = newlyUnlocked.map((ach, idx) => ({
          id: `ach-${timestamp}-${ach.key}-${idx}`,
          icon: ach.icon,
          type: "achievement",
          title: t(`achievements.${ach.key}`),
        }));

        setGameState((prev) => ({
          ...prev,
          unlockedAchievements: [...prev.unlockedAchievements, ...newlyUnlocked.map((a) => a.key)],
        }));
        setToastQueue((q) => [...q, ...newToasts]);
      }
    }, 1000);
    return () => clearInterval(checkAchievements);
  }, [t]);

  useEffect(() => {
    window.game = {
      setMoney: (val) => { setGameState((prev) => ({ ...prev, money: new Decimal(val) })); },
      addMoney: (val) => { setGameState((prev) => ({ ...prev, money: prev.money.plus(new Decimal(val)) })); },
      setGames: (val) => { setGameState((prev) => ({ ...prev, currentGames: new Decimal(val), totalGames: new Decimal(val) })); },
      addGames: (val) => { setGameState((prev) => ({ ...prev, currentGames: prev.currentGames.plus(new Decimal(val)), totalGames: prev.totalGames.plus(new Decimal(val)) })); },
      reset: () => { localStorage.clear(); window.location.reload(); },
    };
    return () => { delete window.game; };
  }, []);

  return (
    <div className="p-3 md:p-5 pb-24 md:pb-5">
      <AnimatePresence>
        {isLoading && <LoadingScreen key="loader" message={t("ui.loading") || "Loading..."} />}
      </AnimatePresence>

      {!gameState.languageSelected && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
            <h2 className="text-3xl font-black mb-6 text-gray-800">{t("ui.select_language") || "Select Language"}</h2>
            <div className="flex flex-col gap-4">
              {["ja", "en", "ru", "zh-CN", "sw", "emoji"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setGameState((prev) => ({
                    ...prev,
                    language: lang,
                    languageSelected: true,
                    usedLanguages: prev.usedLanguages.includes(lang) ? prev.usedLanguages : [...prev.usedLanguages, lang],
                  }))}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
                >
                  {lang === "ja" ? "日本語" : lang === "en" ? "English" : lang === "ru" ? "Русский" : lang === "zh-CN" ? "简体中文" : lang === "sw" ? "Kiswahili" : "絵文字"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showResetPrompt && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-4 text-gray-800">{t("reset_prompt.title")}</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">{t("reset_prompt.message")}</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95">{t("reset_prompt.reset")}</button>
              <button onClick={() => { setGameState((prev) => { const newState = { ...prev, resetPromptShown: true }; localStorage.setItem("save", CryptoJS.AES.encrypt(JSON.stringify({ ...newState, lastTimestamp: Date.now() }), SECRET_KEY).toString()); return newState; }); setShowResetPrompt(false); }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 rounded-xl transition-all active:scale-95">{t("reset_prompt.continue")}</button>
            </div>
          </div>
        </div>
      )}

      {offlinePopupData && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-4xl mb-4">⏳</div>
            <h2 className="text-2xl font-black mb-4 text-gray-800">{t("help.offline_title") || "Welcome Back"}</h2>
            <p className="text-gray-600 mb-2 leading-relaxed">{t("ui.offline_stored_time_toast", { time: formatTime(offlinePopupData.time) })}</p>
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 flex flex-col gap-2 border border-gray-100">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-blue-600">{t("ui.games_unit")}</span>
                <span>+{format(offlinePopupData.games)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-yellow-600">{t("ui.money_unit") || "Gold"}</span>
                <span>+{format(offlinePopupData.gold)}</span>
              </div>
            </div>
            <button onClick={() => setOfflinePopupData(null)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-[0_4px_0_0_theme(colors.blue.800)]">{t("ui.close")}</button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        <div className="flex-1 flex flex-col" style={{ perspective: "1500px" }}>
          <motion.div
            className="flex-1 flex flex-col"
            style={{ transformOrigin: "center center" }}
            animate={{ scale: 1, rotate: 0, rotateX: 0, rotateY: 0, z: 0, opacity: 1 }}
            transition={{ duration: 0.1, ease: "linear" }}
          >
            <div className="flex-1 border-2 md:border-4 border-gray-300 p-3 md:p-5 md:mr-5 rounded-lg overflow-y-auto min-h-[500px]">
              {activeTab === "idle2" && (
                <div ref={containerRef} className="flex flex-col gap-2 break-words relative">
                  <button onClick={() => setShowHelp(true)} className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-gray-600 font-bold shadow-sm z-10">?</button>
                  <div className="flex items-center gap-2 md:gap-4 w-full my-2 pr-2 md:pr-10">
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold">{t("ui.games", { count: format(gameState.totalGames) })}</h1>
                    <span className="text-xs sm:text-base">+{format(gps, 2)}/s</span>
                  </div>
                  <div className="flex w-full items-center gap-2">
                    <h1 ref={moneyRef} className="text-xl sm:text-2xl md:text-4xl font-bold">{t("ui.money", { count: format(gameState.money) })}</h1>
                    <span className="text-xs sm:text-base">+{format(mps, 2)}/s</span>
                  </div>
                  {moneyEffects.map((e) => (
                    <div key={e.id} className="floating-money" style={{ left: e.x, top: e.y }}>{e.amount}</div>
                  ))}

                  <div className="flex justify-end mb-2">
                    <button onClick={cycleBuyAmount} className="bg-white text-gray-800 font-bold py-1 px-3 rounded border border-gray-300 shadow-sm text-sm hover:bg-gray-100 transition-colors">Buy: {currentBuyAmount}</button>
                  </div>

                  <div className="space-y-3 mt-4">
                    {DIMENSIONS.map((dim) => {
                      const totalCount = gameState.dimensions[`tier${dim.tier}`];
                      const manualCount = gameState.manualDimensions[`tier${dim.tier}`];
                      const producedCount = totalCount - manualCount;
                      const price = getBulkPrice(getDimensionPrice, manualCount, currentBuyAmount, dim.tier);
                      
                      const evolveLevel = gameState.evolution[`tier${dim.tier}`] || 0;
                      const isRevolution = evolveLevel >= 10;
                      const evolveReq = isRevolution 
                        ? new Decimal(1e11).times(Decimal.pow(1000, evolveLevel - 9)) 
                        : new Decimal(10).times(Decimal.pow(10, evolveLevel));
                      const canEvolve = new Decimal(totalCount).gte(evolveReq);

                      const baseColorClass = 
                        dim.tier === 1 ? "bg-blue-600 hover:bg-blue-700" : 
                        dim.tier === 2 ? "bg-emerald-600 hover:bg-emerald-700" : 
                        dim.tier === 3 ? "bg-amber-600 hover:bg-amber-700" : 
                        dim.tier === 4 ? "bg-red-700 hover:bg-red-800" : 
                        dim.tier === 5 ? "bg-purple-700 hover:bg-purple-800" :
                        "bg-indigo-900 hover:bg-indigo-950";
                      
                      let evolveColorClass = baseColorClass;
                      if (isRevolution) {
                        evolveColorClass = 
                          dim.tier === 1 ? "bg-blue-900 hover:bg-blue-950" : 
                          dim.tier === 2 ? "bg-emerald-900 hover:bg-emerald-950" : 
                          dim.tier === 3 ? "bg-amber-900 hover:bg-amber-950" : 
                          dim.tier === 4 ? "bg-red-950 hover:bg-black" : 
                          dim.tier === 5 ? "bg-purple-950 hover:bg-black" :
                          "bg-black hover:bg-gray-900";
                      }

                      // 生産情報のテキストを動的に変更
                      const currentMult = getTierMultiplier(dim.tier, gameState.evolution, gameState.cpUpgrades);
                      const prodInfo = dim.tier === 1 
                        ? `+${format(new Decimal(1).plus(gameState.expansionLines).times(currentMult), 2)} games/s`
                        : `+${format(new Decimal(gameState.manualDimensions[`tier${dim.tier-1}`] || 0).times(currentMult), 2)} tier${dim.tier - 1}/s`;

                      // Unlock logic: Tier 1 is always unlocked. Tier 2-5 unlock if the previous tier is owned.
                      // Tier 6 (Aliens) only unlocks if the CP upgrade 'aliens' is owned.
                      let isUnlocked = dim.tier === 1 || gameState.dimensions[`tier${dim.tier - 1}`] > 0 || totalCount > 0;
                      if (dim.tier === 6) isUnlocked = gameState.cpUpgrades.aliens;
                      
                      if (!isUnlocked) return null;

                      return (
                        <div key={dim.tier} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50/50 rounded-xl">
                          <div className="flex-1 text-sm font-bold text-gray-700 flex items-center gap-2">
                            <span className="text-xl">{dim.icon}</span>
                            <span>
                              {t(`ui.${dim.nameKey}`) || dim.nameKey}: {format(manualCount)} 
                              {producedCount > 0.01 && ` (+${format(producedCount)})`} {t(`ui.${dim.nameKey}_owned`) || "owned"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <ActionButton 
                              onClick={() => buyDimension(dim.tier)} 
                              disabled={gameState.money.lt(price)} 
                              currentValue={gameState.money} 
                              targetValue={price}
                          colorClass={baseColorClass}
                              progressColorClass="bg-white/20"
                            >
                              {currentBuyAmount > 1 ? `x${currentBuyAmount} ` : ""}{t(`actions.buy_${dim.nameKey}_btn`) || "Buy"} ({format(price)}G)
                            </ActionButton>
                            <ActionButton
                              onClick={() => evolveTier(dim.tier)}
                              disabled={!canEvolve}
                              currentValue={new Decimal(totalCount)}
                              targetValue={new Decimal(evolveReq)}
                          colorClass={evolveColorClass}
                              progressColorClass="bg-white/40"
                            >
                              {isRevolution ? (t("actions.revolution") || "Revolution") : (t("actions.evolve") || "Evolve")} ({format(evolveReq)})
                            </ActionButton>
                            <div className="w-24 text-right text-[10px] font-mono text-gray-500 italic">
                              {prodInfo}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-indigo-50/50 rounded-xl">
                      <div className="flex-1 text-sm font-bold text-indigo-800 flex items-center gap-2">
                        <span className="text-xl">{EXPANSION_LINE.icon}</span>
                        <span>{t("ui.expansion_line") || "Expansion Line"}: {format(gameState.expansionLines)} {t("ui.expansion_line_owned") || "owned"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <ActionButton 
                          onClick={buyExpansionLine} 
                          disabled={gameState.money.lt(getBulkPrice(getExpansionLinePrice, gameState.expansionLines, currentBuyAmount))} 
                          currentValue={gameState.money} 
                          targetValue={getBulkPrice(getExpansionLinePrice, gameState.expansionLines, currentBuyAmount)}
                          colorClass="bg-indigo-600 hover:bg-indigo-700"
                          progressColorClass="bg-white/20"
                        >
                          {currentBuyAmount > 1 ? `x${currentBuyAmount} ` : ""}{t("actions.expand_line_btn") || "Expand Line"} ({format(getBulkPrice(getExpansionLinePrice, gameState.expansionLines, currentBuyAmount))}G)
                        </ActionButton>
                        <div className="w-24 text-right text-[10px] font-mono text-indigo-600 font-bold">
                          +100% Prod.
                        </div>
                      </div>
                    </div>
                  </div>

                  <StaticAdsAndForm />
                </div>
              )}
              <ErrorBoundary>
                <Suspense fallback={<div className="p-10 text-center animate-pulse">{t("ui.loading")}</div>}>
                  {activeTab === "automation" && (
                    <AutomationTab 
                      gameState={gameState} 
                      t={t} 
                      format={format} 
                      onBuyAutomator={buyAutomator} 
                      onToggleAutomator={toggleAutomator}
                      onToggleAllAutomators={toggleAllAutomators}
                    />
                  )}
                  {activeTab === "capacity" && (
                    <CapacityTab 
                      gameState={gameState} 
                      t={t} 
                      format={format} 
                      onBuyCPUpgrade={buyCPUpgrade} 
                      onResetCapacity={resetCapacity} 
                    />
                  )}
                  {activeTab === "graph" && <GraphTab history={history} t={t} format={format} />}
                  {activeTab === "achievements" && <AchievementsTab gameState={gameState} t={t} onUnlockAchievement={unlockAchievement} />}
                  {activeTab === "setting" && <SettingTab gameState={gameState} setGameState={setGameState} i18n={i18n} t={t} onSave={handleManualSave} />}
                </Suspense>
              </ErrorBoundary>
            </div>
          </motion.div>
        </div>

        <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-[110] flex flex-col-reverse gap-2 items-center pointer-events-none">
          <AnimatePresence>
            {toastQueue.filter((t) => t.type !== "achievement").map((toast) => (
              <InfoToast key={toast.id} toast={toast} onComplete={() => removeToast(toast.id)} />
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showHelp && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[80vh] relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h2 className="text-2xl font-bold text-gray-800">{t("ui.help_title")}</h2>
                  <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-600 text-3xl font-light">&times;</button>
                </div>
                <div className="space-y-4 text-gray-700 leading-relaxed text-sm md:text-base">
                  <section><h3 className="font-bold text-blue-600 mb-1">{t("help.basics_title")}</h3><p>{t("help.basics_text")}</p></section>
                  <section><h3 className="font-bold text-blue-600 mb-1">{t("help.production_title") || "Production Chain"}</h3><p>{t("help.production_text") || "Higher tiers produce lower tiers. Tier 1 produces games. Games produce Gold."}</p></section>
                  <section><h3 className="font-bold text-blue-600 mb-1">{t("help.automation_title")}</h3><p>{t("help.automation_text")}</p></section>
                  <section><h3 className="font-bold text-blue-600 mb-1">{t("help.capacity_title") || "Capacity Reset"}</h3><p>{t("help.capacity_text") || "Reaching 1.00e60 Gold allows you to reset for Capacity Points (CP) to buy powerful upgrades."}</p></section>
                </div>
                <button onClick={() => setShowHelp(false)} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">{t("ui.close")}</button>
              </motion.div>
            </motion.div>
          )}
          {toastQueue.filter((toast) => toast.type === "achievement").map((toast) => (
            <AchievementToast key={toast.id} achievement={toast} targetPos={targetPos} onComplete={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>

        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-300 p-3 z-50 md:static md:w-40 md:bg-transparent md:border-t-0 md:p-0 flex flex-col gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none">
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto">
            <TabButton active={activeTab === "idle2"} onClick={handleTabIdle2}>{t("tabs.idle2")}</TabButton>
            {gameState.dimensions.tier3 > 0 && (
              <TabButton active={activeTab === "automation"} onClick={handleTabAutomation}>{t("tabs.automation") || "🤖"}</TabButton>
            )}
            <TabButton active={activeTab === "capacity"} onClick={handleTabCapacity}>{t("tabs.capacity") || "🌐"}</TabButton>
            <TabButton active={activeTab === "graph"} onClick={handleTabGraph}>{t("tabs.graph") || "📊"}</TabButton>
            <TabButton ref={achievementTabRef} active={activeTab === "achievements"} onClick={handleTabAchievements}>{t("tabs.achievements")}</TabButton>
            <TabButton active={activeTab === "setting"} onClick={handleTabSetting}>{t("tabs.setting")}</TabButton>
          </div>
          <div className="hidden md:flex justify-center"><AccessCounter /></div>
          <SideAds />
        </div>
      </div>
    </div>
  );
}
