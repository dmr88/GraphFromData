/**
 * Верхняя брендированная панель.
 * Содержит логотип, название проекта, регион, дату, навигацию (Главная/Команда)
 * и переключатель языков.
 */
import { useDataStore } from '@/store/dataStore';
import { useT, useLangStore } from '@/i18n/useTranslation';
import { LANGUAGES, type Lang } from '@/i18n/translations';

export type Page = 'main' | 'team';

interface HeaderProps {
  page: Page;
  onNavigate: (page: Page) => void;
}

const LOCALE_MAP: Record<Lang, string> = {
  ru: 'ru-RU',
  kk: 'kk-KZ',
  en: 'en-GB',
};

export function Header({ page, onNavigate }: HeaderProps) {
  const t       = useT();
  const lang    = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const dataset = useDataStore((s) => s.dataset);

  const today = new Date().toLocaleDateString(LOCALE_MAP[lang], {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  return (
    <header className="bg-gradient-to-r from-slate-900 to-blue-900 text-white shadow-md">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-4">
        {/* Логотип-плашка */}
        <div className="w-10 h-10 bg-blue-500/20 rounded flex items-center justify-center border border-blue-400/40">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-200" fill="currentColor">
            <path d="M3 3h7v9H3V3m0 18v-7h7v7H3m11 0v-9h7v9h-7m0-18h7v7h-7V3z" />
          </svg>
        </div>

        {/* Заголовок */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-semibold leading-tight truncate">
            {t('header.title')}
          </h1>
          <p className="text-xs text-blue-200/80 leading-tight">
            {t('header.region')}
            {page === 'main' && dataset && (
              <>
                <span className="mx-2 opacity-50">·</span>
                <span className="truncate">{dataset.sourceName}</span>
              </>
            )}
          </p>
        </div>

        {/* Селектор языка */}
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          aria-label={t('header.langLabel')}
          className="bg-slate-800/60 border border-slate-700 text-white text-sm rounded px-2 py-1 cursor-pointer hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} className="bg-slate-800">
              {l.native}
            </option>
          ))}
        </select>

        {/* Дата */}
        <div className="hidden md:block text-right">
          <div className="text-xs uppercase tracking-wider text-blue-300/70">{t('header.today')}</div>
          <div className="text-sm font-medium tabular-nums">{today}</div>
        </div>
      </div>

      {/* Навигация */}
      <nav className="bg-slate-800/60 border-t border-slate-700/50">
        <div className="max-w-[1400px] mx-auto px-4 flex">
          <NavLink active={page === 'main'} onClick={() => onNavigate('main')}>
            {t('nav.main')}
          </NavLink>
          <NavLink active={page === 'team'} onClick={() => onNavigate('team')}>
            {t('nav.team')}
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

function NavLink({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-2 text-sm transition ${
        active
          ? 'text-white font-medium'
          : 'text-blue-200/70 hover:text-white hover:bg-slate-800/40'
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-400 rounded-t" />
      )}
    </button>
  );
}
