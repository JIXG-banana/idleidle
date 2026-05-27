import React from "react";

/**
 * 転生（世界を再コーディング）ボタンコンポーネント
 * @param {Object} props
 * @param {number|Object} props.production - 現在の生産量（数値またはDecimalオブジェクト）
 */
const RebirthButton = ({ production }) => {
  // 100億 (10^10) の閾値
  const THRESHOLD = 1e10;

  // productionが数値の場合と、break_infinity.jsのDecimalオブジェクトの場合の両方に対応
  const canRebirth =
    typeof production === "object" && production.gte
      ? production.gte(THRESHOLD)
      : Number(production) >= THRESHOLD;

  if (!canRebirth) return null;

  return (
    <button
      onClick={() => alert("Coming soon")}
      className="mt-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-black py-4 px-10 rounded-2xl shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all duration-300 transform hover:scale-105 active:scale-95 animate-pulse"
    >
      世界を再コーディング
    </button>
  );
};

export default RebirthButton;
