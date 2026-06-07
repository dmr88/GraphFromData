/**
 * i18n: тонкий хук перевода с Zustand-store для текущего языка.
 * Использование:
 *   const t = useT();
 *   t('header.title');
 *   t('msg.noRecords', { topic: 'Радиация' });
 *
 * Текущий язык хранится в localStorage и переживает перезагрузку.
 */
import { useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, type Lang } from './translations';

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: detectInitialLang(),
      setLang: (lang) => {
        set({ lang });
        if (typeof document !== 'undefined') document.documentElement.lang = lang;
      },
    }),
    {
      name: 'gfd:lang',
      // После регидрации из localStorage — синхронизируем <html lang>
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          document.documentElement.lang = state.lang;
        }
      },
    }
  )
);

// Также синхронизируем при первом импорте модуля (на случай если persist пуст)
if (typeof document !== 'undefined') {
  document.documentElement.lang = useLangStore.getState().lang;
}

/** Определяет начальный язык по navigator.language, fallback — русский. */
function detectInitialLang(): Lang {
  if (typeof navigator === 'undefined') return 'ru';
  const raw = (navigator.language || 'ru').toLowerCase();
  if (raw.startsWith('kk') || raw.startsWith('kz')) return 'kk';
  if (raw.startsWith('en')) return 'en';
  return 'ru';
}

/**
 * Возвращает функцию перевода. ВАЖНО: функция стабилизирована через useCallback
 * (ключ — текущий язык), чтобы можно было безопасно класть `t` в зависимости
 * useEffect/useMemo без бесконечного цикла рендеров.
 */
export function useT(): (key: string, params?: Record<string, string | number>) => string {
  const lang = useLangStore((s) => s.lang);
  return useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = translations[lang] ?? translations.ru;
      let value = dict[key] ?? translations.ru[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return value;
    },
    [lang]
  );
}
