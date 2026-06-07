/**
 * Заглушка карты региона ВКО. Будет заменена на интерактивную карту
 * (Leaflet/MapLibre) на следующем этапе.
 */
import { useT } from '@/i18n/useTranslation';

export function RegionMap() {
  const t = useT();
  return (
    <div className="h-full min-h-[280px] flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {t('map.title')}
        </h3>
        <span className="text-xs text-gray-400">{t('map.soon')}</span>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-30" aria-hidden="true">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <svg
          viewBox="0 0 200 140"
          className="w-2/3 h-2/3 text-blue-300 opacity-60"
          fill="currentColor"
        >
          <path d="M30,40 Q50,20 80,25 L120,30 Q160,35 170,55 L175,90 Q165,115 130,118 L80,120 Q45,115 35,90 Q25,65 30,40 Z" />
        </svg>

        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-sm text-gray-500">{t('map.caption')}</p>
          <p className="text-xs text-gray-400 mt-0.5">{t('map.hint')}</p>
        </div>
      </div>
    </div>
  );
}
