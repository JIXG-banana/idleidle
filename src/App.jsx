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
import { formatNumber, formatTime } from "./utils/format";
import { SECRET_KEY, achievementsList } from "./constants/gameData";
import { TabButton, ActionButton } from "./components/Buttons";
import { InfoToast, AchievementToast } from "./components/Toasts";
import {
  AchievementCard,
  StaticAdsAndForm,
  SideAds,
} from "./components/GameUI";
import RebirthButton from "./components/RebirthButton";

// Lazy load tab components
const TimeFluxTab = React.lazy(() => import("./components/TimeFluxTab"));
const AchievementsTab = React.lazy(
  () => import("./components/AchievementsTab"),
);
const SettingTab = React.lazy(() => import("./components/SettingTab"));
const GraphTab = React.lazy(() => import("./components/GraphTab"));
const DeveloperTab = React.lazy(() => import("./components/DeveloperTab"));

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
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const achievementTabRef = useRef(null);
  const moneyRef = useRef(null);
  const containerRef = useRef(null);
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });

  const bgmRef = useRef(new Audio(bgm));

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
  const [flashes, setFlashes] = useState({
    developer: false,
    company: false,
  });
  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const [isRebirthing, setIsRebirthing] = useState(false);
  const [offlinePopupData, setOfflinePopupData] = useState(null);

  useEffect(() => {
    setAssetsLoaded(true);
  }, []);

  const flashTimers = useRef({});

  const triggerFlash = useCallback((key) => {
    if (flashTimers.current[key]) {
      clearTimeout(flashTimers.current[key]);
    }
    setFlashes((prev) => ({ ...prev, [key]: true }));
    flashTimers.current[key] = setTimeout(() => {
      setFlashes((prev) => ({ ...prev, [key]: false }));
      flashTimers.current[key] = null;
    }, 300);
  }, []);

  const removeToast = useCallback((id) => {
    setToastQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const preventAutoSave = useRef(true);
  const [showHelp, setShowHelp] = useState(false);
  const offlineProcessedRef = useRef(false);

  const [gameState, setGameState] = useState(() => {
    const defaultState = {
      money: new Decimal(50),
      games: new Decimal(0),
      dp: 0,
      players: 0,
      developer: 0,
      autoDeveloper: 0,
      currentDeveloperGrade: 1,
      automationUnlocked: false,
      company: 0,
      autoCompany: 0,
      currentCompanyGrade: 1,
      government: 0,
      autoConglomerate: 0,
      currentGovernmentGrade: 1,
      conglomerate: 0,
      currentConglomerateGrade: 1,
      unlockedAchievements: [],
      languageSelected: false,
      useScientific: false,
      bgmEnabled: true,
      lastTimestamp: Date.now(),
      language: "en",
      usedLanguages: ["en"],
      billingCount: 0,
      resetPromptShown: false,
      storedTime: 0,
      developerX: 0,
      developerXStates: [],
      isTimeFluxActive: false,
      timeFluxMultiplier: 2,
      timeFluxReferenceTime: 0,
      buyAmountIndex: 0,
      automation: {
        developer: { level: 0, enabled: false, progress: 0 },
        company: { level: 0, enabled: false, progress: 0 },
        companyUpgrade: { level: 0, enabled: false, progress: 0 },
        developerUpgrade: { level: 0, enabled: false, progress: 0 },
        conglomerateUpgrade: { level: 0, enabled: false, progress: 0 },
        governmentUpgrade: { level: 0, enabled: false, progress: 0 },
      },
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
        const language = parsed.language ?? "en";
        const usedLanguages = parsed.usedLanguages ?? [language];
        if (!usedLanguages.includes(language)) usedLanguages.push(language);

        return {
          ...defaultState,
          ...parsed,
          money: new Decimal(
            parsed.money ?? parsed.developers ?? parsed.gold ?? 50,
          ),
          developer: parsed.developer ?? parsed.indieDev ?? 0,
          games: new Decimal(parsed.games ?? 0),
          usedLanguages,
          developerXStates: parsed.developerXStates ?? Array.from({ length: parsed.developerX ?? 0 }, () => ({
            isSleeping: false,
            sleepFrame: 0,
            timeUntilNextDecision: 2 + Math.random() * 3,
          })),
          automation: {
            ...defaultState.automation,
            ...(parsed.automation ?? {}),
            developer:
              parsed.automation?.developer ??
              parsed.automation?.indieDev ??
              defaultState.automation.developer,
          },
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

  const getDeveloperPrice = useCallback((count) => {
    return new Decimal(1.15).pow(count).times(10).floor();
  }, []);

  const getCompanyPrice = useCallback((count, grade) => {
    return new Decimal(1.2)
      .pow(count || 0)
      .times(grade + 2)
      .times(25)
      .floor();
  }, []);

  const getUpgradeCompanyPrice = useCallback((grade) => {
    const adjustedExponent = Math.pow(grade - 1, 0.85);
    let basePrice = new Decimal(1000);
    const multiplier = grade >= 10 ? 10000 : 1;
    return basePrice
      .times(multiplier)
      .times(new Decimal(50).pow(adjustedExponent))
      .floor();
  }, []);

  const getUpgradeDeveloperPrice = useCallback((grade) => {
    return new Decimal(1000)
      .times(new Decimal(10).pow(Math.pow(grade - 1, 1.2)))
      .floor();
  }, []);

  const getUpgradeConglomeratePrice = useCallback((grade) => {
    return new Decimal(1e15)
      .times(new Decimal(1000).pow(Math.pow(grade - 1, 1.2)))
      .floor();
  }, []);

  const getGovernmentPrice = useCallback((count) => {
    return new Decimal(1.5).pow(count || 0).times(1e18).floor();
  }, []);

  const getUpgradeGovernmentPrice = useCallback((grade) => {
    return new Decimal(1e24)
      .times(new Decimal(10000).pow(Math.pow(grade - 1, 1.2)))
      .floor();
  }, []);

  const getConglomeratePrice = useCallback((count) => {
    return new Decimal(1.5).pow(count || 0).times(1e12).floor();
  }, []);

  const getDeveloperXPrice = useCallback((count) => {
    return new Decimal(100).pow(count).times(1e21).floor();
  }, []);

  const getAutomationUpgradeCost = useCallback((level) => {
    return level >= 50 ? new Decimal(Infinity) : new Decimal(1e12);
  }, []);

  const buyAmounts = React.useMemo(() => [1, 2, 5, 10, 50, 100, 200], []);
  const currentBuyAmount = React.useMemo(() => {
    if (!gameState.unlockedAchievements.includes("1000-game")) return 1;
    return buyAmounts[gameState.buyAmountIndex || 0] || 1;
  }, [gameState.unlockedAchievements, gameState.buyAmountIndex, buyAmounts]);

  const cycleBuyAmount = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      buyAmountIndex: ((prev.buyAmountIndex || 0) + 1) % buyAmounts.length,
    }));
  }, [buyAmounts.length]);

  useEffect(() => {
    const currentAudio = bgmRef.current;
    if (!currentAudio) return;

    if (assetsLoaded && gameState.bgmEnabled) {
      currentAudio.play().catch((e) => {
        console.log("BGM play failed:", e);
      });
    } else {
      currentAudio.pause();
    }

    return () => {
      if (currentAudio) {
        currentAudio.pause();
      }
    };
  }, [gameState.bgmEnabled, assetsLoaded]);

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

  const developerPrice = getBulkPrice(
    getDeveloperPrice,
    gameState.developer,
    currentBuyAmount,
  );
  const companyPrice = getBulkPrice(
    getCompanyPrice,
    gameState.company,
    currentBuyAmount,
    gameState.currentCompanyGrade,
  );
  const upgradeCompanyPrice = getUpgradeCompanyPrice(
    gameState.currentCompanyGrade,
  );
  const conglomeratePrice = getBulkPrice(
    getConglomeratePrice,
    gameState.conglomerate || 0,
    currentBuyAmount,
  );
  const governmentPrice = getBulkPrice(
    getGovernmentPrice,
    gameState.government || 0,
    currentBuyAmount,
  );

  const companyGrades = React.useMemo(
    () => ({
      1: t("company_grades.small"),
      2: t("company_grades.normal"),
      3: t("company_grades.big"),
      4: t("company_grades.huge"),
      5: t("company_grades.legal"),
      6: t("company_grades.illegal"),
      7: t("company_grades.ultimet"),
      8: t("company_grades.extreme"),
      9: t("company_grades.endless"),
      10: t("company_grades.JIXG"),
      11: t("company_grades.multiverse"),
      12: t("company_grades.omnipotent"),
      13: t("company_grades.eternal"),
      14: t("company_grades.godly"),
      15: t("company_grades.transcendent"),
    }),
    [t],
  );

  const companyButtonColors = React.useMemo(() => {
    const colors = [
      { color: "bg-blue-500 hover:bg-blue-600", shadow: "shadow-[0_4px_0_0_theme(colors.blue.700)]" },
      { color: "bg-emerald-500 hover:bg-emerald-600", shadow: "shadow-[0_4px_0_0_theme(colors.emerald.700)]" },
      { color: "bg-yellow-500 hover:bg-yellow-600", shadow: "shadow-[0_4px_0_0_theme(colors.yellow.700)]" },
      { color: "bg-orange-500 hover:bg-orange-600", shadow: "shadow-[0_4px_0_0_theme(colors.orange.700)]" },
      { color: "bg-red-500 hover:bg-red-600", shadow: "shadow-[0_4px_0_0_theme(colors.red.700)]" },
      { color: "bg-pink-500 hover:bg-pink-600", shadow: "shadow-[0_4px_0_0_theme(colors.pink.700)]" },
      { color: "bg-purple-500 hover:bg-purple-600", shadow: "shadow-[0_4px_0_0_theme(colors.purple.700)]" },
      { color: "bg-indigo-500 hover:bg-indigo-600", shadow: "shadow-[0_4px_0_0_theme(colors.indigo.700)]" },
      { color: "bg-gray-800 hover:bg-gray-900", shadow: "shadow-[0_4px_0_0_theme(colors.gray.950)]" },
      { color: "bg-cyan-500 hover:bg-cyan-600", shadow: "shadow-[0_4px_0_0_theme(colors.cyan.700)]" },
      { color: "bg-lime-500 hover:bg-lime-600", shadow: "shadow-[0_4px_0_0_theme(colors.lime.700)]" },
      { color: "bg-teal-500 hover:bg-teal-600", shadow: "shadow-[0_4px_0_0_theme(colors.teal.700)]" },
      { color: "bg-fuchsia-500 hover:bg-fuchsia-600", shadow: "shadow-[0_4px_0_0_theme(colors.fuchsia.700)]" },
      { color: "bg-rose-500 hover:bg-rose-600", shadow: "shadow-[0_4px_0_0_theme(colors.rose.700)]" },
      { color: "bg-sky-500 hover:bg-sky-600", shadow: "shadow-[0_4px_0_0_theme(colors.sky.700)]" },
    ];
    return colors[Math.min(gameState.currentCompanyGrade - 1, colors.length - 1)];
  }, [gameState.currentCompanyGrade]);

  const buyDeveloper = useCallback(() => {
    setGameState((prev) => {
      const amount = currentBuyAmount;
      const totalCost = getBulkPrice(getDeveloperPrice, prev.developer, amount);
      if (prev.money.gte(totalCost)) {
        return {
          ...prev,
          money: prev.money.minus(totalCost),
          developer: prev.developer + amount,
        };
      }
      return prev;
    });
  }, [getDeveloperPrice, getBulkPrice, currentBuyAmount]);

  const buyDeveloperX = useCallback(() => {
    setGameState((prev) => {
      const currentPrice = getDeveloperXPrice(prev.developerX || 0);
      if (prev.money.gte(currentPrice) && (prev.developerX || 0) < 10) {
        const newStates = [...(prev.developerXStates || [])];
        newStates.push({
          isSleeping: false,
          sleepFrame: 0,
          timeUntilNextDecision: 2 + Math.random() * 3,
        });
        return {
          ...prev,
          money: prev.money.minus(currentPrice),
          developerX: (prev.developerX || 0) + 1,
          developerXStates: newStates,
        };
      }
      return prev;
    });
  }, [getDeveloperXPrice]);

  const wakeAllDevelopers = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      developerXStates: (prev.developerXStates || []).map((dev) => ({
        ...dev,
        isSleeping: false,
        sleepFrame: 0,
        timeUntilNextDecision: 2 + Math.random() * 3,
      })),
    }));
  }, []);

  const buyCompany = useCallback(() => {
    setGameState((prev) => {
      const amount = currentBuyAmount;
      const totalCost = getBulkPrice(getCompanyPrice, prev.company, amount, prev.currentCompanyGrade);
      if (prev.money.gte(totalCost)) {
        return {
          ...prev,
          money: prev.money.minus(totalCost),
          company: prev.company + amount,
        };
      }
      return prev;
    });
  }, [getCompanyPrice, getBulkPrice, currentBuyAmount]);

  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const upgradeCompany = useCallback(() => {
    const currentState = gameStateRef.current;
    const currentPrice = getUpgradeCompanyPrice(currentState.currentCompanyGrade);
    const totalCompany = currentState.company + (currentState.autoCompany || 0);
    
    if (currentState.money.gte(currentPrice) && totalCompany >= 1 && currentState.currentCompanyGrade < 15) {
      const nextGrade = currentState.currentCompanyGrade + 1;
      setGameState((prev) => ({
        ...prev,
        money: prev.money.minus(currentPrice),
        games: new Decimal(0),
        currentCompanyGrade: nextGrade,
      }));
      setToastQueue((q) => [
        ...q,
        {
          id: `upgrade-${Date.now()}`,
          icon: "",
          type: "info",
          title: t("ui.company_upgraded", { grade: companyGrades[nextGrade] }),
        },
      ]);
    }
  }, [getUpgradeCompanyPrice, t, companyGrades]);

  const upgradeDeveloper = useCallback(() => {
    const currentState = gameStateRef.current;
    const currentPrice = getUpgradeDeveloperPrice(currentState.currentDeveloperGrade);
    const totalDev = currentState.developer + (currentState.autoDeveloper || 0);
    
    if (currentState.money.gte(currentPrice) && totalDev >= 1) {
      const nextGrade = currentState.currentDeveloperGrade + 1;
      setGameState((prev) => ({
        ...prev,
        money: prev.money.minus(currentPrice),
        currentDeveloperGrade: nextGrade,
      }));
      setToastQueue((q) => [
        ...q,
        {
          id: `upgrade-dev-${Date.now()}`,
          icon: "👨‍💻",
          type: "info",
          title: t("ui.developer_upgraded", { grade: nextGrade }),
        },
      ]);
    }
  }, [getUpgradeDeveloperPrice, t]);

  const upgradeConglomerate = useCallback(() => {
    const currentState = gameStateRef.current;
    const currentPrice = getUpgradeConglomeratePrice(currentState.currentConglomerateGrade);
    
    if (currentState.money.gte(currentPrice) && (currentState.conglomerate || 0) >= 1) {
      const nextGrade = currentState.currentConglomerateGrade + 1;
      setGameState((prev) => ({
        ...prev,
        money: prev.money.minus(currentPrice),
        currentConglomerateGrade: nextGrade,
      }));
      setToastQueue((q) => [
        ...q,
        {
          id: `upgrade-cong-${Date.now()}`,
          icon: "amber-600",
          type: "info",
          title: t("ui.conglomerate_upgraded", { grade: nextGrade }),
        },
      ]);
    }
  }, [getUpgradeConglomeratePrice, t]);

  const upgradeGovernment = useCallback(() => {
    const currentState = gameStateRef.current;
    const currentPrice = getUpgradeGovernmentPrice(currentState.currentGovernmentGrade);
    
    if (currentState.money.gte(currentPrice) && (currentState.government || 0) >= 1) {
      const nextGrade = currentState.currentGovernmentGrade + 1;
      setGameState((prev) => ({
        ...prev,
        money: prev.money.minus(currentPrice),
        currentGovernmentGrade: nextGrade,
      }));
      setToastQueue((q) => [
        ...q,
        {
          id: `upgrade-gov-${Date.now()}`,
          icon: "🏛️",
          type: "info",
          title: t("ui.government_upgraded", { grade: nextGrade }),
        },
      ]);
    }
  }, [getUpgradeGovernmentPrice, t]);

  const buyGovernment = useCallback(() => {
    setGameState((prev) => {
      const amount = currentBuyAmount;
      const totalCost = getBulkPrice(getGovernmentPrice, prev.government || 0, amount);
      if (prev.money.gte(totalCost)) {
        return {
          ...prev,
          money: prev.money.minus(totalCost),
          government: (prev.government || 0) + amount,
        };
      }
      return prev;
    });
  }, [getGovernmentPrice, getBulkPrice, currentBuyAmount]);

  const buyConglomerate = useCallback(() => {
    setGameState((prev) => {
      const amount = currentBuyAmount;
      const totalCost = getBulkPrice(getConglomeratePrice, prev.conglomerate || 0, amount);
      if (prev.money.gte(totalCost)) {
        return {
          ...prev,
          money: prev.money.minus(totalCost),
          conglomerate: (prev.conglomerate || 0) + amount,
        };
      }
      return prev;
    });
  }, [getConglomeratePrice, getBulkPrice, currentBuyAmount]);

  const upgradeAutomation = useCallback(
    (key) => {
      setGameState((prev) => {
        const currentLevel = prev.automation[key].level;
        const cost = getAutomationUpgradeCost(currentLevel);
        if (prev.games.gte(cost) && currentLevel < 50) {
          return {
            ...prev,
            games: prev.games.minus(cost),
            automation: {
              ...prev.automation,
              [key]: {
                ...prev.automation[key],
                level: 50,
                enabled: true,
              },
            },
          };
        }
        return prev;
      });
    },
    [getAutomationUpgradeCost],
  );

  const toggleAutomation = useCallback((key) => {
    setGameState((prev) => ({
      ...prev,
      automation: {
        ...prev.automation,
        [key]: {
          ...prev.automation[key],
          enabled: !prev.automation[key].enabled,
        },
      },
    }));
  }, []);

  const gps = React.useMemo(() => {
    const totalDev = new Decimal(gameState.developer).plus(gameState.autoDeveloper || 0);
    const sleepingCount = (gameState.developerXStates || []).filter((d) => d.isSleeping).length;
    let devProd = totalDev.div(6).times(gameState.currentDeveloperGrade);
    devProd = devProd.times(Math.max(0, 1 - 0.1 * sleepingCount));
    const activeDevX = Math.max(0, (gameState.developerX || 0) - sleepingCount);
    const devXProd = new Decimal(activeDevX).times(1e18);
    return devProd.plus(devXProd);
  }, [
    gameState.developer,
    gameState.autoDeveloper,
    gameState.currentDeveloperGrade,
    gameState.developerX,
    gameState.developerXStates,
  ]);

  useEffect(() => {
    if (offlineProcessedRef.current) return;
    offlineProcessedRef.current = true;
    if (gameState.lastTimestamp) {
      const now = Date.now();
      const diffMs = now - gameState.lastTimestamp;
      if (diffMs >= 60000 && gameState.currentCompanyGrade > 1) {
        setGameState((prev) => {
          const MAX_STORED = 50 * 60 * 60 * 1000;
          const devXCount = prev.developerX || 0;
          const offlineMultiplier = Math.pow(0.775, devXCount);
          const gainedTime = diffMs * offlineMultiplier;
          return {
            ...prev,
            storedTime: Math.min(MAX_STORED, (prev.storedTime || 0) + gainedTime),
            lastTimestamp: now,
          };
        });
        const devXCount = gameState.developerX || 0;
        const offlineMultiplier = Math.pow(0.775, devXCount);
        setOfflinePopupData({ time: diffMs * offlineMultiplier });
      }
    }
  }, [gameState.lastTimestamp, gameState.currentCompanyGrade, gameState.developerX]);

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

        if (deltaMs > 1000 && gameStateRef.current.currentCompanyGrade > 1) {
          const excessMs = deltaMs - 1000;
          deltaMs = 1000;
          setGameState((prev) => {
            const MAX_STORED = 50 * 60 * 60 * 1000;
            const currentStored = prev.storedTime || 0;
            const devXCount = prev.developerX || 0;
            const offlineMultiplier = Math.pow(0.775, devXCount);
            const gainedTime = excessMs * offlineMultiplier;
            const newStored = Math.min(MAX_STORED, currentStored + gainedTime);
            if (newStored === currentStored) return prev;
            return { ...prev, storedTime: newStored };
          });
        }

        accumulatedTimeRef.current += deltaMs;

        if (accumulatedTimeRef.current >= RENDER_INTERVAL) {
          const automationThreshold = 5000000;
          const currentAccumulated = accumulatedTimeRef.current;
          accumulatedTimeRef.current = 0;

          let flashesToTrigger = [];
          let billingGainToTrigger = null;

          setGameState((prev) => {
            let deltaTime = currentAccumulated / 1000;
            let newStoredTime = prev.storedTime || 0;
            let newIsTimeFluxActive = prev.isTimeFluxActive;

            if (newIsTimeFluxActive && newStoredTime > 0) {
              const multiplier = Math.min(50, prev.timeFluxMultiplier || 2);
              const speedupFactor = multiplier - 1;
              const costFactor = Math.pow(multiplier, 1.35) - 1;
              const costMs = currentAccumulated * costFactor;
              const speedupMs = currentAccumulated * speedupFactor;

              let actualSpeedupMs;
              let actualCostMs;

              if (newStoredTime >= costMs) {
                actualSpeedupMs = speedupMs;
                actualCostMs = costMs;
              } else {
                const ratio = costFactor / speedupFactor;
                actualSpeedupMs = newStoredTime / ratio;
                actualCostMs = newStoredTime;
                newIsTimeFluxActive = false;
              }
              deltaTime = (currentAccumulated + actualSpeedupMs) / 1000;
              newStoredTime -= actualCostMs;
            }

            let updatedDevXStates = [...(prev.developerXStates || [])];
            while (updatedDevXStates.length < (prev.developerX || 0)) {
              updatedDevXStates.push({
                isSleeping: false,
                sleepFrame: 0,
                timeUntilNextDecision: 2 + Math.random() * 3,
              });
            }
            if (updatedDevXStates.length > (prev.developerX || 0)) {
              updatedDevXStates.length = prev.developerX || 0;
            }

            updatedDevXStates = updatedDevXStates.map((dev) => {
              let nextTime = (dev.timeUntilNextDecision ?? (2 + Math.random() * 3)) - deltaTime;
              let isSleeping = dev.isSleeping || false;
              let sleepFrame = dev.sleepFrame || 0;
              if (nextTime <= 0) {
                if (isSleeping) {
                  // Developers no longer wake up on their own
                  sleepFrame = (sleepFrame + 1) % 3;
                  // Increased nextTime interval (5 to 10 seconds) to lower the sleep motion framerate
                  nextTime = 5 + Math.random() * 5;
                } else {
                  // Decreased sleep probability to 0.001 (0.1%) so developers sleep very rarely
                  if (Math.random() < 0.001) {
                    isSleeping = true;
                    sleepFrame = 0;
                    nextTime = 5 + Math.random() * 5;
                  } else {
                    nextTime = 2 + Math.random() * 3;
                  }
                }
              }
              return {
                ...dev,
                isSleeping,
                sleepFrame,
                timeUntilNextDecision: nextTime,
              };
            });

            const totalCompany = prev.company + (prev.autoCompany || 0);
            const developerRate = new Decimal(prev.currentCompanyGrade).pow(2.25).times(totalCompany).div(10).toNumber();
            const conglomerateRate = (prev.conglomerate || 0) * 0.1 * prev.currentConglomerateGrade;
            const governmentRate = (prev.government || 0) * 0.05 * prev.currentGovernmentGrade;

            let updatedAutoDeveloper = (prev.autoDeveloper || 0) + developerRate * deltaTime;
            let updatedAutoCompany = (prev.autoCompany || 0) + conglomerateRate * deltaTime;
            let updatedAutoConglomerate = (prev.autoConglomerate || 0) * (1 - 0.1 * deltaTime) + governmentRate * deltaTime;

            const totalDev = new Decimal(prev.developer).plus(prev.autoDeveloper || 0);
            const sleepingCount = updatedDevXStates.filter((d) => d.isSleeping).length;
            let devProd = totalDev.div(6).times(prev.currentDeveloperGrade);
            devProd = devProd.times(Math.max(0, 1 - 0.1 * sleepingCount));
            const activeDevX = Math.max(0, (prev.developerX || 0) - sleepingCount);
            const devXProd = new Decimal(activeDevX).times(1e18);
            const currentGps = devProd.plus(devXProd);

            const newGames = prev.games.plus(currentGps.times(deltaTime));
            const newMoney = prev.money.plus(prev.games.floor().times(deltaTime));
            const newAutomation = { ...prev.automation };
            let updatedMoney = newMoney;
            let updatedDeveloper = prev.developer;
            let updatedCompany = prev.company;
            let updatedGrade = prev.currentCompanyGrade;
            let updatedGovernment = prev.government || 0;
            let updatedDeveloperGrade = prev.currentDeveloperGrade;
            let updatedConglomerateGrade = prev.currentConglomerateGrade;
            let updatedGovernmentGrade = prev.currentGovernmentGrade;
            let updatedGames = newGames;
            const newAutomationUnlocked = prev.automationUnlocked || newGames.gte(automationThreshold);

            const pendingFlashes = [];
            [
              "developer", "company", "companyUpgrade", "developerUpgrade", "conglomerateUpgrade", "governmentUpgrade",
            ].forEach((key) => {
              if (newAutomation[key].level > 0 && newAutomation[key].enabled) {
                newAutomation[key] = { ...newAutomation[key] };
                const auto = newAutomation[key];
                auto.progress += auto.level * 0.1 * deltaTime;
                if (auto.progress >= 1) {
                  const buyCount = Math.floor(auto.progress);
                  auto.progress -= buyCount;
                  for (let i = 0; i < buyCount; i++) {
                    let price;
                    if (key === "developer") {
                      price = getDeveloperPrice(Math.floor(updatedDeveloper));
                      if (updatedMoney.gte(price)) {
                        updatedMoney = updatedMoney.minus(price);
                        updatedDeveloper++;
                        if (!pendingFlashes.includes("developer")) pendingFlashes.push("developer");
                      }
                    } else if (key === "company") {
                      price = getCompanyPrice(updatedCompany, prev.currentCompanyGrade);
                      if (updatedMoney.gte(price)) {
                        updatedMoney = updatedMoney.minus(price);
                        updatedCompany++;
                        if (!pendingFlashes.includes("company")) pendingFlashes.push("company");
                      }
                    } else if (key === "companyUpgrade") {
                      const totalCompanyInLoop = updatedCompany + updatedAutoCompany;
                      if (totalCompanyInLoop >= 1 && updatedGrade < 15) {
                        price = getUpgradeCompanyPrice(updatedGrade);
                        if (updatedMoney.gte(price)) {
                          updatedMoney = updatedMoney.minus(price);
                          updatedGrade++;
                          updatedGames = new Decimal(0);
                        }
                      }
                    } else if (key === "developerUpgrade") {
                      const totalDevInLoop = updatedDeveloper + updatedAutoDeveloper;
                      if (totalDevInLoop >= 1) {
                        price = getUpgradeDeveloperPrice(updatedDeveloperGrade);
                        if (updatedMoney.gte(price)) {
                          updatedMoney = updatedMoney.minus(price);
                          updatedDeveloperGrade++;
                        }
                      }
                    } else if (key === "conglomerateUpgrade") {
                      if ((prev.conglomerate || 0) >= 1) {
                        price = getUpgradeConglomeratePrice(updatedConglomerateGrade);
                        if (updatedMoney.gte(price)) {
                          updatedMoney = updatedMoney.minus(price);
                          updatedConglomerateGrade++;
                        }
                      }
                    } else if (key === "governmentUpgrade") {
                      if (updatedGovernment >= 1) {
                        price = getUpgradeGovernmentPrice(updatedGovernmentGrade);
                        if (updatedMoney.gte(price)) {
                          updatedMoney = updatedMoney.minus(price);
                          updatedGovernmentGrade++;
                        }
                      }
                    }
                  }
                }
              }
            });

            if (pendingFlashes.length > 0) flashesToTrigger = [...pendingFlashes];

            let billingEvents = 0;
            const gamesNum = prev.games.floor().toNumber();
            const timeScale = deltaTime / (RENDER_INTERVAL / 1000);
            const billingProbability = 0.00008 * (1 + (prev.currentCompanyGrade - 1) * 0.5) * timeScale;

            if (gamesNum > 0) {
              const expectedEvents = prev.games.times(billingProbability).toNumber();
              if (gamesNum > 100 || expectedEvents > 10) {
                billingEvents = Math.max(0, Math.floor(expectedEvents + (Math.random() + Math.random() + Math.random() - 1.5) * Math.sqrt(Math.max(expectedEvents, 0))));
              } else {
                for (let i = 0; i < gamesNum; i++) if (Math.random() < billingProbability) billingEvents++;
              }
            }

            let billingMoneyGained = new Decimal(0);
            if (billingEvents > 0) {
              const companyScale = new Decimal(5).pow(prev.currentCompanyGrade - 1);
              const quantityScale = new Decimal(updatedDeveloper + updatedAutoDeveloper).plus(new Decimal(updatedCompany + updatedAutoCompany).times(10)).plus(1);
              billingMoneyGained = new Decimal(billingEvents).times(Math.random() * 9 + 1).times(companyScale).times(quantityScale).times(prev.games.div(1000).plus(1)).floor();
              billingGainToTrigger = billingMoneyGained;
            }

            return {
              ...prev,
              games: updatedGames,
              money: updatedMoney.plus(billingMoneyGained),
              billingCount: (prev.billingCount || 0) + billingEvents,
              developer: updatedDeveloper,
              autoDeveloper: updatedAutoDeveloper,
              automationUnlocked: newAutomationUnlocked,
              company: updatedCompany,
              autoCompany: updatedAutoCompany,
              government: updatedGovernment,
              autoConglomerate: updatedAutoConglomerate,
              currentCompanyGrade: updatedGrade,
              currentDeveloperGrade: updatedDeveloperGrade,
              currentConglomerateGrade: updatedConglomerateGrade,
              currentGovernmentGrade: updatedGovernmentGrade,
              automation: newAutomation,
              storedTime: newStoredTime,
              isTimeFluxActive: newIsTimeFluxActive,
              developerXStates: updatedDevXStates,
            };
          });

          if (flashesToTrigger.length > 0) flashesToTrigger.forEach((key) => triggerFlash(key));
          if (billingGainToTrigger && triggerRef.current) triggerRef.current(billingGainToTrigger);
        }
      }
      lastTimeRef.current = currentTime;
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [getCompanyPrice, getDeveloperPrice, getUpgradeCompanyPrice, getUpgradeDeveloperPrice, getUpgradeConglomeratePrice, getUpgradeGovernmentPrice, triggerFlash]);

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
    const recordInterval = setInterval(() => {
      const state = gameStateRef.current;
      setHistory((prev) => {
        const newData = {
          time: Date.now(),
          games: state.games.toNumber(),
          money: state.money.toNumber(),
          developer: state.developer + (state.autoDeveloper || 0),
          company: state.company + (state.autoCompany || 0),
          conglomerate: state.conglomerate || 0,
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

  const handleTabIdle2 = useCallback(() => { setActiveTab("idle2"); setTimeout(updateTargetPos, 50); }, [updateTargetPos]);
  const handleTabTimeFlux = useCallback(() => { setActiveTab("time_flux"); setTimeout(updateTargetPos, 50); }, [updateTargetPos]);
  const handleTabAchievements = useCallback(() => { setActiveTab("achievements"); setTimeout(updateTargetPos, 50); }, [updateTargetPos]);
  const handleTabSetting = useCallback(() => { setActiveTab("setting"); setTimeout(updateTargetPos, 50); }, [updateTargetPos]);
  const handleTabUpgrade = useCallback(() => { setActiveTab("upgrade"); setTimeout(updateTargetPos, 50); }, [updateTargetPos]);
  const handleTabGraph = useCallback(() => { setActiveTab("graph"); setTimeout(updateTargetPos, 50); }, [updateTargetPos]);
  const handleTabDeveloper = useCallback(() => { setActiveTab("developer"); setTimeout(updateTargetPos, 50); }, [updateTargetPos]);

  const toggleTimeFlux = useCallback(() => {
    setGameState((prev) => {
      const activating = !prev.isTimeFluxActive;
      return {
        ...prev,
        isTimeFluxActive: activating,
        timeFluxReferenceTime: activating ? prev.storedTime : prev.timeFluxReferenceTime,
      };
    });
  }, []);

  const mps = React.useMemo(() => gameState.games.floor(), [gameState.games]);

  useEffect(() => {
    window.game = {
      setMoney: (val) => { setGameState((prev) => ({ ...prev, money: new Decimal(val) })); },
      addMoney: (val) => { setGameState((prev) => ({ ...prev, money: prev.money.plus(new Decimal(val)) })); },
      setGames: (val) => { setGameState((prev) => ({ ...prev, games: new Decimal(val) })); },
      addGames: (val) => { setGameState((prev) => ({ ...prev, games: prev.games.plus(new Decimal(val)) })); },
      setStoredTime: (ms) => { setGameState((prev) => ({ ...prev, storedTime: ms })); },
      addStoredTime: (ms) => { setGameState((prev) => ({ ...prev, storedTime: (prev.storedTime || 0) + ms })); },
      setGrade: (grade) => { setGameState((prev) => ({ ...prev, currentCompanyGrade: Math.max(1, Math.min(15, grade)) })); },
      setDeveloper: (count) => { setGameState((prev) => ({ ...prev, developer: count })); },
      setConglomerate: (count) => { setGameState((prev) => ({ ...prev, conglomerate: count })); },
      reset: () => { localStorage.clear(); window.location.reload(); },
    };
    return () => { delete window.game; };
  }, []);

  useEffect(() => {
    if (activeTab === "developer" && (gameState.developerX || 0) === 0) {
      setActiveTab("idle2");
    }
  }, [activeTab, gameState.developerX]);


  return (
    <div className="p-3 md:p-5 pb-24 md:pb-5">
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
            <h2 className="text-2xl font-black mb-4 text-gray-800">{t("help.offline_title") || "Offline Stored Time"}</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">{t("ui.offline_stored_time_toast", { time: formatTime(offlinePopupData.time) })}</p>
            <button onClick={() => setOfflinePopupData(null)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95">{t("ui.close")}</button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        <div className="flex-1 flex flex-col" style={{ perspective: "1500px" }}>
          <motion.div
            className="flex-1 flex flex-col"
            style={{ transformOrigin: "center center" }}
            animate={isRebirthing ? { scale: [1, 0.8, 0], rotate: [0, -360, -1440], rotateX: [0, 45, 90], rotateY: [0, -45, -90], z: [0, -500, -2000], opacity: [1, 1, 0] } : { scale: 1, rotate: 0, rotateX: 0, rotateY: 0, z: 0, opacity: 1 }}
            transition={{ duration: isRebirthing ? 8.0 : 0.1, ease: isRebirthing ? "easeInOut" : "linear" }}
          >
            <div className="flex-1 border-2 md:border-4 border-gray-300 p-3 md:p-5 md:mr-5 rounded-lg overflow-y-auto">
              {activeTab === "idle2" && (
                <div ref={containerRef} className="flex flex-col gap-2 break-words relative">
                  <button onClick={() => setShowHelp(true)} className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-gray-600 font-bold shadow-sm z-10">?</button>
                  <div className="flex items-center gap-2 md:gap-4 w-full my-2 pr-2 md:pr-10">
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold">{t("ui.games", { count: format(gameState.games) })}</h1>
                    <span className="text-xs sm:text-base">+{format(gps, 2)}/s</span>
                  </div>
                  <div className="flex w-full items-center gap-2">
                    <h1 ref={moneyRef} className="text-xl sm:text-2xl md:text-4xl font-bold">{t("ui.money", { count: format(gameState.money) })}</h1>
                    <span className="text-xs sm:text-base">+{format(mps, 2)}/s</span>
                  </div>
                  {!isRebirthing && moneyEffects.map((e) => (
                    <div key={e.id} className="floating-money" style={{ left: e.x, top: e.y }}>{e.amount}</div>
                  ))}

                  {gameState.isTimeFluxActive && gameState.currentCompanyGrade > 1 && (
                    <div className="mb-4">
                      <button onClick={toggleTimeFlux} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl shadow-[0_4px_0_0_#991b1b] active:translate-y-[2px] active:shadow-none transition-all relative overflow-hidden group">
                        <motion.div className="absolute inset-0 bg-white/10 pointer-events-none" animate={{ opacity: [0, 0.2, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
                        <motion.div className="absolute bottom-0 left-0 h-full bg-blue-500/40 pointer-events-none" initial={{ width: 0 }} animate={{ width: `${Math.min(Math.max(((gameState.storedTime || 0) / (50 * 60 * 60 * 1000)) * 100, 0), 100)}%` }} transition={{ type: "spring", bounce: 0, duration: 0.5 }} />
                        <div className="relative z-10 flex flex-col items-center justify-center">
                          <div className="flex items-center gap-2">
                            <span>{t("time_flux.deactivate")}</span>
                            <span className="text-xs opacity-80 bg-black/20 px-2 py-0.5 rounded-full">{gameState.timeFluxMultiplier}x</span>
                          </div>
                          <span className="text-[10px] font-bold opacity-80 tracking-tighter">{formatTime(gameState.storedTime)} REMAINING</span>
                        </div>
                      </button>
                    </div>
                  )}

                  {gameState.unlockedAchievements.includes("1000-game") && (
                    <div className="flex justify-end mb-2">
                      <button onClick={cycleBuyAmount} className="bg-white text-gray-800 font-bold py-1 px-3 rounded border border-gray-300 shadow-sm text-sm hover:bg-gray-100 transition-colors">Buy: {currentBuyAmount}</button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50/50 rounded-xl border border-gray-200">
                    <div className="flex-1 text-sm font-bold text-gray-700">{t("ui.developer") || "Developer"}: {format(gameState.developer)}{gameState.autoDeveloper > 0 ? ` (${format(gameState.autoDeveloper)})` : ""}{t("ui.developer_owned") || " owned"}</div>
                    <div className="flex items-center gap-3">
                      <ActionButton onClick={buyDeveloper} disabled={gameState.money.lt(developerPrice)} flashing={flashes.developer} currentValue={gameState.money} targetValue={developerPrice} progressColorClass="bg-yellow-400/30">
                        {currentBuyAmount > 1 ? `x${currentBuyAmount} ` : ""}{t("actions.hire_developer_btn") || "Hire Dev"} ({format(developerPrice)}G)
                      </ActionButton>
                      <div className="w-20 text-right text-xs font-mono text-blue-600">+{format(1 / 6, 2)} G/s</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50/50 rounded-xl border border-gray-200">
                    <div className="flex-1 text-sm font-bold text-gray-700">{companyGrades[gameState.currentCompanyGrade]}{t("ui.company") || "Company"}: {format(gameState.company)}{gameState.autoCompany > 0 ? ` (${format(gameState.autoCompany)})` : ""}{t("ui.company_owned") || " owned"}</div>
                    <div className="flex items-center gap-3">
                      <ActionButton onClick={buyCompany} disabled={gameState.money.lt(companyPrice)} colorClass={companyButtonColors.color} shadowClass={companyButtonColors.shadow} flashing={flashes.company} currentValue={gameState.money} targetValue={companyPrice} progressColorClass={gameState.currentCompanyGrade % 2 === 0 ? "bg-orange-400/30" : "bg-fuchsia-400/30"}>
                        {currentBuyAmount > 1 ? `x${currentBuyAmount} ` : ""}{t("actions.buy_company_btn") || "Buy Co."} ({format(companyPrice)}G)
                      </ActionButton>
                      <div className="w-20 text-right text-xs font-mono text-emerald-600">+{format(new Decimal(gameState.currentCompanyGrade).pow(2.25).div(10), 2)} dev/s</div>
                    </div>
                  </div>

                  {gameState.currentCompanyGrade >= 10 && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50/50 rounded-xl border border-gray-200">
                      <div className="flex-1 text-sm font-bold text-gray-700">{t("ui.conglomerate") || "Conglomerate"}: {format(gameState.conglomerate || 0)}{gameState.autoConglomerate > 0 ? ` (${format(gameState.autoConglomerate)})` : ""}{t("ui.conglomerate_owned") || " owned"}</div>
                      <div className="flex items-center gap-3">
                        <ActionButton onClick={buyConglomerate} disabled={gameState.money.lt(conglomeratePrice)} colorClass="bg-amber-600 hover:bg-amber-700" shadowClass="shadow-[0_4px_0_0_theme(colors.amber-800)]" currentValue={gameState.money} targetValue={conglomeratePrice} progressColorClass="bg-yellow-400/30">
                          {currentBuyAmount > 1 ? `x${currentBuyAmount} ` : ""}{t("actions.form_conglomerate_btn") || "Form Conglomerate"} ({format(conglomeratePrice)})
                        </ActionButton>
                        <div className="w-20 text-right text-xs font-mono text-amber-600">+{format(0.1, 2)} Co./s</div>
                      </div>
                    </div>
                  )}

                  {gameState.currentConglomerateGrade >= 5 && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50/50 rounded-xl border border-gray-200">
                      <div className="flex-1 text-sm font-bold text-gray-700">{t("ui.government") || "Government"}: {format(gameState.government || 0)}{t("ui.government_owned") || " owned"}</div>
                      <div className="flex items-center gap-3">
                        <ActionButton onClick={buyGovernment} disabled={gameState.money.lt(governmentPrice)} colorClass="bg-red-700 hover:bg-red-800" shadowClass="shadow-[0_4px_0_0_theme(colors.red-900)]" currentValue={gameState.money} targetValue={governmentPrice}>
                          {currentBuyAmount > 1 ? `x${currentBuyAmount} ` : ""}{t("actions.buy_government_btn") || "Establish Government"} ({format(governmentPrice)})
                        </ActionButton>
                        <div className="w-20 text-right text-xs font-mono text-red-600">+{format(0.05, 2)} Cong./s</div>
                      </div>
                    </div>
                  )}

                  {gameState.currentGovernmentGrade >= 10 && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                      <div className="flex-1 text-sm font-bold text-indigo-900 italic">{t("automation.developerX") || "Developer X"}: {gameState.developerX || 0} / 10{t("ui.developer_x_owned") || " summoned"}</div>
                      <div className="flex items-center gap-3">
                        <ActionButton onClick={buyDeveloperX} disabled={gameState.money.lt(getDeveloperXPrice(gameState.developerX || 0)) || (gameState.developerX || 0) >= 10} colorClass="bg-black hover:bg-gray-800" shadowClass="shadow-[0_4px_0_0_theme(colors.gray.600)]" currentValue={gameState.money} targetValue={getDeveloperXPrice(gameState.developerX || 0)}>
                          {t("actions.buy_developer_x_btn") || "Summon Developer X"} ({format(getDeveloperXPrice(gameState.developerX || 0))})
                        </ActionButton>
                        <div className="w-20 text-right text-xs font-mono text-indigo-700">+{format(1e18)} G/s</div>
                      </div>
                    </div>
                  )}

                  <RebirthButton production={gameState.games} setIsRebirthing={setIsRebirthing} />
                  <StaticAdsAndForm />
                </div>
              )}
              <ErrorBoundary>
                <Suspense fallback={<div className="p-10 text-center animate-pulse">{t("ui.loading")}</div>}>
                  {activeTab === "upgrade" && (
                    <div className="flex flex-col gap-6">
                      <section className="p-4 bg-white/40 rounded-2xl border border-gray-200">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">🏢 {t("company_grades.upgrade_title") || "Company Expansion"}</h2>
                        {gameState.currentCompanyGrade < 15 ? (
                          <ActionButton onClick={upgradeCompany} disabled={gameState.money.lt(upgradeCompanyPrice) || gameState.company + (gameState.autoCompany || 0) <= 0} currentValue={gameState.money} targetValue={upgradeCompanyPrice} progressColorClass="bg-cyan-400/30">
                            {t("actions.upgrade_company", { price: format(upgradeCompanyPrice) })}
                          </ActionButton>
                        ) : (
                          <p className="text-sm text-gray-500 italic text-center">Maximum Grade Reached</p>
                        )}
                      </section>

                      <section className="p-4 bg-white/40 rounded-2xl border border-gray-200">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">👨‍💻 {t("upgrade.developer_title") || "Developer Training"}</h2>
                        <ActionButton onClick={upgradeDeveloper} disabled={gameState.money.lt(getUpgradeDeveloperPrice(gameState.currentDeveloperGrade)) || gameState.developer + (gameState.autoDeveloper || 0) <= 0} currentValue={gameState.money} targetValue={getUpgradeDeveloperPrice(gameState.currentDeveloperGrade)} progressColorClass="bg-yellow-400/30">
                          {t("actions.upgrade_developer", { price: format(getUpgradeDeveloperPrice(gameState.currentDeveloperGrade)) })}
                        </ActionButton>
                        <p className="text-xs text-gray-500 mt-2">{t("upgrade.developer_desc", { grade: gameState.currentDeveloperGrade })}</p>
                      </section>

                      {gameState.currentCompanyGrade >= 10 && (
                        <section className="p-4 bg-white/40 rounded-2xl border border-gray-200">
                          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">🏢 {t("upgrade.conglomerate_title") || "Conglomerate Integration"}</h2>
                          <ActionButton onClick={upgradeConglomerate} disabled={gameState.money.lt(getUpgradeConglomeratePrice(gameState.currentConglomerateGrade)) || (gameState.conglomerate || 0) <= 0} currentValue={gameState.money} targetValue={getUpgradeConglomeratePrice(gameState.currentConglomerateGrade)} progressColorClass="bg-amber-400/30">
                            {t("actions.upgrade_conglomerate", { price: format(getUpgradeConglomeratePrice(gameState.currentConglomerateGrade)) })}
                          </ActionButton>
                          <p className="text-xs text-gray-500 mt-2">{t("upgrade.conglomerate_desc", { grade: gameState.currentConglomerateGrade })}</p>
                        </section>
                      )}

                      {gameState.government >= 1 && (
                        <section className="p-4 bg-white/40 rounded-2xl border border-gray-200">
                          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">🏛️ {t("upgrade.government_title") || "Government Reform"}</h2>
                          <ActionButton onClick={upgradeGovernment} disabled={gameState.money.lt(getUpgradeGovernmentPrice(gameState.currentGovernmentGrade))} currentValue={gameState.money} targetValue={getUpgradeGovernmentPrice(gameState.currentGovernmentGrade)}>
                            {t("actions.upgrade_government", { price: format(getUpgradeGovernmentPrice(gameState.currentGovernmentGrade)) }) || `政府を改革する (${format(getUpgradeGovernmentPrice(gameState.currentGovernmentGrade))}G)`}
                          </ActionButton>
                        </section>
                      )}

                      {gameState.automationUnlocked && (
                        <section className="p-4 bg-white/40 rounded-2xl border border-gray-200">
                          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">🤖 {t("tabs.automation") || "Automation"}</h2>
                          <div className="space-y-4">
                            {["developer", "company", "companyUpgrade", "developerUpgrade", "conglomerateUpgrade", "governmentUpgrade"].filter((key) => {
                              if (key === "companyUpgrade") return gameState.currentCompanyGrade < 15;
                              if (key === "conglomerateUpgrade") return gameState.currentCompanyGrade >= 10;
                              return true;
                            }).map((key) => {
                              const auto = gameState.automation?.[key] || { level: 0, enabled: false, progress: 0 };
                              const upgradeCost = getAutomationUpgradeCost(auto.level);
                              return (
                                <div key={key} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 flex flex-col gap-3">
                                  <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold uppercase">{t(`automation.${key}`)}</h3>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-gray-500">LV. {auto.level}</span>
                                      {auto.level > 0 && (
                                        <button onClick={() => toggleAutomation(key)} className={`w-10 h-5 rounded-full relative transition-colors ${auto.enabled ? "bg-green-500" : "bg-gray-400"}`}>
                                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${auto.enabled ? "left-5.5" : "left-0.5"}`} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-1 text-xs text-gray-600">
                                    <p>{t("automation.speed")}: <span className="font-bold text-blue-600">{(auto.level * 0.1).toFixed(1)}/s</span></p>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                      <div className="bg-blue-400 h-full transition-all duration-75" style={{ width: `${(auto.progress || 0) * 100}%` }} />
                                    </div>
                                  </div>
                                  <ActionButton onClick={() => upgradeAutomation(key)} disabled={gameState.games.lt(upgradeCost)} colorClass="bg-indigo-600 hover:bg-indigo-700" shadowClass="shadow-[0_4px_0_0_theme(colors.indigo.800)]" currentValue={gameState.games} targetValue={upgradeCost} progressColorClass="bg-yellow-400/30" size="sm">
                                    {t("automation.upgrade", { price: format(upgradeCost) })}
                                  </ActionButton>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      )}
                    </div>
                  )}
                  {activeTab === "time_flux" && gameState.currentCompanyGrade > 1 && (
                    <TimeFluxTab gameState={gameState} setGameState={setGameState} toggleTimeFlux={toggleTimeFlux} t={t} maxMultiplier={50} />
                  )}
                  {activeTab === "graph" && <GraphTab history={history} t={t} format={format} />}
                  {activeTab === "achievements" && <AchievementsTab gameState={gameState} t={t} />}
                  {activeTab === "setting" && <SettingTab gameState={gameState} setGameState={setGameState} i18n={i18n} t={t} />}
                  {activeTab === "developer" && (gameState.developerX || 0) > 0 && <DeveloperTab developerCount={gameState.developerX || 0} developerXStates={gameState.developerXStates || []} normalDeveloperCount={gameState.developer || 0} onWakeAll={wakeAllDevelopers} t={t} />}
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
                  <section><h3 className="font-bold text-blue-600 mb-1">{t("help.offline_title")}</h3><p>{t("help.offline_text")}</p></section>
                  <section><h3 className="font-bold text-blue-600 mb-1">{t("help.billing_title")}</h3><p>{t("help.billing_text")}</p></section>
                  <section><h3 className="font-bold text-blue-600 mb-1">{t("help.automation_title")}</h3><p>{t("help.automation_text")}</p></section>
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
            <TabButton active={activeTab === "upgrade"} onClick={handleTabUpgrade}>{t("tabs.upgrade") || "Upgrade ⤴️"}</TabButton>
            {gameState.currentCompanyGrade > 1 && (
              <TabButton active={activeTab === "time_flux"} onClick={handleTabTimeFlux}>{t("tabs.time_flux")}</TabButton>
            )}
            <TabButton active={activeTab === "graph"} onClick={handleTabGraph}>{t("tabs.graph") || "Graph"}</TabButton>
            {(gameState.developerX || 0) > 0 && (
              <TabButton active={activeTab === "developer"} onClick={handleTabDeveloper}>{t("tabs.developer") || "Dev"}</TabButton>
            )}
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
