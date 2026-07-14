import React from "react";
import { ActionButton } from "./Buttons";
import { CP_SHOP } from "../constants/gameData";

export default function CapacityTab({ gameState, t, format, onBuyCPUpgrade, onResetCapacity }) {
  const { money, capacityPoints, cpUpgrades } = gameState;
  const isCapacityReached = money.gte("1e60");

  return (
    <div className="flex flex-col gap-6 p-4">
      <h2 className="text-xl font-bold flex items-center gap-2">🌐 {t("tabs.capacity") || "Capacity"}</h2>
      
      {isCapacityReached ? (
        <div className="p-6 bg-red-50 rounded-2xl text-center flex flex-col gap-4 animate-pulse">
          <h3 className="text-2xl font-black text-red-600">{t("capacity.reached_title") || "CAPACITY REACHED!"}</h3>
          <p className="text-sm text-red-800 leading-relaxed">
            {t("capacity.reached_desc") || "致命的なエラー：経済データの処理容量（Capacity）を超過しました。全資産をリセットし、上位クラウドへ移行します。"}
          </p>
          <button
            onClick={onResetCapacity}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl shadow-[0_6px_0_0_theme(colors.red.800)] transition-all active:scale-95 active:translate-y-[2px] active:shadow-none"
          >
            {t("capacity.reset_btn") || "世界をリセットして 1 CP を獲得"}
          </button>
        </div>
      ) : (
        <div className="p-4 bg-gray-100 rounded-xl text-center">
          <p className="text-xs text-gray-500 mb-1">{t("capacity.progress_label") || "Capacity Progress"}</p>
          <div className="text-lg font-bold text-gray-800">{format(money.log10() / 60 * 100, 2)}%</div>
          <div className="w-full bg-gray-300 h-2 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-red-500 h-full transition-all duration-500" 
              style={{ width: `${Math.min(100, money.log10() / 60 * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-2 italic">{t("capacity.hint") || "1.00e60 Gold 到達でリセット可能"}</p>
        </div>
      )}

      { (capacityPoints > 0 || Object.values(cpUpgrades).some(v => v) || isCapacityReached) && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">{t("capacity.shop_title") || "CP Shop"}</h3>
            <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
              {capacityPoints} CP
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {CP_SHOP.map((item) => {
              const isOwned = cpUpgrades[item.id];
              return (
                <div key={item.id} className={`p-4 rounded-xl flex items-center gap-4 transition-all ${isOwned ? "bg-indigo-50" : "bg-white"}`}>
                  <div className="text-3xl">{item.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{t(`capacity.${item.nameKey}`) || item.id}</h4>
                    <p className="text-[10px] text-gray-500 leading-tight mt-1">{t(`capacity.${item.nameKey}_desc`) || "Upgrade description"}</p>
                  </div>
                  {isOwned ? (
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">{t("ui.owned") || "Owned"}</span>
                  ) : (
                    <button
                      onClick={() => onBuyCPUpgrade(item.id, item.cost)}
                      disabled={capacityPoints < item.cost}
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${capacityPoints >= item.cost ? "bg-indigo-600 text-white shadow-[0_4px_0_0_theme(colors.indigo.800)] active:translate-y-[2px] active:shadow-none" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                    >
                      {item.cost} CP
                    </button>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
