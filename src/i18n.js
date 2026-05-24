// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ja from './locales/ja.json';
import en from './locales/en.json';
import ru from './locales/ru.json';
import zhCN from './locales/zh-cn.json';
import sw from './locales/sw.json';
import emoji from './locales/emoji.json';

const resources = {
  ja: {
    translation: ja
  },
  en: {
    translation: en
  },
  ru: {
    translation: ru
  },
  'zh-CN': {
    translation: zhCN
  },
  sw: {
    translation: sw
  },
  emoji: {
    translation: emoji
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
