import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

import RebirthConfirmModal from "./RebirthConfirmModal"; // Import the new modal component
/**
 * 転生（世界を再コーディング）ボタンコンポーネント
 * @param {Object} props
 * @param {number|Object} props.production - 現在の生産量（数値またはDecimalオブジェクト）
 */
const RebirthButton = ({ production, setIsRebirthing }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false); // State for the custom confirmation modal

  // 50億 (5e9) の閾値
  const THRESHOLD = 5e9;

  // productionが数値の場合と、break_infinity.jsのDecimalオブジェクトの場合の両方に対応
  const canRebirth =
    typeof production === "object" && production.gte
      ? production.gte(THRESHOLD)
      : Number(production) >= THRESHOLD;

  const handleConfirm = () => {
    setIsConfirming(false); // Close the modal
    setIsRebirthing(true);  // メイン画面の吸い込み開始

    // 9秒後にUIを元の状態に戻す（黒い円が完全に覆っている最中）
    setTimeout(() => {
      setIsRebirthing(false);
    }, 9000);

    setIsAnimating(true); // アニメーション開始
  };

  const handleCancel = () => {
    setIsConfirming(false); // Close the modal
  };

  const handleRebirth = () => {
    setIsConfirming(true); // Show the custom confirmation modal
  };

  // Only render the button if conditions are met AND not currently confirming or animating
  if (!canRebirth && !isAnimating && !isConfirming) return null;

  return (
    <>
      {/* Custom Confirmation Modal */}
      {isConfirming && (
        <RebirthConfirmModal onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
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
                  {/* 中心から広がる黒い円 (画面全体を覆い尽くす) */}
                  <motion.div
                    className="absolute bg-black rounded-full"
                    initial={{ width: 0, height: 0 }}
                    animate={{
                      // 0s-4.8s: 待機, 4.8s-7.2s: 拡大(全画面覆う), 7.2s-9.6s: 維持, 9.6s-12s: 透明化
                      width: ["0vmax", "0vmax", "300vmax", "300vmax", "300vmax"],
                      height: ["0vmax", "0vmax", "300vmax", "300vmax", "300vmax"],
                      opacity: [1, 1, 1, 1, 0],
                    }}
                    transition={{
                      duration: 12.0,
                      times: [0, 0.4, 0.6, 0.8, 1], // 0.4*12=4.8s, 0.6*12=7.2s, 0.8*12=9.6s
                      ease: "easeInOut",
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
