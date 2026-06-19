import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './translations/en';
import bn from './translations/bn';

const STORAGE_KEY = 'rentnao_lang';

const translations = { en, bn };

const LanguageContext = createContext(null);

function readStoredLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'bn') return stored;
  } catch {
    /* ignore */
  }
  return 'en';
}

function interpolate(str, params) {
  if (!params || typeof str !== 'string') return str;
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value ?? '')),
    str
  );
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);

  const setLang = useCallback((next) => {
    const value = next === 'bn' ? 'bn' : 'en';
    setLangState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key, paramsOrFallback) => {
      let fallback;
      let params = null;
      if (typeof paramsOrFallback === 'string') {
        fallback = paramsOrFallback;
      } else if (paramsOrFallback && typeof paramsOrFallback === 'object') {
        params = paramsOrFallback;
      }

      const parts = String(key).split('.');
      let node = translations[lang];
      for (const part of parts) {
        if (node == null || typeof node !== 'object') return fallback ?? key;
        node = node[part];
      }
      if (typeof node === 'string') return interpolate(node, params);
      return fallback ?? key;
    },
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
      messages: translations[lang],
    }),
    [lang, setLang, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}

export function useTranslation() {
  const { t, lang, setLang, messages } = useLanguage();
  return { t, lang, setLang, messages };
}
