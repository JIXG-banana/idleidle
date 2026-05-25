import React from "react";
import CryptoJS from "crypto-js";
import { ActionButton } from "./Buttons";
import { SECRET_KEY } from "../constants/gameData";

export default function SettingTab({ gameState, setGameState, i18n, t }) {
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
      <div className="flex items-center gap-3 p-3 rounded">
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
      </div>
      <ActionButton
        onClick={() => {
          localStorage.setItem(
            "save",
            CryptoJS.AES.encrypt(
              JSON.stringify({
                ...gameState,
                lastTimestamp: Date.now(),
              }),
              SECRET_KEY,
            ).toString(),
          );
          alert(t("messages.save_success"));
        }}
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
