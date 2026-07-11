import React, { useState, memo } from "react";
import { achievementsList } from "../constants/gameData";

const AchievementCard = memo(({ number, title, icon, isLocked, description }) => {
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

      <div
        className={`absolute inset-0 bg-white/95 rounded-xl transition-opacity flex flex-col items-center justify-center p-2 text-center shadow-inner border border-blue-200 z-10 pointer-events-none ${
          showOverlay ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
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
});

export default function AchievementsTab({ gameState, t }) {
  const [filter, setFilter] = useState("regular");

  const filteredList = achievementsList.filter(item => {
    if (filter === "regular") return !item.hidden;
    return item.hidden;
  });

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex gap-2 w-full">
        <button
          onClick={() => setFilter("regular")}
          className={`flex-1 py-3 rounded-xl font-black transition-all shadow-sm ${
            filter === "regular"
              ? "bg-blue-600 text-white shadow-[0_4px_0_0_#1e40af]"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          {t("achievements.tab_regular") || "Regular"}
        </button>
        <button
          onClick={() => setFilter("hidden")}
          className={`flex-1 py-3 rounded-xl font-black transition-all shadow-sm ${
            filter === "hidden"
              ? "bg-purple-600 text-white shadow-[0_4px_0_0_#581c87]"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          {t("achievements.tab_hidden") || "Hidden"}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {filteredList.map((item, index) => (
          <AchievementCard
            key={item.key}
            number={index + 1}
            title={t(`achievements.${item.key}`)}
            description={t(`achievements.${item.key}_desc`)}
            icon={item.icon}
            isLocked={!gameState.unlockedAchievements.includes(item.key)}
          />
        ))}
        {filteredList.length === 0 && (
          <p className="text-gray-400 italic mt-10">No achievements in this category yet.</p>
        )}
      </div>
    </div>
  );
}
