import React from "react";
import { ActionButton } from "./Buttons";

export default function AiAssistantTab({
  gameState,
  t,
  format,
  getAutomationUpgradeCost,
  upgradeAutomation,
  toggleAutomation,
}) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold border-b pb-2">
        {t("tabs.ai_assistant")}
      </h2>
      <div className="space-y-8">
        {["developer", "company", "companyUpgrade", "aiDev", "developerUpgrade", "aiDevUpgrade", "conglomerateUpgrade"]
          .filter((key) => {
            if (key === "companyUpgrade")
              return gameState.currentCompanyGrade < 15;
            if (key === "aiDev") return gameState.aiEnabled;
            if (key === "aiDevUpgrade") return gameState.aiEnabled;
            if (key === "conglomerateUpgrade")
              return gameState.currentCompanyGrade >= 10;
            return true;
          })
          .map((key) => {
            const auto = gameState.automation?.[key] || { level: 0, enabled: false, progress: 0 };
            const upgradeCost = getAutomationUpgradeCost(auto.level);
            return (
              <div
                key={key}
                className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-3"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold uppercase">
                    {t(`automation.${key}`)}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-500">
                      LV. {auto.level}
                    </span>
                    {auto.level > 0 && (
                      <button
                        onClick={() => toggleAutomation(key)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${auto.enabled ? "bg-green-500" : "bg-gray-400"}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${auto.enabled ? "left-7" : "left-1"}`}
                        />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-sm text-gray-600">
                  <p>
                    {t("automation.speed")}:{" "}
                    <span className="font-bold text-blue-600">
                      {(auto.level * 0.1).toFixed(1)}/s
                    </span>
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-400 h-full transition-all duration-75"
                      style={{ width: `${(auto.progress || 0) * 100}%` }}
                    />
                  </div>
                </div>
                <ActionButton
                  onClick={() => upgradeAutomation(key)}
                  disabled={gameState.games.lt(upgradeCost)}
                  colorClass="bg-indigo-600 hover:bg-indigo-700"
                  shadowClass="shadow-[0_4px_0_0_theme(colors.indigo.800)]"
                  currentValue={gameState.games}
                  targetValue={upgradeCost}
                  progressColorClass="bg-yellow-400/30"
                >
                  {t("automation.upgrade", {
                    price: format(upgradeCost),
                  })}
                </ActionButton>
              </div>
            );
          })}
      </div>
    </div>
  );
}
