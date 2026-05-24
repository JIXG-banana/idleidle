import React, {
  useState,
  useEffect,
  useRef,
  memo,
  useCallback,
  forwardRef,
} from "react";
import Decimal from "break_infinity.js";
import CryptoJS from "crypto-js";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import AdMax from "./AdMax";
import AccessCounter from "./AccessCounter";

const SECRET_KEY = "AgsqyqyY(bu7*7^2…7[bu&x#a@es729100qiYe29Bw3";

// 巨大数字フォーマット
const formatNumber = (
  val,
  useScientific = false,
  lang = "en",
  decimals = 0,
) => {
  const dec = new Decimal(val);
  const isJpOrZh = lang === "ja" || lang === "zh-CN";
  const threshold = isJpOrZh ? 10000 : 1000;

  if (dec.abs().lt(threshold)) {
    const num = dec.toNumber();
    return decimals === 0 ? Math.floor(num).toString() : num.toFixed(decimals);
  }
  if (useScientific) return dec.toExponential(2).replace("+", "");

  if (isJpOrZh) {
    const units =
      lang === "ja"
        ? ["", "万", "億", "兆", "京", "垓", "𥝱"]
        : ["", "万", "亿", "兆", "京", "垓", "𥝱"];
    const exp = dec.exponent;
    const unitIdx = Math.floor(exp / 4);
    if (unitIdx < units.length) {
      const displayVal = dec.div(Decimal.pow(10000, unitIdx)).toNumber();
      return displayVal.toFixed(2) + units[unitIdx];
    }
  } else {
    const units = [
      "",
      "K",
      "M",
      "B",
      "T",
      "Qa",
      "Qi",
      "Sx",
      "Sp",
      "Oc",
      "No",
      "Dc",
    ];
    const exp = dec.exponent;
    const unitIdx = Math.floor(exp / 3);
    if (unitIdx < units.length) {
      const displayVal = dec.div(Decimal.pow(1000, unitIdx)).toNumber();
      return displayVal.toFixed(2) + units[unitIdx];
    }
  }
  return dec.toExponential(2).replace("+", "");
};

// ★ 最適化1: React.memo で包み、プロパティが変わらない限り再描画しないようにする
const TabButton = memo(
  forwardRef(({ active, onClick, children }, ref) => {
    const baseClass =
      "text-white font-bold py-2 px-4 rounded transition-colors";
    const activeClass = active
      ? "bg-green-800"
      : "bg-gray-500 hover:bg-blue-600";
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={`${baseClass} ${activeClass}`}
      >
        {children}
      </button>
    );
  }),
);

const ActionButton = memo(
  ({
    onClick,
    disabled,
    children,
    colorClass = "bg-blue-500 hover:bg-blue-600",
    shadowClass = "shadow-[0_4px_0_0_theme(colors.blue.700)]",
    flashing = false,
  }) => {
    const activeStyle = !disabled
      ? `active:translate-y-[2px] active:shadow-none ${shadowClass}`
      : "opacity-50 cursor-not-allowed translate-y-[2px]";

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
        ${colorClass} text-white font-bold py-2 px-4 rounded-lg
        transition-all duration-75 relative
        ${activeStyle}
        ${flashing ? "animate-flash" : ""}
      `}
        style={{
          display: "inline-block",
          verticalAlign: "middle",
        }}
      >
        {children}
      </button>
    );
  },
);

const AchievementCard = memo(
  ({ number, title, icon, isLocked, description }) => {
    const [showOverlay, setShowOverlay] = useState(false);

    const baseStyles =
      "group w-32 h-32 relative rounded-xl border-2 flex flex-col justify-center items-center font-bold shadow-sm transition-all duration-200 cursor-pointer select-none";
    const stateStyles = isLocked
      ? "bg-gray-100 border-gray-300 text-gray-400 grayscale"
      : "bg-white border-gray-200 text-gray-800 hover:border-yellow-400 hover:shadow-md";

    return (
      <div
        className={`${baseStyles} ${stateStyles}`}
        onClick={() => setShowOverlay(!showOverlay)}
        onMouseLeave={() => setShowOverlay(false)}
      >
        <span className="absolute top-2 left-2 text-[10px] font-mono opacity-50">
          {String(number).padStart(3, "0")}
        </span>
        <span className="text-3xl mb-1">{isLocked ? "🔒" : icon}</span>
        <span className="text-[11px] px-2 text-center leading-tight">
          {isLocked ? "???" : title}
        </span>

        {/* Hover/Click Overlay for Description */}
        <div
          className={`absolute inset-0 bg-white/95 rounded-xl transition-opacity flex flex-col items-center justify-center p-2 text-center shadow-inner border border-blue-200 z-10 pointer-events-none ${showOverlay ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        >
          <span className="text-[10px] text-blue-600 mb-1 font-black uppercase tracking-tighter">
            Requirement
          </span>
          <span className="text-[11px] text-gray-800 leading-tight">
            {description}
          </span>
        </div>
      </div>
    );
  },
);

const InfoToast = memo(({ toast, onComplete }) => {
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, 3000);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-gray-900/90 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-700 backdrop-blur-md w-max max-w-[90vw] pointer-events-auto"
    >
      <span className="text-2xl">{toast.icon}</span>
      <span className="font-bold text-sm tracking-tight">{toast.title}</span>
    </motion.div>
  );
});

