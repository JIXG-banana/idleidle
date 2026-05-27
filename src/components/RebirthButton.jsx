import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

/**
 * 転生（世界を再コーディング）ボタンコンポーネント
 * @param {Object} props
 * @param {number|Object} props.production - 現在の生産量（数値またはDecimalオブジェクト）
 */
const RebirthButton = ({ production }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // 100億 (10^10) の閾値
  const THRESHOLD = 1e10;

  // productionが数値の場合と、break_infinity.jsのDecimalオブジェクトの場合の両方に対応
  const canRebirth =
    typeof production === "object" && production.gte
      ? production.gte(THRESHOLD)
      : Number(production) >= THRESHOLD;

  const handleRebirth = () => {
    // 警告ポップアップの表示
    const confirmed = window.confirm(
      "【警告: 世界の再コーディング】\n本当に実行しますか？現在の進行状況はすべて消去され、新たな宇宙が構築されます。\n(※現時点では演出のみが実行されます)",
    );

    if (confirmed) {
      setIsAnimating(true);
    }
  };

  if (!canRebirth && !isAnimating) return null;

  return (
    <>
      {/* ボタン本体 */}
      {canRebirth && (
        <button
          onClick={handleRebirth}
          className="mt-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-black py-4 px-10 rounded-2xl shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all duration-300 transform hover:scale-105 active:scale-95 animate-pulse"
        >
          世界を再コーディング
        </button>
      )}

      {/* エフェクトのオーバーレイ (PortalでBody直下に配置) */}
      {isAnimating &&
        createPortal(
          <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden">
            <AnimatePresence>
              {isAnimating && (
                <>
                  {/* 1. 画面全体が吸い込まれる渦巻きレイヤー */}
                  <motion.div
                    className="absolute inset-0 bg-white/30 backdrop-blur-md"
                    initial={{ scale: 1.5, rotate: 0, opacity: 0 }}
                    animate={{
                      scale: [1.5, 1, 0],
                      rotate: [0, 360, 1080],
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: 2.5,
                      times: [0, 0.2, 0.8, 1],
                      ease: "easeInOut",
                    }}
                  />

                  {/* 2. 中心から広がる黒い円 */}
                  <motion.div
                    className="absolute bg-black rounded-full"
                    initial={{ width: 0, height: 0 }}
                    animate={{
                      width: ["0vmax", "0vmax", "300vmax", "300vmax"],
                      height: ["0vmax", "0vmax", "300vmax", "300vmax"],
                      opacity: [1, 1, 1, 0],
                    }}
                    transition={{
                      duration: 4,
                      times: [0, 0.4, 0.7, 1],
                      ease: "easeIn",
                    }}
                    onAnimationComplete={() => setIsAnimating(false)}
                  />
                </>
              )}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </>
  );
};

export default RebirthButton;
