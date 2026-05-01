// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "welcome": "Welcome to React",
      "description": "This is a multi-language app."
    }
  },
  ja: {
    translation: {
      "welcome": "Reactへようこそ",
      "description": "これは多言語対応アプリです。"
    }
  }
};

i18n
  .use(LanguageDetector) // ブラウザの言語設定を自動で読み取る
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "ja", // 見つからない時のデフォルト言語
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
