import React, { useState } from "react";
import Decimal from "break_infinity.js";

export default function CheatWindow({ gameState, setGameState, onClose, format }) {
  const [moneyInput, setMoneyInput] = useState("1e10");
  const [gamesInput, setGamesInput] = useState("1e10");
  const [cpInput, setCpInput] = useState("10");

  const addMoney = () => {
    try {
      if (!moneyInput) throw new Error();
      const val = new Decimal(moneyInput);
      setGameState(prev => ({ ...prev, money: prev.money.plus(val) }));
    } catch (e) { alert("Invalid input"); }
  };

  const addGames = () => {
    try {
      if (!gamesInput) throw new Error();
      const val = new Decimal(gamesInput);
      setGameState(prev => ({
        ...prev,
        currentGames: prev.currentGames.plus(val),
        totalGames: prev.totalGames.plus(val)
      }));
    } catch (e) { alert("Invalid input"); }
  };

  const addCP = () => {
    try {
      const val = parseInt(cpInput);
      if (isNaN(val)) throw new Error();
      setGameState(prev => ({ ...prev, capacityPoints: prev.capacityPoints + val }));
    } catch (e) { alert("Invalid input"); }
  };

  const unlockAllTiers = () => {
    setGameState(prev => ({
      ...prev,
      unlockedTiers: {
        tier1: true,
        tier2: true,
        tier3: true,
        tier4: true,
        tier5: true,
        tier6: true,
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-3xl font-black text-gray-800">🛠 DEV CHEATS</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-600">Add Gold (e.g. 1e10, 1000000)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={moneyInput}
                onChange={(e) => setMoneyInput(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-xl font-mono text-sm"
              />
              <button onClick={addMoney} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded-xl transition-all active:scale-95">ADD</button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-600">Add Games</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={gamesInput}
                onChange={(e) => setGamesInput(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-xl font-mono text-sm"
              />
              <button onClick={addGames} className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl transition-all active:scale-95">ADD</button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-600">Add Capacity Points</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cpInput}
                onChange={(e) => setCpInput(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-xl font-mono text-sm"
              />
              <button onClick={addCP} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl transition-all active:scale-95">ADD</button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-4 border-t">
            <button onClick={unlockAllTiers} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95">UNLOCK ALL TIERS</button>
            <button 
              onClick={() => setGameState(prev => ({ ...prev, unlockedAchievements: [] }))}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
            >
              CLEAR ACHIEVEMENTS
            </button>
          </div>
        </div>

        <button onClick={onClose} className="mt-8 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl transition-colors">CLOSE</button>
      </div>
    </div>
  );
}