const AchievementToast = memo(({ achievement, onComplete, targetPos }) => {
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ y: 500, x: "-50%", rotate: -20, scale: 0.5, opacity: 1 }}
      animate={{
        y: [500, -20, 0],
        x: "-50%",
        rotate: [10, -10, 5, 0],
        scale: 1,
        opacity: 1,
      }}
      exit={{
        x: targetPos.x,
        y: targetPos.y,
        scale: 0,
        opacity: 0,
        transition: { duration: 0.7, ease: "backIn" },
      }}
      transition={{
        duration: 1.2,
        times: [0, 0.6, 0.8, 0.9, 1],
        ease: "easeOut",
      }}
      className="fixed top-1/2 left-1/2 z-[100] w-64 p-6 bg-yellow-400 border-4 border-white rounded-2xl shadow-2xl flex flex-col items-center justify-center text-center"
    >
      <div className="text-6xl mb-2">{achievement.icon}</div>
      <div className="text-black font-black text-xl uppercase tracking-tighter">
        Achievement Unlocked!
      </div>
      <div className="text-yellow-900 font-bold text-lg leading-tight">
        {achievement.title}
      </div>
    </motion.div>
  );
});

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
  {
    key: "international",
    icon: "🌍",
    condition: (state) => (state.usedLanguages || []).length >= 5,
  },
  { key: "1-indie-dev", icon: "🤝", condition: (state) => state.indieDev >= 1 },
  {
    key: "10-indie-dev",
    icon: "👥",
    condition: (state) => state.indieDev >= 10,
  },
  {
    key: "50-indie-dev",
    icon: "🏢",
    condition: (state) => state.indieDev >= 50,
  },
  { key: "1-company", icon: "💼", condition: (state) => state.company >= 1 },
  { key: "10-company", icon: "🏪", condition: (state) => state.company >= 10 },
  {
    key: "100-company",
    icon: "🏭",
    condition: (state) => state.company >= 100,
  },
  {
    key: "1000-company",
    icon: "🏙️",
    condition: (state) => state.company >= 1000,
  },
  {
    key: "first-upgrade",
    icon: "🆙",
    condition: (state) => state.currentCompanyGrade >= 2,
  },
  {
    key: "last-upgrade",
    icon: "🎖️",
    condition: (state) => state.currentCompanyGrade >= 15,
  },
  { key: "ai-unlocked", icon: "⚡", condition: (state) => state.aiEnabled },
  {
    key: "1-ai-dev",
    icon: "🤖",
    condition: (state) => (state.aiDev || 0) >= 1,
  },
  {
    key: "10-ai-dev",
    icon: "🌐",
    condition: (state) => (state.aiDev || 0) >= 10,
  },
  {
    key: "50-ai-dev",
    icon: "🧠",
    condition: (state) => (state.aiDev || 0) >= 50,
  },
  {
    key: "100-ai-dev",
    icon: "🧬",
    condition: (state) => (state.aiDev || 0) >= 100,
  },
  {
    key: "250-ai-dev",
    icon: "🕸️",
    condition: (state) => (state.aiDev || 0) >= 250,
  },
  {
    key: "500-ai-dev",
    icon: "💠",
    condition: (state) => (state.aiDev || 0) >= 500,
  },
  {
    key: "1000-ai-dev",
    icon: "📡",
    condition: (state) => (state.aiDev || 0) >= 1000,
  },
  {
    key: "2500-ai-dev",
    icon: "🛰️",
    condition: (state) => (state.aiDev || 0) >= 2500,
  },
  {
    key: "5000-ai-dev",
    icon: "🌌",
    condition: (state) => (state.aiDev || 0) >= 5000,
  },
  {
    key: "10000-game",
    icon: "🚀",
    condition: (state) => state.games.gte(10000),
  },
  {
    key: "100000-game",
    icon: "🛰️",
    condition: (state) => state.games.gte(100000),
  },
  {
    key: "1000000-game",
    icon: "🌌",
    condition: (state) => state.games.gte(1000000),
  },
  {
    key: "10000000-game",
    icon: "☄️",
    condition: (state) => state.games.gte(10000000),
  },
  {
    key: "100000000-game",
    icon: "🛸",
    condition: (state) => state.games.gte(100000000),
  },
  {
    key: "1000000000-game",
    icon: "🔭",
    condition: (state) => state.games.gte(1000000000),
  },
  {
    key: "1000000-money",
    icon: "🏦",
    condition: (state) => state.money.gte(1000000),
  },
  {
    key: "10000000-money",
    icon: "💎",
    condition: (state) => state.money.gte(10000000),
  },
  {
    key: "100000000-money",
    icon: "💹",
    condition: (state) => state.money.gte(100000000),
  },
  {
    key: "10000000000-money",
    icon: "🏛️",
    condition: (state) => state.money.gte(10000000000),
  },
  {
    key: "100000000000-money",
    icon: "🏰",
    condition: (state) => state.money.gte(100000000000),
  },
  {
    key: "1000000000000-money",
    icon: "🌍",
    condition: (state) => state.money.gte(1000000000000),
  },
  {
    key: "1000000000000000-money",
    icon: "🌌",
    condition: (state) => state.money.gte(1000000000000000),
  },
  {
    key: "billing-received",
    icon: "💸",
    condition: (state) => (state.billingCount || 0) >= 1,
  },
];

