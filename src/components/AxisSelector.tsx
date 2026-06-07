import { useDataStore } from '@/store/dataStore';
import { useT } from '@/i18n/useTranslation';

/** Селекторы колонок для осей X и Y. */
export function AxisSelector() {
  const t = useT();
  const activeSheet = useDataStore((s) => s.getActiveSheet());
  const xKey = useDataStore((s) => s.xKey);
  const yKeys = useDataStore((s) => s.yKeys);
  const chartType = useDataStore((s) => s.chartType);
  const setXKey = useDataStore((s) => s.setXKey);
  const toggleYKey = useDataStore((s) => s.toggleYKey);
  const setYKeys = useDataStore((s) => s.setYKeys);

  if (!activeSheet) return null;

  const { columns } = activeSheet;
  const isPie = chartType === 'pie';

  return (
    <div className="flex flex-wrap gap-4">
      <label className="flex flex-col gap-1 min-w-[180px]">
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {isPie ? t('chart.category') : t('chart.xAxis')}
        </span>
        <select
          value={xKey ?? ''}
          onChange={(e) => setXKey(e.target.value || null)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">{t('chart.notSelected')}</option>
          {columns.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {isPie ? t('chart.value') : t('chart.yAxis')}
        </span>
        {isPie ? (
          <select
            value={yKeys[0] ?? ''}
            onChange={(e) =>
              setYKeys(e.target.value ? [e.target.value] : [])
            }
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[180px]"
          >
            <option value="">{t('chart.notSelected')}</option>
            {columns
              .filter((c) => c !== xKey)
              .map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
          </select>
        ) : (
          <div className="flex flex-wrap gap-2 max-w-md">
            {columns
              .filter((c) => c !== xKey)
              .map((col) => {
                const active = yKeys.includes(col);
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => toggleYKey(col)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {col}
                  </button>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
