import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { ActionButton } from "./Buttons";
import { formatTime } from "../utils/format";

export default function TimeFluxTab({
  gameState,
  setGameState,
  toggleTimeFlux,
  t,
}) {
  const setMultiplier = (m) => {
    setGameState((prev) => ({
      ...prev,
      timeFluxMultiplier: m,
    }));
  };

  const currentStoredTime = gameState.storedTime || 0;
  const currentMultiplier = gameState.timeFluxMultiplier || 2;
  const MAX_STORED = 50 * 60 * 60 * 1000; // 10 hours
  
  // 進捗率の計算 (0% - 100%) - 常に上限10時間を基準にする
  const progress = Math.min(Math.max((currentStoredTime / MAX_STORED) * 100, 0), 100);

  // 消費速度の倍率計算 (Multiplier^1.35)
  const consumptionRate = Math.pow(currentMultiplier, 1.35).toFixed(1);

  return (
    <div className="flex flex-col gap-4 p-2 md:p-4">
      <h2 className="text-2xl font-bold text-gray-800">{t("time_flux.title")}</h2>
      <p className="text-gray-600 text-sm md:text-base leading-relaxed">
        {t("time_flux.description")}
      </p>

      {/* 巨大なプログレスゲージ - 背景全体がバーになるデザイン */}
      <div className="bg-blue-100/50 h-32 rounded-3xl border-2 border-blue-200 shadow-sm relative overflow-hidden flex items-center justify-center">
        {/* プログレスバー本体 - 背景として機能 */}
        <motion.div
          className="absolute top-0 left-0 h-full bg-blue-500 shadow-[inset_-4px_0_8px_rgba(0,0,0,0.1)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
        />

        {/* 加速中のみ表示される装飾 */}
        {gameState.isTimeFluxActive && (
          <motion.div
            className="absolute inset-0 bg-white/20"
            animate={{
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />
        )}

        {/* 中央のテキスト情報 */}
        <div className="relative z-10 text-center">
          <p className="text-[10px] md:text-xs text-blue-900/60 font-black uppercase tracking-[0.2em] mb-1 drop-shadow-sm">
            {t("time_flux.stored_time")}
          </p>
          <p className={`text-4xl md:text-5xl font-black transition-colors duration-300 ${progress > 40 ? "text-white" : "text-blue-900"} drop-shadow-md`}>
            {formatTime(currentStoredTime)}
          </p>
          <p className={`text-[10px] font-bold mt-1 transition-colors duration-300 ${progress > 40 ? "text-white/80" : "text-blue-600/80"}`}>
             MAX: {formatTime(MAX_STORED)} ({progress.toFixed(1)}%)
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center ml-1">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            {t("time_flux.speed_multiplier")}
          </p>
          <p className="text-xl font-black text-blue-600">
            {currentMultiplier}x
          </p>
        </div>
        <div className="px-2">
          <input
            type="range"
            min="2"
            max="50"
            step="1"
            value={currentMultiplier}
            onChange={(e) => setMultiplier(parseInt(e.target.value))}
            className="w-full h-3 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
            <span>Min (2x)</span>
            <span>Max (50x)</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {gameState.isTimeFluxActive ? (
          <button
            onClick={toggleTimeFlux}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl shadow-[0_6px_0_0_#991b1b] active:translate-y-[2px] active:shadow-none transition-all relative overflow-hidden group"
          >
            {/* Pulsing Decoration */}
            <motion.div
              className="absolute inset-0 bg-white/10 pointer-events-none"
              animate={{ opacity: [0, 0.2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            
            {/* Synchronized Progress Bar - 10 hour limit */}
            <motion.div
              className="absolute bottom-0 left-0 h-full bg-blue-500/40 pointer-events-none"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            />
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-xl uppercase tracking-widest leading-none">
                {t("time_flux.deactivate")}
              </span>
              <span className="text-xs font-bold mt-1 opacity-80 uppercase tracking-tighter">
                {formatTime(currentStoredTime)} Remaining
              </span>
            </div>
          </button>
        ) : (
          <button
            onClick={toggleTimeFlux}
            disabled={currentStoredTime <= 0}
            className={`w-full ${currentStoredTime > 0 ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"} text-white font-black py-5 rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none transition-all relative overflow-hidden group`}
          >
            {/* Progress Bar Background for inactive state */}
            {currentStoredTime > 0 && (
              <motion.div
                className="absolute bottom-0 left-0 h-full bg-white/20 pointer-events-none"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 text-xl uppercase tracking-widest">
              {t("time_flux.activate")}
            </span>
          </button>
        )}
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
            {t("time_flux.drain", { rate: consumptionRate })}
          </p>
        </div>
      )}
    </div>
  );
}
