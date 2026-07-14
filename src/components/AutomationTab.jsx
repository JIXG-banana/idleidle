import React from "react";
import { ActionButton } from "./Buttons";
import { AUTOMATORS } from "../constants/gameData";

export default function AutomationTab({ gameState, t, format, onBuyAutomator }) {
  const { automation, currentGames } = gameState;

  return (
    <div className="flex flex-col gap-6 p-4">
      <h2 className="text-xl font-bold flex items-center gap-2">🤖 {t("tabs.automation") || "Automation"}</h2>
      <p className="text-sm text-gray-600 mb-4">
        {t("automation.desc") || "作成したゲームを消費して、各施設の購入を自動化します。上の階層を解放するには、手前の自動化を完了させる必要があります。"}
      </p>

      <div className="space-y-4">
        {AUTOMATORS.map((auto, index) => {
          const isUnlocked = index === 0 || automation[AUTOMATORS[index - 1].key];
          const isOwned = automation[auto.key];
          
          return (
            <div key={auto.key} className={`p-4 rounded-xl flex flex-col gap-3 transition-all ${isOwned ? "bg-green-50" : isUnlocked ? "bg-gray-50/50" : "bg-gray-200 opacity-50 select-none"}`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase flex items-center gap-2">
                  {isOwned && <span className="text-green-600">✓</span>}
                  {t(`automation.${auto.nameKey}`) || auto.key}
                </h3>
                {!isOwned && isUnlocked && (
                  <span className="text-xs font-bold text-blue-600">{format(auto.cost)} {t("ui.games_unit") || "Games"}</span>
                )}
              </div>
              
              {isOwned ? (
                <div className="text-xs text-green-700 font-bold bg-green-100/50 p-2 rounded-lg text-center">
                  {t("automation.active") || "自動購入が稼働中です"}
                </div>
              ) : isUnlocked ? (
                <ActionButton
                  onClick={() => onBuyAutomator(auto.key, auto.cost)}
                  disabled={currentGames.lt(auto.cost)}
                  currentValue={currentGames}
                  targetValue={auto.cost}
                  colorClass="bg-indigo-600 hover:bg-indigo-700"
                  progressColorClass="bg-blue-400/30"
                >
                  {t("automation.buy_btn") || "自動化をアンロック"}
                </ActionButton>
              ) : (
                <div className="text-xs text-gray-500 italic flex items-center gap-1">
                  🔒 {t("automation.locked_prev") || "前の自動化を完了してください"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
