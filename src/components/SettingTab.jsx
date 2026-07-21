import React, { useState } from "react";
import CryptoJS from "crypto-js";
import { ActionButton } from "./Buttons";
import { SECRET_KEY } from "../constants/gameData";

export default function SettingTab({ gameState, setGameState, i18n, t, onSave, onActivateDevMode }) {
  const [promoCode, setPromoCode] = useState("");

  const handlePromoSubmit = (e) => {
    e.preventDefault();
    if (promoCode === "qwerty123456789") {
      onActivateDevMode();
      setPromoCode("");
      alert("DEV MODE ACTIVATED");
    } else {
      alert(t("messages.invalid_promo") || "Invalid Promo Code");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 p-3 rounded">
        <label
          htmlFor="language-select"
          className="font-bold whitespace-nowrap"
        >
          {t("settings.language_label")}
        </label>
        <select
          id="language-select"
          value={i18n.language}
          onChange={(e) => {
            const newLang = e.target.value;
            i18n.changeLanguage(newLang);
            setGameState((prev) => ({
              ...prev,
              language: newLang,
              usedLanguages: prev.usedLanguages.includes(newLang)
                ? prev.usedLanguages
                : [...prev.usedLanguages, newLang],
            }));
          }}
          className="flex-1 p-2 border border-gray-400 rounded bg-white text-black font-bold"
        >
          <option value="ja">日本語</option>
          <option value="en">English</option>
          <option value="ru">Русский</option>
          <option value="zh-CN">简体中文</option>
          <option value="sw">Kiswahili</option>
          <option value="emoji">絵文字 (Emoji)</option>
        </select>
      </div>

      <div className="p-3 bg-gray-100 rounded-xl flex flex-col gap-2 border border-gray-200 shadow-inner">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("settings.promo_label") || "Promo Code"}</label>
        <form onSubmit={handlePromoSubmit} className="flex gap-2">
          <input 
            type="text" 
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder={t("settings.promo_placeholder") || "Enter code..."}
            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm font-mono"
          />
          <button type="submit" className="bg-gray-800 text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-black transition-colors">OK</button>
        </form>
      </div>

      <div className="flex flex-col gap-2 p-3 rounded">
        <label className="font-bold flex items-center cursor-pointer gap-2">
          <input
            type="checkbox"
            checked={gameState.useScientific}
            onChange={(e) =>
              setGameState((prev) => ({
                ...prev,
                useScientific: e.target.checked,
              }))
            }
            className="w-5 h-5"
          />
          <span>{t("settings.use_scientific")}</span>
        </label>
        <label className="font-bold flex items-center cursor-pointer gap-2">
          <input
            type="checkbox"
            checked={gameState.bgmEnabled}
            onChange={(e) =>
              setGameState((prev) => ({
                ...prev,
                bgmEnabled: e.target.checked,
              }))
            }
            className="w-5 h-5"
          />
          <span>{t("settings.bgm_label")}</span>
        </label>
      </div>
      <ActionButton
        onClick={onSave}
        colorClass="bg-green-700 hover:bg-green-800"
        shadowClass="shadow-[0_4px_0_0_theme(colors.green.900)]"
      >
        {t("actions.save")}
      </ActionButton>
      <ActionButton
        onClick={() => {
          navigator.clipboard
            .writeText(
              CryptoJS.AES.encrypt(
                JSON.stringify({
                  ...gameState,
                  lastTimestamp: Date.now(),
                }),
                SECRET_KEY,
              ).toString(),
            )
            .then(() => alert(t("messages.export_success")))
            .catch(() => alert(t("messages.copy_fail")));
        }}
        colorClass="bg-blue-600 hover:bg-blue-700"
        shadowClass="shadow-[0_4px_0_0_theme(colors.blue.800)]"
      >
        {t("actions.export")}
      </ActionButton>
      <ActionButton
        onClick={() => {
          const importText = prompt(t("messages.import_prompt"));
          if (importText) {
            try {
              const decrypted = CryptoJS.AES.decrypt(
                importText,
                SECRET_KEY,
              ).toString(CryptoJS.enc.Utf8);
              if (!decrypted) throw new Error();
              localStorage.setItem("save", importText);
              window.location.reload();
            } catch {
              alert(t("messages.import_fail"));
            }
          }
        }}
        colorClass="bg-yellow-600 hover:bg-yellow-700"
        shadowClass="shadow-[0_4px_0_0_theme(colors.yellow.800)]"
      >
        {t("actions.import")}
      </ActionButton>
      <ActionButton
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        colorClass="bg-red-800 hover:bg-red-900"
        shadowClass="shadow-[0_4px_0_0_theme(colors.red.950)]"
      >
        {t("actions.clear_save")}
      </ActionButton>
    </div>
  );
}
