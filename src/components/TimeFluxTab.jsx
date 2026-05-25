import React from "react";
import { motion } from "framer-motion";
import { ActionButton } from "./Buttons";
import { formatTime } from "../utils/format";

export default function TimeFluxTab({
  gameState,
  setGameState,
  t,
}) {
  const multipliers = [2, 5, 10, 50, 100];

  const toggleFlux = () => {
    setGameState((prev) => {
      const activating = !prev.isTimeFluxActive;
      return {
        ...prev,
        isTimeFluxActive: activating,
        // 発動時の蓄積時間を100%の基準として保存する
        timeFluxReferenceTime: activating ? prev.storedTime : prev.timeFluxReferenceTime,
      };
    });
  };

  const setMultiplier = (m) => {
    setGameState((prev) => ({
      ...prev,
      timeFluxMultiplier: m,
    }));
  };

  const currentStoredTime = gameState.storedTime || 0;
  const currentMultiplier = gameState.timeFluxMultiplier || 2;
  const referenceTime = gameState.timeFluxReferenceTime || currentStoredTime || 1;
  
  // 進捗率の計算 (0% - 100%)
  const progress = Math.min(Math.max((currentStoredTime / referenceTime) * 100, 0), 100);

  // 消費速度の倍率計算 (Multiplier^1.35)
  const consumptionRate = Math.pow(currentMultiplier, 1.35).toFixed(1);

  return (
    <div className="flex flex-col gap-4 p-2 md:p-4">
      <h2 className="text-2xl font-bold text-gray-800">{t("time_flux.title")}</h2>
      <p className="text-gray-600 text-sm md:text-base leading-relaxed">
        {t("time_flux.description")}
      </p>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-sm text-blue-600 font-bold uppercase tracking-wider mb-1">
            {t("time_flux.title")}
          </p>
          <p className="text-3xl md:text-4xl font-black text-blue-900">
            {formatTime(currentStoredTime)}
          </p>
        </div>

        {/* プログレスバー背景 */}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-blue-100/50" />
        
        {/* プログレスバー本体 */}
        <motion.div
          className="absolute bottom-0 left-0 h-2 bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
        />

        {/* 装飾用のアニメーション (加速中のみ) */}
        {gameState.isTimeFluxActive && (
          <motion.div
            className="absolute inset-0 bg-blue-400/10"
            animate={{
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          />
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center ml-1">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Speed Multiplier
          </p>
          <p className="text-xl font-black text-blue-600">
            {currentMultiplier}x
          </p>
        </div>
        <div className="px-2">
          <input
            type="range"
            min="2"
            max="100"
            step="1"
            value={currentMultiplier}
            onChange={(e) => setMultiplier(parseInt(e.target.value))}
            className="w-full h-3 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
            <span>Min (2x)</span>
            <span>Max (100x)</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ActionButton
          onClick={toggleFlux}
          disabled={currentStoredTime <= 0 && !gameState.isTimeFluxActive}
          colorClass={
            gameState.isTimeFluxActive
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-600 hover:bg-green-700"
          }
          shadowClass={
            gameState.isTimeFluxActive
              ? "shadow-[0_4px_0_0_theme(colors.red.800)]"
              : "shadow-[0_4px_0_0_theme(colors.green.800)]"
          }
        >
          <span className="text-lg uppercase tracking-widest">
            {gameState.isTimeFluxActive
              ? t("time_flux.deactivate")
              : t("time_flux.activate")}
          </span>
        </ActionButton>
      </div>

      {gameState.isTimeFluxActive && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex flex-col items-center justify-center gap-1 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <p className="text-red-700 font-bold text-lg">
              {t("time_flux.speed", { multiplier: currentMultiplier })}
            </p>
            <div className="w-2 h-2 bg-red-500 rounded-full" />
          </div>
          <p className="text-red-500 text-xs font-bold uppercase tracking-widest">
            Flux Drain: {consumptionRate}s / sec
          </p>
        </div>
      )}
    </div>
  );
}
