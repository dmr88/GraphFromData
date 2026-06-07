import { useDataStore } from '@/store/dataStore';
import type { ChartType } from '@/types';
import { useT } from '@/i18n/useTranslation';

const TYPES: ChartType[] = ['bar', 'line', 'area', 'pie', 'scatter'];

export function ChartTypeSelector() {
  const t = useT();
  const chartType = useDataStore((s) => s.chartType);
  const setChartType = useDataStore((s) => s.setChartType);

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
        {t('chart.type')}
      </span>
      <select
        value={chartType}
        onChange={(e) => setChartType(e.target.value as ChartType)}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {TYPES.map((type) => (
          <option key={type} value={type}>
            {t(`chart.type.${type}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
