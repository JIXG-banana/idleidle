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

/*
const getFactorial = (n) => {
  let res = new Decimal(1);
  for (let i = 2; i <= n; i++) res = res.times(i);
  return res;
};
*/

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

const InfoToast = ({ toast, onComplete }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    const timer = setTimeout(onComplete, 3000); // 3秒で消去
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className={`fixed ${isMobile ? "bottom-24" : "bottom-10"} left-1/2 -translate-x-1/2 z-[110] bg-gray-900/90 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-700 backdrop-blur-md w-max max-w-[90vw]`}
    >
      <span className="text-2xl">{toast.icon}</span>
      <span className="font-bold text-sm tracking-tight">{toast.title}</span>
    </motion.div>
  );
};

const AchievementToast = ({ achievement, onComplete, targetPos }) => {
  // タイマーを使って確実に削除を実行するように修正
  useEffect(() => {
    // 表示時間（約2.5秒）が経過したら削除
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空の配列にすることで、再レンダリングによるタイマーリセットを防ぐ

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
};

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
    condition: (state) => state.currentCompanyGrade >= 2,
  },
  {
    key: "last-upgrade",
    icon: "",
    condition: (state) => state.currentCompanyGrade >= 9,
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
];

export default function App() {
  const achievementTabRef = useRef(null);
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });

  // 実績タブの座標を計算する関数
  const updateTargetPos = useCallback(() => {
    if (achievementTabRef.current) {
      const rect = achievementTabRef.current.getBoundingClientRect();
      // トーストは fixed top-1/2 left-1/2 なので、画面中央からのオフセットを計算
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      setTargetPos({
        x: centerX - window.innerWidth / 2,
        y: centerY - window.innerHeight / 2,
      });
    }
  }, []);

  useEffect(() => {
    // 初回レンダリング後に少し待ってから計算（レイアウト確定のため）
    const timer = setTimeout(updateTargetPos, 500);
    window.addEventListener("resize", updateTargetPos);
    return () => {
      window.removeEventListener("resize", updateTargetPos);
      clearTimeout(timer);
    };
  }, [updateTargetPos]);

  const [toastQueue, setToastQueue] = useState([]);
  const removeToast = useCallback((id) => {
    setToastQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);
  const preventAutoSave = useRef(true); // 初期ロード時や削除操作中のガード
  const [showHelp, setShowHelp] = useState(false);

  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("idle2");
  const [gameState, setGameState] = useState(() => {
    const defaultState = {
      money: new Decimal(20),
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
    };

    try {
      const saveData = localStorage.getItem("save");
      if (saveData) {
        let parsed;
        try {
          const bytes = CryptoJS.AES.decrypt(saveData, SECRET_KEY);
          const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
          if (!decryptedData) throw new Error("エラー！");
          parsed = JSON.parse(decryptedData);
        } catch {
          parsed = JSON.parse(saveData);
        }
        return {
          ...defaultState,
          ...parsed,
          lastTimestamp: parsed.lastTimestamp ?? Date.now(),
          languageSelected: parsed.languageSelected ?? false,
          useScientific: parsed.useScientific ?? false,
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

  // フォーマット用ショートカット
  const format = useCallback(
    (val, decimals = 0) =>
      formatNumber(val, gameState.useScientific, gameState.language, decimals),
    [gameState.useScientific, gameState.language],
  );

  // 価格の計算
  const indieDevPrice = new Decimal(1.15)
    .pow(gameState.indieDev)
    .times(10)
    .floor();

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
    ];
    return colors[
      Math.min(gameState.currentCompanyGrade - 1, colors.length - 1)
    ];
  }, [gameState.currentCompanyGrade]);

  const companyPrice = new Decimal(1.2)
    .pow(gameState.company || 0)
    .times(gameState.currentCompanyGrade + 2)
    .times(25)
    .floor();

  const upgradeCompanyPrice = new Decimal(1000)
    .times(new Decimal(5).pow(gameState.currentCompanyGrade - 1))
    .floor();

  const aiDevPrice = new Decimal(1.5)
    .pow(gameState.aiDev || 0)
    .times(1000000)
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
        .times(prev.currentCompanyGrade + 2)
        .times(25)
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
      const currentPrice = new Decimal(1000)
        .times(new Decimal(5).pow(prev.currentCompanyGrade - 1))
        .floor();
      if (
        prev.money.gte(currentPrice) &&
        prev.company >= 1 &&
        prev.currentCompanyGrade < 9
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
          games: new Decimal(0),
          currentCompanyGrade: nextGrade,
        };
      }
      return prev;
    });
  }, [t, companyGrades]);

  const unlockAI = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      indieDev: 0,
      aiEnabled: true,
    }));
  }, []);

  const buyAiDev = useCallback(() => {
    setGameState((prev) => {
      const currentPrice = new Decimal(1.5)
        .pow(prev.aiDev || 0)
        .times(1000000)
        .floor();
      if (prev.money.gte(currentPrice)) {
        return {
          ...prev,
          money: prev.money.minus(currentPrice),
          aiDev: (prev.aiDev || 0) + 1,
        };
      }
      return prev;
    });
  }, []);

  // オフライン収入の計算
  useEffect(() => {
    if (gameState.lastTimestamp) {
      const now = Date.now();
      const diffInSeconds = Math.floor((now - gameState.lastTimestamp) / 1000);

      // 最大5時間 (5 * 60 * 60 = 18,000秒) に制限
      const cappedSeconds = Math.min(diffInSeconds, 18000);

      // 1分(60秒)以上離れていた場合に適用
      if (cappedSeconds >= 60) {
        const devProd = new Decimal(gameState.indieDev).div(6);
        const aiProd = new Decimal(gameState.aiDev || 0).times(10000);
        const compProd = new Decimal(gameState.currentCompanyGrade)
          .pow(2.25)
          .times(gameState.company);
        const gps = devProd.plus(aiProd).plus(compProd);

        // ゲームの増加量: 制限された秒数 * 秒間生産量
        const gamesGained = gps.times(cappedSeconds);
        // お金の増加量 (簡易計算: 離脱時のゲーム数 * 制限された秒数)
        const moneyGained = gameState.games.times(cappedSeconds);

        if (gamesGained.gt(0) || moneyGained.gt(0)) {
          setGameState((prev) => ({
            ...prev,
            games: prev.games.plus(gamesGained),
            money: prev.money.plus(moneyGained),
          }));

          const uniqueId = `offline-income-${now}-${Math.random().toString(36).substr(2, 9)}`;
          setToastQueue((prev) => [
            ...prev,
            {
              id: uniqueId,
              icon: "💤",
              type: "info",
              title: `Welcome back! +${format(gamesGained)} games / +${format(moneyGained)} money (${cappedSeconds}s)`,
            },
          ]);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 初回マウント時のみ実行

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
            const aiProd = new Decimal(prev.aiDev || 0).times(10000);
            const compProd = new Decimal(prev.currentCompanyGrade)
              .pow(2.25)
              .times(prev.company);
            const gamesPerSec = devProd.plus(aiProd).plus(compProd);

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
              const newToasts = newlyUnlocked.map((ach) => ({
                id: `ach-${Date.now()}-${ach.key}-${Math.random().toString(36).substr(2, 5)}`,
                icon: ach.icon,
                type: "achievement",
                title: t(`achievements.${ach.key}`),
              }));
              setToastQueue((prev) => [...prev, ...newToasts]);
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
  }, [t]);

  // オートセーブ
  useEffect(() => {
    // 起動後2秒間は「ロード中」としてオートセーブを無効化
    const enableTimer = setTimeout(() => {
      preventAutoSave.current = false;
    }, 2000);

    const autoSaveInterval = setInterval(() => {
      setGameState((currentState) => {
        if (preventAutoSave.current) return currentState;
        const stateToSave = {
          ...currentState,
          lastTimestamp: Date.now(),
        };
        const jsonText = JSON.stringify(stateToSave);
        const encryptedText = CryptoJS.AES.encrypt(
          jsonText,
          SECRET_KEY,
        ).toString();
        localStorage.setItem("save", encryptedText);
        console.log("saved");
        return currentState;
      });
    }, 1000);

    return () => {
      clearTimeout(enableTimer);
      clearInterval(autoSaveInterval);
    };
  }, []);

  // タブ切り替え用のハンドラも useCallback で安定化
  const handleTabIdle2 = useCallback(() => {
    setActiveTab("idle2");
    setTimeout(updateTargetPos, 50); // タブ切り替え後のレイアウト確定を待って更新
  }, [updateTargetPos]);

  const handleTabAchievements = useCallback(() => {
    setActiveTab("achievements");
    setTimeout(updateTargetPos, 50);
  }, [updateTargetPos]);

  const handleTabSetting = useCallback(() => {
    setActiveTab("setting");
    setTimeout(updateTargetPos, 50);
  }, [updateTargetPos]);

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

  const mps = React.useMemo(() => {
    return gameState.games.floor();
  }, [gameState.games]);

  return (
    <div className="p-3 md:p-5 pb-24 md:pb-5">
      {/* 初回言語選択モーダル */}
      {!gameState.languageSelected && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
            <h2 className="text-3xl font-black mb-6 text-gray-800">
              Select Language
            </h2>
            <div className="flex flex-col gap-4">
              <button
                onClick={() =>
                  setGameState((prev) => ({
                    ...prev,
                    language: "ja",
                    languageSelected: true,
                  }))
                }
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
              >
                日本語 (Japanese)
              </button>
              <button
                onClick={() =>
                  setGameState((prev) => ({
                    ...prev,
                    language: "en",
                    languageSelected: true,
                  }))
                }
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
              >
                English
              </button>
              <button
                onClick={() =>
                  setGameState((prev) => ({
                    ...prev,
                    language: "zh-CN",
                    languageSelected: true,
                  }))
                }
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
              >
                简体中文 (Chinese)
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        <div className="flex-1 border-2 md:border-4 border-gray-300 p-3 md:p-5 md:mr-5 rounded-lg overflow-hidden">
          {activeTab === "idle2" && (
            <div className="flex flex-col gap-2 break-words relative">
              <button
                onClick={() => setShowHelp(true)}
                className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-gray-600 font-bold transition-all shadow-sm z-10 hover:scale-110 active:scale-95"
                title={t("ui.help")}
              >
                ?
              </button>
              <div className="flex md:items-center gap-3 md:gap-4 w-full my-2 pr-10">
                <h1 className="text-3xl md:text-5xl font-bold">
                  {t("ui.games", { count: format(gameState.games) })}
                </h1>
                <span>+{format(gps, 2)}/s</span>
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
              <div className="flex w-full items-center">
                <h1 className="text-2xl md:text-4xl font-bold mb-2">
                  {t("ui.money", { count: format(gameState.money) })}
                </h1>
                <span className="">+{format(mps, 2)}/s</span>
              </div>

              <ActionButton
                onClick={buyIndieDev}
                disabled={gameState.money.lt(indieDevPrice)}
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
              >
                {t("actions.buy_company", {
                  price: format(companyPrice),
                  count: gameState.company,
                  grade: companyGrades[gameState.currentCompanyGrade],
                })}
              </ActionButton>

              {gameState.currentCompanyGrade < 9 ? (
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
              <a href="https://www.buymeacoffee.com/jiaxianglif">
                <img
                  src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=jiaxianglif&button_colour=5F7FFF&font_colour=ffffff&font_family=Lato&outline_colour=000000&coffee_colour=FFDD00"
                  alt="Buy me a coffee"
                />
              </a>

              <ActionButton
                onClick={() => {
                  const jsonText = JSON.stringify({
                    ...gameState,
                    lastTimestamp: Date.now(),
                  });
                  const encryptedText = CryptoJS.AES.encrypt(
                    jsonText,
                    SECRET_KEY,
                  ).toString();
                  localStorage.setItem("save", encryptedText);
                  alert("セーブしました！");
                }}
                colorClass="bg-green-700 hover:bg-green-800"
                shadowClass="shadow-[0_4px_0_0_theme(colors.green.900)]"
              >
                {t("actions.save")}
              </ActionButton>

              <ActionButton
                onClick={() => {
                  const jsonText = JSON.stringify({
                    ...gameState,
                    lastTimestamp: Date.now(),
                  });
                  const encryptedText = CryptoJS.AES.encrypt(
                    jsonText,
                    SECRET_KEY,
                  ).toString();
                  navigator.clipboard
                    .writeText(encryptedText)
                    .then(() =>
                      alert("セーブデータをクリップボードにコピーしました"),
                    )
                    .catch(() => alert("コピーに失敗しました。"));
                }}
                colorClass="bg-blue-600 hover:bg-blue-700"
                shadowClass="shadow-[0_4px_0_0_theme(colors.blue.800)]"
              >
                {t("actions.export")}
              </ActionButton>

              <ActionButton
                onClick={() => {
                  const importText = prompt(
                    "セーブデータのテキストを貼り付けてください",
                  );
                  if (importText) {
                    try {
                      const bytes = CryptoJS.AES.decrypt(
                        importText,
                        SECRET_KEY,
                      );
                      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
                      if (!decryptedText) throw new Error("？？？");
                      preventAutoSave.current = true;
                      localStorage.setItem("save", importText);
                      window.location.reload();
                    } catch {
                      alert("無効なセーブデータです。");
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
                  preventAutoSave.current = true;
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
          {toastQueue.map((toast) =>
            toast.type === "achievement" ? (
              <AchievementToast
                key={toast.id}
                achievement={toast}
                targetPos={targetPos}
                onComplete={() => removeToast(toast.id)}
              />
            ) : (
              <InfoToast
                key={toast.id}
                toast={toast}
                onComplete={() => removeToast(toast.id)}
              />
            ),
          )}
        </AnimatePresence>

        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-300 p-3 z-50 md:static md:w-40 md:bg-transparent md:border-t-0 md:p-0 flex flex-col gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none">
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto">
            <TabButton active={activeTab === "idle2"} onClick={handleTabIdle2}>
              {t("tabs.idle2")}
            </TabButton>
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
