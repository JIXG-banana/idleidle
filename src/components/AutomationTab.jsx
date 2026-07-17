import React from "react";
import { ActionButton } from "./Buttons";
import { AUTOMATORS } from "../constants/gameData";

export default function AutomationTab({ gameState, t, format, onBuyAutomator, onToggleAutomator, onToggleAllAutomators }) {
  const { automation, automationEnabled = {}, currentGames, capacityPoints } = gameState;
  const ownedCount = Object.values(automation).filter(v => v).length;

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold flex items-center gap-2">🤖 {t("tabs.automation") || "Automation"}</h2>
          <p className="text-sm text-gray-600">
            {t("automation.desc") || "作成したゲームを消費して、各施設の購入を自動化します。上の階層を解放するには、手前の自動化を完了させる必要があります。"}
          </p>
        </div>
        
        {ownedCount > 0 && (
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => onToggleAllAutomators(true)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all active:scale-95"
            >
              {t("automation.all_on") || "ALL ON"}
            </button>
            <button
              onClick={() => onToggleAllAutomators(false)}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all active:scale-95"
            >
              {t("automation.all_off") || "ALL OFF"}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {AUTOMATORS.map((auto, index) => {
          // Tier 6 (Alien) automation should only be visible if Alien Communication is unlocked
          if (auto.key === "tier6" && !gameState.cpUpgrades.aliens) {
            return null;
          }

          // Auto Expansion, Evolve and Revolution are always visible
          const isAdvanced = auto.key === "expansion" || auto.key === "autoEvolve" || auto.key === "autoRevolution";
          const isUnlocked = isAdvanced || index === 0 || automation[AUTOMATORS[index - 1].key];
          const isOwned = automation[auto.key];
          const isCP = auto.currency === "CP";
          
          return (
            <div key={auto.key} className={`p-4 rounded-xl flex flex-col gap-3 transition-all ${isOwned ? "bg-green-50" : isUnlocked ? "bg-gray-50/50" : "bg-gray-200 opacity-50 select-none"}`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase flex items-center gap-2">
                  {t(`automation.${auto.nameKey}`) || auto.key}
                </h3>
                {isOwned ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500">{automationEnabled[auto.key] !== false ? "ON" : "OFF"}</span>
                    <button
                      onClick={() => onToggleAutomator(auto.key)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                        automationEnabled[auto.key] !== false ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${automationEnabled[auto.key] !== false ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                ) : isUnlocked && (
                  <span className={`text-xs font-bold ${isCP ? "text-purple-600" : "text-blue-600"}`}>
                    {isCP ? `${auto.cost} CP` : `${format(auto.cost)} ${t("ui.games_unit") || "Games"}`}
                  </span>
                )}
              </div>
              
              {isOwned ? (
                <div className="text-xs text-green-700 font-bold bg-green-100/50 p-2 rounded-lg text-center">
                  {t("automation.active") || "自動購入が稼働中です"}
                </div>
              ) : isUnlocked ? (
                <ActionButton
                  onClick={() => onBuyAutomator(auto.key, auto.cost)}
                  disabled={isCP ? capacityPoints < auto.cost : currentGames.lt(auto.cost)}
                  currentValue={isCP ? new Decimal(capacityPoints) : currentGames}
                  targetValue={new Decimal(auto.cost)}
                  colorClass={isCP ? "bg-purple-600 hover:bg-purple-700" : "bg-indigo-600 hover:bg-indigo-700"}
                  progressColorClass={isCP ? "bg-purple-400/30" : "bg-blue-400/30"}
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
