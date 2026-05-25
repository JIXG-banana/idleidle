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
import { formatNumber, formatTime } from "./utils/format";
import { SECRET_KEY, achievementsList } from "./constants/gameData";
import { TabButton, ActionButton } from "./components/Buttons";
import { InfoToast, AchievementToast } from "./components/Toasts";
import {
  AchievementCard,
  StaticAdsAndForm,
  SideAds,
} from "./components/GameUI";

// Lazy load tab components
const AiAssistantTab = React.lazy(() => import("./components/AiAssistantTab"));
const TimeFluxTab = React.lazy(() => import("./components/TimeFluxTab"));
const AchievementsTab = React.lazy(
  () => import("./components/AchievementsTab"),
);
const SettingTab = React.lazy(() => import("./components/SettingTab"));
const GraphTab = React.lazy(() => import("./components/GraphTab"));

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
      automationUnlocked: false,
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
      storedTime: 0,
      isTimeFluxActive: false,
      timeFluxMultiplier: 2,
      timeFluxReferenceTime: 0,
      automation: {
        indieDev: { level: 0, enabled: false, progress: 0 },
        company: { level: 0, enabled: false, progress: 0 },
        aiDev: { level: 0, enabled: false, progress: 0 },
        companyUpgrade: { level: 0, enabled: false, progress: 0 },
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
    // 指数の減衰（0.85乗）により後半の上昇を緩やかにしつつ、JIXG以降で単位を大きく跳ね上げます。
    const adjustedExponent = Math.pow(grade - 1, 0.85);
    let basePrice = new Decimal(1000000);
    // JIXG (Grade 10) 以降は希少性を出すため、コストを1万倍（4桁増）に設定
    const multiplier = grade >= 10 ? 10000 : 1;
    return basePrice
      .times(multiplier)
      .times(new Decimal(50).pow(adjustedExponent))
      .floor();
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
      const diffMs = now - gameState.lastTimestamp;
      // 1分以上経過していたら蓄積
      if (diffMs >= 60000) {
        setGameState((prev) => ({
          ...prev,
          storedTime: (prev.storedTime || 0) + diffMs,
          lastTimestamp: now,
        }));

        setToastQueue((prev) => [
          ...prev,
          {
            id: `offline-${now}`,
            icon: "⏳",
            type: "info",
            title: t("ui.offline_stored_time_toast", {
              time: formatTime(diffMs),
            }),
          },
        ]);
      }
    }
  }, [gameState.lastTimestamp, t]);

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
        let deltaMs = currentTime - lastTimeRef.current;

        // タブがバックグラウンドになった際などの巨大なデルタ時間を防ぐ
        // 1秒以上の差がある場合は、その分をタイムフラックスとして蓄積する
        if (deltaMs > 1000) {
          const excessMs = deltaMs - 1000;
          deltaMs = 1000;
          setGameState((prev) => ({
            ...prev,
            storedTime: (prev.storedTime || 0) + excessMs,
          }));
        }

        accumulatedTime += deltaMs;
        if (accumulatedTime >= RENDER_INTERVAL) {
          const automationThreshold = 5000000;
          setGameState((prev) => {
            let deltaTime = accumulatedTime / 1000;
            let newStoredTime = prev.storedTime || 0;
            let newIsTimeFluxActive = prev.isTimeFluxActive;

            if (newIsTimeFluxActive && newStoredTime > 0) {
              const multiplier = prev.timeFluxMultiplier || 2;
              const speedupFactor = multiplier - 1;
              const costFactor = Math.pow(multiplier, 1.35) - 1;
              
              const speedupMs = accumulatedTime * speedupFactor;
              const costMs = accumulatedTime * costFactor;

              let actualSpeedupMs;
              let actualCostMs;

              if (newStoredTime >= costMs) {
                actualSpeedupMs = speedupMs;
                actualCostMs = costMs;
              } else {
                // 残り時間で可能な加速分を比例計算
                const ratio = costFactor / speedupFactor;
                actualSpeedupMs = newStoredTime / ratio;
                actualCostMs = newStoredTime;
                newIsTimeFluxActive = false;
              }

              deltaTime = (accumulatedTime + actualSpeedupMs) / 1000;
              newStoredTime -= actualCostMs;
            }

            const newGames = prev.games.plus(gpsRef.current.times(deltaTime));
            const newMoney = prev.money.plus(
              prev.games.floor().times(deltaTime),
            );
            const newAutomation = { ...prev.automation };
            let updatedMoney = newMoney;
            let updatedIndieDev = prev.indieDev;
            let updatedCompany = prev.company;
            let updatedAiDev = prev.aiDev || 0;
            let updatedGrade = prev.currentCompanyGrade;
            let updatedGames = newGames;
            const newAutomationUnlocked =
              prev.automationUnlocked || newGames.gte(automationThreshold);

            const pendingFlashes = [];

            ["indieDev", "company", "aiDev", "companyUpgrade"].forEach(
              (key) => {
                if (
                  newAutomation[key].level > 0 &&
                  newAutomation[key].enabled
                ) {
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
                        if (!prev.aiEnabled) continue;
                        price = getAiDevPrice(updatedAiDev);
                        if (updatedMoney.gte(price)) {
                          updatedMoney = updatedMoney.minus(price);
                          updatedAiDev++;
                          if (!pendingFlashes.includes("aiDev"))
                            pendingFlashes.push("aiDev");
                        }
                      } else if (key === "companyUpgrade") {
                        if (updatedCompany >= 1 && updatedGrade < 15) {
                          price = getUpgradeCompanyPrice(updatedGrade);
                          if (updatedMoney.gte(price)) {
                            updatedMoney = updatedMoney.minus(price);
                            updatedGrade++;
                            updatedGames = new Decimal(0);
                          }
                        }
                      }
                    }
                  }
                }
              },
            );

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
              updatedGrade === prev.currentCompanyGrade &&
              billingEvents === 0 &&
              updatedGames.equals(prev.games) &&
              newAutomationUnlocked === prev.automationUnlocked &&
              newStoredTime === prev.storedTime &&
              newIsTimeFluxActive === prev.isTimeFluxActive
            )
              return prev;

            return {
              ...prev,
              games: updatedGames,
              money: updatedMoney.plus(billingMoneyGained),
              billingCount: (prev.billingCount || 0) + billingEvents,
              indieDev: updatedIndieDev,
              automationUnlocked: newAutomationUnlocked,
              company: updatedCompany,
              aiDev: updatedAiDev,
              currentCompanyGrade: updatedGrade,
              automation: newAutomation,
              storedTime: newStoredTime,
              isTimeFluxActive: newIsTimeFluxActive,
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
  }, [
    getAiDevPrice,
    getCompanyPrice,
    getIndieDevPrice,
    getUpgradeCompanyPrice,
    triggerFlash,
  ]);

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
  }, [t, gameStateRef]);

  // 1秒おきに統計データを記録する
  useEffect(() => {
    const recordInterval = setInterval(() => {
      const state = gameStateRef.current;
      setHistory((prev) => {
        const newData = {
          time: Date.now(),
          games: state.games.toNumber(),
          money: state.money.toNumber(),
          indieDev: state.indieDev,
          company: state.company,
          aiDev: state.aiDev || 0,
        };
        // 最大100件まで保持
        const next = [...prev, newData];
        return next.slice(-100);
      });
    }, 1000);
    return () => clearInterval(recordInterval);
  }, []);

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
  const handleTabTimeFlux = useCallback(() => {
    setActiveTab("time_flux");
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
  const handleTabGraph = useCallback(() => {
    setActiveTab("graph");
    setTimeout(updateTargetPos, 50);
  }, [updateTargetPos]);

  const mps = React.useMemo(() => gameState.games.floor(), [gameState.games]);

  return (
    <div className="p-3 md:p-5 pb-24 md:pb-5">
      {!gameState.languageSelected && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
            <h2 className="text-3xl font-black mb-6 text-gray-800">
              {t("ui.select_language") || "Select Language"}
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
              {t("reset_prompt.title")}
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {t("reset_prompt.message")}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
              >
                {t("reset_prompt.reset")}
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
                {t("reset_prompt.continue")}
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
          <Suspense
            fallback={
              <div className="p-10 text-center animate-pulse">
                {t("ui.loading")}
              </div>
            }
          >
            {activeTab === "ai_assistant" && (
              <AiAssistantTab
                gameState={gameState}
                t={t}
                format={format}
                getAutomationUpgradeCost={getAutomationUpgradeCost}
                upgradeAutomation={upgradeAutomation}
                toggleAutomation={toggleAutomation}
              />
            )}
            {activeTab === "time_flux" && (
              <TimeFluxTab
                gameState={gameState}
                setGameState={setGameState}
                t={t}
              />
            )}
            {activeTab === "graph" && (
              <GraphTab history={history} t={t} format={format} />
            )}
            {activeTab === "achievements" && (
              <AchievementsTab gameState={gameState} t={t} />
            )}
            {activeTab === "setting" && (
              <SettingTab
                gameState={gameState}
                setGameState={setGameState}
                i18n={i18n}
                t={t}
              />
            )}
          </Suspense>
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
            {gameState.automationUnlocked && (
              <TabButton
                active={activeTab === "ai_assistant"}
                onClick={handleTabAiAssistant}
              >
                {t("tabs.ai_assistant")}
              </TabButton>
            )}
            <TabButton
              active={activeTab === "time_flux"}
              onClick={handleTabTimeFlux}
            >
              {t("tabs.time_flux")}
            </TabButton>
            <TabButton active={activeTab === "graph"} onClick={handleTabGraph}>
              {t("tabs.graph") || "Graph"}
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