export default function App() {
  const achievementTabRef = useRef(null);
  const moneyRef = useRef(null);
  const containerRef = useRef(null);
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });

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
  }, []);

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
  const [moneyEffects, setMoneyEffects] = useState([]);
  const [flashes, setFlashes] = useState({
    indieDev: false,
    company: false,
    aiDev: false,
  });
  const [showResetPrompt, setShowResetPrompt] = useState(false);

  useEffect(() => {
    const hasSave = localStorage.getItem("save");
    if (hasSave && !gameState.resetPromptShown) {
      setShowResetPrompt(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

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
      indieDev: 0,
      aiDev: 0,
      aiEnabled: false,
      company: 0,
      currentCompanyGrade: 1,
      unlockedAchievements: [],
      languageSelected: false,
      useScientific: false,
      lastTimestamp: Date.now(),
      language: "en",
      usedLanguages: ["en"],
      billingCount: 0,
      resetPromptShown: false,
      automation: {
        indieDev: { level: 0, enabled: false, progress: 0 },
        company: { level: 0, enabled: false, progress: 0 },
        aiDev: { level: 0, enabled: false, progress: 0 },
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
          money: new Decimal(parsed.money ?? parsed.gold ?? 50),
          games: new Decimal(parsed.games ?? 0),
          usedLanguages,
          automation: {
            ...defaultState.automation,
            ...(parsed.automation ?? {}),
          },
        };
      }
    } catch (e) {
      console.error(e);
    }
    // 新規プレイヤーの場合は、すでに最新バランスのためリセット推奨を表示しない
    return { ...defaultState, resetPromptShown: true };
  });

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
        amount: `+${format(amount)}G`,
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

  const getIndieDevPrice = useCallback((count) => {
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
    return new Decimal(1000000).times(new Decimal(50).pow(grade - 1)).floor();
  }, []);

  const getAiDevPrice = useCallback((count) => {
    return new Decimal(1.5)
      .pow(count || 0)
      .times(1000000)
      .floor();
  }, []);

  const getAutomationUpgradeCost = useCallback((level) => {
    return new Decimal(100).times(new Decimal(5).pow(level)).floor();
  }, []);

  const indieDevPrice = getIndieDevPrice(gameState.indieDev);
  const companyPrice = getCompanyPrice(
    gameState.company,
    gameState.currentCompanyGrade,
  );
  const upgradeCompanyPrice = getUpgradeCompanyPrice(
    gameState.currentCompanyGrade,
  );
  const aiDevPrice = getAiDevPrice(gameState.aiDev);

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
      {
        color: "bg-blue-500 hover:bg-blue-600",
        shadow: "shadow-[0_4px_0_0_theme(colors.blue.700)]",
      },
      {
        color: "bg-emerald-500 hover:bg-emerald-600",
        shadow: "shadow-[0_4px_0_0_theme(colors.emerald.700)]",
      },
      {
        color: "bg-yellow-500 hover:bg-yellow-600",
        shadow: "shadow-[0_4px_0_0_theme(colors.yellow.700)]",
      },
      {
        color: "bg-orange-500 hover:bg-orange-600",
        shadow: "shadow-[0_4px_0_0_theme(colors.orange.700)]",
      },
      {
        color: "bg-red-500 hover:bg-red-600",
        shadow: "shadow-[0_4px_0_0_theme(colors.red.700)]",
      },
      {
        color: "bg-pink-500 hover:bg-pink-600",
        shadow: "shadow-[0_4px_0_0_theme(colors.pink.700)]",
      },
      {
        color: "bg-purple-500 hover:bg-purple-600",
        shadow: "shadow-[0_4px_0_0_theme(colors.purple.700)]",
      },
      {
        color: "bg-indigo-500 hover:bg-indigo-600",
        shadow: "shadow-[0_4px_0_0_theme(colors.indigo.700)]",
      },
      {
        color: "bg-gray-800 hover:bg-gray-900",
        shadow: "shadow-[0_4px_0_0_theme(colors.gray.950)]",
      },
      {
        color: "bg-cyan-500 hover:bg-cyan-600",
        shadow: "shadow-[0_4px_0_0_theme(colors.cyan.700)]",
      },
      {
        color: "bg-lime-500 hover:bg-lime-600",
        shadow: "shadow-[0_4px_0_0_theme(colors.lime.700)]",
      },
      {
        color: "bg-teal-500 hover:bg-teal-600",
        shadow: "shadow-[0_4px_0_0_theme(colors.teal.700)]",
      },
      {
        color: "bg-fuchsia-500 hover:bg-fuchsia-600",
        shadow: "shadow-[0_4px_0_0_theme(colors.fuchsia.700)]",
      },
      {
        color: "bg-rose-500 hover:bg-rose-600",
        shadow: "shadow-[0_4px_0_0_theme(colors.rose.700)]",
      },
      {
        color: "bg-sky-500 hover:bg-sky-600",
        shadow: "shadow-[0_4px_0_0_theme(colors.sky.700)]",
      },
    ];
    return colors[
      Math.min(gameState.currentCompanyGrade - 1, colors.length - 1)
    ];
  }, [gameState.currentCompanyGrade]);

  const buyIndieDev = useCallback(() => {
    setGameState((prev) => {
      const currentPrice = getIndieDevPrice(prev.indieDev);
      if (prev.money.gte(currentPrice)) {
        return {
          ...prev,
          money: prev.money.minus(currentPrice),
          indieDev: prev.indieDev + 1,
        };
      }
      return prev;
    });
  }, [getIndieDevPrice]);

  const buyCompany = useCallback(() => {
    setGameState((prev) => {
      const currentPrice = getCompanyPrice(
        prev.company,
        prev.currentCompanyGrade,
      );
      if (prev.money.gte(currentPrice)) {
        return {
          ...prev,
          money: prev.money.minus(currentPrice),
          company: prev.company + 1,
        };
      }
      return prev;
    });
  }, [getCompanyPrice]);

  const upgradeCompany = useCallback(() => {
    setGameState((prev) => {
      const currentPrice = getUpgradeCompanyPrice(prev.currentCompanyGrade);
      if (
        prev.money.gte(currentPrice) &&
        prev.company >= 1 &&
        prev.currentCompanyGrade < 15
      ) {
        const nextGrade = prev.currentCompanyGrade + 1;
        setToastQueue((q) => [
          ...q,
          {
            id: `upgrade-${Date.now()}`,
            icon: "",
            type: "info",
            title: t("ui.company_upgraded", {
              grade: companyGrades[nextGrade],
            }),
          },
        ]);
        return {
          ...prev,
          money: prev.money.minus(currentPrice),
          games: new Decimal(0),
          currentCompanyGrade: nextGrade,
        };
      }
      return prev;
    });
  }, [getUpgradeCompanyPrice, t, companyGrades]);

  const unlockAI = useCallback(() => {
    setGameState((prev) => ({ ...prev, indieDev: 0, aiEnabled: true }));
  }, []);

  const buyAiDev = useCallback(() => {
    setGameState((prev) => {
      const currentPrice = getAiDevPrice(prev.aiDev);
      if (prev.money.gte(currentPrice)) {
        return {
          ...prev,
          money: prev.money.minus(currentPrice),
          aiDev: (prev.aiDev || 0) + 1,
        };
      }
      return prev;
    });
  }, [getAiDevPrice]);

  const upgradeAutomation = useCallback(
    (key) => {
      setGameState((prev) => {
        const currentLevel = prev.automation[key].level;
        const cost = getAutomationUpgradeCost(currentLevel);
        if (prev.games.gte(cost)) {
          return {
            ...prev,
            games: prev.games.minus(cost),
            automation: {
              ...prev.automation,
              [key]: {
                ...prev.automation[key],
                level: currentLevel + 1,
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
    const devProd = new Decimal(gameState.indieDev).div(6);
    const aiProd = new Decimal(gameState.aiDev || 0).times(10000);
    const compProd = new Decimal(gameState.currentCompanyGrade)
      .pow(2.25)
      .times(gameState.company);
    return devProd.plus(aiProd).plus(compProd);
  }, [
    gameState.indieDev,
    gameState.aiDev,
    gameState.currentCompanyGrade,
    gameState.company,
  ]);

  useEffect(() => {
    if (offlineProcessedRef.current) return;
    offlineProcessedRef.current = true;
    if (gameState.lastTimestamp) {
      const now = Date.now();
      const diffInSeconds = Math.floor((now - gameState.lastTimestamp) / 1000);
      const cappedSeconds = Math.min(diffInSeconds, 10800);
      if (cappedSeconds >= 60) {
        const gamesGained = gps.times(cappedSeconds).div(2);
        const moneyGained = gameState.games.times(cappedSeconds).div(2);

        let offlineMoney = gameState.money.plus(moneyGained);
        let offlineIndieDev = gameState.indieDev;
        let offlineCompany = gameState.company;
        let offlineAiDev = gameState.aiDev || 0;

        ["indieDev", "company", "aiDev"].forEach((key) => {
          const auto = gameState.automation[key];
          if (auto.level > 0 && auto.enabled) {
            // 大量購入によるフリーズを防ぐため、1ループあたりの最大購入試行数を制限
            const potentialBuys = Math.min(
              Math.floor(cappedSeconds * auto.level * 0.05),
              500,
            );
            for (let i = 0; i < potentialBuys; i++) {
              let price;
              if (key === "indieDev") {
                price = getIndieDevPrice(offlineIndieDev);
                if (offlineMoney.gte(price)) {
                  offlineMoney = offlineMoney.minus(price);
                  offlineIndieDev++;
                }
              } else if (key === "company") {
                price = getCompanyPrice(
                  offlineCompany,
                  gameState.currentCompanyGrade,
                );
                if (offlineMoney.gte(price)) {
                  offlineMoney = offlineMoney.minus(price);
                  offlineCompany++;
                }
              } else if (key === "aiDev") {
                price = getAiDevPrice(offlineAiDev);
                if (offlineMoney.gte(price)) {
                  offlineMoney = offlineMoney.minus(price);
                  offlineAiDev++;
                }
              }
            }
          }
        });

        if (gamesGained.gt(0) || moneyGained.gt(0)) {
          setGameState((prev) => ({
            ...prev,
            games: prev.games.plus(gamesGained),
            money: offlineMoney,
            indieDev: offlineIndieDev,
            company: offlineCompany,
            aiDev: offlineAiDev,
          }));
          setToastQueue((prev) => [
            ...prev,
            {
              id: `offline-${now}`,
              icon: "💤",
              type: "info",
              title: t("ui.offline_income_toast", {
                games: format(gamesGained),
                money: format(moneyGained),
                seconds: cappedSeconds,
              }),
            },
          ]);
        }
      }
    }
  }, [
    getAiDevPrice,
    getCompanyPrice,
    getIndieDevPrice,
    format,
    t,
    gps,
    gameState.money,
    gameState.games,
    gameState.indieDev,
    gameState.company,
    gameState.aiDev,
    gameState.currentCompanyGrade,
    gameState.automation,
    gameState.lastTimestamp,
  ]);

  const lastTimeRef = useRef(null);
  const gpsRef = useRef(gps);
  useEffect(() => {
    gpsRef.current = gps;
  }, [gps]);

  useEffect(() => {
    let animationFrameId;
    let accumulatedTime = 0;
    const RENDER_INTERVAL = 50;

    const gameLoop = (currentTime) => {
      if (lastTimeRef.current !== null) {
        const deltaMs = currentTime - lastTimeRef.current;
        accumulatedTime += deltaMs;
        if (accumulatedTime >= RENDER_INTERVAL) {
          const deltaTime = accumulatedTime / 1000;
          setGameState((prev) => {
            const newGames = prev.games.plus(gpsRef.current.times(deltaTime));
            const newMoney = prev.money.plus(
              prev.games.floor().times(deltaTime),
            );
            const newAutomation = { ...prev.automation };
            let updatedMoney = newMoney;
            let updatedIndieDev = prev.indieDev;
            let updatedCompany = prev.company;
            let updatedAiDev = prev.aiDev || 0;

            const pendingFlashes = [];

            ["indieDev", "company", "aiDev"].forEach((key) => {
              if (newAutomation[key].level > 0 && newAutomation[key].enabled) {
                // ネストされたオブジェクトをコピーして不変性を守る
                newAutomation[key] = { ...newAutomation[key] };
                const auto = newAutomation[key];
                auto.progress += auto.level * 0.1 * deltaTime;
                if (auto.progress >= 1) {
                  const buyCount = Math.floor(auto.progress);
                  auto.progress -= buyCount;
                  for (let i = 0; i < buyCount; i++) {
                    let price;
                    if (key === "indieDev") {
                      price = getIndieDevPrice(updatedIndieDev);
                      if (updatedMoney.gte(price)) {
                        updatedMoney = updatedMoney.minus(price);
                        updatedIndieDev++;
                        if (!pendingFlashes.includes("indieDev"))
                          pendingFlashes.push("indieDev");
                      }
                    } else if (key === "company") {
                      price = getCompanyPrice(
                        updatedCompany,
                        prev.currentCompanyGrade,
                      );
                      if (updatedMoney.gte(price)) {
                        updatedMoney = updatedMoney.minus(price);
                        updatedCompany++;
                        if (!pendingFlashes.includes("company"))
                          pendingFlashes.push("company");
                      }
                    } else if (key === "aiDev") {
                      price = getAiDevPrice(updatedAiDev);
                      if (updatedMoney.gte(price)) {
                        updatedMoney = updatedMoney.minus(price);
                        updatedAiDev++;
                        if (!pendingFlashes.includes("aiDev"))
                          pendingFlashes.push("aiDev");
                      }
                    }
                  }
                }
              }
            });

            // 購入が発生した場合は、アニメーションをトリガー（非同期）
            if (pendingFlashes.length > 0) {
              setTimeout(() => {
                pendingFlashes.forEach((key) => triggerFlash(key));
              }, 0);
            }

            let billingEvents = 0;
            const gamesNum = prev.games.floor().toNumber();
            const billingProbability =
              0.00008 * (1 + (prev.currentCompanyGrade - 1) * 0.5);
            if (gamesNum > 0) {
              // gamesNum が非常に大きい場合に備え、Decimalで計算し、
              // 100回以上の判定が必要な場合は近似値を使用する
              const expectedEvents = prev.games
                .times(billingProbability)
                .toNumber();
              if (gamesNum > 100 || expectedEvents > 10) {
                billingEvents = Math.max(
                  0,
                  Math.floor(
                    expectedEvents +
                      (Math.random() + Math.random() + Math.random() - 1.5) *
                        Math.sqrt(Math.max(expectedEvents, 0)),
                  ),
                );
              } else {
                for (let i = 0; i < gamesNum; i++)
                  if (Math.random() < billingProbability) billingEvents++;
              }
            }

            let billingMoneyGained = new Decimal(0);
            if (billingEvents > 0) {
              const companyScale = new Decimal(5).pow(
                prev.currentCompanyGrade - 1,
              );
              const quantityScale = new Decimal(prev.indieDev)
                .plus(new Decimal(prev.company).times(10))
                .plus(new Decimal(prev.aiDev || 0).times(100))
                .plus(1);
              billingMoneyGained = new Decimal(billingEvents)
                .times(Math.random() * 9 + 1)
                .times(companyScale)
                .times(quantityScale)
                .times(prev.games.div(1000).plus(1))
                .floor();
              if (triggerRef.current)
                // エフェクトが多すぎると重いため、描画タイミングをずらす
                requestAnimationFrame(() =>
                  triggerRef.current(billingMoneyGained),
                );
            }

            // 変更がない場合は参照を維持して再レンダリングを抑制
            if (
              updatedMoney.equals(prev.money) &&
              updatedIndieDev === prev.indieDev &&
              updatedCompany === prev.company &&
              updatedAiDev === (prev.aiDev || 0) &&
              billingEvents === 0 &&
              newGames.equals(prev.games)
            )
              return prev;

            return {
              ...prev,
              games: newGames,
              money: updatedMoney.plus(billingMoneyGained),
              billingCount: (prev.billingCount || 0) + billingEvents,
              indieDev: updatedIndieDev,
              company: updatedCompany,
              aiDev: updatedAiDev,
              automation: newAutomation,
            };
          });
          accumulatedTime %= RENDER_INTERVAL;
        }
      }
      lastTimeRef.current = currentTime;
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [getAiDevPrice, getCompanyPrice, getIndieDevPrice, triggerFlash]);

  // 最新のgameStateをインターバル内で安全に参照するためのRef
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const checkAchievements = setInterval(() => {
      const currentState = gameStateRef.current;
      // 現在のステートに基づいて未達成の実績を抽出
      const newlyUnlocked = achievementsList.filter(
        (ach) =>
          !currentState.unlockedAchievements.includes(ach.key) &&
          ach.condition(currentState),
      );

      if (newlyUnlocked.length > 0) {
        const timestamp = Date.now();
        const newToasts = newlyUnlocked.map((ach, idx) => ({
          id: `ach-${timestamp}-${ach.key}-${idx}`,
          icon: ach.icon,
          type: "achievement",
          title: t(`achievements.${ach.key}`),
        }));

        setGameState((prev) => ({
          ...prev,
          unlockedAchievements: [
            ...prev.unlockedAchievements,
            ...newlyUnlocked.map((a) => a.key),
          ],
        }));
        setToastQueue((q) => [...q, ...newToasts]);
      }
    }, 1000);
    return () => clearInterval(checkAchievements);
  }, [t]);

  useEffect(() => {
    const enableTimer = setTimeout(() => {
      preventAutoSave.current = false;
    }, 2000);
    const autoSaveInterval = setInterval(() => {
      setGameState((currentState) => {
        if (preventAutoSave.current) return currentState;
        const stateToSave = { ...currentState, lastTimestamp: Date.now() };
        localStorage.setItem(
          "save",
          CryptoJS.AES.encrypt(
            JSON.stringify(stateToSave),
            SECRET_KEY,
          ).toString(),
        );
        return currentState;
      });
    }, 20000);
    return () => {
      clearTimeout(enableTimer);
      clearInterval(autoSaveInterval);
    };
  }, []);

  const handleTabIdle2 = useCallback(() => {
    setActiveTab("idle2");
    setTimeout(updateTargetPos, 50);
  }, [updateTargetPos]);
  const handleTabAchievements = useCallback(() => {
    setActiveTab("achievements");
    setTimeout(updateTargetPos, 50);
  }, [updateTargetPos]);
  const handleTabSetting = useCallback(() => {
    setActiveTab("setting");
    setTimeout(updateTargetPos, 50);
  }, [updateTargetPos]);
  const handleTabAiAssistant = useCallback(() => {
    setActiveTab("ai_assistant");
    setTimeout(updateTargetPos, 50);
  }, [updateTargetPos]);

  const mps = React.useMemo(() => gameState.games.floor(), [gameState.games]);

  return (
    <div className="p-3 md:p-5 pb-24 md:pb-5">
      {!gameState.languageSelected && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
            <h2 className="text-3xl font-black mb-6 text-gray-800">
              Select Language
            </h2>
            <div className="flex flex-col gap-4">
              {["ja", "en", "ru", "zh-CN", "sw", "emoji"].map((lang) => (
                <button
                  key={lang}
                  onClick={() =>
                    setGameState((prev) => ({
                      ...prev,
                      language: lang,
                      languageSelected: true,
                      usedLanguages: prev.usedLanguages.includes(lang)
                        ? prev.usedLanguages
                        : [...prev.usedLanguages, lang],
                    }))
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
                >
                  {lang === "ja"
                    ? "日本語"
                    : lang === "en"
                      ? "English"
                      : lang === "ru"
                        ? "Русский"
                        : lang === "zh-CN"
                          ? "简体中文"
                          : lang === "sw"
                            ? "Kiswahili"
                            : "絵文字"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showResetPrompt && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-4 text-gray-800">
              重要なお知らせ
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              すでに遊んでいる方へ：
              <br />
              アップデートによりゲームバランスが大幅に変わりました。
              データをリセットして最初から遊ぶことをおすすめしますが、
              このまま続きから始めますか？
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
              >
                最初からやる (推奨)
              </button>
              <button
                onClick={() => {
                  setGameState((prev) => {
                    const newState = { ...prev, resetPromptShown: true };
                    // 選択を即座に保存（オートセーブを待たずに反映させる）
                    localStorage.setItem(
                      "save",
                      CryptoJS.AES.encrypt(
                        JSON.stringify({
                          ...newState,
                          lastTimestamp: Date.now(),
                        }),
                        SECRET_KEY,
                      ).toString(),
                    );
                    return newState;
                  });
                  setShowResetPrompt(false);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 rounded-xl transition-all active:scale-95"
              >
                続きからやる
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        <div className="flex-1 border-2 md:border-4 border-gray-300 p-3 md:p-5 md:mr-5 rounded-lg overflow-y-auto">
          {activeTab === "idle2" && (
            <div
              ref={containerRef}
              className="flex flex-col gap-2 break-words relative"
            >
              <button
                onClick={() => setShowHelp(true)}
                className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-gray-600 font-bold shadow-sm z-10"
              >
                ?
              </button>
              <div className="flex items-center gap-2 md:gap-4 w-full my-2 pr-2 md:pr-10">
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold">
                  {t("ui.games", { count: format(gameState.games) })}
                </h1>
                <span className="text-xs sm:text-base">
                  +{format(gps, 2)}/s
                </span>
              </div>
              <div className="flex w-full items-center gap-2">
                <h1
                  ref={moneyRef}
                  className="text-xl sm:text-2xl md:text-4xl font-bold"
                >
                  {t("ui.money", { count: format(gameState.money) })}
                </h1>
                <span className="text-xs sm:text-base">
                  +{format(mps, 2)}/s
                </span>
              </div>
              {moneyEffects.map((e) => (
                <div
                  key={e.id}
                  className="floating-money"
                  style={{ left: e.x, top: e.y }}
                >
                  {e.amount}
                </div>
              ))}
              <ActionButton
                onClick={buyIndieDev}
                disabled={gameState.money.lt(indieDevPrice)}
                flashing={flashes.indieDev}
              >
                {t("actions.buy_indie", {
                  price: format(indieDevPrice),
                  count: gameState.indieDev,
                })}
              </ActionButton>
              <ActionButton
                onClick={buyCompany}
                disabled={gameState.money.lt(companyPrice)}
                colorClass={companyButtonColors.color}
                shadowClass={companyButtonColors.shadow}
                flashing={flashes.company}
              >
                {t("actions.buy_company", {
                  price: format(companyPrice),
                  count: gameState.company,
                  grade: companyGrades[gameState.currentCompanyGrade],
                })}
              </ActionButton>
              {gameState.currentCompanyGrade < 15 ? (
                <ActionButton
                  onClick={upgradeCompany}
                  disabled={
                    gameState.money.lt(upgradeCompanyPrice) ||
                    gameState.company <= 0
                  }
                >
                  {t("actions.upgrade_company", {
                    price: format(upgradeCompanyPrice),
                  })}
                </ActionButton>
              ) : !gameState.aiEnabled ? (
                <ActionButton
                  onClick={unlockAI}
                  colorClass="bg-purple-600 hover:bg-purple-700"
                  shadowClass="shadow-[0_4px_0_0_theme(colors.purple.800)]"
                >
                  {t("actions.unlock_ai")}
                </ActionButton>
              ) : (
                <ActionButton
                  onClick={buyAiDev}
                  disabled={gameState.money.lt(aiDevPrice)}
                  colorClass="bg-indigo-600 hover:bg-indigo-700"
                  shadowClass="shadow-[0_4px_0_0_theme(colors.indigo.800)]"
                  flashing={flashes.aiDev}
                >
                  {t("actions.buy_ai", {
                    price: format(aiDevPrice),
                    count: gameState.aiDev || 0,
                  })}
                </ActionButton>
              )}
              <StaticAdsAndForm />
            </div>
          )}
          {activeTab === "ai_assistant" && (
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-bold border-b pb-2">
                {t("tabs.ai_assistant")}
              </h2>
              <div className="space-y-8">
                {["indieDev", "company", "aiDev"].map((key) => {
                  const auto = gameState.automation[key];
                  const upgradeCost = getAutomationUpgradeCost(auto.level);
                  return (
                    <div
                      key={key}
                      className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold uppercase">
                          {t(`automation.${key}`)}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-500">
                            LV. {auto.level}
                          </span>
                          {auto.level > 0 && (
                            <button
                              onClick={() => toggleAutomation(key)}
                              className={`w-12 h-6 rounded-full relative transition-colors ${auto.enabled ? "bg-green-500" : "bg-gray-400"}`}
                            >
                              <div
                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${auto.enabled ? "left-7" : "left-1"}`}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-gray-600">
                        <p>
                          {t("automation.speed")}:{" "}
                          <span className="font-bold text-blue-600">
                            {(auto.level * 0.1).toFixed(1)}/s
                          </span>
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-400 h-full transition-all duration-75"
                            style={{ width: `${auto.progress * 100}%` }}
                          />
                        </div>
                      </div>
                      <ActionButton
                        onClick={() => upgradeAutomation(key)}
                        disabled={gameState.games.lt(upgradeCost)}
                        colorClass="bg-indigo-600 hover:bg-indigo-700"
                        shadowClass="shadow-[0_4px_0_0_theme(colors.indigo.800)]"
                      >
                        {t("automation.upgrade", {
                          price: format(upgradeCost),
                        })}
                      </ActionButton>
                    </div>
                  );
                })}
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
                  description={t(`achievements.${item.key}_desc`)}
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
                    const newLang = e.target.value;
                    i18n.changeLanguage(newLang);
                    setGameState((prev) => ({
                      ...prev,
                      language: newLang,
                      usedLanguages: prev.usedLanguages.includes(newLang)
                        ? prev.usedLanguages
                        : [...prev.usedLanguages, newLang],
                    }));
                  }}
                  className="flex-1 p-2 border border-gray-400 rounded bg-white text-black font-bold"
                >
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                  <option value="zh-CN">简体中文</option>
                  <option value="sw">Kiswahili</option>
                  <option value="emoji">絵文字 (Emoji)</option>
                </select>
              </div>
              <div className="flex items-center gap-3 p-3 rounded">
                <label className="font-bold flex items-center cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    checked={gameState.useScientific}
                    onChange={(e) =>
                      setGameState((prev) => ({
                        ...prev,
                        useScientific: e.target.checked,
                      }))
                    }
                    className="w-5 h-5"
                  />
                  <span>Use Scientific Notation / 指数表記を使用</span>
                </label>
              </div>
              <ActionButton
                onClick={() => {
                  localStorage.setItem(
                    "save",
                    CryptoJS.AES.encrypt(
                      JSON.stringify({
                        ...gameState,
                        lastTimestamp: Date.now(),
                      }),
                      SECRET_KEY,
                    ).toString(),
                  );
                  alert(t("messages.save_success"));
                }}
                colorClass="bg-green-700 hover:bg-green-800"
                shadowClass="shadow-[0_4px_0_0_theme(colors.green.900)]"
              >
                {t("actions.save")}
              </ActionButton>
              <ActionButton
                onClick={() => {
                  navigator.clipboard
                    .writeText(
                      CryptoJS.AES.encrypt(
                        JSON.stringify({
                          ...gameState,
                          lastTimestamp: Date.now(),
                        }),
                        SECRET_KEY,
                      ).toString(),
                    )
                    .then(() => alert(t("messages.export_success")))
                    .catch(() => alert(t("messages.copy_fail")));
                }}
                colorClass="bg-blue-600 hover:bg-blue-700"
                shadowClass="shadow-[0_4px_0_0_theme(colors.blue.800)]"
              >
                {t("actions.export")}
              </ActionButton>
              <ActionButton
                onClick={() => {
                  const importText = prompt(t("messages.import_prompt"));
                  if (importText) {
                    try {
                      const decrypted = CryptoJS.AES.decrypt(
                        importText,
                        SECRET_KEY,
                      ).toString(CryptoJS.enc.Utf8);
                      if (!decrypted) throw new Error();
                      localStorage.setItem("save", importText);
                      window.location.reload();
                    } catch {
                      alert(t("messages.import_fail"));
                    }
                  }
                }}
                colorClass="bg-yellow-600 hover:bg-yellow-700"
                shadowClass="shadow-[0_4px_0_0_theme(colors.yellow.800)]"
              >
                {t("actions.import")}
              </ActionButton>
              <ActionButton
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                colorClass="bg-red-800 hover:bg-red-900"
                shadowClass="shadow-[0_4px_0_0_theme(colors.red.950)]"
              >
                {t("actions.clear_save")}
              </ActionButton>
            </div>
          )}
        </div>

        <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-[110] flex flex-col-reverse gap-2 items-center pointer-events-none">
          <AnimatePresence>
            {toastQueue
              .filter((t) => t.type !== "achievement")
              .map((toast) => (
                <InfoToast
                  key={toast.id}
                  toast={toast}
                  onComplete={() => removeToast(toast.id)}
                />
              ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowHelp(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[80vh] relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {t("ui.help_title")}
                  </h2>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="text-gray-400 hover:text-gray-600 text-3xl font-light"
                  >
                    &times;
                  </button>
                </div>
                <div className="space-y-4 text-gray-700 leading-relaxed text-sm md:text-base">
                  <section>
                    <h3 className="font-bold text-blue-600 mb-1">
                      {t("help.basics_title")}
                    </h3>
                    <p>{t("help.basics_text")}</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-blue-600 mb-1">
                      {t("help.offline_title")}
                    </h3>
                    <p>{t("help.offline_text")}</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-blue-600 mb-1">
                      {t("help.billing_title")}
                    </h3>
                    <p>{t("help.billing_text")}</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-blue-600 mb-1">
                      {t("help.automation_title")}
                    </h3>
                    <p>{t("help.automation_text")}</p>
                  </section>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  {t("ui.close")}
                </button>
              </motion.div>
            </motion.div>
          )}
          {toastQueue
            .filter((toast) => toast.type === "achievement")
            .map((toast) => (
              <AchievementToast
                key={toast.id}
                achievement={toast}
                targetPos={targetPos}
                onComplete={() => removeToast(toast.id)}
              />
            ))}
        </AnimatePresence>

        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-300 p-3 z-50 md:static md:w-40 md:bg-transparent md:border-t-0 md:p-0 flex flex-col gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none">
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto">
            <TabButton active={activeTab === "idle2"} onClick={handleTabIdle2}>
              {t("tabs.idle2")}
            </TabButton>
            {gameState.aiEnabled && (
              <TabButton
                active={activeTab === "ai_assistant"}
                onClick={handleTabAiAssistant}
              >
                {t("tabs.ai_assistant")}
              </TabButton>
            )}
            <TabButton
              ref={achievementTabRef}
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
          <SideAds />
        </div>
      </div>
    </div>
  );
}
