import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enMedical from '../locales/en/medical.json';
import enChatbot from '../locales/en/chatbot.json';
import enAppointments from '../locales/en/appointments.json';
import enSettings from '../locales/en/settings.json';
import enValidation from '../locales/en/validation.json';
import enReports from '../locales/en/reports.json';
import enSearch from '../locales/en/search.json';
import enStaff from '../locales/en/staff.json';
import enChat from '../locales/en/chat.json';
import enFeed from '../locales/en/feed.json';
import enUserManagement from '../locales/en/userManagement.json';

import frCommon from '../locales/fr/common.json';
import frAuth from '../locales/fr/auth.json';
import frMedical from '../locales/fr/medical.json';
import frChatbot from '../locales/fr/chatbot.json';
import frAppointments from '../locales/fr/appointments.json';
import frSettings from '../locales/fr/settings.json';
import frValidation from '../locales/fr/validation.json';
import frReports from '../locales/fr/reports.json';
import frSearch from '../locales/fr/search.json';
import frStaff from '../locales/fr/staff.json';
import frChat from '../locales/fr/chat.json';
import frFeed from '../locales/fr/feed.json';
import frUserManagement from '../locales/fr/userManagement.json';

import arCommon from '../locales/ar/common.json';
import arAuth from '../locales/ar/auth.json';
import arMedical from '../locales/ar/medical.json';
import arChatbot from '../locales/ar/chatbot.json';
import arAppointments from '../locales/ar/appointments.json';
import arSettings from '../locales/ar/settings.json';
import arValidation from '../locales/ar/validation.json';
import arReports from '../locales/ar/reports.json';
import arSearch from '../locales/ar/search.json';
import arStaff from '../locales/ar/staff.json';
import arChat from '../locales/ar/chat.json';
import arFeed from '../locales/ar/feed.json';
import arUserManagement from '../locales/ar/userManagement.json';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    medical: enMedical,
    chatbot: enChatbot,
    appointments: enAppointments,
    settings: enSettings,
    validation: enValidation,
    reports: enReports,
    search: enSearch,
    staff: enStaff,
    chat: enChat,
    feed: enFeed,
    userManagement: enUserManagement,
  },
  fr: {
    common: frCommon,
    auth: frAuth,
    medical: frMedical,
    chatbot: frChatbot,
    appointments: frAppointments,
    settings: frSettings,
    validation: frValidation,
    reports: frReports,
    search: frSearch,
    staff: frStaff,
    chat: frChat,
    feed: frFeed,
    userManagement: frUserManagement,
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    medical: arMedical,
    chatbot: arChatbot,
    appointments: arAppointments,
    settings: arSettings,
    validation: arValidation,
    reports: arReports,
    search: arSearch,
    staff: arStaff,
    chat: arChat,
    feed: arFeed,
    userManagement: arUserManagement,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: true,
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false,
    },

    defaultNS: 'common',
    
    nsSeparator: ':',
    keySeparator: '.',

    react: {
      useSuspense: false,
    },
  })
  .then(() => {
    const currentLang = i18n.language;
    const isRTL = currentLang === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  });

export default i18n;
