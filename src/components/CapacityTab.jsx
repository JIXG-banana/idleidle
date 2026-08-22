import React from "react";
import { CP_SHOP, CP_CONNECTORS } from "../constants/gameData";

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

      {(capacityPoints > 0 || Object.values(cpUpgrades).some(v => v) || isCapacityReached) && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">{t("capacity.shop_title") || "CP Shop"}</h3>
            <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
              {capacityPoints} CP
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 md:p-8 flex justify-center overflow-visible">
            {/* Wrapper that accounts for the scaled height to prevent clipping and allow page scroll */}
            <div 
              className="flex justify-center items-start" 
              style={{ 
                height: 'calc(929px * 1.3 + 160px)', 
                width: 'calc(511px * 1.3)',
                minWidth: 'calc(511px * 1.3)'
              }}
            >
              {/* Scaling wrapper: origin-top ensures it grows downwards */}
              <div className="origin-top scale-[1.3]"> 
                <div 
                  className="relative bg-gray-50 mb-8" 
                  style={{ width: '511px', height: '929px', minWidth: '511px' }}
                >
                  <svg 
                    className="absolute inset-0 pointer-events-none" 
                    width="511" 
                    height="929"
                    viewBox="0 0 511 929"
                  >
                    <g transform="translate(115, 0)">
                      {CP_CONNECTORS.map((d, i) => (
                        <path 
                          key={i} 
                          d={d} 
                          fill="none" 
                          stroke="black" 
                          strokeWidth="1" 
                        />
                      ))}
                    </g>
                  </svg>

                  {CP_SHOP.map((item) => {
                    const isOwned = cpUpgrades[item.id];
                    const canAfford = capacityPoints >= item.cost;
                    
                    const parents = item.parents || [];
                    const ownedParentsCount = parents.filter(p => cpUpgrades[p]).length;
                    
                    const isSecret = parents.length > 0 && ownedParentsCount === 0;
                    const isLocked = parents.length > 0 && ownedParentsCount < parents.length;
                    
                    const isPurchasable = !isOwned && !isLocked && canAfford;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onBuyCPUpgrade(item.id, item.cost)}
                        disabled={isOwned || !isPurchasable}
                        className={`absolute border border-black flex items-center justify-center text-[8px] font-bold p-1 leading-tight transition-all duration-200 z-10 ${
                          isOwned 
                            ? "bg-black text-white" 
                            : "bg-white text-black hover:bg-gray-100 active:scale-95"
                        } ${isSecret ? "opacity-30 grayscale" : (isLocked ? "opacity-50 grayscale" : "")}`}
                        style={{
                          left: `${item.x + 115}px`,
                          top: `${item.y}px`,
                          width: `40px`,
                          height: `40px`,
                          boxShadow: isOwned ? 'none' : '2px 2px 0px 0px rgba(0,0,0,1)'
                        }}
                        title={isSecret ? "???" : t(`capacity.${item.nameKey}`)}
                      >
                        <div className="text-center break-all">
                          {isSecret ? "?" : t(`capacity.${item.nameKey}`)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
